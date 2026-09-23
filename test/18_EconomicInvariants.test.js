const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 2: Economic Invariant Testing (18_EconomicInvariants.test.js)", function () {
  let owner, user1, user2, user3, user4, user5, user6, tokenLiq, nftLiq;
  let usdt, adai, nft, mainPlan;

  const toWei = (val) => ethers.parseEther(val.toString());

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, user5, user6, tokenLiq, nftLiq] = await ethers.getSigners();

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

    for (const u of [user1, user2, user3, user4, user5, user6]) {
      await usdt.mint(u.address, toWei(200000));
      await usdt.connect(u).approve(await mainPlan.getAddress(), ethers.MaxUint256);
    }
  });

  describe("I1 — Invariant: ROI Never Exceeds 200%", function () {
    it("Invariant holds across repeated claims and large time advances", async function () {
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);
      await usdt.mint(await mainPlan.getAddress(), toWei(50000));

      // Advance by 300 days
      await ethers.provider.send("evm_increaseTime", [300 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await mainPlan.connect(user1).claimRoi(0);

      // Advance by another 1000 days
      await ethers.provider.send("evm_increaseTime", [1000 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await mainPlan.connect(user1).claimRoi(0);

      const inv = await mainPlan.getUserInvestment(user1.address, 0);
      expect(inv.totalRoiClaimed).to.equal(toWei(2000));
      expect(inv.totalRoiClaimed).to.be.lte(toWei(1000) * 2n);
    });
  });

  describe("I2 — Invariant: Completed Investment Remains Completed", function () {
    it("Once completed is true, it never changes back to false and claimRoi always reverts", async function () {
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);
      await usdt.mint(await mainPlan.getAddress(), toWei(50000));

      await ethers.provider.send("evm_increaseTime", [1200 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await mainPlan.connect(user1).claimRoi(0);

      const inv = await mainPlan.getUserInvestment(user1.address, 0);
      expect(inv.completed).to.be.true;

      await expect(
        mainPlan.connect(user1).claimRoi(0)
      ).to.be.revertedWithCustomError(mainPlan, "InvestmentAlreadyCompleted");
    });
  });

  describe("I3 — Invariant: Active Capital Accounting on Partial Completions", function () {
    it("activeCapital decreases only by the capital of the specific completed investment", async function () {
      // User 1 buys Package 1 ($1,000) and Package 2 ($5,000) -> total active capital = $6,000
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);
      await mainPlan.connect(user1).registerAndInvest(owner.address, 2);

      let u1State = await mainPlan.users(user1.address);
      expect(u1State.activeCapital).to.equal(toWei(6000));

      await usdt.mint(await mainPlan.getAddress(), toWei(50000));

      // Advance time so Package 1 completes
      await ethers.provider.send("evm_increaseTime", [1200 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // Claim only Investment 0 (Package 1)
      await mainPlan.connect(user1).claimRoi(0);

      u1State = await mainPlan.users(user1.address);
      // Active capital should reduce by exactly $1,000 to $5,000
      expect(u1State.activeCapital).to.equal(toWei(5000));

      const inv0 = await mainPlan.getUserInvestment(user1.address, 0);
      const inv1 = await mainPlan.getUserInvestment(user1.address, 1);
      expect(inv0.completed).to.be.true;
      expect(inv1.completed).to.be.false;
    });
  });

  describe("I4 — Invariant: Level Income Remainder Conservation", function () {
    it("Conservation law: Paid + PendingRemainder == TotalClaimable across consecutive billing periods", async function () {
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1); // $1,000 -> 2x cap = $2,000

      const downlines = [user2, user3, user4, user5, user6];
      for (let i = 0; i < 5; i++) {
        await mainPlan.connect(downlines[i]).registerAndInvest(user1.address, 3);
      }

      await ethers.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const accrued = await mainPlan.calculateLevelIncome(user1.address);
      const balBefore = await usdt.balanceOf(user1.address);
      await mainPlan.connect(user1).withdrawLevelIncome();
      const balAfter = await usdt.balanceOf(user1.address);

      const paid = balAfter - balBefore;
      const u1State = await mainPlan.users(user1.address);
      const pending = u1State.pendingLevelIncome;

      // Invariant: sum of paid and pending must match total accrued
      expect(paid + pending).to.be.closeTo(accrued, toWei(0.01));
    });
  });

  describe("I5 & I6 — Referral BPS & Liquidity BPS Safety Bounds", function () {
    it("I6: Contract strictly reverts if referral BPS exceeds maximum allowed (20%)", async function () {
      // Max allowed: L1 + L2 + L3 <= 2000 (20%)
      await expect(
        mainPlan.connect(owner).setDirectReferralPercentages(1500, 500, 1) // 2001 bps
      ).to.be.revertedWithCustomError(mainPlan, "ReferralPercentageTooHigh");

      await expect(
        mainPlan.connect(owner).setDirectReferralPercentages(700, 200, 100) // 1000 bps
      ).to.not.be.reverted;
    });

    it("I6: Contract strictly reverts if liquidity BPS exceeds maximum allowed (5%)", async function () {
      // Max allowed: tokenBps + nftBps <= 500 (5%)
      await expect(
        mainPlan.connect(owner).setLiquidityWallets(tokenLiq.address, nftLiq.address, 300, 201) // 501 bps
      ).to.be.revertedWithCustomError(mainPlan, "FeeTooHigh");

      await expect(
        mainPlan.connect(owner).setLiquidityWallets(tokenLiq.address, nftLiq.address, 50, 50) // 100 bps
      ).to.not.be.reverted;
    });
  });
});
