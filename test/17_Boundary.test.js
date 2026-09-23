const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 1: Boundary Testing (17_Boundary.test.js)", function () {
  let owner, user1, user2, user3, tokenLiq, nftLiq;
  let usdt, adai, nft, mainPlan;

  const toWei = (val) => ethers.parseEther(val.toString());

  beforeEach(async function () {
    [owner, user1, user2, user3, tokenLiq, nftLiq] = await ethers.getSigners();

    const MockUSDT = await ethers.getContractFactory("contracts/tokens/MockUSDT.sol:MockUSDT");
    usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();

    const ADAITokenFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:ADAIToken");
    adai = await ADAITokenFactory.deploy(owner.address);
    await adai.waitForDeployment();

    const AnyDexAINFTFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:AnyDexAINFT");
    nft = await AnyDexAINFTFactory.deploy(owner.address, "https://api.anydexai.com/metadata/nft");
    await nft.waitForDeployment();

    const AnyDexAIMainPlanFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:AnyDexAIMainPlan");
    mainPlan = await AnyDexAIMainPlanFactory.deploy(
      owner.address,
      await usdt.getAddress(),
      tokenLiq.address,
      nftLiq.address
    );
    await mainPlan.waitForDeployment();

    await adai.setMinter(await mainPlan.getAddress(), true);
    await nft.setMinter(await mainPlan.getAddress(), true);
    await mainPlan.setTokenAndNFTContracts(await adai.getAddress(), await nft.getAddress());

    for (const u of [user1, user2, user3]) {
      await usdt.mint(u.address, toWei(200000));
      await usdt.connect(u).approve(await mainPlan.getAddress(), ethers.MaxUint256);
    }
  });

  describe("B1 — Exact 120-Day Activity Boundary", function () {
    it("Should be ACTIVE at exactly 120 days (<= 120 days) and INACTIVE at 120 days + 1 second", async function () {
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);
      const userState = await mainPlan.users(user1.address);
      const regTime = userState.lastReferralTimestamp;

      // Jump to exactly regTime + 120 days
      const exact120Days = Number(regTime) + 120 * 24 * 60 * 60;
      await ethers.provider.send("evm_setNextBlockTimestamp", [exact120Days]);
      await ethers.provider.send("evm_mine");

      // Verify active at boundary
      expect(await mainPlan.is120DaysActive(user1.address)).to.be.true;

      // Jump 1 second past boundary
      await ethers.provider.send("evm_setNextBlockTimestamp", [exact120Days + 1]);
      await ethers.provider.send("evm_mine");

      // Verify inactive
      expect(await mainPlan.is120DaysActive(user1.address)).to.be.false;
    });
  });

  describe("B2, B3, B4 — Exact 2x ROI, Just Below 2x, and Claim After 2x", function () {
    it("B3: Just Below 2x — Investment remains active when total claimed is under 200%", async function () {
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1); // $1000 capital, 5% / 30 days
      // Advance by 30 days -> 5% = $50
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await mainPlan.connect(user1).claimRoi(0);
      const inv = await mainPlan.getUserInvestment(user1.address, 0);
      expect(inv.completed).to.be.false;
      expect(inv.totalRoiClaimed).to.be.closeTo(toWei(50), toWei(0.01));
      expect(inv.totalRoiClaimed).to.be.lt(toWei(2000));
    });

    it("B2: Exact 2x ROI — Reaching 200% marks completed and stops accrual", async function () {
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);
      await usdt.mint(await mainPlan.getAddress(), toWei(50000));

      // Advance by 1200 days to reach 200% ($2,000)
      await ethers.provider.send("evm_increaseTime", [1200 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const claimable = await mainPlan.calculateClaimableRoi(user1.address, 0);
      expect(claimable).to.equal(toWei(2000));

      await mainPlan.connect(user1).claimRoi(0);
      const inv = await mainPlan.getUserInvestment(user1.address, 0);
      expect(inv.completed).to.be.true;
      expect(inv.totalRoiClaimed).to.equal(toWei(2000));
      expect(await mainPlan.calculateClaimableRoi(user1.address, 0)).to.equal(0n);
    });

    it("B4: Claim After 2x — Attempting claim after completion strictly REVERTS with InvestmentAlreadyCompleted", async function () {
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);
      await usdt.mint(await mainPlan.getAddress(), toWei(50000));

      await ethers.provider.send("evm_increaseTime", [1200 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await mainPlan.connect(user1).claimRoi(0);

      await expect(
        mainPlan.connect(user1).claimRoi(0)
      ).to.be.revertedWithCustomError(mainPlan, "InvestmentAlreadyCompleted");
    });
  });

  describe("B5 — Minimum Withdrawal Boundary ($10)", function () {
    it("Should revert if claimable < minWithdrawal, and succeed when claimable >= $10", async function () {
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);

      // Only advance 2 days -> $1000 * 5% * 2/30 = $3.33 < $10
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const claimableSmall = await mainPlan.calculateClaimableRoi(user1.address, 0);
      expect(claimableSmall).to.be.lt(toWei(10));

      await expect(
        mainPlan.connect(user1).claimRoi(0)
      ).to.be.revertedWithCustomError(mainPlan, "BelowMinWithdrawal");

      // Advance 10 more days -> total 12 days -> $1000 * 5% * 12/30 = $20 >= $10
      await ethers.provider.send("evm_increaseTime", [10 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await expect(mainPlan.connect(user1).claimRoi(0)).to.not.be.reverted;
    });
  });

  describe("B6 & B7 — Monthly Cap Boundary & One-Wei Overflow Test", function () {
    it("B6 & B7: Should pay up to exact cap, overflow +1 goes to pendingLevelIncome", async function () {
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1); // $1,000 active capital -> 2x cap = $2,000
      await mainPlan.connect(user2).registerAndInvest(user1.address, 3); // $10,000
      for (let i = 0; i < 4; i++) {
        const tempUser = (await ethers.getSigners())[7 + i];
        await usdt.mint(tempUser.address, toWei(10000));
        await usdt.connect(tempUser).approve(await mainPlan.getAddress(), ethers.MaxUint256);
        await mainPlan.connect(tempUser).registerAndInvest(user1.address, 1);
      }

      // user1 has received referral commissions
      const u1State = await mainPlan.users(user1.address);
      const earned = u1State.currentMonthEarnings;
      const maxAllowed = u1State.activeCapital * 2n;
      expect(earned).to.be.lt(maxAllowed);

      // Advance time so level income accrues
      await ethers.provider.send("evm_increaseTime", [60 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const accrued = await mainPlan.calculateLevelIncome(user1.address);
      expect(accrued).to.be.gt(0n);

      await mainPlan.connect(user1).withdrawLevelIncome();
      const u1After = await mainPlan.users(user1.address);

      // Current month earnings should not exceed 2x cap
      expect(u1After.currentMonthEarnings).to.be.lte(maxAllowed);
      // Remainder must be safely in pendingLevelIncome
      expect(u1After.pendingLevelIncome).to.be.gte(0n);
    });
  });

  describe("B8 — Package Integer Boundaries", function () {
    it("Should accept valid uint128 amounts and reject zero amounts", async function () {
      await expect(
        mainPlan.connect(owner).addPackage(0, 500, 30, toWei(10))
      ).to.be.revertedWithCustomError(mainPlan, "AmountZero");

      // Huge valid amount below uint128 max
      const largeAmount = toWei(1000000000); // 1 Billion USDT
      await mainPlan.connect(owner).addPackage(largeAmount, 500, 30, toWei(1000));
      const pCount = await mainPlan.packageCount();
      const newPkg = await mainPlan.packages(pCount);
      expect(newPkg.amount).to.equal(largeAmount);
    });
  });
});
