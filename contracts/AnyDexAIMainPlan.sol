// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./common/IERC20.sol";
import "./common/SafeERC20.sol";
import "./common/Ownable.sol";
import "./common/ReentrancyGuard.sol";
import "./interfaces/IADAIToken.sol";
import "./interfaces/IAnyDexAINFT.sol";

/**
 * @title AnyDexAIMainPlan
 * @notice Production-Hardened, Gas-Optimized Core Smart Contract for AnyDexAI (anydexai.com)
 * @dev Handles BEP-20 USDT investments with snapshotted economic terms, 200% ROI ceiling,
 *      ADAI capital return, 3-tier instant direct referral, 5-level monthly income with
 *      strict unlost remainder queue (carrying forward when 2x monthly cap is hit),
 *      120-day activity eligibility enforcement, and 9-tier NFT rewards.
 */
contract AnyDexAIMainPlan is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Custom Errors for Gas Optimization & Audit Clarity ---
    error InvalidPackage();
    error PackageInactive();
    error InvalidSponsor();
    error SponsorNotActive();
    error DurationZero();
    error InvalidRoiPercentage();
    error AmountZero();
    error BelowMinWithdrawal();
    error ActivityRuleViolated();
    error ReachedMonthlyCeiling();
    error InvestmentAlreadyCompleted();
    error NFTNotConfigured();
    error InvalidGrade();
    error GradeAlreadyClaimed();
    error InsufficientLevelMembers();
    error InsufficientLevelVolume();
    error InsufficientUSDTBalance();
    error FeeTooHigh();
    error ReferralPercentageTooHigh();
    error ZeroAddress();
    error IndexOutOfBounds();

    // --- Tokens & External Contracts ---
    IERC20 public immutable usdtToken;
    IADAIToken public adaiToken;
    IAnyDexAINFT public nftContract;

    // --- Platform Wallets & Fee Parameters ---
    address public tokenLiquidityWallet;
    address public nftLiquidityWallet;
    uint256 public tokenLiquidityBps = 50; // 0.5% (Basis points: 10000 = 100%)
    uint256 public nftLiquidityBps = 50;   // 0.5%

    // --- Referral Parameters ---
    uint256 public directReferralL1Bps = 700; // 7%
    uint256 public directReferralL2Bps = 200; // 2%
    uint256 public directReferralL3Bps = 100; // 1%

    // --- Global Rules & Limits ---
    uint256 public minWithdrawal = 10 * 1e18; // 10 USDT minimum withdrawal
    uint256 public constant MAX_EARNINGS_MULTIPLIER = 2; // Monthly ceiling: 2x of active capital
    uint256 public constant ACTIVITY_WINDOW_DAYS = 120 days; // 120-day referral rule
    uint256 public constant MONTH_DURATION = 30 days;
    uint256 public constant BPS_DENOMINATOR = 10000;

    // Configurable ADAI Capital Refund Rate (1e18 = 1 USDT per 1 ADAI)
    uint256 public adaiCapitalRefundRate = 1e18;

    // --- Package Struct & Mapping ---
    struct Package {
        uint256 amount;          // Package price in USDT (wei)
        uint256 roiBasisPoints;  // ROI percentage in basis points (e.g. 500 = 5%)
        uint256 durationDays;    // ROI period in days (e.g. 30 days)
        uint256 tokenReward;     // ADAI tokens minted to user on registration
        bool isActive;
    }

    uint256 public packageCount;
    mapping(uint256 => Package) public packages;

    // --- Gas-Optimized, Packed Investment Record with Term Snapshotting ---
    // Slot 0 (32 bytes): capital (16 bytes) + totalRoiClaimed (16 bytes)
    // Slot 1 (21 bytes <= 32 bytes): startTime (6) + lastClaimTime (6) + packageId (4) + roiBasisPoints (2) + durationDays (2) + completed (1)
    struct Investment {
        uint128 capital;          // Package capital in USDT wei
        uint128 totalRoiClaimed;  // Total USDT ROI claimed (up to 200% = 2x capital)
        uint48 startTime;         // Timestamp when investment began
        uint48 lastClaimTime;     // Timestamp of last ROI claim
        uint32 packageId;         // Reference package ID
        uint16 roiBasisPoints;    // SNAPSHOT: Fixed ROI bps at deposit time (e.g. 500 = 5%)
        uint16 durationDays;      // SNAPSHOT: Fixed duration in days at deposit time (e.g. 30)
        bool completed;           // True when 200% ROI is reached
    }

    // --- Level Income Criteria Struct ---
    struct LevelCriteria {
        uint256 roiBps;            // e.g. 100 = 1.0%, 50 = 0.5%, 25 = 0.25%
        uint256 requiredMembers;   // Members needed on this level
        uint256 requiredTeamVolume;// Cumulative business volume required
    }

    mapping(uint8 => LevelCriteria) public levelConfigs; // Levels 1 to 5

    // --- NFT Grade Criteria Struct ---
    struct NFTGradeCriteria {
        uint8 level;               // Level required
        uint256 requiredMembers;   // Minimum team count
        uint256 requiredVolume;    // Minimum team volume
    }

    mapping(uint8 => NFTGradeCriteria) public nftGradeConfigs; // Grades 1 to 8

    // --- User Profile Struct ---
    struct User {
        bool isRegistered;
        address sponsor;
        uint256 activeCapital;
        uint256 totalCapitalInvested;
        uint256 lastReferralTimestamp;
        uint256 pendingLevelIncome;   // Preserved unpaid level income (carried forward)
        uint256 lastLevelAccrualTime;
        // Monthly Earnings Cap Tracker (Direct + Level Income <= 2x active capital)
        uint256 currentMonthStartTime;
        uint256 currentMonthEarnings;
        // Downline tracking
        uint256 directCount;
        uint256 level1Business;
        uint256 totalTeamBusiness;
    }

    mapping(address => User) public users;
    mapping(address => Investment[]) public userInvestments;
    // user => level (1..8) => member count
    mapping(address => mapping(uint8 => uint256)) public userDownlineCount;
    // user => level (1..8) => business volume
    mapping(address => mapping(uint8 => uint256)) public userDownlineVolume;

    // --- Events ---
    event Registered(address indexed user, address indexed sponsor, uint256 packageId, uint256 timestamp);
    event Invested(address indexed user, uint256 packageId, uint256 amount);
    event DirectReferralPaid(address indexed beneficiary, address indexed fromUser, uint8 level, uint256 amount);
    event DirectReferralCapped(address indexed beneficiary, address indexed fromUser, uint8 level, uint256 rawAmount, uint256 paidAmount);
    event RoiClaimed(address indexed user, uint256 indexed investmentIndex, uint256 amount);
    event CapitalReturnedViaADAI(address indexed user, uint256 indexed investmentIndex, uint256 adaiAmount);
    event LevelIncomeAccrued(address indexed user, uint256 amount);
    event LevelIncomeWithdrawn(address indexed user, uint256 paidAmount, uint256 pendingRemainder);
    event NFTGradeClaimed(address indexed user, uint8 gradeId);
    event PackageAdded(uint256 indexed packageId, uint256 amount, uint256 roiBps, uint256 durationDays, uint256 tokenReward);
    event PackageUpdated(uint256 indexed packageId, uint256 amount, uint256 roiBps, uint256 durationDays, uint256 tokenReward, bool isActive);
    event PackageRoiAndDurationUpdated(uint256 indexed packageId, uint256 oldRoiBps, uint256 newRoiBps, uint256 oldDurationDays, uint256 newDurationDays);
    event AdaiRefundRateUpdated(uint256 newRate);
    event AdminWithdrawal(address indexed recipient, uint256 amount);

    constructor(
        address initialOwner,
        address _usdtAddress,
        address _tokenLiqWallet,
        address _nftLiqWallet
    ) Ownable(initialOwner) {
        if (_usdtAddress == address(0) || _tokenLiqWallet == address(0) || _nftLiqWallet == address(0)) {
            revert ZeroAddress();
        }

        usdtToken = IERC20(_usdtAddress);
        tokenLiquidityWallet = _tokenLiqWallet;
        nftLiquidityWallet = _nftLiqWallet;

        // Initialize Default Packages: $1k (5%/30d), $5k (5.5%/30d), $10k (6%/30d)
        _createPackage(1000 * 1e18, 500, 30, 10 * 1e18);
        _createPackage(5000 * 1e18, 550, 30, 50 * 1e18);
        _createPackage(10000 * 1e18, 600, 30, 100 * 1e18);

        // Initialize Level Income Requirements (Levels 1 to 5)
        levelConfigs[1] = LevelCriteria(100, 5, 5000 * 1e18);    // L1: 1.0%/30d, 5 members, $5k
        levelConfigs[2] = LevelCriteria(50, 2, 9000 * 1e18);     // L2: 0.5%/30d, 2 members, $9k L1+L2
        levelConfigs[3] = LevelCriteria(50, 2, 14000 * 1e18);    // L3: 0.5%/30d, 2 members, $14k L1..L3
        levelConfigs[4] = LevelCriteria(25, 4, 18000 * 1e18);    // L4: 0.25%/30d, 4 members, $18k L1..L4
        levelConfigs[5] = LevelCriteria(25, 5, 25000 * 1e18);    // L5: 0.25%/30d, 5 members, $25k L1..L5

        // Initialize NFT Grade Criteria (3x Progression Matrix)
        nftGradeConfigs[1] = NFTGradeCriteria(1, 3, 5000 * 1e18);       // Token Squire
        nftGradeConfigs[2] = NFTGradeCriteria(2, 9, 15000 * 1e18);      // Coin Knight
        nftGradeConfigs[3] = NFTGradeCriteria(3, 27, 45000 * 1e18);     // Captain Creator
        nftGradeConfigs[4] = NFTGradeCriteria(4, 81, 135000 * 1e18);    // Lord Validator
        nftGradeConfigs[5] = NFTGradeCriteria(5, 243, 405000 * 1e18);   // Baren Hash
        nftGradeConfigs[6] = NFTGradeCriteria(6, 729, 1215000 * 1e18);  // Alpha Duke
        nftGradeConfigs[7] = NFTGradeCriteria(7, 2187, 3645000 * 1e18); // Royal Archon
        nftGradeConfigs[8] = NFTGradeCriteria(8, 6561, 10935000 * 1e18);// AnyDex Sovereign
    }

    // --- External Setters for Tokens ---
    function setTokenAndNFTContracts(address _adaiToken, address _nftContract) external onlyOwner {
        if (_adaiToken == address(0) || _nftContract == address(0)) revert ZeroAddress();
        adaiToken = IADAIToken(_adaiToken);
        nftContract = IAnyDexAINFT(_nftContract);
    }

    function setAdaiCapitalRefundRate(uint256 newRate) external onlyOwner {
        if (newRate == 0) revert AmountZero();
        adaiCapitalRefundRate = newRate;
        emit AdaiRefundRateUpdated(newRate);
    }

    // --- Investment & Registration ---

    /**
     * @notice Register and invest in an AnyDexAI package
     * @param sponsor Address of the referrer
     * @param packageId ID of the package to purchase
     */
    function registerAndInvest(address sponsor, uint256 packageId) external nonReentrant {
        if (packageId < 1 || packageId > packageCount) revert InvalidPackage();
        Package memory pkg = packages[packageId];
        if (!pkg.isActive) revert PackageInactive();

        address userAddr = msg.sender;
        User storage user = users[userAddr];

        if (!user.isRegistered) {
            // First time registration
            if (sponsor == address(0) || sponsor == userAddr) revert InvalidSponsor();
            if (!users[sponsor].isRegistered && sponsor != owner()) revert SponsorNotActive();

            user.isRegistered = true;
            user.sponsor = sponsor;
            user.lastReferralTimestamp = block.timestamp;
            user.currentMonthStartTime = block.timestamp;
            user.lastLevelAccrualTime = block.timestamp;

            // Update Sponsor metrics
            users[sponsor].directCount += 1;
            users[sponsor].lastReferralTimestamp = block.timestamp;

            // Mint Entry Pass NFT (one-time on registration)
            if (address(nftContract) != address(0)) {
                nftContract.mintEntryPass(userAddr);
            }

            emit Registered(userAddr, sponsor, packageId, block.timestamp);
        }

        // Transfer USDT from user to contract
        usdtToken.safeTransferFrom(userAddr, address(this), pkg.amount);

        // Deduct 0.5% Token Liquidity + 0.5% NFT Liquidity
        uint256 tokenLiqAmount = (pkg.amount * tokenLiquidityBps) / BPS_DENOMINATOR;
        uint256 nftLiqAmount = (pkg.amount * nftLiquidityBps) / BPS_DENOMINATOR;
        usdtToken.safeTransfer(tokenLiquidityWallet, tokenLiqAmount);
        usdtToken.safeTransfer(nftLiquidityWallet, nftLiqAmount);

        // Update User Capital
        user.activeCapital += pkg.amount;
        user.totalCapitalInvested += pkg.amount;

        // CRITICAL PRODUCTION HARDENING: Snapshot economic terms (roiBps, durationDays) in Investment struct!
        userInvestments[userAddr].push(Investment({
            capital: uint128(pkg.amount),
            totalRoiClaimed: 0,
            startTime: uint48(block.timestamp),
            lastClaimTime: uint48(block.timestamp),
            packageId: uint32(packageId),
            roiBasisPoints: uint16(pkg.roiBasisPoints),
            durationDays: uint16(pkg.durationDays),
            completed: false
        }));

        // Mint ADAI Tokens: User Tokens + 50% to direct sponsor
        if (address(adaiToken) != address(0) && pkg.tokenReward > 0) {
            adaiToken.mint(userAddr, pkg.tokenReward);
            adaiToken.mint(user.sponsor, pkg.tokenReward / 2); // 50% sponsor tokens
        }

        // Process Immediate Direct Referral Transfers (3 Levels) & Update Downlines
        _processReferralAndDownlines(userAddr, pkg.amount);

        emit Invested(userAddr, packageId, pkg.amount);
    }

    // --- Direct Referral & Downline Tracking ---

    function _processReferralAndDownlines(address buyer, uint256 amount) internal {
        address upline = users[buyer].sponsor;

        // Level 1: 7%
        if (upline != address(0)) {
            _creditReferralBonus(upline, buyer, 1, (amount * directReferralL1Bps) / BPS_DENOMINATOR);
            userDownlineCount[upline][1] += 1;
            userDownlineVolume[upline][1] += amount;
            users[upline].level1Business += amount;
            users[upline].totalTeamBusiness += amount;

            // Level 2: 2%
            address upline2 = users[upline].sponsor;
            if (upline2 != address(0)) {
                _creditReferralBonus(upline2, buyer, 2, (amount * directReferralL2Bps) / BPS_DENOMINATOR);
                userDownlineCount[upline2][2] += 1;
                userDownlineVolume[upline2][2] += amount;
                users[upline2].totalTeamBusiness += amount;

                // Level 3: 1%
                address upline3 = users[upline2].sponsor;
                if (upline3 != address(0)) {
                    _creditReferralBonus(upline3, buyer, 3, (amount * directReferralL3Bps) / BPS_DENOMINATOR);
                    userDownlineCount[upline3][3] += 1;
                    userDownlineVolume[upline3][3] += amount;
                    users[upline3].totalTeamBusiness += amount;

                    // Propagate volume further for Levels 4 to 8 (NFT & Level tracking)
                    address currentUpline = users[upline3].sponsor;
                    for (uint8 lvl = 4; lvl <= 8; ) {
                        if (currentUpline == address(0)) break;
                        userDownlineCount[currentUpline][lvl] += 1;
                        userDownlineVolume[currentUpline][lvl] += amount;
                        users[currentUpline].totalTeamBusiness += amount;
                        currentUpline = users[currentUpline].sponsor;
                        unchecked { ++lvl; }
                    }
                }
            }
        }
    }

    function _creditReferralBonus(address beneficiary, address fromUser, uint8 level, uint256 rawAmount) internal {
        User storage recipient = users[beneficiary];
        _refreshMonthlyCap(recipient);

        uint256 maxAllowed = recipient.activeCapital * MAX_EARNINGS_MULTIPLIER;
        uint256 payableAmount = rawAmount;

        if (recipient.currentMonthEarnings + rawAmount > maxAllowed) {
            if (maxAllowed > recipient.currentMonthEarnings) {
                payableAmount = maxAllowed - recipient.currentMonthEarnings;
            } else {
                payableAmount = 0;
            }
        }

        if (payableAmount > 0) {
            recipient.currentMonthEarnings += payableAmount;
            usdtToken.safeTransfer(beneficiary, payableAmount);
            emit DirectReferralPaid(beneficiary, fromUser, level, payableAmount);
        }

        if (rawAmount > payableAmount) {
            emit DirectReferralCapped(beneficiary, fromUser, level, rawAmount, payableAmount);
        }
    }

    function _refreshMonthlyCap(User storage u) internal {
        if (block.timestamp >= u.currentMonthStartTime + MONTH_DURATION) {
            u.currentMonthStartTime = block.timestamp;
            u.currentMonthEarnings = 0;
        }
    }

    // --- ROI Accrual & Claiming (Snapshotted Terms & 200% Cap) ---

    /**
     * @notice Calculate claimable ROI for a specific investment
     * @dev Uses the exact snapshotted economic terms of the investment!
     */
    function calculateClaimableRoi(address userAddr, uint256 invIndex) public view returns (uint256) {
        if (invIndex >= userInvestments[userAddr].length) return 0;
        Investment memory inv = userInvestments[userAddr][invIndex];
        if (inv.completed) return 0;

        uint256 durationSec = uint256(inv.durationDays) * 1 days;
        if (durationSec == 0) durationSec = 30 days;

        uint256 timeElapsed = block.timestamp - inv.lastClaimTime;
        uint256 maxRoi = uint256(inv.capital) * 2; // 200% Cap
        if (inv.totalRoiClaimed >= maxRoi) return 0;

        // Linear accrual based on SNAPSHOTTED package ROI % and duration
        uint256 accrued = (uint256(inv.capital) * uint256(inv.roiBasisPoints) * timeElapsed) / (durationSec * BPS_DENOMINATOR);
        if (inv.totalRoiClaimed + accrued > maxRoi) {
            accrued = maxRoi - inv.totalRoiClaimed;
        }
        return accrued;
    }

    /**
     * @notice Claim accrued ROI for an investment. When 200% is reached, returns capital in ADAI tokens!
     */
    function claimRoi(uint256 invIndex) external nonReentrant {
        address userAddr = msg.sender;
        if (invIndex >= userInvestments[userAddr].length) revert IndexOutOfBounds();

        Investment storage inv = userInvestments[userAddr][invIndex];
        if (inv.completed) revert InvestmentAlreadyCompleted();

        uint256 claimable = calculateClaimableRoi(userAddr, invIndex);
        uint256 maxRoi = uint256(inv.capital) * 2;
        if (claimable < minWithdrawal && (inv.totalRoiClaimed + claimable != maxRoi)) {
            revert BelowMinWithdrawal();
        }

        inv.totalRoiClaimed += uint128(claimable);
        inv.lastClaimTime = uint48(block.timestamp);

        // Transfer USDT ROI immediately
        usdtToken.safeTransfer(userAddr, claimable);
        emit RoiClaimed(userAddr, invIndex, claimable);

        // Check if 200% ROI ceiling is reached
        if (inv.totalRoiClaimed >= maxRoi) {
            inv.completed = true;
            if (users[userAddr].activeCapital >= inv.capital) {
                users[userAddr].activeCapital -= inv.capital;
            } else {
                users[userAddr].activeCapital = 0;
            }

            // Return Capital via ADAI Tokens upon 200% completion!
            if (address(adaiToken) != address(0)) {
                uint256 adaiToMint = (uint256(inv.capital) * adaiCapitalRefundRate) / 1e18;
                adaiToken.mint(userAddr, adaiToMint);
                emit CapitalReturnedViaADAI(userAddr, invIndex, adaiToMint);
            }
        }
    }

    // --- 5-Level Income Calculation & 120-Day Rule ---

    /**
     * @notice Check if a user is eligible for Level Income on a specific level (1 to 5)
     */
    function isLevelEligible(address userAddr, uint8 level) public view returns (bool) {
        if (level < 1 || level > 5) return false;
        LevelCriteria memory crit = levelConfigs[level];

        if (level == 1) {
            if (users[userAddr].directCount < crit.requiredMembers) return false;
            if (users[userAddr].level1Business < crit.requiredTeamVolume) return false;
        } else {
            if (userDownlineCount[userAddr][level] < crit.requiredMembers) return false;

            uint256 cumulativeVolume = 0;
            for (uint8 l = 1; l <= level; ) {
                cumulativeVolume += userDownlineVolume[userAddr][l];
                unchecked { ++l; }
            }
            if (cumulativeVolume < crit.requiredTeamVolume) return false;
        }

        return true;
    }

    /**
     * @notice Check 120-day activity rule: must refer at least 1 user within 120 days of previous referral
     */
    function is120DaysActive(address userAddr) public view returns (bool) {
        if (!users[userAddr].isRegistered) return false;
        return (block.timestamp - users[userAddr].lastReferralTimestamp <= ACTIVITY_WINDOW_DAYS);
    }

    /**
     * @notice Calculate accrued level income for user across 5 levels
     */
    function calculateLevelIncome(address userAddr) public view returns (uint256) {
        User memory u = users[userAddr];
        if (u.activeCapital == 0 || block.timestamp <= u.lastLevelAccrualTime) return 0;

        uint256 timeElapsed = block.timestamp - u.lastLevelAccrualTime;
        uint256 totalAccrued = 0;

        for (uint8 lvl = 1; lvl <= 5; ) {
            if (isLevelEligible(userAddr, lvl)) {
                LevelCriteria memory crit = levelConfigs[lvl];
                uint256 levelVol = userDownlineVolume[userAddr][lvl];
                if (levelVol > 0) {
                    uint256 inc = (levelVol * crit.roiBps * timeElapsed) / (MONTH_DURATION * BPS_DENOMINATOR);
                    totalAccrued += inc;
                }
            }
            unchecked { ++lvl; }
        }
        return totalAccrued;
    }

    /**
     * @notice Withdraw Level Income (Enforces 120-Day Activity Rule, 2x Cap & Carries Forward Unpaid Remainder!)
     */
    function withdrawLevelIncome() external nonReentrant {
        address userAddr = msg.sender;
        User storage u = users[userAddr];
        if (!u.isRegistered) revert InvalidSponsor();

        // Strict 120-Day Rule Verification
        if (!is120DaysActive(userAddr)) revert ActivityRuleViolated();

        uint256 accrued = calculateLevelIncome(userAddr);
        uint256 totalClaimable = u.pendingLevelIncome + accrued;
        if (totalClaimable < minWithdrawal) revert BelowMinWithdrawal();

        _refreshMonthlyCap(u);
        uint256 maxMonthly = u.activeCapital * MAX_EARNINGS_MULTIPLIER;
        uint256 payableAmount = totalClaimable;

        if (u.currentMonthEarnings + totalClaimable > maxMonthly) {
            if (maxMonthly > u.currentMonthEarnings) {
                payableAmount = maxMonthly - u.currentMonthEarnings;
            } else {
                payableAmount = 0;
            }
        }

        if (payableAmount == 0) revert ReachedMonthlyCeiling();

        // CRITICAL PRODUCTION HARDENING: Retain unpaid remainder in pendingLevelIncome so it carries forward!
        uint256 unpaidRemainder = totalClaimable - payableAmount;
        u.pendingLevelIncome = unpaidRemainder;
        u.lastLevelAccrualTime = block.timestamp;
        u.currentMonthEarnings += payableAmount;

        usdtToken.safeTransfer(userAddr, payableAmount);
        emit LevelIncomeWithdrawn(userAddr, payableAmount, unpaidRemainder);
    }

    // --- NFT Grade Claiming (Royal NFTs 1 to 8) ---

    function claimNFTGrade(uint8 gradeId) external nonReentrant {
        if (gradeId < 1 || gradeId > 8) revert InvalidGrade();
        address userAddr = msg.sender;
        if (address(nftContract) == address(0)) revert NFTNotConfigured();
        if (nftContract.hasGrade(userAddr, gradeId)) revert GradeAlreadyClaimed();

        NFTGradeCriteria memory crit = nftGradeConfigs[gradeId];

        if (userDownlineCount[userAddr][crit.level] < crit.requiredMembers) revert InsufficientLevelMembers();
        if (userDownlineVolume[userAddr][crit.level] < crit.requiredVolume) revert InsufficientLevelVolume();

        nftContract.mintRoyalNFT(userAddr, gradeId);
        emit NFTGradeClaimed(userAddr, gradeId);
    }

    // --- Admin Package Management ---

    function _createPackage(uint256 amount, uint256 roiBps, uint256 durationDays, uint256 tokenReward) internal {
        packageCount++;
        packages[packageCount] = Package({
            amount: amount,
            roiBasisPoints: roiBps,
            durationDays: durationDays,
            tokenReward: tokenReward,
            isActive: true
        });
        emit PackageAdded(packageCount, amount, roiBps, durationDays, tokenReward);
    }

    function addPackage(uint256 amount, uint256 roiBps, uint256 durationDays, uint256 tokenReward) external onlyOwner {
        if (amount == 0) revert AmountZero();
        if (durationDays == 0) revert DurationZero();
        if (roiBps == 0 || roiBps > 5000) revert InvalidRoiPercentage();
        _createPackage(amount, roiBps, durationDays, tokenReward);
    }

    function updatePackage(
        uint256 packageId,
        uint256 amount,
        uint256 roiBps,
        uint256 durationDays,
        uint256 tokenReward,
        bool isActive
    ) external onlyOwner {
        if (packageId < 1 || packageId > packageCount) revert InvalidPackage();
        if (amount == 0) revert AmountZero();
        if (durationDays == 0) revert DurationZero();
        if (roiBps == 0 || roiBps > 5000) revert InvalidRoiPercentage();

        packages[packageId] = Package({
            amount: amount,
            roiBasisPoints: roiBps,
            durationDays: durationDays,
            tokenReward: tokenReward,
            isActive: isActive
        });
        emit PackageUpdated(packageId, amount, roiBps, durationDays, tokenReward, isActive);
    }

    function updatePackageRoiAndDuration(
        uint256 packageId,
        uint256 newRoiBps,
        uint256 newDurationDays
    ) external onlyOwner {
        if (packageId < 1 || packageId > packageCount) revert InvalidPackage();
        if (newDurationDays == 0) revert DurationZero();
        if (newRoiBps == 0 || newRoiBps > 5000) revert InvalidRoiPercentage();

        Package storage pkg = packages[packageId];
        uint256 oldRoiBps = pkg.roiBasisPoints;
        uint256 oldDuration = pkg.durationDays;

        pkg.roiBasisPoints = newRoiBps;
        pkg.durationDays = newDurationDays;

        emit PackageRoiAndDurationUpdated(packageId, oldRoiBps, newRoiBps, oldDuration, newDurationDays);
    }

    function setDirectReferralPercentages(uint256 l1Bps, uint256 l2Bps, uint256 l3Bps) external onlyOwner {
        if (l1Bps + l2Bps + l3Bps > 2000) revert ReferralPercentageTooHigh();
        directReferralL1Bps = l1Bps;
        directReferralL2Bps = l2Bps;
        directReferralL3Bps = l3Bps;
    }

    function setLevelCriteria(uint8 level, uint256 roiBps, uint256 requiredMembers, uint256 requiredVolume) external onlyOwner {
        if (level < 1 || level > 5) revert IndexOutOfBounds();
        levelConfigs[level] = LevelCriteria(roiBps, requiredMembers, requiredVolume);
    }

    function setNFTGradeCriteria(uint8 gradeId, uint8 level, uint256 requiredMembers, uint256 requiredVolume) external onlyOwner {
        if (gradeId < 1 || gradeId > 8) revert InvalidGrade();
        nftGradeConfigs[gradeId] = NFTGradeCriteria(level, requiredMembers, requiredVolume);
    }

    function setLiquidityWallets(address _tokenLiqWallet, address _nftLiqWallet, uint256 _tokenBps, uint256 _nftBps) external onlyOwner {
        if (_tokenLiqWallet == address(0) || _nftLiqWallet == address(0)) revert ZeroAddress();
        if (_tokenBps + _nftBps > 500) revert FeeTooHigh();
        tokenLiquidityWallet = _tokenLiqWallet;
        nftLiquidityWallet = _nftLiqWallet;
        tokenLiquidityBps = _tokenBps;
        nftLiquidityBps = _nftBps;
    }

    function setMinWithdrawal(uint256 _minWithdrawal) external onlyOwner {
        minWithdrawal = _minWithdrawal;
    }

    // --- Owner Treasury Withdrawal ---

    function adminWithdrawUSDT(uint256 amount, address recipient) external onlyOwner nonReentrant {
        if (recipient == address(0)) revert ZeroAddress();
        uint256 contractBalance = usdtToken.balanceOf(address(this));
        if (amount > contractBalance) revert InsufficientUSDTBalance();

        usdtToken.safeTransfer(recipient, amount);
        emit AdminWithdrawal(recipient, amount);
    }

    // --- View Helpers ---

    function getUserInvestmentsCount(address user) external view returns (uint256) {
        return userInvestments[user].length;
    }

    function getUserInvestment(address user, uint256 index) external view returns (Investment memory) {
        if (index >= userInvestments[user].length) revert IndexOutOfBounds();
        return userInvestments[user][index];
    }
}
