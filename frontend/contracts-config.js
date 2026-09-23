// Auto-generated configuration for ANYDEXAI Frontend (AnyDexAISingle based)
window.ANYDEX_CONFIG = {
  "networks": {
    "local": {
      "chainId": 31337,
      "name": "Hardhat Local",
      "rpcUrl": "http://127.0.0.1:8545",
      "mainContract": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      "adaiToken": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "nftContract": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      "usdtToken": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
    },
    "bscTestnet": {
      "chainId": 97,
      "name": "BNB Smart Chain Testnet",
      "rpcUrl": "https://data-seed-prebsc-1-s1.binance.org:8545/",
      "mainContract": "",
      "adaiToken": "",
      "nftContract": "",
      "usdtToken": "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"
    },
    "bscMainnet": {
      "chainId": 56,
      "name": "BNB Smart Chain Mainnet",
      "rpcUrl": "https://bsc-dataseed.binance.org/",
      "mainContract": "",
      "adaiToken": "",
      "nftContract": "",
      "usdtToken": "0x55d398326f99059fF775485246999027B3197955"
    }
  },
  "abis": {
    "AnyDexAIMainPlan": [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "initialOwner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_usdtAddress",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_tokenLiqWallet",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_nftLiqWallet",
            "type": "address"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [],
        "name": "ActivityRuleViolated",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "AmountZero",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "BelowMinWithdrawal",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "DurationZero",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "FeeTooHigh",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "GradeAlreadyClaimed",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "IndexOutOfBounds",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InsufficientLevelMembers",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InsufficientLevelVolume",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InsufficientUSDTBalance",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InvalidGrade",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InvalidPackage",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InvalidRoiPercentage",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InvalidSponsor",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InvestmentAlreadyCompleted",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "NFTNotConfigured",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "PackageInactive",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "ReachedMonthlyCeiling",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "ReferralPercentageTooHigh",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "SponsorNotActive",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "ZeroAddress",
        "type": "error"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newRate",
            "type": "uint256"
          }
        ],
        "name": "AdaiRefundRateUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "AdminWithdrawal",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "investmentIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "adaiAmount",
            "type": "uint256"
          }
        ],
        "name": "CapitalReturnedViaADAI",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "beneficiary",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "fromUser",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "rawAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "paidAmount",
            "type": "uint256"
          }
        ],
        "name": "DirectReferralCapped",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "beneficiary",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "fromUser",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "DirectReferralPaid",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Invested",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "LevelIncomeAccrued",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "paidAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "pendingRemainder",
            "type": "uint256"
          }
        ],
        "name": "LevelIncomeWithdrawn",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint8",
            "name": "gradeId",
            "type": "uint8"
          }
        ],
        "name": "NFTGradeClaimed",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "roiBps",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "durationDays",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "tokenReward",
            "type": "uint256"
          }
        ],
        "name": "PackageAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "oldRoiBps",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newRoiBps",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "oldDurationDays",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newDurationDays",
            "type": "uint256"
          }
        ],
        "name": "PackageRoiAndDurationUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "roiBps",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "durationDays",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "tokenReward",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "name": "PackageUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "sponsor",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "name": "Registered",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "investmentIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "RoiClaimed",
        "type": "event"
      },
      {
        "inputs": [],
        "name": "ACTIVITY_WINDOW_DAYS",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "BPS_DENOMINATOR",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "MAX_EARNINGS_MULTIPLIER",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "MONTH_DURATION",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "adaiCapitalRefundRate",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "adaiToken",
        "outputs": [
          {
            "internalType": "contract IADAIToken",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "roiBps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "durationDays",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tokenReward",
            "type": "uint256"
          }
        ],
        "name": "addPackage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          }
        ],
        "name": "adminWithdrawUSDT",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "userAddr",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "invIndex",
            "type": "uint256"
          }
        ],
        "name": "calculateClaimableRoi",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "userAddr",
            "type": "address"
          }
        ],
        "name": "calculateLevelIncome",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint8",
            "name": "gradeId",
            "type": "uint8"
          }
        ],
        "name": "claimNFTGrade",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "invIndex",
            "type": "uint256"
          }
        ],
        "name": "claimRoi",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "directReferralL1Bps",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "directReferralL2Bps",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "directReferralL3Bps",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "index",
            "type": "uint256"
          }
        ],
        "name": "getUserInvestment",
        "outputs": [
          {
            "components": [
              {
                "internalType": "uint128",
                "name": "capital",
                "type": "uint128"
              },
              {
                "internalType": "uint128",
                "name": "totalRoiClaimed",
                "type": "uint128"
              },
              {
                "internalType": "uint48",
                "name": "startTime",
                "type": "uint48"
              },
              {
                "internalType": "uint48",
                "name": "lastClaimTime",
                "type": "uint48"
              },
              {
                "internalType": "uint32",
                "name": "packageId",
                "type": "uint32"
              },
              {
                "internalType": "uint16",
                "name": "roiBasisPoints",
                "type": "uint16"
              },
              {
                "internalType": "uint16",
                "name": "durationDays",
                "type": "uint16"
              },
              {
                "internalType": "bool",
                "name": "completed",
                "type": "bool"
              }
            ],
            "internalType": "struct AnyDexAIMainPlan.Investment",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          }
        ],
        "name": "getUserInvestmentsCount",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "userAddr",
            "type": "address"
          }
        ],
        "name": "is120DaysActive",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "userAddr",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          }
        ],
        "name": "isLevelEligible",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "name": "levelConfigs",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "roiBps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requiredMembers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requiredTeamVolume",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "minWithdrawal",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "nftContract",
        "outputs": [
          {
            "internalType": "contract IAnyDexAINFT",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "name": "nftGradeConfigs",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "requiredMembers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requiredVolume",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "nftLiquidityBps",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "nftLiquidityWallet",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "packageCount",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "packages",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "roiBasisPoints",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "durationDays",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tokenReward",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sponsor",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          }
        ],
        "name": "registerAndInvest",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "newRate",
            "type": "uint256"
          }
        ],
        "name": "setAdaiCapitalRefundRate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "l1Bps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "l2Bps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "l3Bps",
            "type": "uint256"
          }
        ],
        "name": "setDirectReferralPercentages",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "roiBps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requiredMembers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requiredVolume",
            "type": "uint256"
          }
        ],
        "name": "setLevelCriteria",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_tokenLiqWallet",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_nftLiqWallet",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "_tokenBps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_nftBps",
            "type": "uint256"
          }
        ],
        "name": "setLiquidityWallets",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_minWithdrawal",
            "type": "uint256"
          }
        ],
        "name": "setMinWithdrawal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint8",
            "name": "gradeId",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "requiredMembers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requiredVolume",
            "type": "uint256"
          }
        ],
        "name": "setNFTGradeCriteria",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_adaiToken",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_nftContract",
            "type": "address"
          }
        ],
        "name": "setTokenAndNFTContracts",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "tokenLiquidityBps",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "tokenLiquidityWallet",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "roiBps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "durationDays",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tokenReward",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "name": "updatePackage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "newRoiBps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "newDurationDays",
            "type": "uint256"
          }
        ],
        "name": "updatePackageRoiAndDuration",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "usdtToken",
        "outputs": [
          {
            "internalType": "contract IERC20",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "name": "userDownlineCount",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "name": "userDownlineVolume",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "userInvestments",
        "outputs": [
          {
            "internalType": "uint128",
            "name": "capital",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "totalRoiClaimed",
            "type": "uint128"
          },
          {
            "internalType": "uint48",
            "name": "startTime",
            "type": "uint48"
          },
          {
            "internalType": "uint48",
            "name": "lastClaimTime",
            "type": "uint48"
          },
          {
            "internalType": "uint32",
            "name": "packageId",
            "type": "uint32"
          },
          {
            "internalType": "uint16",
            "name": "roiBasisPoints",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "durationDays",
            "type": "uint16"
          },
          {
            "internalType": "bool",
            "name": "completed",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "name": "users",
        "outputs": [
          {
            "internalType": "bool",
            "name": "isRegistered",
            "type": "bool"
          },
          {
            "internalType": "address",
            "name": "sponsor",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "activeCapital",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalCapitalInvested",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lastReferralTimestamp",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "pendingLevelIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lastLevelAccrualTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentMonthStartTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentMonthEarnings",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "directCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "level1Business",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalTeamBusiness",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "withdrawLevelIncome",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ],
    "AnyDexAIMain": [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "initialOwner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_usdtAddress",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_tokenLiqWallet",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_nftLiqWallet",
            "type": "address"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [],
        "name": "ActivityRuleViolated",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "AmountZero",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "BelowMinWithdrawal",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "DurationZero",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "FeeTooHigh",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "GradeAlreadyClaimed",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "IndexOutOfBounds",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InsufficientLevelMembers",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InsufficientLevelVolume",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InsufficientUSDTBalance",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InvalidGrade",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InvalidPackage",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InvalidRoiPercentage",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InvalidSponsor",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InvestmentAlreadyCompleted",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "NFTNotConfigured",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "PackageInactive",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "ReachedMonthlyCeiling",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "ReferralPercentageTooHigh",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "SponsorNotActive",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "ZeroAddress",
        "type": "error"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newRate",
            "type": "uint256"
          }
        ],
        "name": "AdaiRefundRateUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "AdminWithdrawal",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "investmentIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "adaiAmount",
            "type": "uint256"
          }
        ],
        "name": "CapitalReturnedViaADAI",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "beneficiary",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "fromUser",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "rawAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "paidAmount",
            "type": "uint256"
          }
        ],
        "name": "DirectReferralCapped",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "beneficiary",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "fromUser",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "DirectReferralPaid",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Invested",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "LevelIncomeAccrued",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "paidAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "pendingRemainder",
            "type": "uint256"
          }
        ],
        "name": "LevelIncomeWithdrawn",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint8",
            "name": "gradeId",
            "type": "uint8"
          }
        ],
        "name": "NFTGradeClaimed",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "roiBps",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "durationDays",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "tokenReward",
            "type": "uint256"
          }
        ],
        "name": "PackageAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "oldRoiBps",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newRoiBps",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "oldDurationDays",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "newDurationDays",
            "type": "uint256"
          }
        ],
        "name": "PackageRoiAndDurationUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "roiBps",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "durationDays",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "tokenReward",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "name": "PackageUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "sponsor",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "name": "Registered",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "investmentIndex",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "RoiClaimed",
        "type": "event"
      },
      {
        "inputs": [],
        "name": "ACTIVITY_WINDOW_DAYS",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "BPS_DENOMINATOR",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "MAX_EARNINGS_MULTIPLIER",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "MONTH_DURATION",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "adaiCapitalRefundRate",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "adaiToken",
        "outputs": [
          {
            "internalType": "contract IADAIToken",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "roiBps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "durationDays",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tokenReward",
            "type": "uint256"
          }
        ],
        "name": "addPackage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          }
        ],
        "name": "adminWithdrawUSDT",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "userAddr",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "invIndex",
            "type": "uint256"
          }
        ],
        "name": "calculateClaimableRoi",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "userAddr",
            "type": "address"
          }
        ],
        "name": "calculateLevelIncome",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint8",
            "name": "gradeId",
            "type": "uint8"
          }
        ],
        "name": "claimNFTGrade",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "invIndex",
            "type": "uint256"
          }
        ],
        "name": "claimRoi",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "directReferralL1Bps",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "directReferralL2Bps",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "directReferralL3Bps",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "index",
            "type": "uint256"
          }
        ],
        "name": "getUserInvestment",
        "outputs": [
          {
            "components": [
              {
                "internalType": "uint128",
                "name": "capital",
                "type": "uint128"
              },
              {
                "internalType": "uint128",
                "name": "totalRoiClaimed",
                "type": "uint128"
              },
              {
                "internalType": "uint48",
                "name": "startTime",
                "type": "uint48"
              },
              {
                "internalType": "uint48",
                "name": "lastClaimTime",
                "type": "uint48"
              },
              {
                "internalType": "uint32",
                "name": "packageId",
                "type": "uint32"
              },
              {
                "internalType": "uint16",
                "name": "roiBasisPoints",
                "type": "uint16"
              },
              {
                "internalType": "uint16",
                "name": "durationDays",
                "type": "uint16"
              },
              {
                "internalType": "bool",
                "name": "completed",
                "type": "bool"
              }
            ],
            "internalType": "struct AnyDexAIMainPlan.Investment",
            "name": "",
            "type": "tuple"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          }
        ],
        "name": "getUserInvestmentsCount",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "userAddr",
            "type": "address"
          }
        ],
        "name": "is120DaysActive",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "userAddr",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          }
        ],
        "name": "isLevelEligible",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "name": "levelConfigs",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "roiBps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requiredMembers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requiredTeamVolume",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "minWithdrawal",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "nftContract",
        "outputs": [
          {
            "internalType": "contract IAnyDexAINFT",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "name": "nftGradeConfigs",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "requiredMembers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requiredVolume",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "nftLiquidityBps",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "nftLiquidityWallet",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "packageCount",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "packages",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "roiBasisPoints",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "durationDays",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tokenReward",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sponsor",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          }
        ],
        "name": "registerAndInvest",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "newRate",
            "type": "uint256"
          }
        ],
        "name": "setAdaiCapitalRefundRate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "l1Bps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "l2Bps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "l3Bps",
            "type": "uint256"
          }
        ],
        "name": "setDirectReferralPercentages",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "roiBps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requiredMembers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requiredVolume",
            "type": "uint256"
          }
        ],
        "name": "setLevelCriteria",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_tokenLiqWallet",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_nftLiqWallet",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "_tokenBps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_nftBps",
            "type": "uint256"
          }
        ],
        "name": "setLiquidityWallets",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_minWithdrawal",
            "type": "uint256"
          }
        ],
        "name": "setMinWithdrawal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint8",
            "name": "gradeId",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "level",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "requiredMembers",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "requiredVolume",
            "type": "uint256"
          }
        ],
        "name": "setNFTGradeCriteria",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "_adaiToken",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "_nftContract",
            "type": "address"
          }
        ],
        "name": "setTokenAndNFTContracts",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "tokenLiquidityBps",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "tokenLiquidityWallet",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "roiBps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "durationDays",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tokenReward",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "name": "updatePackage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "packageId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "newRoiBps",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "newDurationDays",
            "type": "uint256"
          }
        ],
        "name": "updatePackageRoiAndDuration",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "usdtToken",
        "outputs": [
          {
            "internalType": "contract IERC20",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "name": "userDownlineCount",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "name": "userDownlineVolume",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "userInvestments",
        "outputs": [
          {
            "internalType": "uint128",
            "name": "capital",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "totalRoiClaimed",
            "type": "uint128"
          },
          {
            "internalType": "uint48",
            "name": "startTime",
            "type": "uint48"
          },
          {
            "internalType": "uint48",
            "name": "lastClaimTime",
            "type": "uint48"
          },
          {
            "internalType": "uint32",
            "name": "packageId",
            "type": "uint32"
          },
          {
            "internalType": "uint16",
            "name": "roiBasisPoints",
            "type": "uint16"
          },
          {
            "internalType": "uint16",
            "name": "durationDays",
            "type": "uint16"
          },
          {
            "internalType": "bool",
            "name": "completed",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "name": "users",
        "outputs": [
          {
            "internalType": "bool",
            "name": "isRegistered",
            "type": "bool"
          },
          {
            "internalType": "address",
            "name": "sponsor",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "activeCapital",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalCapitalInvested",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lastReferralTimestamp",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "pendingLevelIncome",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "lastLevelAccrualTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentMonthStartTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "currentMonthEarnings",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "directCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "level1Business",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalTeamBusiness",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "withdrawLevelIncome",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ],
    "ADAIToken": [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "initialOwner",
            "type": "address"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "account",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "isMinter",
            "type": "bool"
          }
        ],
        "name": "MinterStatusUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "tokenOwner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "burn",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "burnFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "isMinter",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "minterAddress",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "status",
            "type": "bool"
          }
        ],
        "name": "setMinter",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ],
    "ADAI": [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "initialOwner",
            "type": "address"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "account",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "isMinter",
            "type": "bool"
          }
        ],
        "name": "MinterStatusUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "tokenOwner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "burn",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "burnFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "isMinter",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "minterAddress",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "status",
            "type": "bool"
          }
        ],
        "name": "setMinter",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ],
    "AnyDexAINFT": [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "initialOwner",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "initialBaseURI",
            "type": "string"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [],
        "name": "AlreadyHasEntryPass",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "AlreadyHasGrade",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InvalidRoyalGrade",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "NonexistentToken",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "NotAuthorized",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "UnsafeRecipient",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "ZeroAddress",
        "type": "error"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "approved",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "operator",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "approved",
            "type": "bool"
          }
        ],
        "name": "ApprovalForAll",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "string",
            "name": "newBaseURI",
            "type": "string"
          }
        ],
        "name": "BaseURIUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "minter",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "status",
            "type": "bool"
          }
        ],
        "name": "MinterUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "indexed": true,
            "internalType": "uint8",
            "name": "gradeId",
            "type": "uint8"
          }
        ],
        "name": "NFTMinted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "previousOwner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "baseTokenURI",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "getApproved",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "name": "gradeNames",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          }
        ],
        "name": "hasEntryPass",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "gradeId",
            "type": "uint8"
          }
        ],
        "name": "hasGrade",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "ownerAccount",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "operator",
            "type": "address"
          }
        ],
        "name": "isApprovedForAll",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          }
        ],
        "name": "mintEntryPass",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "gradeId",
            "type": "uint8"
          }
        ],
        "name": "mintRoyalNFT",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "name": "minters",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "ownerOf",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "operator",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "approved",
            "type": "bool"
          }
        ],
        "name": "setApprovalForAll",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "string",
            "name": "newBaseURI",
            "type": "string"
          }
        ],
        "name": "setBaseURI",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "minterAddress",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "status",
            "type": "bool"
          }
        ],
        "name": "setMinter",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes4",
            "name": "interfaceId",
            "type": "bytes4"
          }
        ],
        "name": "supportsInterface",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "tokenGrade",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "tokenURI",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          }
        ],
        "name": "userHighestGrade",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    "USDT": [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  }
};
