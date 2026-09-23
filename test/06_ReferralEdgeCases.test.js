const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 7: Referral Tree Edge Cases & Depths (06_ReferralEdgeCases.test.js)", function () {
  let owner, tokenLiq, nftLiq;
  let testUsers = [];
  let usdt, adai, nft, mainPlan;

  const toWei = (val) => ethers.parseEther(val.toString());

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    tokenLiq = signers[1];
    nftLiq = signers[2];
    testUsers = signers.slice(3);

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

    for (const u of testUsers) {
      await usdt.mint(u.address, toWei(200000));
      await usdt.connect(u).approve(await mainPlan.getAddress(), ethers.MaxUint256);
    }
  });

  it("R1: Owner as direct sponsor functions correctly", async function () {
    const u1 = testUsers[0];
    await expect(mainPlan.connect(u1).registerAndInvest(owner.address, 1)).to.not.be.reverted;
    const u1State = await mainPlan.users(u1.address);
    expect(u1State.sponsor).to.equal(owner.address);
  });

  it("R3 & R4 & R5: Level volume propagates up to 8 levels and stops cleanly without bleeding into Level 9+", async function () {
    // Chain: u0 -> u1 -> u2 -> u3 -> u4 -> u5 -> u6 -> u7 -> u8 -> u9 (10 users deep)
    let parent = owner.address;
    for (let i = 0; i < 10; i++) {
      await mainPlan.connect(testUsers[i]).registerAndInvest(parent, 1); // $1,000 each
      parent = testUsers[i].address;
    }

    const rootUser = testUsers[0].address;

    // Check downline count for rootUser across levels 1 to 8:
    // Level 1: testUsers[1] (1 member)
    // Level 2: testUsers[2] (1 member)
    // ...
    // Level 8: testUsers[8] (1 member)
    for (let lvl = 1; lvl <= 8; lvl++) {
      expect(await mainPlan.userDownlineCount(rootUser, lvl)).to.equal(1n);
      expect(await mainPlan.userDownlineVolume(rootUser, lvl)).to.equal(toWei(1000));
    }

    // Level 9 user is testUsers[9]. In contract, loop stops at lvl <= 8.
    // Ensure rootUser downline count at level 8 did NOT erroneously count Level 9
    expect(await mainPlan.userDownlineCount(rootUser, 8)).to.equal(1n);
  });

  it("R6 & R7: Self-sponsorship and invalid/unregistered sponsors strictly revert", async function () {
    const u1 = testUsers[0];
    await expect(
      mainPlan.connect(u1).registerAndInvest(u1.address, 1)
    ).to.be.revertedWithCustomError(mainPlan, "InvalidSponsor");

    await expect(
      mainPlan.connect(u1).registerAndInvest(ethers.ZeroAddress, 1)
    ).to.be.revertedWithCustomError(mainPlan, "InvalidSponsor");

    await expect(
      mainPlan.connect(u1).registerAndInvest(testUsers[5].address, 1)
    ).to.be.revertedWithCustomError(mainPlan, "SponsorNotActive");
  });
});
