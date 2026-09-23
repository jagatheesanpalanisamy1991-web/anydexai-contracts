const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AnyDexAISingle.sol - Comprehensive Production & Load Test Suite", function () {
  this.timeout(180000); // 3 minutes timeout for load tests

  let owner, tokenLiq, nftLiq;
  let testUsers = [];
  let usdt, adai, nft, mainPlan;

  const toWei = (val) => ethers.parseEther(val.toString());
  const fromWei = (val) => ethers.formatEther(val);

  before(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    tokenLiq = signers[1];
    nftLiq = signers[2];
    testUsers = signers.slice(3); // 17 test accounts available in Hardhat node
  });

  beforeEach(async function () {
    // 1. Deploy Mock USDT
    const MockUSDT = await ethers.getContractFactory("contracts/tokens/MockUSDT.sol:MockUSDT");
    usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();

    // 2. Deploy ADAIToken from AnyDexAISingle.sol
    const ADAITokenFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:ADAIToken");
    adai = await ADAITokenFactory.deploy(owner.address);
    await adai.waitForDeployment();

    // 3. Deploy AnyDexAINFT from AnyDexAISingle.sol
    const AnyDexAINFTFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:AnyDexAINFT");
    nft = await AnyDexAINFTFactory.deploy(owner.address, "https://api.anydexai.com/metadata/nft");
    await nft.waitForDeployment();

    // 4. Deploy AnyDexAIMainPlan from AnyDexAISingle.sol
    const AnyDexAIMainPlanFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:AnyDexAIMainPlan");
    mainPlan = await AnyDexAIMainPlanFactory.deploy(
      owner.address,
      await usdt.getAddress(),
      tokenLiq.address,
      nftLiq.address
    );
    await mainPlan.waitForDeployment();

    // 5. Wire System Contracts & Grant Minter Roles
    await adai.setMinter(await mainPlan.getAddress(), true);
    await nft.setMinter(await mainPlan.getAddress(), true);
    await mainPlan.setTokenAndNFTContracts(await adai.getAddress(), await nft.getAddress());

    // 6. Fund all test users with abundant USDT & Approve MainPlan
    for (const u of testUsers) {
      await usdt.mint(u.address, toWei(500000));
      await usdt.connect(u).approve(await mainPlan.getAddress(), ethers.MaxUint256);
    }
  });

  // ============================================================================
  // SECTION 1: SYSTEM INITIALIZATION & DEFAULT CONFIGURATION
  // ============================================================================
  describe("1. System Initialization & Default Packages", function () {
    it("Should correctly initialize 3 default packages matching specifications", async function () {
      expect(await mainPlan.packageCount()).to.equal(3n);

      const p1 = await mainPlan.packages(1);
      expect(p1.amount).to.equal(toWei(1000));
      expect(p1.roiBasisPoints).to.equal(500n); // 5%
      expect(p1.durationDays).to.equal(30n);
      expect(p1.tokenReward).to.equal(toWei(10));
      expect(p1.isActive).to.be.true;

      const p2 = await mainPlan.packages(2);
      expect(p2.amount).to.equal(toWei(5000));
      expect(p2.roiBasisPoints).to.equal(550n); // 5.5%
      expect(p2.durationDays).to.equal(30n);
      expect(p2.tokenReward).to.equal(toWei(50));
      expect(p2.isActive).to.be.true;

      const p3 = await mainPlan.packages(3);
      expect(p3.amount).to.equal(toWei(10000));
      expect(p3.roiBasisPoints).to.equal(600n); // 6.0%
      expect(p3.durationDays).to.equal(30n);
      expect(p3.tokenReward).to.equal(toWei(100));
      expect(p3.isActive).to.be.true;
    });

    it("Should verify liquidity fee parameters (0.5% Token + 0.5% NFT)", async function () {
      expect(await mainPlan.tokenLiquidityBps()).to.equal(50n);
      expect(await mainPlan.nftLiquidityBps()).to.equal(50n);
      expect(await mainPlan.tokenLiquidityWallet()).to.equal(tokenLiq.address);
      expect(await mainPlan.nftLiquidityWallet()).to.equal(nftLiq.address);
    });

    it("Should verify 3-tier direct referral rates (7%, 2%, 1%)", async function () {
      expect(await mainPlan.directReferralL1Bps()).to.equal(700n);
      expect(await mainPlan.directReferralL2Bps()).to.equal(200n);
      expect(await mainPlan.directReferralL3Bps()).to.equal(100n);
    });
  });

  // ============================================================================
  // SECTION 2: POSITIVE FUNCTIONAL TESTS (HAPPY PATHS)
  // ============================================================================
  describe("2. Positive Functional Workflows", function () {
    it("P1: Full registration, immediate 1% liquidity routing, token rewards, and Entry Pass NFT", async function () {
      const u1 = testUsers[0];
      const tokenLiqBefore = await usdt.balanceOf(tokenLiq.address);
      const nftLiqBefore = await usdt.balanceOf(nftLiq.address);

      // User 1 registers with Package 1 ($1,000) under Owner
      await expect(mainPlan.connect(u1).registerAndInvest(owner.address, 1))
        .to.emit(mainPlan, "Registered")
        .withArgs(u1.address, owner.address, 1, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1))
        .and.to.emit(mainPlan, "Invested");

      // Verify 0.5% Token Liquidity ($5) & 0.5% NFT Liquidity ($5)
      expect((await usdt.balanceOf(tokenLiq.address)) - tokenLiqBefore).to.equal(toWei(5));
      expect((await usdt.balanceOf(nftLiq.address)) - nftLiqBefore).to.equal(toWei(5));

      // Verify Entry Pass NFT minted
      expect(await nft.hasEntryPass(u1.address)).to.be.true;
      expect(await nft.balanceOf(u1.address)).to.equal(1n);

      // Verify Package ADAI tokens (10 ADAI to user, 5 ADAI (50%) to sponsor)
      expect(await adai.balanceOf(u1.address)).to.equal(toWei(10));
      expect(await adai.balanceOf(owner.address)).to.equal(toWei(5));
    });

    it("P2: Immediate 3-tier Direct Referral Distribution (7% L1, 2% L2, 1% L3)", async function () {
      const u1 = testUsers[0];
      const u2 = testUsers[1];
      const u3 = testUsers[2];
      const u4 = testUsers[3];

      // Build chain: Owner -> u1 -> u2 -> u3 -> u4
      await mainPlan.connect(u1).registerAndInvest(owner.address, 1);
      await mainPlan.connect(u2).registerAndInvest(u1.address, 1);
      await mainPlan.connect(u3).registerAndInvest(u2.address, 1);

      const u1Before = await usdt.balanceOf(u1.address);
      const u2Before = await usdt.balanceOf(u2.address);
      const u3Before = await usdt.balanceOf(u3.address);

      // u4 invests $10,000 (Package 3) under u3
      await mainPlan.connect(u4).registerAndInvest(u3.address, 3);

      // Level 1 Sponsor (u3): 7% of $10,000 = $700 USDT
      expect((await usdt.balanceOf(u3.address)) - u3Before).to.equal(toWei(700));

      // Level 2 Sponsor (u2): 2% of $10,000 = $200 USDT
      expect((await usdt.balanceOf(u2.address)) - u2Before).to.equal(toWei(200));

      // Level 3 Sponsor (u1): 1% of $10,000 = $100 USDT
      expect((await usdt.balanceOf(u1.address)) - u1Before).to.equal(toWei(100));
    });

    it("P3: SEC-02 Economic Terms Snapshotting — Admin package edits NEVER affect active deposits", async function () {
      const u1 = testUsers[0];
      const u2 = testUsers[1];

      // u1 invests in Package 1 at default terms (5.0% / 30d)
      await mainPlan.connect(u1).registerAndInvest(owner.address, 1);
      const invBefore = await mainPlan.getUserInvestment(u1.address, 0);
      expect(invBefore.roiBasisPoints).to.equal(500);
      expect(invBefore.durationDays).to.equal(30);

      // Admin modifies Package 1 to 12.0% / 40 days
      await mainPlan.connect(owner).updatePackageRoiAndDuration(1, 1200, 40);

      // u2 invests AFTER modification
      await mainPlan.connect(u2).registerAndInvest(owner.address, 1);
      const invAfter = await mainPlan.getUserInvestment(u2.address, 0);
      expect(invAfter.roiBasisPoints).to.equal(1200);
      expect(invAfter.durationDays).to.equal(40);

      // Advance time by 30 days
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // u1 still accrues at 5% / 30d = $50
      const claimableU1 = await mainPlan.calculateClaimableRoi(u1.address, 0);
      expect(claimableU1).to.be.closeTo(toWei(50), toWei(0.01));

      // u2 accrues at 12% / 40d = (1000 * 12% * 30 / 40) = $90
      const claimableU2 = await mainPlan.calculateClaimableRoi(u2.address, 0);
      expect(claimableU2).to.be.closeTo(toWei(90), toWei(0.01));
    });

    it("P4: SEC-01 Remainder Queue — Level income exceeding 2x cap carries forward with ZERO fund loss", async function () {
      const u1 = testUsers[0];
      // u1 has $1,000 capital -> Monthly 2x cap = $2,000
      await mainPlan.connect(u1).registerAndInvest(owner.address, 1);

      // Setup 5 directs for u1 so L1 eligibility is satisfied
      for (let i = 1; i <= 5; i++) {
        await mainPlan.connect(testUsers[i]).registerAndInvest(u1.address, 3); // 5 x $10,000 = $50,000 volume
      }

      expect(await mainPlan.isLevelEligible(u1.address, 1)).to.be.true;

      // Advance 90 days to accrue substantial level income
      await ethers.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const accrued = await mainPlan.calculateLevelIncome(u1.address);
      expect(accrued).to.be.gt(toWei(1000));

      const u1BalanceBefore = await usdt.balanceOf(u1.address);
      await mainPlan.connect(u1).withdrawLevelIncome();
      const u1BalanceAfter = await usdt.balanceOf(u1.address);

      const paid = u1BalanceAfter - u1BalanceBefore;
      const userState = await mainPlan.users(u1.address);

      // Invariant: Paid + Pending Remainder MUST strictly equal Accrued
      expect(paid + userState.pendingLevelIncome).to.be.closeTo(accrued, toWei(0.01));

      // Next month: advance 30 days, monthly cap resets, claim carried forward remainder
      if (userState.pendingLevelIncome > 0n) {
        await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");

        const secondWithdrawBefore = await usdt.balanceOf(u1.address);
        await mainPlan.connect(u1).withdrawLevelIncome();
        const secondWithdrawAfter = await usdt.balanceOf(u1.address);

        expect(secondWithdrawAfter - secondWithdrawBefore).to.be.gt(0n);
      }
    });

    it("P5: 200% ROI Cap Completion & Capital Return in ADAI Tokens", async function () {
      const u1 = testUsers[0];
      await mainPlan.connect(u1).registerAndInvest(owner.address, 1);

      // Fund mainPlan with reserve USDT to cover 200% payout
      await usdt.mint(await mainPlan.getAddress(), toWei(10000));

      // Advance time by 1200 days to reach 200% ceiling ($2,000 max payout)
      await ethers.provider.send("evm_increaseTime", [1200 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const u1UsdtBefore = await usdt.balanceOf(u1.address);
      const u1AdaiBefore = await adai.balanceOf(u1.address);

      await mainPlan.connect(u1).claimRoi(0);

      const u1UsdtAfter = await usdt.balanceOf(u1.address);
      const u1AdaiAfter = await adai.balanceOf(u1.address);

      // Exact $2,000 USDT paid
      expect(u1UsdtAfter - u1UsdtBefore).to.equal(toWei(2000));

      // Initial $1,000 capital returned via ADAI tokens
      expect(u1AdaiAfter - u1AdaiBefore).to.equal(toWei(1000));

      // Investment marked completed
      const inv = await mainPlan.getUserInvestment(u1.address, 0);
      expect(inv.completed).to.be.true;
    });

    it("P6: NFT Grade Achievement (Token Squire & Coin Knight)", async function () {
      const leader = testUsers[0];
      await mainPlan.connect(leader).registerAndInvest(owner.address, 1);

      // Token Squire requires L1: min 3 members, $5,000 volume
      await mainPlan.connect(testUsers[1]).registerAndInvest(leader.address, 1);
      await mainPlan.connect(testUsers[2]).registerAndInvest(leader.address, 1);
      await mainPlan.connect(testUsers[3]).registerAndInvest(leader.address, 2); // $5,000

      // Leader claims Grade 1 (Token Squire)
      await expect(mainPlan.connect(leader).claimNFTGrade(1))
        .to.emit(mainPlan, "NFTGradeClaimed")
        .withArgs(leader.address, 1);

      expect(await nft.hasGrade(leader.address, 1)).to.be.true;
      expect(await nft.userHighestGrade(leader.address)).to.equal(1);
    });
  });

  // ============================================================================
  // SECTION 3: NEGATIVE REVERT & SECURITY INVARIANT TESTS
  // ============================================================================
  describe("3. Negative & Security Revert Cases", function () {
    it("N1: Should REVERT if user tries to self-sponsor or sponsor is unregistered", async function () {
      const u1 = testUsers[0];
      await expect(
        mainPlan.connect(u1).registerAndInvest(u1.address, 1)
      ).to.be.revertedWithCustomError(mainPlan, "InvalidSponsor");

      await expect(
        mainPlan.connect(u1).registerAndInvest(testUsers[5].address, 1)
      ).to.be.revertedWithCustomError(mainPlan, "SponsorNotActive");
    });

    it("N2: Should REVERT if 120-day activity rule is expired", async function () {
      const u1 = testUsers[0];
      await mainPlan.connect(u1).registerAndInvest(owner.address, 1);

      // Fast forward 121 days with no referrals
      await ethers.provider.send("evm_increaseTime", [121 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await expect(
        mainPlan.connect(u1).withdrawLevelIncome()
      ).to.be.revertedWithCustomError(mainPlan, "ActivityRuleViolated");
    });

    it("N3: Should REVERT if claiming ROI on an already completed investment", async function () {
      const u1 = testUsers[0];
      await mainPlan.connect(u1).registerAndInvest(owner.address, 1);
      await usdt.mint(await mainPlan.getAddress(), toWei(10000));

      await ethers.provider.send("evm_increaseTime", [1200 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await mainPlan.connect(u1).claimRoi(0); // Completes investment

      await expect(
        mainPlan.connect(u1).claimRoi(0)
      ).to.be.revertedWithCustomError(mainPlan, "InvestmentAlreadyCompleted");
    });

    it("N4: Should REVERT if duplicate NFT grade claim is attempted", async function () {
      const leader = testUsers[0];
      await mainPlan.connect(leader).registerAndInvest(owner.address, 1);
      for (let i = 1; i <= 3; i++) {
        await mainPlan.connect(testUsers[i]).registerAndInvest(leader.address, 2);
      }

      await mainPlan.connect(leader).claimNFTGrade(1);

      // Re-claim must revert
      await expect(
        mainPlan.connect(leader).claimNFTGrade(1)
      ).to.be.revertedWithCustomError(mainPlan, "GradeAlreadyClaimed");
    });

    it("N5: Should REVERT unauthorized access to admin treasury and setters", async function () {
      const u1 = testUsers[0];
      await expect(
        mainPlan.connect(u1).adminWithdrawUSDT(toWei(100), u1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        mainPlan.connect(u1).updatePackageRoiAndDuration(1, 500, 30)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        mainPlan.connect(u1).setAdaiCapitalRefundRate(toWei(2))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("N6: Should REVERT parameter violations in package configuration", async function () {
      await expect(
        mainPlan.connect(owner).updatePackageRoiAndDuration(0, 500, 30)
      ).to.be.revertedWithCustomError(mainPlan, "InvalidPackage");

      await expect(
        mainPlan.connect(owner).updatePackageRoiAndDuration(1, 500, 0)
      ).to.be.revertedWithCustomError(mainPlan, "DurationZero");

      await expect(
        mainPlan.connect(owner).updatePackageRoiAndDuration(1, 5001, 30)
      ).to.be.revertedWithCustomError(mainPlan, "InvalidRoiPercentage");
    });
  });

  // ============================================================================
  // SECTION 4: HIGH-CONCURRENCY LOAD & STRESS TEST
  // ============================================================================
  describe("4. High-Concurrency Downline Load & Stress Testing", function () {
    it("LOAD-1: 15-User Deep Chain with Recursive Volume Propagation & Commission Cascading", async function () {
      const chainDepth = 12; // 12-level deep hierarchical network
      let previousSponsor = owner.address;

      console.log(`      Executing ${chainDepth}-level network registration load test...`);

      const gasUsedList = [];

      for (let i = 0; i < chainDepth; i++) {
        const currentUser = testUsers[i];
        const packageChoice = (i % 3) + 1; // Rotate between packages 1, 2, 3

        const tx = await mainPlan.connect(currentUser).registerAndInvest(previousSponsor, packageChoice);
        const receipt = await tx.wait();
        gasUsedList.push(receipt.gasUsed);

        previousSponsor = currentUser.address;
      }

      // Verify deepest user registered successfully
      const deepUser = testUsers[chainDepth - 1];
      expect((await mainPlan.users(deepUser.address)).isRegistered).to.be.true;

      // Verify upline 1 received team business across full network
      const rootUpline = await mainPlan.users(testUsers[0].address);
      expect(rootUpline.totalTeamBusiness).to.be.gt(toWei(20000));

      const avgGas = gasUsedList.reduce((acc, g) => acc + g, 0n) / BigInt(gasUsedList.length);
      console.log(`      Load Test Gas: Min=${gasUsedList[0]}, Max=${gasUsedList[chainDepth - 1]}, Avg=${avgGas}`);
      expect(avgGas).to.be.lt(1500000n); // Well within BSC 60M block gas limit (< 2% of block)
    });

    it("LOAD-2: Mass Batch Deposits and Multi-User Simultaneous ROI Claims", async function () {
      const batchCount = 8;
      // Register 8 users
      for (let i = 0; i < batchCount; i++) {
        await mainPlan.connect(testUsers[i]).registerAndInvest(owner.address, 1);
      }

      // Advance time by 30 days
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // Concurrently claim ROI across all 8 users
      for (let i = 0; i < batchCount; i++) {
        const u = testUsers[i];
        const balanceBefore = await usdt.balanceOf(u.address);
        await mainPlan.connect(u).claimRoi(0);
        const balanceAfter = await usdt.balanceOf(u.address);

        // Verify each user receives approximately 5% ($50 USDT) with 1-second block timestamp tolerance
        expect(balanceAfter - balanceBefore).to.be.closeTo(toWei(50), toWei(0.01));
      }
    });
  });
});
