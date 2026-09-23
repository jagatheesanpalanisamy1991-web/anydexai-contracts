const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("User Registration & Genealogy Tree Suite", function () {
  let owner, user1, user2, user3, user4, tokenLiq, nftLiq;
  let usdt, adai, nft, mainPlan;

  const toWei = (val) => ethers.parseUnits(val.toString(), 18);

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, tokenLiq, nftLiq] = await ethers.getSigners();

    // 1. Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();

    // 2. Deploy ADAIToken from AnyDexAISingle
    const ADAIToken = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:ADAIToken");
    adai = await ADAIToken.deploy(owner.address);
    await adai.waitForDeployment();

    // 3. Deploy AnyDexAINFT from AnyDexAISingle
    const AnyDexAINFT = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:AnyDexAINFT");
    nft = await AnyDexAINFT.deploy(owner.address, "https://api.anydexai.com/metadata/nft/");
    await nft.waitForDeployment();

    // 4. Deploy AnyDexAIMainPlan from AnyDexAISingle
    const MainPlan = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:AnyDexAIMainPlan");
    mainPlan = await MainPlan.deploy(
      owner.address,
      await usdt.getAddress(),
      tokenLiq.address,
      nftLiq.address
    );
    await mainPlan.waitForDeployment();

    // Authorize MainPlan on Token and NFT
    await adai.setMinter(await mainPlan.getAddress(), true);
    await nft.setMinter(await mainPlan.getAddress(), true);
    await mainPlan.setTokenAndNFTContracts(await adai.getAddress(), await nft.getAddress());

    // Mint USDT and approve
    for (const u of [user1, user2, user3, user4]) {
      await usdt.mint(u.address, toWei(50000));
      await usdt.connect(u).approve(await mainPlan.getAddress(), ethers.MaxUint256);
    }
  });

  describe("1. Standalone Registration: regUser(uint256 _referrerID)", function () {
    it("Should register user with numeric referrer ID 1, mint Entry Pass NFT, and populate genealogy tree", async function () {
      expect(await mainPlan.isUserRegistered(user1.address)).to.be.false;

      // Register user1 under Root Deployer (ID 1)
      const tx = await mainPlan.connect(user1)["regUser(uint256)"](1);
      await expect(tx)
        .to.emit(mainPlan, "Registered")
        .withArgs(user1.address, owner.address, 0, await ethers.provider.getBlock("latest").then(b => b.timestamp));

      // Check user registration fields
      const u1Data = await mainPlan.users(user1.address);
      expect(u1Data.isExist).to.be.true;
      expect(u1Data.isRegistered).to.be.true;
      expect(u1Data.id).to.equal(2);
      expect(u1Data.referrerID).to.equal(1);
      expect(u1Data.sponsorID).to.equal(1);
      expect(u1Data.sponsor).to.equal(owner.address);
      expect(u1Data.activeCapital).to.equal(0);

      // Verify global counters and mapping aliases
      expect(await mainPlan.totalUsers()).to.equal(2);
      expect(await mainPlan.currentId()).to.equal(2);
      expect(await mainPlan.idToAddress(2)).to.equal(user1.address);
      expect(await mainPlan.userList(2)).to.equal(user1.address);
      expect(await mainPlan.addressToId(user1.address)).to.equal(2);

      // Verify Entry Pass NFT was minted
      expect(await nft.hasEntryPass(user1.address)).to.be.true;

      // Verify tree view helpers
      const ownerReferrals = await mainPlan.getUserReferrals(owner.address);
      expect(ownerReferrals.length).to.equal(1);
      expect(ownerReferrals[0]).to.equal(user1.address);

      expect(await mainPlan.getUserUpline(user1.address, 1)).to.equal(owner.address);
      expect(await mainPlan.isUserRegistered(user1.address)).to.be.true;
      expect(await mainPlan.isLevelActive(user1.address, 1)).to.be.false; // No active package yet
    });

    it("Should revert if registering with invalid referrer ID or already registered", async function () {
      // ID 0
      await expect(mainPlan.connect(user1)["regUser(uint256)"](0))
        .to.be.revertedWithCustomError(mainPlan, "InvalidReferrerID");

      // ID > totalUsers
      await expect(mainPlan.connect(user1)["regUser(uint256)"](999))
        .to.be.revertedWithCustomError(mainPlan, "InvalidReferrerID");

      // Register successfully once
      await mainPlan.connect(user1)["regUser(uint256)"](1);

      // Re-registration should revert
      await expect(mainPlan.connect(user1)["regUser(uint256)"](1))
        .to.be.revertedWithCustomError(mainPlan, "AlreadyRegistered");
    });
  });

  describe("2. Standalone Registration: regUser(address _referrer)", function () {
    it("Should register user with referrer address", async function () {
      await expect(mainPlan.connect(user1)["regUser(address)"](owner.address))
        .to.emit(mainPlan, "Registered");

      expect(await mainPlan.isUserRegistered(user1.address)).to.be.true;
      expect(await mainPlan.getUserUpline(user1.address, 1)).to.equal(owner.address);
    });

    it("Should revert if sponsor address is self or unregistered", async function () {
      // Self sponsor
      await expect(mainPlan.connect(user1)["regUser(address)"](user1.address))
        .to.be.revertedWithCustomError(mainPlan, "InvalidSponsor");

      // Unregistered sponsor
      await expect(mainPlan.connect(user1)["regUser(address)"](user2.address))
        .to.be.revertedWithCustomError(mainPlan, "SponsorNotActive");
    });
  });

  describe("3. Separate Investment: buyPackage(uint256) & invest(uint256)", function () {
    beforeEach(async function () {
      // Register user1 under owner and activate package 1
      await mainPlan.connect(user1)["regUser(uint256)"](1);
      await mainPlan.connect(user1).buyPackage(1);
      // Register user2 under user1 (ID 2)
      await mainPlan.connect(user2)["regUser(uint256)"](2);
    });

    it("Should allow already-registered user to buyPackage and receive rewards", async function () {
      const u1UsdtBefore = await usdt.balanceOf(user1.address);

      // User 2 buys package 1 ($1,000)
      await expect(mainPlan.connect(user2).buyPackage(1))
        .to.emit(mainPlan, "Invested")
        .withArgs(user2.address, 1, toWei(1000));

      const u2Data = await mainPlan.users(user2.address);
      expect(u2Data.activeCapital).to.equal(toWei(1000));
      expect(await mainPlan.isLevelActive(user2.address, 1)).to.be.true;

      // 7% Direct referral paid to sponsor (user1 who has $1,000 active capital)
      const u1UsdtAfter = await usdt.balanceOf(user1.address);
      expect(u1UsdtAfter - u1UsdtBefore).to.equal(toWei(70)); // 7% of $1,000

      // ADAI token rewards: 10 to user2, 5 to user1
      expect(await adai.balanceOf(user2.address)).to.equal(toWei(10));
      expect(await adai.balanceOf(user1.address)).to.equal(toWei(5 + 10)); // 10 from own + 5 from user2
    });

    it("Should allow invest(uint256) alias for buyPackage", async function () {
      await expect(mainPlan.connect(user2).invest(1))
        .to.emit(mainPlan, "Invested")
        .withArgs(user2.address, 1, toWei(1000));

      expect((await mainPlan.users(user2.address)).activeCapital).to.equal(toWei(1000));
    });

    it("Should revert buyPackage if caller is not registered", async function () {
      await expect(mainPlan.connect(user3).buyPackage(1))
        .to.be.revertedWithCustomError(mainPlan, "NotRegistered");
    });
  });

  describe("4. Combined Registration & Investment: regUser(uint256 _referrerID, uint256 _packageId)", function () {
    it("Should register and invest in a single transaction", async function () {
      await expect(mainPlan.connect(user1)["regUser(uint256,uint256)"](1, 1))
        .to.emit(mainPlan, "Registered")
        .and.to.emit(mainPlan, "Invested");

      expect(await mainPlan.isUserRegistered(user1.address)).to.be.true;
      expect((await mainPlan.users(user1.address)).activeCapital).to.equal(toWei(1000));
      expect(await nft.hasEntryPass(user1.address)).to.be.true;
      expect(await adai.balanceOf(user1.address)).to.equal(toWei(10));
    });
  });
});
