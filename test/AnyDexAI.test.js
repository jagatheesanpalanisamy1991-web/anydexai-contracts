const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ANYDEXAI Smart Contract Suite", function () {
  let owner, tokenLiqWallet, nftLiqWallet, user1, user2, user3, user4, user5, user6, user7;
  let mockUSDT, adaiToken, anyDexNFT, mainContract;

  const toWei = (val) => ethers.parseUnits(val.toString(), 18);
  const fromWei = (val) => ethers.formatUnits(val, 18);

  beforeEach(async function () {
    [owner, tokenLiqWallet, nftLiqWallet, user1, user2, user3, user4, user5, user6, user7] = await ethers.getSigners();

    // 1. Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    mockUSDT = await MockUSDT.deploy();
    await mockUSDT.waitForDeployment();

    // 2. Deploy ADAI Token
    const ADAI = await ethers.getContractFactory("ADAI");
    adaiToken = await ADAI.deploy();
    await adaiToken.waitForDeployment();

    // 3. Deploy AnyDexAINFT
    const AnyDexAINFT = await ethers.getContractFactory("contracts/AnyDexAINFT.sol:AnyDexAINFT");
    anyDexNFT = await AnyDexAINFT.deploy(owner.address, "https://api.anydexai.com/metadata/nft/");
    await anyDexNFT.waitForDeployment();

    // 4. Deploy AnyDexAIMain
    const AnyDexAIMain = await ethers.getContractFactory("AnyDexAIMain");
    mainContract = await AnyDexAIMain.deploy(
      await mockUSDT.getAddress(),
      await adaiToken.getAddress(),
      await anyDexNFT.getAddress(),
      tokenLiqWallet.address,
      nftLiqWallet.address
    );
    await mainContract.waitForDeployment();

    // 5. Authorize Main Contract as Minter for ADAI and AnyDexAINFT
    await adaiToken.setMinter(await mainContract.getAddress(), true);
    await anyDexNFT.setMinter(await mainContract.getAddress(), true);

    // Distribute USDT to test users and approve Main contract
    const testUsers = [user1, user2, user3, user4, user5, user6, user7];
    for (const u of testUsers) {
      await mockUSDT.mint(u.address, toWei(50000));
      await mockUSDT.connect(u).approve(await mainContract.getAddress(), ethers.MaxUint256);
    }
  });

  describe("1. Initialization & Package Configuration", function () {
    it("Should have 3 default packages with correct ROI and ADAI rewards", async function () {
      expect(await mainContract.packageCount()).to.equal(3);

      const p1 = await mainContract.packages(1);
      expect(p1.price).to.equal(toWei(1000));
      expect(p1.roiBpsPer30d).to.equal(500); // 5%
      expect(p1.tokenReward).to.equal(toWei(10)); // 10 ADAI

      const p2 = await mainContract.packages(2);
      expect(p2.price).to.equal(toWei(5000));
      expect(p2.roiBpsPer30d).to.equal(550); // 5.5%
      expect(p2.tokenReward).to.equal(toWei(50)); // 50 ADAI

      const p3 = await mainContract.packages(3);
      expect(p3.price).to.equal(toWei(10000));
      expect(p3.roiBpsPer30d).to.equal(600); // 6%
      expect(p3.tokenReward).to.equal(toWei(100)); // 100 ADAI
    });

    it("Should allow owner to add and update packages", async function () {
      await mainContract.addPackage(toWei(25000), 700, toWei(300));
      expect(await mainContract.packageCount()).to.equal(4);

      const p4 = await mainContract.packages(4);
      expect(p4.price).to.equal(toWei(25000));
      expect(p4.roiBpsPer30d).to.equal(700);
      expect(p4.tokenReward).to.equal(toWei(300));

      await mainContract.updatePackage(4, toWei(30000), 750, toWei(350), true);
      const updatedP4 = await mainContract.packages(4);
      expect(updatedP4.price).to.equal(toWei(30000));
      expect(updatedP4.roiBpsPer30d).to.equal(750);
    });
  });

  describe("2. User Registration, Staking & Liquidity Routing", function () {
    it("Should register user, route 0.5% token and 0.5% NFT liquidity, and mint Entry Pass NFT + ADAI", async function () {
      const initTokenLiq = await mockUSDT.balanceOf(tokenLiqWallet.address);
      const initNftLiq = await mockUSDT.balanceOf(nftLiqWallet.address);

      // User1 invests $1,000 package
      await mainContract.connect(user1).invest(1, owner.address, "Arun", "+919876543210");

      // Verify liquidity transfers: 0.5% of $1,000 = $5 USDT each
      expect(await mockUSDT.balanceOf(tokenLiqWallet.address)).to.equal(initTokenLiq + toWei(5));
      expect(await mockUSDT.balanceOf(nftLiqWallet.address)).to.equal(initNftLiq + toWei(5));

      // Verify user's profile in smart contract
      const profile = await mainContract.users(user1.address);
      expect(profile.name).to.equal("Arun");
      expect(profile.mobile).to.equal("+919876543210");
      expect(profile.totalInvested).to.equal(toWei(1000));
      expect(profile.activeInvested).to.equal(toWei(1000));
      expect(profile.registered).to.be.true;

      // Verify Entry Pass NFT (Tier 0) minted
      expect(await anyDexNFT.balanceOf(user1.address)).to.equal(1);
      expect(await anyDexNFT.hasTierNFT(user1.address, 0)).to.be.true;

      // Verify 10 ADAI welcome tokens minted to user1
      expect(await adaiToken.balanceOf(user1.address)).to.equal(toWei(10));
    });
  });

  describe("3. 3-Tier Immediate Direct Referral & Sponsor Token Bonus", function () {
    it("Should distribute immediate USDT referral (7%, 2%, 1%) and 50% sponsor ADAI bonus", async function () {
      // Chain: Owner -> User1 ($1000) -> User2 ($1000) -> User3 ($1000) -> User4 ($1000)
      await mainContract.connect(user1).invest(1, owner.address, "User1", "111");

      const u1UsdtBefore = await mockUSDT.balanceOf(user1.address);
      const u1AdaiBefore = await adaiToken.balanceOf(user1.address);

      // User2 joins under User1 ($1,000 pack)
      await mainContract.connect(user2).invest(1, user1.address, "User2", "222");

      // User1 is Direct Sponsor:
      // Receives 7% of $1,000 = $70 USDT immediately
      expect(await mockUSDT.balanceOf(user1.address)).to.equal(u1UsdtBefore + toWei(70));
      // Receives 50% of User2's ADAI welcome tokens (50% of 10 = 5 ADAI)
      expect(await adaiToken.balanceOf(user1.address)).to.equal(u1AdaiBefore + toWei(5));

      // User3 joins under User2 ($1,000 pack)
      // User1 is now Upline 2 (2% = $20 USDT)
      await mainContract.connect(user3).invest(1, user2.address, "User3", "333");
      expect(await mockUSDT.balanceOf(user1.address)).to.equal(u1UsdtBefore + toWei(70) + toWei(20));

      // User4 joins under User3 ($1,000 pack)
      // User1 is now Upline 3 (1% = $10 USDT)
      await mainContract.connect(user4).invest(1, user3.address, "User4", "444");
      expect(await mockUSDT.balanceOf(user1.address)).to.equal(u1UsdtBefore + toWei(70) + toWei(20) + toWei(10));
    });
  });

  describe("4. ROI Accrual, 200% Cap & ADAI Capital Refund", function () {
    it("Should accrue 5%/30 days ROI, strictly cap at 200%, and refund capital in ADAI tokens", async function () {
      await mainContract.connect(user1).invest(1, owner.address, "User1", "111");

      // Advance time by 30 days
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      // Pending ROI should be approximately $50 (5% of $1,000)
      const pendingRoi30d = await mainContract.calculatePendingROI(user1.address);
      expect(pendingRoi30d).to.be.closeTo(toWei(50), toWei(0.5));

      // Fast-forward by 1,300 days (well beyond the 200% threshold: 40 months * 5% = 200%)
      await ethers.provider.send("evm_increaseTime", [1300 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      const adaiBalBefore = await adaiToken.balanceOf(user1.address); // currently 10 ADAI
      
      // Claim ROI
      await mainContract.connect(user1).claimROI();

      // Verify total claimable USDT is exactly 200% = $2,000 USDT
      const claimable = await mainContract.claimableUSDT(user1.address);
      expect(claimable).to.equal(toWei(2000));

      // Verify Capital Return via ADAI tokens: 1,000 ADAI minted to user!
      const adaiBalAfter = await adaiToken.balanceOf(user1.address);
      expect(adaiBalAfter - adaiBalBefore).to.equal(toWei(1000));

      // Verify active investment is now 0 and investment is inactive
      const profile = await mainContract.users(user1.address);
      expect(profile.activeInvested).to.equal(0);
    });
  });

  describe("5. Level Income & 120-Day Activity Enforcement", function () {
    it("Should allow level income claim when active, but block if 120-day rule is violated until new referral", async function () {
      // User1 registers with $5,000 package
      await mainContract.connect(user1).invest(2, owner.address, "User1", "111");

      // User1 refers 5 direct members with $1,000 each -> Total L1 = $5,000, 5 members (Qualifies for Level 1: 1%/30d)
      const downline = [user2, user3, user4, user5, user6];
      for (let i = 0; i < downline.length; i++) {
        await mainContract.connect(downline[i]).invest(1, user1.address, `Downline${i}`, `999${i}`);
      }

      // Check downline stats
      const stats = await mainContract.getUserDownlineStats(user1.address, 0);
      expect(stats.members).to.equal(5);
      expect(stats.volume).to.equal(toWei(5000));

      // Fast forward 30 days (User1 last referral was today, so 30 days <= 120 days is ACTIVE)
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      expect(await mainContract.is120DayActive(user1.address)).to.be.true;

      // Pending level income: 1% of $5,000 for 30 days = $50 USDT
      const pendingLvl = await mainContract.calculatePendingLevelIncome(user1.address);
      expect(pendingLvl).to.be.closeTo(toWei(50), toWei(0.5));

      // Successfully claim level income
      await mainContract.connect(user1).claimLevelIncome();
      expect(await mainContract.claimableUSDT(user1.address)).to.be.closeTo(toWei(50), toWei(0.5));

      // NOW advance time by 130 days without User1 making any new referral (Total elapsed > 120 days)
      await ethers.provider.send("evm_increaseTime", [130 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      expect(await mainContract.is120DayActive(user1.address)).to.be.false;

      // Attempting to claim level income must REVERT due to 120-day rule!
      await expect(mainContract.connect(user1).claimLevelIncome()).to.be.revertedWith(
        "120-day rule: must refer a member within 120 days to claim level income"
      );

      // User1 now refers a new member (User7) to reactivate 120-day status!
      await mainContract.connect(user7).invest(1, user1.address, "User7", "777");

      // Verify 120-day active status is restored!
      expect(await mainContract.is120DayActive(user1.address)).to.be.true;

      // Now User1 can successfully claim level income again!
      await expect(mainContract.connect(user1).claimLevelIncome()).to.not.be.reverted;
    });
  });

  describe("6. 2x Monthly Affiliate Ceiling", function () {
    it("Should cap total direct referral + level income at 2x user's active capital per month", async function () {
      // User1 has $1,000 active capital -> 2x monthly ceiling is $2,000 USDT
      await mainContract.connect(user1).invest(1, owner.address, "User1", "111");

      const u1UsdtStart = await mockUSDT.balanceOf(user1.address);

      // User2 joins with $30,000 package under User1
      // 7% direct referral would normally be $2,100 USDT
      // But ceiling is 2x of $1,000 = $2,000!
      await mainContract.addPackage(toWei(30000), 600, toWei(300));
      await mockUSDT.mint(user2.address, toWei(30000));
      await mainContract.connect(user2).invest(4, user1.address, "User2", "222");

      // User1 should receive exactly $2,000 (capped from $2,100)
      expect(await mockUSDT.balanceOf(user1.address)).to.equal(u1UsdtStart + toWei(2000));
    });
  });

  describe("7. NFT Grade Achievements", function () {
    it("Should award Token Squire NFT (Tier 1) when qualifying for Level 1 criteria (3 members, $5k)", async function () {
      await mainContract.connect(user1).invest(1, owner.address, "User1", "111");

      // User1 refers 3 members with $2,000 package each (total 3 members, $6,000 volume > $5,000)
      await mainContract.addPackage(toWei(2000), 500, toWei(20));
      await mockUSDT.mint(user2.address, toWei(2000));
      await mockUSDT.mint(user3.address, toWei(2000));
      await mockUSDT.mint(user4.address, toWei(2000));

      await mainContract.connect(user2).invest(4, user1.address, "User2", "2");
      await mainContract.connect(user3).invest(4, user1.address, "User3", "3");
      await mainContract.connect(user4).invest(4, user1.address, "User4", "4");

      // User1 should have 2 NFTs: Tier 0 (Entry Pass) and Tier 1 (Token Squire)
      expect(await anyDexNFT.hasTierNFT(user1.address, 1)).to.be.true;
      expect(await anyDexNFT.balanceOf(user1.address)).to.equal(2);
    });
  });

  describe("8. Instant Withdrawal & Minimum $10 Threshold", function () {
    it("Should revert if withdrawal is below $10, and process immediately when >= $10", async function () {
      await mainContract.connect(user1).invest(1, owner.address, "User1", "111");

      // 1 day elapsed: ~ $1.66 ROI (below $10)
      await ethers.provider.send("evm_increaseTime", [1 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      await expect(mainContract.connect(user1).withdraw()).to.be.revertedWith(
        "Withdrawal below minimum $10"
      );

      // Advance by 10 days: ROI ~ $16.66 (above $10)
      await ethers.provider.send("evm_increaseTime", [10 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      const u1UsdtBefore = await mockUSDT.balanceOf(user1.address);
      await mainContract.connect(user1).withdraw();
      const u1UsdtAfter = await mockUSDT.balanceOf(user1.address);

      expect(u1UsdtAfter - u1UsdtBefore).to.be.greaterThanOrEqual(toWei(10));
    });
  });

  describe("9. Owner Treasury Controls", function () {
    it("Should allow owner to withdraw USDT in emergency and reject non-owner", async function () {
      await mainContract.connect(user1).invest(1, owner.address, "User1", "111");

      const contractBal = await mockUSDT.balanceOf(await mainContract.getAddress());
      expect(contractBal).to.be.greaterThan(0);

      const ownerBefore = await mockUSDT.balanceOf(owner.address);
      await mainContract.connect(owner).emergencyWithdrawUSDT(toWei(500));
      expect(await mockUSDT.balanceOf(owner.address)).to.equal(ownerBefore + toWei(500));

      await expect(
        mainContract.connect(user1).emergencyWithdrawUSDT(toWei(100))
      ).to.be.revertedWithCustomError(mainContract, "OwnableUnauthorizedAccount");
    });
  });
});
