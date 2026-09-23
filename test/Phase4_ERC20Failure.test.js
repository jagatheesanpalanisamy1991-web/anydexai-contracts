const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 4: ERC20 Failure Handling & SafeERC20 Operations", function () {
  let owner, user1, tokenLiq, nftLiq;
  let adai, nft;

  const toWei = (val) => ethers.parseEther(val.toString());

  beforeEach(async function () {
    [owner, user1, tokenLiq, nftLiq] = await ethers.getSigners();

    const ADAITokenFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:ADAIToken");
    adai = await ADAITokenFactory.deploy(owner.address);
    await adai.waitForDeployment();

    const AnyDexAINFTFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:AnyDexAINFT");
    nft = await AnyDexAINFTFactory.deploy(owner.address, "https://api.anydexai.com/metadata/nft");
    await nft.waitForDeployment();
  });

  it("Should strictly REVERT when interacting with a token that returns false (FalseReturnToken)", async function () {
    const FalseTokenFactory = await ethers.getContractFactory("contracts/test/MockFailureTokens.sol:FalseReturnToken");
    const falseToken = await FalseTokenFactory.deploy();
    await falseToken.waitForDeployment();

    const AnyDexAIMainPlanFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:AnyDexAIMainPlan");
    const testPlan = await AnyDexAIMainPlanFactory.deploy(
      owner.address,
      await falseToken.getAddress(),
      tokenLiq.address,
      nftLiq.address
    );
    await testPlan.waitForDeployment();

    // FalseReturnToken returns false on transferFrom -> SafeERC20 must revert
    await expect(
      testPlan.connect(user1).registerAndInvest(owner.address, 1)
    ).to.be.revertedWith("SafeERC20: ERC20 operation failed");
  });

  it("Should strictly REVERT when interacting with a token that reverts (RevertingToken)", async function () {
    const RevertingTokenFactory = await ethers.getContractFactory("contracts/test/MockFailureTokens.sol:RevertingToken");
    const revToken = await RevertingTokenFactory.deploy();
    await revToken.waitForDeployment();

    const AnyDexAIMainPlanFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:AnyDexAIMainPlan");
    const testPlan = await AnyDexAIMainPlanFactory.deploy(
      owner.address,
      await revToken.getAddress(),
      tokenLiq.address,
      nftLiq.address
    );
    await testPlan.waitForDeployment();

    await expect(
      testPlan.connect(user1).registerAndInvest(owner.address, 1)
    ).to.be.revertedWith("SafeERC20: low-level call failed");
  });

  it("Should correctly SUCCEED when interacting with a token that returns NO data (NoReturnToken like BSC USDT)", async function () {
    const NoReturnTokenFactory = await ethers.getContractFactory("contracts/test/MockFailureTokens.sol:NoReturnToken");
    const noRetToken = await NoReturnTokenFactory.deploy();
    await noRetToken.waitForDeployment();

    const AnyDexAIMainPlanFactory = await ethers.getContractFactory("contracts/AnyDexAISingle.sol:AnyDexAIMainPlan");
    const testPlan = await AnyDexAIMainPlanFactory.deploy(
      owner.address,
      await noRetToken.getAddress(),
      tokenLiq.address,
      nftLiq.address
    );
    await testPlan.waitForDeployment();

    await noRetToken.connect(owner).transfer(user1.address, toWei(10000));
    await noRetToken.connect(user1).approve(await testPlan.getAddress(), ethers.MaxUint256);

    // NoReturnToken succeeds with empty returndata -> SafeERC20 handles it safely
    await expect(
      testPlan.connect(user1).registerAndInvest(owner.address, 1)
    ).to.not.be.reverted;
  });
});
