const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 5: Reentrancy Attack Testing", function () {
  let owner, attackerEOA, tokenLiq, nftLiq;
  let reentrantToken, adai, nft, mainPlan;

  const toWei = (val) => ethers.parseEther(val.toString());

  beforeEach(async function () {
    [owner, attackerEOA, tokenLiq, nftLiq] = await ethers.getSigners();

    // 1. Deploy Malicious Reentrant Token
    const ReentrantTokenFactory = await ethers.getContractFactory("contracts/test/MockFailureTokens.sol:MaliciousReentrantToken");
    reentrantToken = await ReentrantTokenFactory.deploy();
    await reentrantToken.waitForDeployment();

    // 2. Deploy ADAIToken
    const ADAITokenFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:ADAIToken");
    adai = await ADAITokenFactory.deploy(owner.address);
    await adai.waitForDeployment();

    // 3. Deploy AnyDexAINFT
    const AnyDexAINFTFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:AnyDexAINFT");
    nft = await AnyDexAINFTFactory.deploy(owner.address, "https://api.anydexai.com/metadata/nft");
    await nft.waitForDeployment();

    // 4. Deploy AnyDexAIMainPlan with reentrantToken as USDT
    const AnyDexAIMainPlanFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:AnyDexAIMainPlan");
    mainPlan = await AnyDexAIMainPlanFactory.deploy(
      owner.address,
      await reentrantToken.getAddress(),
      tokenLiq.address,
      nftLiq.address
    );
    await mainPlan.waitForDeployment();

    await adai.setMinter(await mainPlan.getAddress(), true);
    await nft.setMinter(await mainPlan.getAddress(), true);
    await mainPlan.setTokenAndNFTContracts(await adai.getAddress(), await nft.getAddress());

    // 5. Transfer tokens to attackerEOA and approve mainPlan
    await reentrantToken.connect(owner).transfer(attackerEOA.address, toWei(50000));
    await reentrantToken.connect(attackerEOA).approve(await mainPlan.getAddress(), ethers.MaxUint256);

    // 6. Configure attack target on malicious token
    await reentrantToken.setTarget(await mainPlan.getAddress(), attackerEOA.address);
  });

  it("Should strictly block reentrancy when attacker attempts reentrant call into registerAndInvest via token callback", async function () {
    // When attacker calls registerAndInvest, safeTransferFrom invokes reentrantToken.transferFrom
    // transferFrom attempts reentrancy into target.registerAndInvest
    await mainPlan.connect(attackerEOA).registerAndInvest(owner.address, 1);

    // Verify reentrancy was attempted and blocked by ReentrancyGuard
    expect(await reentrantToken.reentrancyBlocked()).to.be.true;

    // Decode revert data to ensure it was specifically blocked by ReentrancyGuard
    const revertData = await reentrantToken.lastRevertData();
    const defaultAbiCoder = ethers.AbiCoder.defaultAbiCoder();
    const reason = defaultAbiCoder.decode(["string"], "0x" + revertData.slice(10))[0];
    expect(reason).to.equal("ReentrancyGuard: reentrant call");
  });
});
