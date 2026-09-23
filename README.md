# AnyDexAI Smart Contracts Suite (Solidity ^0.8.26)

This repository contains the complete 100% decentralized smart contract suite for **AnyDexAI (anydexai.com)** built for the **BNB Smart Chain (BSC)** using **BEP-20 USDT**.

---

## 📁 File Structure

```
anydexai-contracts/
├── contracts/
│   ├── common/
│   │   ├── IERC20.sol           # Standard ERC20 interface
│   │   ├── SafeERC20.sol        # Safe transfer library for USDT
│   │   ├── Ownable.sol          # Multi-role access control
│   │   └── ReentrancyGuard.sol  # Security against reentrancy attacks
│   ├── interfaces/
│   │   ├── IADAIToken.sol       # ADAI Coin interface
│   │   └── IAnyDexAINFT.sol     # Entry Pass & Royal NFT interface
│   ├── ADAIToken.sol            # AnyDexAI Coin (BEP-20) Minting Engine
│   ├── AnyDexAINFT.sol          # Entry Pass + 8 Royal NFTs (ERC-721)
│   └── AnyDexAIMainPlan.sol     # Core Plan, 200% ROI, Level Income & Treasury
└── README.md
```

---

## 🚀 Contracts Breakdown

### 1. `ADAIToken.sol`
* **Standard**: BEP-20 / ERC-20
* **Symbol**: `ADAI`
* **Features**:
  * Authorized minters (`onlyMinter`): AnyDexAIMainPlan & Gaming engines.
  * Mints bonus tokens upon package registration.
  * Mints 50% sponsor tokens to direct referrer.
  * Mints initial capital return when 200% ROI is completed.

### 2. `AnyDexAINFT.sol`
* **Standard**: ERC-721 / BEP-721
* **Symbol**: `ADAI-NFT`
* **9 NFT Tiers**:
  * **Grade 0**: Entry Pass NFT (Free on first registration)
  * **Grade 1**: Token Squire (Level 1: 3 members, $5,000 vol)
  * **Grade 2**: Coin Knight (Level 2: 9 members, $15,000 vol)
  * **Grade 3**: Captain Creator (Level 3: 27 members, $45,000 vol)
  * **Grade 4**: Lord Validator (Level 4: 81 members, $135,000 vol)
  * **Grade 5**: Baren Hash (Level 5: 243 members, $405,000 vol)
  * **Grade 6**: Alpha Duke (Level 6: 729 members, $1,215,000 vol)
  * **Grade 7**: Royal Archon (Level 7: 2,187 members)
  * **Grade 8**: AnyDex Sovereign (Level 8: 6,561 members)

### 3. `AnyDexAIMainPlan.sol`
* **Core Investment & Distribution Engine**:
  * **Packages**: Default $1,000 (5%), $5,000 (5.5%), $10,000 (6%) — fully editable and expandable.
  * **Liquidity Split**: 0.5% Token Liquidity + 0.5% NFT Liquidity routed immediately.
  * **Instant Direct Referrals**: Level 1 (7%), Level 2 (2%), Level 3 (1%).
  * **ROI Engine**: Up to 200% ROI ceiling with automatic capital refund in ADAI tokens.
  * **Monthly Ceiling**: Maximum 2x active capital for referral + level earnings per 30 days.
  * **Level Income**: 5-Level qualification matrix with strict **120-Day activity verification**.
  * **Admin / Treasury**: `adminWithdrawUSDT` allows owner to withdraw reserves immediately; setters for packages, rates, and thresholds.
  * **Minimum Withdrawal**: $10 USDT.

---

## 🛠️ Deployment Order (Remix / Hardhat / Foundry)

1. **Deploy `ADAIToken.sol`**:
   * Constructor argument: `initialOwner` (Your deployer/admin wallet address).
2. **Deploy `AnyDexAINFT.sol`**:
   * Constructor arguments:
     * `initialOwner`: Deployer address.
     * `initialBaseURI`: Metadata base URL (e.g. `https://api.anydexai.com/metadata/nft`).
3. **Deploy `AnyDexAIMainPlan.sol`**:
   * Constructor arguments:
     * `initialOwner`: Deployer address.
     * `_usdtAddress`: USDT BEP-20 address:
       * BSC Mainnet: `0x55d398326f99059fF775485246999027B3197955`
       * BSC Testnet: `0x337610d27c682E347C9cD60BD4b3b107C9d34dDd` (Mock USDT)
     * `_tokenLiqWallet`: Your Token Liquidity wallet.
     * `_nftLiqWallet`: Your NFT Liquidity wallet.
4. **Authorize Main Plan as Minter**:
   * Call `ADAIToken.setMinter(address(AnyDexAIMainPlan), true)`
   * Call `AnyDexAINFT.setMinter(address(AnyDexAIMainPlan), true)`
   * Call `AnyDexAIMainPlan.setTokenAndNFTContracts(address(ADAIToken), address(AnyDexAINFT))`
