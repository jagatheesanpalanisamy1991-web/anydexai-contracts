const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Phase 6: Admin Treasury & Liabilities (13_AdminControls.test.js)", function () {
  let owner, user1, tokenLiq, nftLiq;
  let usdt, adai, nft, mainPlan;

  const toWei = (val) => ethers.parseEther(val.toString());

  beforeEach(async function () {
    [owner, user1, tokenLiq, nftLiq] = await ethers.getSigners();

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

    await usdt.mint(user1.address, toWei(100000));
    await usdt.connect(user1).approve(await mainPlan.getAddress(), ethers.MaxUint256);
  });

  it("Analysis of Treasury Drain: When admin withdraws all USDT, user ROI claims revert with Insufficient Balance", async function () {
    // Alice (user1) deposits $1,000 into Package 1
    await mainPlan.connect(user1).registerAndInvest(owner.address, 1);

    const contractBal = await usdt.balanceOf(await mainPlan.getAddress());
    expect(contractBal).to.be.gt(0n); // $920 remaining after 1% liq + 7% referral

    // Admin drains 100% of the remaining contract balance
    await expect(mainPlan.connect(owner).adminWithdrawUSDT(contractBal, owner.address))
      .to.emit(mainPlan, "AdminWithdrawal")
      .withArgs(owner.address, contractBal);

    // Contract USDT balance is now 0
    expect(await usdt.balanceOf(await mainPlan.getAddress())).to.equal(0n);

    // Advance time by 30 days so Alice has $50 claimable ROI
    await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    const claimable = await mainPlan.calculateClaimableRoi(user1.address, 0);
    expect(claimable).to.be.closeTo(toWei(50), toWei(0.01));

    // Alice attempts claim -> REVERTS due to zero contract liquidity!
    await expect(
      mainPlan.connect(user1).claimRoi(0)
    ).to.be.revertedWith("SafeERC20: low-level call failed");
  });
});
