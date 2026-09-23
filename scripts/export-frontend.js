const fs = require("fs");
const path = require("path");

function main() {
  const artifactsDir = path.resolve(__dirname, "../artifacts/contracts");
  const frontendDir = path.resolve(__dirname, "../frontend");

  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  // Load ABIs compiled directly from AnyDexAISingle.sol
  const mainArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsDir, "AnyDexAISingle.sol/AnyDexAIMainPlan.json"), "utf8")
  );
  const adaiArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsDir, "AnyDexAISingle.sol/ADAIToken.json"), "utf8")
  );
  const nftArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsDir, "AnyDexAISingle.sol/AnyDexAINFT.json"), "utf8")
  );
  const usdtArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactsDir, "tokens/MockUSDT.sol/MockUSDT.json"), "utf8")
  );

  const config = {
    networks: {
      local: {
        chainId: 31337,
        name: "Hardhat Local",
        rpcUrl: "http://127.0.0.1:8545",
        mainContract: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        adaiToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        nftContract: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        usdtToken: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
      },
      bscTestnet: {
        chainId: 97,
        name: "BNB Smart Chain Testnet",
        rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
        mainContract: "",
        adaiToken: "",
        nftContract: "",
        usdtToken: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"
      },
      bscMainnet: {
        chainId: 56,
        name: "BNB Smart Chain Mainnet",
        rpcUrl: "https://bsc-dataseed.binance.org/",
        mainContract: "",
        adaiToken: "",
        nftContract: "",
        usdtToken: "0x55d398326f99059fF775485246999027B3197955"
      }
    },
    abis: {
      AnyDexAIMainPlan: mainArtifact.abi,
      AnyDexAIMain: mainArtifact.abi, // Alias for backward compatibility
      ADAIToken: adaiArtifact.abi,
      ADAI: adaiArtifact.abi,
      AnyDexAINFT: nftArtifact.abi,
      USDT: usdtArtifact.abi
    }
  };

  const jsContent = `// Auto-generated configuration for ANYDEXAI Frontend (AnyDexAISingle based)
window.ANYDEX_CONFIG = ${JSON.stringify(config, null, 2)};
`;

  fs.writeFileSync(path.join(frontendDir, "contracts-config.js"), jsContent);
  console.log("Exported frontend configuration from AnyDexAISingle.sol to frontend/contracts-config.js successfully!");
}

main();
