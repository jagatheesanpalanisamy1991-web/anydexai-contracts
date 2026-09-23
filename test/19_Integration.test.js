const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 3: End-to-End Integration Lifecycle (19_Integration.test.js)", function () {
  let owner, tokenLiq, nftLiq, userA, userB, userC, userD, userE, userF;
  let usdt, adai, nft, mainPlan;

  const toWei = (val) => ethers.parseEther(val.toString());

  beforeEach(async function () {
    [owner, tokenLiq, nftLiq, userA, userB, userC, userD, userE, userF] = await ethers.getSigners();

    // 1. Deploy USDT Mock
    const MockUSDT = await ethers.getContractFactory("contracts/tokens/MockUSDT.sol:MockUSDT");
    usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();

    // 2. Deploy ADAIToken
    const ADAITokenFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:ADAIToken");
    adai = await ADAITokenFactory.deploy(owner.address);
    await adai.waitForDeployment();

    // 3. Deploy AnyDexAINFT
    const AnyDexAINFTFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:AnyDexAINFT");
    nft = await AnyDexAINFTFactory.deploy(owner.address, "https://api.anydexai.com/metadata/nft");
    await nft.waitForDeployment();

    // 4. Deploy AnyDexAIMainPlan
    const AnyDexAIMainPlanFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:AnyDexAIMainPlan");
    mainPlan = await AnyDexAIMainPlanFactory.deploy(
      owner.address,
      await usdt.getAddress(),
      tokenLiq.address,
      nftLiq.address
    );
    await mainPlan.waitForDeployment();

    // 5. Connect Contracts & Set Minters
    await adai.setMinter(await mainPlan.getAddress(), true);
    await nft.setMinter(await mainPlan.getAddress(), true);
    await mainPlan.setTokenAndNFTContracts(await adai.getAddress(), await nft.getAddress());

    // 6. Fund users with USDT
    for (const u of [userA, userB, userC, userD, userE, userF]) {
      await usdt.mint(u.address, toWei(100000));
      await usdt.connect(u).approve(await mainPlan.getAddress(), ethers.MaxUint256);
    }
  });

  it("Executes the complete ecosystem lifecycle end-to-end", async function () {
    // ---------------------------------------------------------
    // STEP 1: Deploy & Configuration Verification
    // ---------------------------------------------------------
    expect(await mainPlan.usdtToken()).to.equal(await usdt.getAddress());
    expect(await mainPlan.adaiToken()).to.equal(await adai.getAddress());
    expect(await mainPlan.nftContract()).to.equal(await nft.getAddress());
    expect(await mainPlan.tokenLiquidityWallet()).to.equal(tokenLiq.address);
    expect(await mainPlan.nftLiquidityWallet()).to.equal(nftLiq.address);

    // ---------------------------------------------------------
    // STEP 2: User A Registers & Invests (Entry Pass NFT + Liquidity Fees)
    // ---------------------------------------------------------
    const tokenLiqBefore = await usdt.balanceOf(tokenLiq.address);
    const nftLiqBefore = await usdt.balanceOf(nftLiq.address);

    // User A invests in Package 1 (1000 USDT)
    const txA = await mainPlan.connect(userA).registerAndInvest(owner.address, 1);
    await expect(txA).to.emit(mainPlan, "Registered");
    await expect(txA).to.emit(mainPlan, "Invested").withArgs(userA.address, 1, toWei(1000));

    // Verify 0.5% fee to tokenLiquidity and 0.5% fee to nftLiquidity (5 USDT each)
    expect(await usdt.balanceOf(tokenLiq.address) - tokenLiqBefore).to.equal(toWei(5));
    expect(await usdt.balanceOf(nftLiq.address) - nftLiqBefore).to.equal(toWei(5));

    // Verify Entry Pass NFT minted
    expect(await nft.hasEntryPass(userA.address)).to.be.true;
    expect(await nft.balanceOf(userA.address)).to.equal(1n);

    // ---------------------------------------------------------
    // STEP 3: Multi-tier Referral Tree & Direct Referral Distribution
    // User A -> User B -> User C -> User D
    // ---------------------------------------------------------
    // User B invests 1000 USDT (Package 1) under User A
    await mainPlan.connect(userB).registerAndInvest(userA.address, 1);

    // User C invests 1000 USDT (Package 1) under User B
    await mainPlan.connect(userC).registerAndInvest(userB.address, 1);

    // User D invests 1000 USDT (Package 1) under User C
    await mainPlan.connect(userD).registerAndInvest(userC.address, 1);

    // Direct Referral commissions (paid immediately to user wallet):
    // User A receives:
    // - From B (L1, 7%): 70 USDT
    // - From C (L2, 2%): 20 USDT
    // - From D (L3, 1%): 10 USDT
    // Total User A received = 100 USDT
    const userAProfile = await mainPlan.users(userA.address);
    expect(userAProfile.currentMonthEarnings).to.equal(toWei(100));
    expect(await usdt.balanceOf(userA.address)).to.equal(toWei(100000 - 1000 + 100));

    // User B receives:
    // - From C (L1, 7%): 70 USDT
    // - From D (L2, 2%): 20 USDT
    // Total User B received = 90 USDT
    const userBProfile = await mainPlan.users(userB.address);
    expect(userBProfile.currentMonthEarnings).to.equal(toWei(90));
    expect(await usdt.balanceOf(userB.address)).to.equal(toWei(100000 - 1000 + 90));

    // User C receives:
    // - From D (L1, 7%): 70 USDT
    const userCProfile = await mainPlan.users(userC.address);
    expect(userCProfile.currentMonthEarnings).to.equal(toWei(70));
    expect(await usdt.balanceOf(userC.address)).to.equal(toWei(100000 - 1000 + 70));

    // ---------------------------------------------------------
    // STEP 4: Downline Volume Propagation & 120-Day Rule
    // ---------------------------------------------------------
    // User A downline counts and volume:
    // Level 1: 1 member (B), 1000 USDT
    // Level 2: 1 member (C), 1000 USDT
    // Level 3: 1 member (D), 1000 USDT
    expect(await mainPlan.userDownlineCount(userA.address, 1)).to.equal(1n);
    expect(await mainPlan.userDownlineVolume(userA.address, 1)).to.equal(toWei(1000));
    expect(await mainPlan.userDownlineCount(userA.address, 2)).to.equal(1n);
    expect(await mainPlan.userDownlineVolume(userA.address, 2)).to.equal(toWei(1000));
    expect(await mainPlan.userDownlineCount(userA.address, 3)).to.equal(1n);
    expect(await mainPlan.userDownlineVolume(userA.address, 3)).to.equal(toWei(1000));

    // 120-Day Activity window check:
    expect(await mainPlan.is120DaysActive(userA.address)).to.be.true;

    // ---------------------------------------------------------
    // STEP 5: 200% ROI Completion & ADAI Capital Refund
    // ---------------------------------------------------------
    // Fund contract with USDT to cover user claims
    await usdt.mint(await mainPlan.getAddress(), toWei(50000));

    // Advance time by 1300 days to reach 200% ROI cap
    await ethers.provider.send("evm_increaseTime", [1300 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    // User A claims ROI on investment index 0
    const txClaim = await mainPlan.connect(userA).claimRoi(0);

    // Should emit RoiClaimed and CapitalReturnedViaADAI
    await expect(txClaim).to.emit(mainPlan, "RoiClaimed").withArgs(userA.address, 0, toWei(2000));
    await expect(txClaim).to.emit(mainPlan, "CapitalReturnedViaADAI").withArgs(userA.address, 0, toWei(1000));

    // Verify 1000 ADAI token refunded to User A (+15 from signup & referral rewards)
    expect(await adai.balanceOf(userA.address)).to.equal(toWei(1015));

    // Verify investment is marked completed
    const invA = await mainPlan.getUserInvestment(userA.address, 0);
    expect(invA.completed).to.be.true;
    expect(invA.totalRoiClaimed).to.equal(toWei(2000));

    // Attempting further ROI claims on completed investment reverts InvestmentAlreadyCompleted
    await ethers.provider.send("evm_increaseTime", [10 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");
    await expect(mainPlan.connect(userA).claimRoi(0)).to.be.revertedWithCustomError(
      mainPlan,
      "InvestmentAlreadyCompleted"
    );

    // ---------------------------------------------------------
    // STEP 6: NFT Royal Grade Qualification & Minting
    // Grade 1 requires Level 1: >= 3 members and >= 5000 USDT volume
    // Currently User A has 1 member (User B, 1000 USDT).
    // Let's add User E with Package 2 (5000 USDT) and User F with Package 1 (1000 USDT) under User A.
    // ---------------------------------------------------------
    await mainPlan.connect(userE).registerAndInvest(userA.address, 2);
    await mainPlan.connect(userF).registerAndInvest(userA.address, 1);

    // User A Level 1 now has 3 members and 7000 USDT volume (1000 + 5000 + 1000) >= 5000 USDT
    expect(await mainPlan.userDownlineCount(userA.address, 1)).to.equal(3n);
    expect(await mainPlan.userDownlineVolume(userA.address, 1)).to.equal(toWei(7000));

    // User A claims Grade 1
    const txGrade = await mainPlan.connect(userA).claimNFTGrade(1);
    await expect(txGrade).to.emit(mainPlan, "NFTGradeClaimed").withArgs(userA.address, 1);
    expect(await nft.hasGrade(userA.address, 1)).to.be.true;
    expect(await nft.userHighestGrade(userA.address)).to.equal(1);

    // Cannot claim same grade twice
    await expect(mainPlan.connect(userA).claimNFTGrade(1)).to.be.revertedWithCustomError(
      mainPlan,
      "GradeAlreadyClaimed"
    );

    // ---------------------------------------------------------
    // STEP 7: Multi-Hop NFT Transfer
    // ---------------------------------------------------------
    // User A has Entry Pass (tokenId 1) and Grade 1 (tokenId 7)
    const tokenA_Royal = 7; // TokenId for Grade 1
    expect(await nft.ownerOf(tokenA_Royal)).to.equal(userA.address);

    // Transfer User A -> User B
    await nft.connect(userA).transferFrom(userA.address, userB.address, tokenA_Royal);
    expect(await nft.ownerOf(tokenA_Royal)).to.equal(userB.address);

    // Transfer User B -> User C
    await nft.connect(userB).transferFrom(userB.address, userC.address, tokenA_Royal);
    expect(await nft.ownerOf(tokenA_Royal)).to.equal(userC.address);

    // Transfer User C -> User D
    await nft.connect(userC).transferFrom(userC.address, userD.address, tokenA_Royal);
    expect(await nft.ownerOf(tokenA_Royal)).to.equal(userD.address);

    // Verify historical minter records are preserved on User A
    expect(await nft.hasGrade(userA.address, 1)).to.be.true;
    expect(await nft.userHighestGrade(userA.address)).to.equal(1);

    // ---------------------------------------------------------
    // STEP 8: Admin Controls & Treasury Invariance
    // ---------------------------------------------------------
    // Admin updates package parameters
    await mainPlan.connect(owner).updatePackageRoiAndDuration(1, 1200, 180);
    const updatedPkg = await mainPlan.packages(1);
    expect(updatedPkg.roiBasisPoints).to.equal(1200n);
    expect(updatedPkg.durationDays).to.equal(180n);

    // Admin updates ADAI capital refund rate
    await mainPlan.connect(owner).setAdaiCapitalRefundRate(toWei(2));
    expect(await mainPlan.adaiCapitalRefundRate()).to.equal(toWei(2));

    // Admin withdraws treasury USDT safely
    const ownerBalBefore = await usdt.balanceOf(owner.address);
    await mainPlan.connect(owner).adminWithdrawUSDT(toWei(1000), owner.address);
    expect(await usdt.balanceOf(owner.address) - ownerBalBefore).to.equal(toWei(1000));

    // Non-owner cannot withdraw
    await expect(
      mainPlan.connect(userA).adminWithdrawUSDT(toWei(1000), userA.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });
});
