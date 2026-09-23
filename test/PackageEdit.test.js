const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AnyDexAI - Package ROI and Duration Edit Tests", function () {
  let owner, user1, user2, tokenLiq, nftLiq;
  let usdt, adai, nft, mainPlan;

  beforeEach(async function () {
    [owner, user1, user2, tokenLiq, nftLiq] = await ethers.getSigners();

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

    // 5. Connect Contracts
    await adai.setMinter(await mainPlan.getAddress(), true);
    await nft.setMinter(await mainPlan.getAddress(), true);
    await mainPlan.setTokenAndNFTContracts(await adai.getAddress(), await nft.getAddress());
  });

  describe("Initial Default Packages Verification", function () {
    it("Should verify package 1 defaults ($1,000, 5% / 30d, 10 ADAI)", async function () {
      const pkg = await mainPlan.packages(1);
      expect(pkg.amount).to.equal(ethers.parseEther("1000"));
      expect(pkg.roiBasisPoints).to.equal(500n); // 5.0%
      expect(pkg.durationDays).to.equal(30n);
      expect(pkg.tokenReward).to.equal(ethers.parseEther("10"));
      expect(pkg.isActive).to.be.true;
    });

    it("Should verify package 2 defaults ($5,000, 5.5% / 30d, 50 ADAI)", async function () {
      const pkg = await mainPlan.packages(2);
      expect(pkg.amount).to.equal(ethers.parseEther("5000"));
      expect(pkg.roiBasisPoints).to.equal(550n); // 5.5%
      expect(pkg.durationDays).to.equal(30n);
      expect(pkg.tokenReward).to.equal(ethers.parseEther("50"));
      expect(pkg.isActive).to.be.true;
    });

    it("Should verify package 3 defaults ($10,000, 6.0% / 30d, 100 ADAI)", async function () {
      const pkg = await mainPlan.packages(3);
      expect(pkg.amount).to.equal(ethers.parseEther("10000"));
      expect(pkg.roiBasisPoints).to.equal(600n); // 6.0%
      expect(pkg.durationDays).to.equal(30n);
      expect(pkg.tokenReward).to.equal(ethers.parseEther("100"));
      expect(pkg.isActive).to.be.true;
    });
  });

  describe("Positive Test Cases (Happy Paths)", function () {
    it("P1: Owner should successfully update ROI and duration using updatePackageRoiAndDuration", async function () {
      const newRoiBps = 750n; // 7.5%
      const newDurationDays = 45n; // 45 days

      // Execute update and verify event
      await expect(mainPlan.connect(owner).updatePackageRoiAndDuration(1, newRoiBps, newDurationDays))
        .to.emit(mainPlan, "PackageRoiAndDurationUpdated")
        .withArgs(1, 500n, newRoiBps, 30n, newDurationDays);

      // Verify state changes
      const pkg = await mainPlan.packages(1);
      expect(pkg.roiBasisPoints).to.equal(newRoiBps);
      expect(pkg.durationDays).to.equal(newDurationDays);
      expect(pkg.amount).to.equal(ethers.parseEther("1000"));
      expect(pkg.tokenReward).to.equal(ethers.parseEther("10"));
      expect(pkg.isActive).to.be.true;
    });

    it("P2: Owner should successfully edit all package properties via updatePackage", async function () {
      const newAmount = ethers.parseEther("1500");
      const newRoiBps = 800n; // 8%
      const newDurationDays = 60n;
      const newTokenReward = ethers.parseEther("25");

      await expect(
        mainPlan.connect(owner).updatePackage(1, newAmount, newRoiBps, newDurationDays, newTokenReward, true)
      )
        .to.emit(mainPlan, "PackageUpdated")
        .withArgs(1, newAmount, newRoiBps, newDurationDays, newTokenReward, true);

      const pkg = await mainPlan.packages(1);
      expect(pkg.amount).to.equal(newAmount);
      expect(pkg.roiBasisPoints).to.equal(newRoiBps);
      expect(pkg.durationDays).to.equal(newDurationDays);
      expect(pkg.tokenReward).to.equal(newTokenReward);
      expect(pkg.isActive).to.be.true;
    });

    it("P3: Owner can add a new package and subsequently edit its ROI and days", async function () {
      await mainPlan.connect(owner).addPackage(
        ethers.parseEther("25000"),
        700n, // 7.0%
        30n,
        ethers.parseEther("300")
      );
      expect(await mainPlan.packageCount()).to.equal(4n);

      await mainPlan.connect(owner).updatePackageRoiAndDuration(4, 850n, 20n);

      const pkg4 = await mainPlan.packages(4);
      expect(pkg4.roiBasisPoints).to.equal(850n);
      expect(pkg4.durationDays).to.equal(20n);
    });

    it("P4: Updated ROI and duration applies to new investments while preserving snapshot for existing investments", async function () {
      // User 1 registers with Package 1 (5% / 30d)
      await usdt.mint(user1.address, ethers.parseEther("1000"));
      await usdt.connect(user1).approve(await mainPlan.getAddress(), ethers.parseEther("1000"));
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);

      // Now owner updates package 1 to 10% / 30 days (1000 bps)
      await mainPlan.connect(owner).updatePackageRoiAndDuration(1, 1000n, 30n);

      // User 2 joins after update (gets the new 10% / 30d terms)
      await usdt.mint(user2.address, ethers.parseEther("1000"));
      await usdt.connect(user2).approve(await mainPlan.getAddress(), ethers.parseEther("1000"));
      await mainPlan.connect(user2).registerAndInvest(owner.address, 1);

      // Advance time by 30 days
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // User 1 was snapshotted at 5% -> gets $50
      const claimableUser1 = await mainPlan.calculateClaimableRoi(user1.address, 0);
      expect(claimableUser1).to.be.closeTo(ethers.parseEther("50"), ethers.parseEther("0.01"));

      // User 2 deposited after update at 10% -> gets $100
      const claimableUser2 = await mainPlan.calculateClaimableRoi(user2.address, 0);
      expect(claimableUser2).to.be.closeTo(ethers.parseEther("100"), ethers.parseEther("0.01"));
    });
  });

  describe("Negative Test Cases (Revert Checks)", function () {
    it("N1: Should REVERT if a non-owner attempts to call updatePackageRoiAndDuration", async function () {
      await expect(
        mainPlan.connect(user1).updatePackageRoiAndDuration(1, 600n, 30n)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("N2: Should REVERT if a non-owner attempts to call updatePackage", async function () {
      await expect(
        mainPlan.connect(user1).updatePackage(1, ethers.parseEther("1000"), 500n, 30n, ethers.parseEther("10"), true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("N3: Should REVERT if package ID is 0 (invalid ID)", async function () {
      await expect(
        mainPlan.connect(owner).updatePackageRoiAndDuration(0, 600n, 30n)
      ).to.be.revertedWithCustomError(mainPlan, "InvalidPackage");

      await expect(
        mainPlan.connect(owner).updatePackage(0, ethers.parseEther("1000"), 500n, 30n, ethers.parseEther("10"), true)
      ).to.be.revertedWithCustomError(mainPlan, "InvalidPackage");
    });

    it("N4: Should REVERT if package ID exceeds packageCount (non-existent package)", async function () {
      const nonExistentId = 99n;
      await expect(
        mainPlan.connect(owner).updatePackageRoiAndDuration(nonExistentId, 600n, 30n)
      ).to.be.revertedWithCustomError(mainPlan, "InvalidPackage");
    });

    it("N5: Should REVERT if durationDays is set to 0", async function () {
      await expect(
        mainPlan.connect(owner).updatePackageRoiAndDuration(1, 600n, 0n)
      ).to.be.revertedWithCustomError(mainPlan, "DurationZero");

      await expect(
        mainPlan.connect(owner).updatePackage(1, ethers.parseEther("1000"), 500n, 0n, ethers.parseEther("10"), true)
      ).to.be.revertedWithCustomError(mainPlan, "DurationZero");
    });

    it("N6: Should REVERT if roiBps is set to 0", async function () {
      await expect(
        mainPlan.connect(owner).updatePackageRoiAndDuration(1, 0n, 30n)
      ).to.be.revertedWithCustomError(mainPlan, "InvalidRoiPercentage");

      await expect(
        mainPlan.connect(owner).updatePackage(1, ethers.parseEther("1000"), 0n, 30n, ethers.parseEther("10"), true)
      ).to.be.revertedWithCustomError(mainPlan, "InvalidRoiPercentage");
    });

    it("N7: Should REVERT if roiBps exceeds maximum threshold (> 5000 bps / 50%)", async function () {
      const excessiveRoiBps = 5001n; // 50.01%
      await expect(
        mainPlan.connect(owner).updatePackageRoiAndDuration(1, excessiveRoiBps, 30n)
      ).to.be.revertedWithCustomError(mainPlan, "InvalidRoiPercentage");

      await expect(
        mainPlan.connect(owner).updatePackage(1, ethers.parseEther("1000"), excessiveRoiBps, 30n, ethers.parseEther("10"), true)
      ).to.be.revertedWithCustomError(mainPlan, "InvalidRoiPercentage");
    });

    it("N8: Should REVERT if amount is set to 0 in updatePackage", async function () {
      await expect(
        mainPlan.connect(owner).updatePackage(1, 0n, 500n, 30n, ethers.parseEther("10"), true)
      ).to.be.revertedWithCustomError(mainPlan, "AmountZero");
    });
  });
});
