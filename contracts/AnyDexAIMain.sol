// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./interfaces/IERC20.sol";
import "./utils/SafeERC20.sol";
import "./utils/Ownable.sol";
import "./utils/ReentrancyGuard.sol";
import "./tokens/ADAI.sol";
import "./tokens/AnyDexAINFT.sol";

/**
 * @title AnyDexAIMain
 * @notice Core Staking, Affiliate, ROI, and Reward Contract for ANYDEXAI.
 * @dev Handles BEP20 USDT investments, 200% capped ROI with ADAI capital refunds,
 *      immediate 3-tier direct referral, 5-tier level income with 120-day activity enforcement,
 *      9-grade NFT rewards, liquidity splits, and 2x monthly income capping.
 */
contract AnyDexAIMain is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- CONTRACT REFERENCES ---
    IERC20 public immutable usdt;
    ADAI public immutable adaiToken;
    AnyDexAINFT public immutable nftContract;

    // --- LIQUIDITY WALLETS (0.5% + 0.5%) ---
    address public tokenLiquidityWallet;
    address public nftLiquidityWallet;
    uint256 public constant LIQUIDITY_BPS = 50; // 0.5% = 50 basis points (10000 = 100%)

    // --- CONSTANTS ---
    uint256 public constant BPS_DIVISOR = 10000;
    uint256 public constant MONTH = 30 days;
    uint256 public constant ACTIVITY_PERIOD = 120 days; // 120-day referral rule
    uint256 public minWithdrawal = 10 * 1e18; // $10 USDT minimum
    uint256 public maxRoiCapBps = 20000; // 200% ROI limit
    uint256 public adaiCapitalRefundRate = 1e18; // 1 ADAI per 1 USDT of returned capital

    // --- PACKAGES ---
    struct Package {
        uint256 price;          // In USDT (18 decimals)
        uint256 roiBpsPer30d;   // e.g., 500 = 5% / 30 days
        uint256 tokenReward;    // Free ADAI tokens (in 18 decimals)
        bool active;
    }
    mapping(uint256 => Package) public packages;
    uint256 public packageCount;

    // --- USER PROFILE & STAKING ---
    struct UserProfile {
        string name;
        string mobile;
        address sponsor;
        uint256 totalInvested;
        uint256 activeInvested;
        uint256 lastReferralTimestamp;
        uint256 lastLevelClaimTime;
        bool registered;
    }
    mapping(address => UserProfile) public users;

    struct Investment {
        uint256 packageId;
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        uint256 totalRoiClaimed;
        bool capitalReturned;
        bool active;
    }
    mapping(address => Investment[]) private _userInvestments;

    // --- DIRECT REFERRAL (7%, 2%, 1%) ---
    uint256[3] public directReferralBps = [700, 200, 100]; // 7%, 2%, 1%

    // --- LEVEL INCOME CONFIGURATION (Levels 1 to 5) ---
    struct LevelConfig {
        uint256 roiBpsPer30d;
        uint256 minMembers;
        uint256 minCumulativeVolume;
    }
    // Level index 0 to 4 (representing Level 1 to 5)
    LevelConfig[5] public levelConfigs;

    // Downline stats: user => level (0..5) => count & volume
    mapping(address => mapping(uint256 => uint256)) public levelMemberCount;
    mapping(address => mapping(uint256 => uint256)) public levelBusinessVolume;

    // --- 2x MONTHLY CEILING TRACKING ---
    // user => (timestamp / 30 days) => total referral + level income credited
    mapping(address => mapping(uint256 => uint256)) public monthlyAffiliateIncome;

    // --- NFT GRADE QUALIFICATIONS (Tiers 1 to 6) ---
    struct NFTGradeRequirement {
        uint8 level;            // 1 to 6
        uint256 minMembers;
        uint256 minVolume;
    }
    NFTGradeRequirement[6] public nftGradeRequirements;

    // Pending claimable earnings in USDT (e.g. overflow, ROI, level income)
    mapping(address => uint256) public claimableUSDT;

    // --- EVENTS ---
    event UserRegistered(address indexed user, address indexed sponsor, string name, string mobile, uint256 packageId, uint256 amount, uint256 timestamp);
    event Invested(address indexed user, uint256 packageId, uint256 amount, uint256 investmentIndex);
    event DirectReferralPaid(address indexed upline, address indexed fromUser, uint8 level, uint256 amount);
    event DirectReferralCapped(address indexed upline, uint256 paid, uint256 capped);
    event RoiClaimed(address indexed user, uint256 indexed investmentIndex, uint256 amount);
    event CapitalReturnedInADAI(address indexed user, uint256 indexed investmentIndex, uint256 adaiAmount);
    event LevelIncomeClaimed(address indexed user, uint256 amount);
    event EarningsWithdrawn(address indexed user, uint256 amount);
    event PackageUpdated(uint256 indexed packageId, uint256 price, uint256 roiBpsPer30d, uint256 tokenReward, bool active);
    event NFTGradeAwarded(address indexed user, uint8 tier);
    event EmergencyUSDTWithdrawn(address indexed owner, uint256 amount);

    constructor(
        address _usdt,
        address _adaiToken,
        address _nftContract,
        address _tokenLiquidityWallet,
        address _nftLiquidityWallet
    ) Ownable(msg.sender) {
        require(_usdt != address(0) && _adaiToken != address(0) && _nftContract != address(0), "Invalid contract address");
        require(_tokenLiquidityWallet != address(0) && _nftLiquidityWallet != address(0), "Invalid liquidity wallet");

        usdt = IERC20(_usdt);
        adaiToken = ADAI(_adaiToken);
        nftContract = AnyDexAINFT(_nftContract);
        tokenLiquidityWallet = _tokenLiquidityWallet;
        nftLiquidityWallet = _nftLiquidityWallet;

        // Initialize 3 default packages
        // 1: $1,000 -> 5%/30d -> 10 ADAI
        _createPackage(1000 * 1e18, 500, 10 * 1e18);
        // 2: $5,000 -> 5.5%/30d -> 50 ADAI
        _createPackage(5000 * 1e18, 550, 50 * 1e18);
        // 3: $10,000 -> 6%/30d -> 100 ADAI
        _createPackage(10000 * 1e18, 600, 100 * 1e18);

        // Initialize Level Income Requirements (Levels 1 to 5)
        // Level 1: 1% / 30d (100 bps) - min 5 members, $5,000 L1
        levelConfigs[0] = LevelConfig(100, 5, 5000 * 1e18);
        // Level 2: 0.5% / 30d (50 bps) - min 2 members in L2, $9,000 cumulative L1-L2
        levelConfigs[1] = LevelConfig(50, 2, 9000 * 1e18);
        // Level 3: 0.5% / 30d (50 bps) - min 2 members in L3, $14,000 cumulative L1-L3
        levelConfigs[2] = LevelConfig(50, 2, 14000 * 1e18);
        // Level 4: 0.25% / 30d (25 bps) - min 4 members in L4, $18,000 cumulative L1-L4
        levelConfigs[3] = LevelConfig(25, 4, 18000 * 1e18);
        // Level 5: 0.25% / 30d (25 bps) - min 5 members in L5, $25,000 cumulative L1-L5
        levelConfigs[4] = LevelConfig(25, 5, 25000 * 1e18);

        // Initialize NFT Grade Requirements (Grades 1 to 6)
        // Token Squire: L1, 3 members, $5,000
        nftGradeRequirements[0] = NFTGradeRequirement(1, 3, 5000 * 1e18);
        // Coin Knight: L2, 9 members, $15,000
        nftGradeRequirements[1] = NFTGradeRequirement(2, 9, 15000 * 1e18);
        // Captain Creator: L3, 27 members, $45,000
        nftGradeRequirements[2] = NFTGradeRequirement(3, 27, 45000 * 1e18);
        // Lord Validator: L4, 81 members, $135,000
        nftGradeRequirements[3] = NFTGradeRequirement(4, 81, 135000 * 1e18);
        // Baren Hash: L5, 243 members, $405,000
        nftGradeRequirements[4] = NFTGradeRequirement(5, 243, 405000 * 1e18);
        // Alpha Duke: L6, 729 members, $1,215,000
        nftGradeRequirements[5] = NFTGradeRequirement(6, 729, 1215000 * 1e18);
    }

    // --- REGISTRATION & INVESTMENT ---

    /**
     * @notice Registers user (if new) and stakes into a selected package.
     * @param packageId ID of the package (1, 2, 3...)
     * @param sponsor Address of the referring sponsor
     * @param name User's display name for database/UI
     * @param mobile User's contact mobile number
     */
    function invest(
        uint256 packageId,
        address sponsor,
        string calldata name,
        string calldata mobile
    ) external nonReentrant {
        Package memory pack = packages[packageId];
        require(pack.active, "Package is not active");

        UserProfile storage profile = users[msg.sender];
        bool isNewUser = !profile.registered;

        if (isNewUser) {
            // First time registration
            if (sponsor == address(0) || sponsor == msg.sender) {
                sponsor = owner(); // Default fallback to owner
            }
            require(users[sponsor].registered || sponsor == owner(), "Invalid sponsor");

            profile.name = name;
            profile.mobile = mobile;
            profile.sponsor = sponsor;
            profile.registered = true;
            profile.lastLevelClaimTime = block.timestamp;

            // Mint Entry Pass NFT (Tier 0)
            if (!nftContract.hasTierNFT(msg.sender, 0)) {
                nftContract.mintGradeNFT(msg.sender, 0);
            }

            // Update sponsor's last referral timestamp (for 120-day activity rule)
            users[sponsor].lastReferralTimestamp = block.timestamp;

            emit UserRegistered(msg.sender, sponsor, name, mobile, packageId, pack.price, block.timestamp);
        } else {
            // Existing user re-investing
            sponsor = profile.sponsor;
        }

        // Transfer USDT from user to this contract
        usdt.safeTransferFrom(msg.sender, address(this), pack.price);

        // 0.5% Token Liquidity + 0.5% NFT Liquidity
        uint256 tokenLiqAmount = (pack.price * LIQUIDITY_BPS) / BPS_DIVISOR;
        uint256 nftLiqAmount = (pack.price * LIQUIDITY_BPS) / BPS_DIVISOR;
        usdt.safeTransfer(tokenLiquidityWallet, tokenLiqAmount);
        usdt.safeTransfer(nftLiquidityWallet, nftLiqAmount);

        // Mint welcome ADAI tokens to user
        if (pack.tokenReward > 0) {
            try adaiToken.mint(msg.sender, pack.tokenReward) {} catch {}
            // Sponsor gets 50% sponsor tokens for every registration
            if (sponsor != address(0)) {
                uint256 sponsorTokens = pack.tokenReward / 2;
                if (sponsorTokens > 0) {
                    try adaiToken.mint(sponsor, sponsorTokens) {} catch {}
                }
            }
        }

        // Record investment
        profile.totalInvested += pack.price;
        profile.activeInvested += pack.price;
        _userInvestments[msg.sender].push(Investment({
            packageId: packageId,
            amount: pack.price,
            startTime: block.timestamp,
            lastClaimTime: block.timestamp,
            totalRoiClaimed: 0,
            capitalReturned: false,
            active: true
        }));
        uint256 invIndex = _userInvestments[msg.sender].length - 1;

        // Update downline stats & distribute immediate direct referral (7%, 2%, 1%)
        _processDownlineAndDirectReferral(msg.sender, pack.price, isNewUser);

        emit Invested(msg.sender, packageId, pack.price, invIndex);
    }

    /**
     * @dev Updates downline volume/counts up to 6 levels, pays immediate 3-tier referral, and checks NFT upgrades.
     */
    function _processDownlineAndDirectReferral(address user, uint256 amount, bool isNewUser) internal {
        address currentUpline = users[user].sponsor;

        for (uint8 lvl = 0; lvl < 6; lvl++) {
            if (currentUpline == address(0)) break;

            // Update stats
            if (isNewUser) {
                levelMemberCount[currentUpline][lvl] += 1;
            }
            levelBusinessVolume[currentUpline][lvl] += amount;

            // Immediate 3-tier direct referral for levels 0, 1, 2 (Level 1, 2, 3)
            if (lvl < 3) {
                _payImmediateReferral(currentUpline, user, lvl + 1, (amount * directReferralBps[lvl]) / BPS_DIVISOR);
            }

            // Check if upline qualifies for grade NFT at this level
            _checkAndAwardNFT(currentUpline, lvl);

            currentUpline = users[currentUpline].sponsor;
        }
    }

    /**
     * @dev Pays immediate direct referral to upline, enforcing the monthly 2x capital ceiling.
     */
    function _payImmediateReferral(address upline, address fromUser, uint8 levelNum, uint256 grossAmount) internal {
        if (grossAmount == 0 || upline == address(0)) return;

        uint256 monthEpoch = block.timestamp / MONTH;
        uint256 currentMonthlyEarned = monthlyAffiliateIncome[upline][monthEpoch];
        uint256 monthlyCeiling = users[upline].activeInvested * 2;

        // If upline is owner, bypass 2x ceiling
        if (upline == owner()) {
            monthlyCeiling = type(uint256).max;
        }

        uint256 payableAmount = 0;
        if (currentMonthlyEarned < monthlyCeiling) {
            uint256 room = monthlyCeiling - currentMonthlyEarned;
            payableAmount = grossAmount > room ? room : grossAmount;
            monthlyAffiliateIncome[upline][monthEpoch] += payableAmount;
        }

        if (payableAmount > 0) {
            usdt.safeTransfer(upline, payableAmount);
            emit DirectReferralPaid(upline, fromUser, levelNum, payableAmount);
        }

        if (grossAmount > payableAmount) {
            emit DirectReferralCapped(upline, payableAmount, grossAmount - payableAmount);
        }
    }

    // --- NFT GRADE CHECKS & AWARDS ---

    function _checkAndAwardNFT(address upline, uint8 levelIndex) internal {
        if (levelIndex >= 6) return;

        uint8 tier = levelIndex + 1; // Tier 1 to 6
        if (nftContract.hasTierNFT(upline, tier)) return;

        NFTGradeRequirement memory req = nftGradeRequirements[levelIndex];
        if (levelMemberCount[upline][levelIndex] >= req.minMembers && levelBusinessVolume[upline][levelIndex] >= req.minVolume) {
            try nftContract.mintGradeNFT(upline, tier) {
                emit NFTGradeAwarded(upline, tier);
            } catch {}
        }
    }

    // --- ROI CALCULATION & CLAIM ---

    /**
     * @notice Calculates pending ROI across all investments for a user.
     * @dev ROI is capped at 200% of the invested amount.
     */
    function calculatePendingROI(address user) public view returns (uint256 totalPendingRoi) {
        Investment[] memory invs = _userInvestments[user];
        for (uint256 i = 0; i < invs.length; i++) {
            if (!invs[i].active) continue;

            Package memory pack = packages[invs[i].packageId];
            uint256 timeElapsed = block.timestamp - invs[i].lastClaimTime;
            uint256 accrued = (invs[i].amount * pack.roiBpsPer30d * timeElapsed) / (MONTH * BPS_DIVISOR);

            uint256 maxTotalRoi = (invs[i].amount * maxRoiCapBps) / BPS_DIVISOR; // 200%
            if (invs[i].totalRoiClaimed + accrued > maxTotalRoi) {
                accrued = maxTotalRoi > invs[i].totalRoiClaimed ? maxTotalRoi - invs[i].totalRoiClaimed : 0;
            }
            totalPendingRoi += accrued;
        }
    }

    /**
     * @notice Claims accrued ROI for all investments.
     * @dev When an investment reaches 200% ROI, its active flag turns off,
     *      and its capital is refunded in ADAI tokens!
     */
    function claimROI() public nonReentrant returns (uint256 totalClaimed) {
        return _claimROI(msg.sender);
    }

    function _claimROI(address user) internal returns (uint256 totalClaimed) {
        Investment[] storage invs = _userInvestments[user];
        uint256 length = invs.length;

        for (uint256 i = 0; i < length; i++) {
            if (!invs[i].active) continue;

            Package memory pack = packages[invs[i].packageId];
            uint256 timeElapsed = block.timestamp - invs[i].lastClaimTime;
            uint256 accrued = (invs[i].amount * pack.roiBpsPer30d * timeElapsed) / (MONTH * BPS_DIVISOR);

            uint256 maxTotalRoi = (invs[i].amount * maxRoiCapBps) / BPS_DIVISOR; // 200%
            if (invs[i].totalRoiClaimed + accrued >= maxTotalRoi) {
                accrued = maxTotalRoi > invs[i].totalRoiClaimed ? maxTotalRoi - invs[i].totalRoiClaimed : 0;
                invs[i].totalRoiClaimed = maxTotalRoi;
                invs[i].lastClaimTime = block.timestamp;
                invs[i].active = false;
                if (users[user].activeInvested >= invs[i].amount) {
                    users[user].activeInvested -= invs[i].amount;
                } else {
                    users[user].activeInvested = 0;
                }

                // Capital return via ADAI tokens after 200% completed
                if (!invs[i].capitalReturned) {
                    invs[i].capitalReturned = true;
                    uint256 adaiRefund = (invs[i].amount * adaiCapitalRefundRate) / 1e18;
                    try adaiToken.mint(user, adaiRefund) {
                        emit CapitalReturnedInADAI(user, i, adaiRefund);
                    } catch {}
                }
            } else {
                invs[i].totalRoiClaimed += accrued;
                invs[i].lastClaimTime = block.timestamp;
            }

            totalClaimed += accrued;
            emit RoiClaimed(user, i, accrued);
        }

        if (totalClaimed > 0) {
            claimableUSDT[user] += totalClaimed;
        }
    }

    // --- LEVEL INCOME & 120-DAY RULE ---

    /**
     * @notice Checks if user satisfies the 120-day activity requirement to withdraw level income.
     */
    function is120DayActive(address user) public view returns (bool) {
        if (users[user].lastReferralTimestamp == 0) return false;
        return block.timestamp <= users[user].lastReferralTimestamp + ACTIVITY_PERIOD;
    }

    /**
     * @notice Calculates pending level income for a user across levels 1 to 5.
     */
    function calculatePendingLevelIncome(address user) public view returns (uint256 totalIncome) {
        uint256 timeElapsed = block.timestamp - users[user].lastLevelClaimTime;
        if (timeElapsed == 0) return 0;

        uint256 cumulativeVolume = 0;
        for (uint8 lvl = 0; lvl < 5; lvl++) {
            cumulativeVolume += levelBusinessVolume[user][lvl];
            LevelConfig memory cfg = levelConfigs[lvl];

            // Check eligibility for this level
            if (levelMemberCount[user][lvl] >= cfg.minMembers && cumulativeVolume >= cfg.minCumulativeVolume) {
                uint256 levelVol = levelBusinessVolume[user][lvl];
                uint256 income = (levelVol * cfg.roiBpsPer30d * timeElapsed) / (MONTH * BPS_DIVISOR);
                totalIncome += income;
            }
        }
    }

    /**
     * @notice Claims accrued Level Income.
     * @dev Requires passing the 120-day referral rule and adheres to 2x monthly capital ceiling.
     */
    function claimLevelIncome() public nonReentrant returns (uint256 payableAmount) {
        require(is120DayActive(msg.sender), "120-day rule: must refer a member within 120 days to claim level income");

        uint256 grossIncome = calculatePendingLevelIncome(msg.sender);
        require(grossIncome > 0, "No level income accrued");

        users[msg.sender].lastLevelClaimTime = block.timestamp;

        // Apply 2x monthly ceiling
        uint256 monthEpoch = block.timestamp / MONTH;
        uint256 currentMonthlyEarned = monthlyAffiliateIncome[msg.sender][monthEpoch];
        uint256 monthlyCeiling = users[msg.sender].activeInvested * 2;
        if (msg.sender == owner()) monthlyCeiling = type(uint256).max;

        if (currentMonthlyEarned < monthlyCeiling) {
            uint256 room = monthlyCeiling - currentMonthlyEarned;
            payableAmount = grossIncome > room ? room : grossIncome;
            monthlyAffiliateIncome[msg.sender][monthEpoch] += payableAmount;
        }

        if (payableAmount > 0) {
            claimableUSDT[msg.sender] += payableAmount;
            emit LevelIncomeClaimed(msg.sender, payableAmount);
        }
    }

    // --- WITHDRAWAL (INSTANT PROCESSING, MIN $10) ---

    /**
     * @notice Withdraws all claimable USDT instantly to caller.
     * @dev Also auto-claims pending ROI before executing.
     */
    function withdraw() external nonReentrant {
        // Auto-harvest ROI if available
        uint256 pendingRoi = calculatePendingROI(msg.sender);
        if (pendingRoi > 0) {
            _claimROI(msg.sender);
        }

        uint256 amount = claimableUSDT[msg.sender];
        require(amount >= minWithdrawal, "Withdrawal below minimum $10");

        claimableUSDT[msg.sender] = 0;
        usdt.safeTransfer(msg.sender, amount);

        emit EarningsWithdrawn(msg.sender, amount);
    }

    // --- OWNER CONFIGURATION & MANAGEMENT ---

    function _createPackage(uint256 price, uint256 roiBpsPer30d, uint256 tokenReward) internal {
        packageCount++;
        packages[packageCount] = Package({
            price: price,
            roiBpsPer30d: roiBpsPer30d,
            tokenReward: tokenReward,
            active: true
        });
        emit PackageUpdated(packageCount, price, roiBpsPer30d, tokenReward, true);
    }

    function addPackage(uint256 price, uint256 roiBpsPer30d, uint256 tokenReward) external onlyOwner {
        _createPackage(price, roiBpsPer30d, tokenReward);
    }

    function updatePackage(uint256 packageId, uint256 price, uint256 roiBpsPer30d, uint256 tokenReward, bool active) external onlyOwner {
        require(packageId > 0 && packageId <= packageCount, "Invalid package ID");
        packages[packageId] = Package({
            price: price,
            roiBpsPer30d: roiBpsPer30d,
            tokenReward: tokenReward,
            active: active
        });
        emit PackageUpdated(packageId, price, roiBpsPer30d, tokenReward, active);
    }

    function setLiquidityWallets(address _tokenLiquidityWallet, address _nftLiquidityWallet) external onlyOwner {
        require(_tokenLiquidityWallet != address(0) && _nftLiquidityWallet != address(0), "Invalid address");
        tokenLiquidityWallet = _tokenLiquidityWallet;
        nftLiquidityWallet = _nftLiquidityWallet;
    }

    function setMinWithdrawal(uint256 _minWithdrawal) external onlyOwner {
        minWithdrawal = _minWithdrawal;
    }

    function setDirectReferralRates(uint256 l1, uint256 l2, uint256 l3) external onlyOwner {
        directReferralBps[0] = l1;
        directReferralBps[1] = l2;
        directReferralBps[2] = l3;
    }

    function setLevelConfig(uint8 levelIndex, uint256 roiBpsPer30d, uint256 minMembers, uint256 minCumulativeVolume) external onlyOwner {
        require(levelIndex < 5, "Level index 0 to 4");
        levelConfigs[levelIndex] = LevelConfig(roiBpsPer30d, minMembers, minCumulativeVolume);
    }

    function setAdaiCapitalRefundRate(uint256 newRate) external onlyOwner {
        adaiCapitalRefundRate = newRate;
    }

    function setNftGradeRequirement(uint8 gradeIndex, uint8 level, uint256 minMembers, uint256 minVolume) external onlyOwner {
        require(gradeIndex < 6, "Grade index 0 to 5");
        nftGradeRequirements[gradeIndex] = NFTGradeRequirement(level, minMembers, minVolume);
    }

    /**
     * @notice Allows contract owner to withdraw USDT in emergency or for treasury management.
     */
    function emergencyWithdrawUSDT(uint256 amount) external onlyOwner nonReentrant {
        uint256 bal = usdt.balanceOf(address(this));
        require(amount <= bal, "Amount exceeds balance");
        usdt.safeTransfer(owner(), amount);
        emit EmergencyUSDTWithdrawn(owner(), amount);
    }

    // --- VIEW HELPERS ---

    function getUserInvestments(address user) external view returns (Investment[] memory) {
        return _userInvestments[user];
    }

    function getUserDownlineStats(address user, uint256 level) external view returns (uint256 members, uint256 volume) {
        return (levelMemberCount[user][level], levelBusinessVolume[user][level]);
    }
}
