const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("--------------------------------------------------");
  console.log("Deploying ANYDEXAI Ecosystem with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)));
  console.log("--------------------------------------------------");

  // BSC Mainnet USDT: 0x55d398326f99059fF775485246999027B3197955
  // BSC Testnet USDT: 0x337610d27c682E347C9cD60BD4b3b107C9d34dDd (or mock)
  let usdtAddress = process.env.USDT_ADDRESS;
  const isLocal = hre.network.name === "hardhat" || hre.network.name === "localhost";

  if (!usdtAddress || isLocal) {
    console.log("Deploying MockUSDT for local / testnet...");
    const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
    const mockUSDT = await MockUSDT.deploy();
    await mockUSDT.waitForDeployment();
    usdtAddress = await mockUSDT.getAddress();
    console.log("MockUSDT deployed to:", usdtAddress);
  }

  // 1. Deploy ADAI BEP20 Token
  console.log("Deploying ADAI Token...");
  const ADAI = await hre.ethers.getContractFactory("ADAI");
  const adai = await ADAI.deploy();
  await adai.waitForDeployment();
  const adaiAddress = await adai.getAddress();
  console.log("ADAI Token deployed to:", adaiAddress);

  // 2. Deploy AnyDexAINFT
  console.log("Deploying AnyDexAINFT...");
  const baseNFTUri = process.env.NFT_BASE_URI || "https://api.anydexai.com/metadata/nft/";
  const AnyDexAINFT = await hre.ethers.getContractFactory("AnyDexAINFT");
  const nft = await AnyDexAINFT.deploy(baseNFTUri);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("AnyDexAINFT deployed to:", nftAddress);

  // 3. Liquidity Wallets (Token 0.5% + NFT 0.5%)
  const tokenLiqWallet = process.env.TOKEN_LIQUIDITY_WALLET || deployer.address;
  const nftLiqWallet = process.env.NFT_LIQUIDITY_WALLET || deployer.address;

  // 4. Deploy AnyDexAIMain Contract
  console.log("Deploying AnyDexAIMain...");
  const AnyDexAIMain = await hre.ethers.getContractFactory("AnyDexAIMain");
  const mainContract = await AnyDexAIMain.deploy(
    usdtAddress,
    adaiAddress,
    nftAddress,
    tokenLiqWallet,
    nftLiqWallet
  );
  await mainContract.waitForDeployment();
  const mainAddress = await mainContract.getAddress();
  console.log("AnyDexAIMain deployed to:", mainAddress);

  // 5. Authorize Main Contract as Minter on ADAI and AnyDexAINFT
  console.log("Configuring Minter permissions...");
  const tx1 = await adai.setMinter(mainAddress, true);
  await tx1.wait();
  console.log("Set AnyDexAIMain as minter on ADAI: SUCCESS");

  const tx2 = await nft.setMinter(mainAddress, true);
  await tx2.wait();
  console.log("Set AnyDexAIMain as minter on AnyDexAINFT: SUCCESS");

  console.log("--------------------------------------------------");
  console.log("Deployment Complete!");
  console.log("Summary of Contracts:");
  console.log({
    Network: hre.network.name,
    USDT: usdtAddress,
    ADAI_Token: adaiAddress,
    AnyDexAI_NFT: nftAddress,
    AnyDexAI_Main: mainAddress,
    TokenLiquidityWallet: tokenLiqWallet,
    NFTLiquidityWallet: nftLiqWallet,
  });
  console.log("--------------------------------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
