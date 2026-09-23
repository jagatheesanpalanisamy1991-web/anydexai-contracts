const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AnyDexAI - Production Hardening & Security Audit Test Suite", function () {
  let owner, user1, user2, user3, user4, user5, user6, tokenLiq, nftLiq;
  let usdt, adai, nft, mainPlan;

  const toWei = (val) => ethers.parseEther(val.toString());

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, user5, user6, tokenLiq, nftLiq] = await ethers.getSigners();

    // 1. Deploy Mock USDT
    const MockUSDT = await ethers.getContractFactory("contracts/tokens/MockUSDT.sol:MockUSDT");
    usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();

    // 2. Deploy ADAI Token
    const ADAIToken = await ethers.getContractFactory("contracts/ADAIToken.sol:ADAIToken");
    adai = await ADAIToken.deploy(owner.address);
    await adai.waitForDeployment();

    // 3. Deploy AnyDexAI NFT
    const AnyDexAINFT = await ethers.getContractFactory("contracts/AnyDexAINFT.sol:AnyDexAINFT");
    nft = await AnyDexAINFT.deploy(owner.address, "https://api.anydexai.com/metadata/nft");
    await nft.waitForDeployment();

    // 4. Deploy Main Plan
    const AnyDexAIMainPlan = await ethers.getContractFactory("contracts/AnyDexAIMainPlan.sol:AnyDexAIMainPlan");
    mainPlan = await AnyDexAIMainPlan.deploy(
      owner.address,
      await usdt.getAddress(),
      tokenLiq.address,
      nftLiq.address
    );
    await mainPlan.waitForDeployment();

    // 5. Authorize Main Plan as Minter
    await adai.setMinter(await mainPlan.getAddress(), true);
    await nft.setMinter(await mainPlan.getAddress(), true);
    await mainPlan.setTokenAndNFTContracts(await adai.getAddress(), await nft.getAddress());

    // Mint USDT and approve for test users
    for (const u of [user1, user2, user3, user4, user5, user6]) {
      await usdt.mint(u.address, toWei(100000));
      await usdt.connect(u).approve(await mainPlan.getAddress(), ethers.MaxUint256);
    }
  });

  describe("1. SEC-02: Economic Terms Snapshotting (Immutability)", function () {
    it("Should freeze package ROI & duration at deposit time and NOT change when admin modifies package", async function () {
      // User 1 deposits in Package 1: $1,000, 5% / 30 days
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);

      // Verify the snapshotted terms stored in user's investment record
      const invBefore = await mainPlan.getUserInvestment(user1.address, 0);
      expect(invBefore.roiBasisPoints).to.equal(500); // 5.0%
      expect(invBefore.durationDays).to.equal(30);

      // Owner modifies Package 1 to 2% / 60 days for future users
      await mainPlan.connect(owner).updatePackageRoiAndDuration(1, 200, 60);

      // Verify Package 1 config in storage changed
      const pkgConfig = await mainPlan.packages(1);
      expect(pkgConfig.roiBasisPoints).to.equal(200);
      expect(pkgConfig.durationDays).to.equal(60);

      // Advance time by 30 days
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // User 1's claimable ROI MUST still calculate using snapshotted 5% / 30d ($50), NOT 2% / 60d ($10)!
      const claimable = await mainPlan.calculateClaimableRoi(user1.address, 0);
      expect(claimable).to.be.closeTo(toWei(50), toWei(0.01));
    });
  });

  describe("2. SEC-01: Level Income Cap Remainder Queue (Zero Disappearing Funds)", function () {
    it("Should preserve unpaid level income when hitting the 2x monthly cap and allow claim next month", async function () {
      // Setup downlines to generate level volume
      // user1 sponsors user2
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1); // $1,000 active capital -> 2x cap = $2,000

      // user2 invests $10,000
      await mainPlan.connect(user2).registerAndInvest(user1.address, 3);

      // user1 sponsors 4 more directs to meet 5-member Level 1 eligibility
      for (const u of [user3, user4, user5, user6]) {
        await mainPlan.connect(u).registerAndInvest(user1.address, 1);
      }

      // Check user1 is eligible for Level 1
      expect(await mainPlan.isLevelEligible(user1.address, 1)).to.be.true;

      // Advance time by 60 days
      await ethers.provider.send("evm_increaseTime", [60 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // Check accrued level income
      const accrued = await mainPlan.calculateLevelIncome(user1.address);
      expect(accrued).to.be.gt(toWei(10));

      // Withdraw level income
      const user1UsdtBefore = await usdt.balanceOf(user1.address);
      const tx = await mainPlan.connect(user1).withdrawLevelIncome();
      const receipt = await tx.wait();

      const user1Profile = await mainPlan.users(user1.address);
      const user1UsdtAfter = await usdt.balanceOf(user1.address);

      // Paid amount + pending remainder must equal total claimable
      const paid = user1UsdtAfter - user1UsdtBefore;
      expect(paid + user1Profile.pendingLevelIncome).to.be.closeTo(accrued, toWei(0.01));

      // Invariant: Unpaid funds must never disappear!
      if (user1Profile.pendingLevelIncome > 0n) {
        // Advance time by 30 days to reset monthly cap
        await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");

        // User can now claim the carried-forward remainder
        await expect(mainPlan.connect(user1).withdrawLevelIncome()).to.not.be.reverted;
      }
    });
  });

  describe("3. 120-Day Activity Enforcement", function () {
    it("Should lock level income withdrawal after 120 days of inactivity and unlock on new referral", async function () {
      // User 1 registers with package 1
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);

      // Advance time by 121 days without any referral
      await ethers.provider.send("evm_increaseTime", [121 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // Verify activity status is expired
      expect(await mainPlan.is120DaysActive(user1.address)).to.be.false;

      // Level income withdrawal must revert with custom error ActivityRuleViolated
      await expect(
        mainPlan.connect(user1).withdrawLevelIncome()
      ).to.be.revertedWithCustomError(mainPlan, "ActivityRuleViolated");

      // User 1 sponsors User 2 -> resets the 120-day activity timer!
      await mainPlan.connect(user2).registerAndInvest(user1.address, 1);

      // Verify activity is now active again
      expect(await mainPlan.is120DaysActive(user1.address)).to.be.true;
    });
  });

  describe("4. 200% ROI Ceiling & Capital Return via ADAI", function () {
    it("Should cap total ROI at 200% and refund initial capital in ADAI tokens", async function () {
      // User 1 invests $1,000 (Package 1: 5% / 30d)
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);

      // Fund contract reserves with USDT so it can fulfill full 200% ROI payout
      await usdt.mint(await mainPlan.getAddress(), toWei(10000));

      // Advance time by 1200 days to reach 200% cap ($2,000)
      await ethers.provider.send("evm_increaseTime", [1200 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // Claimable ROI must not exceed 200% ($2,000)
      const claimable = await mainPlan.calculateClaimableRoi(user1.address, 0);
      expect(claimable).to.equal(toWei(2000));

      const adaiBalBefore = await adai.balanceOf(user1.address);
      const usdtBalBefore = await usdt.balanceOf(user1.address);

      // Claim full 200% ROI
      await mainPlan.connect(user1).claimRoi(0);

      const usdtBalAfter = await usdt.balanceOf(user1.address);
      const adaiBalAfter = await adai.balanceOf(user1.address);

      // USDT balance should increase by exactly $2,000
      expect(usdtBalAfter - usdtBalBefore).to.equal(toWei(2000));

      // ADAI capital refund should mint $1,000 worth of ADAI tokens (default 1e18 rate)
      expect(adaiBalAfter - adaiBalBefore).to.equal(toWei(1000));

      // Investment should be marked completed
      const inv = await mainPlan.getUserInvestment(user1.address, 0);
      expect(inv.completed).to.be.true;

      // Further claim attempts must revert with InvestmentAlreadyCompleted
      await expect(
        mainPlan.connect(user1).claimRoi(0)
      ).to.be.revertedWithCustomError(mainPlan, "InvestmentAlreadyCompleted");
    });
  });

  describe("5. NFT ERC165 & Compliance Tests", function () {
    it("Should support ERC165, ERC721, and ERC721Metadata interface IDs", async function () {
      expect(await nft.supportsInterface("0x01ffc9a7")).to.be.true; // ERC165
      expect(await nft.supportsInterface("0x80ac58cd")).to.be.true; // ERC721
      expect(await nft.supportsInterface("0x5b5e139f")).to.be.true; // ERC721Metadata
      expect(await nft.supportsInterface("0xffffffff")).to.be.false;
    });

    it("Should mint Entry Pass automatically on first registration only", async function () {
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);
      expect(await nft.hasEntryPass(user1.address)).to.be.true;
      expect(await nft.balanceOf(user1.address)).to.equal(1n);

      // Second investment must NOT mint another Entry Pass
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);
      expect(await nft.balanceOf(user1.address)).to.equal(1n);
    });
  });

  describe("6. Access Control & Treasury Invariants", function () {
    it("Should allow owner to withdraw USDT and revert for unauthorized callers", async function () {
      // Contract has USDT from user investments
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);

      const contractUsdt = await usdt.balanceOf(await mainPlan.getAddress());
      expect(contractUsdt).to.be.gt(0n);

      // Non-owner cannot call adminWithdrawUSDT
      await expect(
        mainPlan.connect(user1).adminWithdrawUSDT(toWei(100), user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      // Owner can withdraw USDT
      const ownerUsdtBefore = await usdt.balanceOf(owner.address);
      await mainPlan.connect(owner).adminWithdrawUSDT(toWei(100), owner.address);
      const ownerUsdtAfter = await usdt.balanceOf(owner.address);
      expect(ownerUsdtAfter - ownerUsdtBefore).to.equal(toWei(100));
    });
  });
});
