const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 3: NFT Ownership & State Consistency (16_NFTTransfer.test.js)", function () {
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
      await usdt.mint(u.address, toWei(100000));
      await usdt.connect(u).approve(await mainPlan.getAddress(), ethers.MaxUint256);
    }
  });

  describe("Entry Pass NFT Transfer & Flag State Verification", function () {
    it("Alice registers, receives Entry Pass, transfers to Bob: verifies ownership vs qualification flag", async function () {
      // Alice (user1) registers
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);
      expect(await nft.ownerOf(1)).to.equal(user1.address);
      expect(await nft.hasEntryPass(user1.address)).to.be.true;
      expect(await nft.hasEntryPass(user2.address)).to.be.false;

      // Alice transfers NFT #1 to Bob (user2)
      await nft.connect(user1).transferFrom(user1.address, user2.address, 1);

      // Current Token Owner is Bob
      expect(await nft.ownerOf(1)).to.equal(user2.address);
      expect(await nft.balanceOf(user2.address)).to.equal(1n);
      expect(await nft.balanceOf(user1.address)).to.equal(0n);

      // Check hasEntryPass flag state:
      // Note: In current architecture, hasEntryPass is an achievement/historical mint flag
      expect(await nft.hasEntryPass(user1.address)).to.be.true; // Historical badge minted to Alice
      expect(await nft.hasEntryPass(user2.address)).to.be.false; // Bob holds the token, but did not mint an Entry Pass through registration
    });
  });

  describe("Royal Grade NFT Multi-Hop Transfer (Alice -> Bob -> Charlie -> Alice)", function () {
    it("Royal NFT transfers successfully across multiple recipients without reverting", async function () {
      // Setup qualification for user1 (Alice) to claim Grade 1 (Token Squire)
      await mainPlan.connect(user1).registerAndInvest(owner.address, 1);
      for (let i = 0; i < 3; i++) {
        const subUser = (await ethers.getSigners())[6 + i];
        await usdt.mint(subUser.address, toWei(10000));
        await usdt.connect(subUser).approve(await mainPlan.getAddress(), ethers.MaxUint256);
        await mainPlan.connect(subUser).registerAndInvest(user1.address, 2); // $5,000 each
      }

      // Alice claims Grade 1 NFT (tokenId 5, after 4 Entry Passes minted)
      await mainPlan.connect(user1).claimNFTGrade(1);
      const royalTokenId = 5;
      expect(await nft.ownerOf(royalTokenId)).to.equal(user1.address);
      expect(await nft.tokenGrade(royalTokenId)).to.equal(1); // Grade 1

      // 1. Alice -> Bob
      await nft.connect(user1).transferFrom(user1.address, user2.address, royalTokenId);
      expect(await nft.ownerOf(royalTokenId)).to.equal(user2.address);

      // 2. Bob -> Charlie
      await nft.connect(user2).transferFrom(user2.address, user3.address, royalTokenId);
      expect(await nft.ownerOf(royalTokenId)).to.equal(user3.address);

      // 3. Charlie -> Alice
      await nft.connect(user3).transferFrom(user3.address, user1.address, royalTokenId);
      expect(await nft.ownerOf(royalTokenId)).to.equal(user1.address);
    });
  });
});
