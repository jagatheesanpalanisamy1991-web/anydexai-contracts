// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * ==============================================================================
 *                         ANYDEXAI ECOSYSTEM (anydexai.com)
 *               PRODUCTION-HARDENED & GAS-OPTIMIZED SINGLE CONTRACT
 *                              Solidity ^0.8.26
 * ==============================================================================
 * Features:
 *   - Term Snapshotting (active investments never altered by admin changes)
 *   - Unpaid Remainder Queue (unpaid capped level income carries forward, 0 loss)
 *   - Packed Investment Struct (2 slots instead of 6, saves 40k+ gas per deposit)
 *   - Configurable ADAI Capital Refund Rate (default 1e18 = 1 USDT/ADAI)
 *   - Custom Errors for maximum gas efficiency
 *   - ERC165 & IERC721Receiver compliant NFT implementation
 *   - Multi-role mint access control
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. IERC20 INTERFACE
// ------------------------------------------------------------------------------
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function decimals() external view returns (uint8);
    function symbol() external view returns (string memory);
    function name() external view returns (string memory);
}

// ------------------------------------------------------------------------------
// 2. SAFE ERC20 LIBRARY
// ------------------------------------------------------------------------------
library SafeERC20 {
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transfer.selector, to, value));
    }

    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
    }

    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        (bool success, bytes memory returndata) = address(token).call(data);
        require(success, "SafeERC20: low-level call failed");
        if (returndata.length > 0) {
            require(abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation failed");
        }
    }
}

// ------------------------------------------------------------------------------
// 3. OWNABLE MODULE
// ------------------------------------------------------------------------------
abstract contract Ownable {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        require(initialOwner != address(0), "Ownable: zero address");
        _owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    modifier onlyOwner() {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: zero address new owner");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

// ------------------------------------------------------------------------------
// 4. REENTRANCY GUARD MODULE
// ------------------------------------------------------------------------------
abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != ENTERED, "ReentrancyGuard: reentrant call");
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }
}

// ------------------------------------------------------------------------------
// 5. ECOSYSTEM INTERFACES & RECEIVERS
// ------------------------------------------------------------------------------
interface IADAIToken is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
    function isMinter(address account) external view returns (bool);
}

interface IAnyDexAINFT {
    event NFTMinted(address indexed recipient, uint256 indexed tokenId, uint8 indexed gradeId);

    function mintEntryPass(address to) external returns (uint256);
    function mintRoyalNFT(address to, uint8 gradeId) external returns (uint256);
    function hasEntryPass(address user) external view returns (bool);
    function hasGrade(address user, uint8 gradeId) external view returns (bool);
    function userHighestGrade(address user) external view returns (uint8);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

// ------------------------------------------------------------------------------
// 6. ADAI TOKEN (BEP-20 AnyDexAI Coin)
// ------------------------------------------------------------------------------
contract ADAIToken is IADAIToken, Ownable {
    string private constant _name = "AnyDexAI Coin";
    string private constant _symbol = "ADAI";
    uint8 private constant _decimals = 18;
    uint256 private _totalSupply;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => bool) private _minters;

    event MinterStatusUpdated(address indexed account, bool isMinter);

    modifier onlyMinter() {
        require(_minters[msg.sender] || owner() == msg.sender, "ADAI: not authorized minter");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        _minters[initialOwner] = true;
        emit MinterStatusUpdated(initialOwner, true);
    }

    function name() external pure override returns (string memory) { return _name; }
    function symbol() external pure override returns (string memory) { return _symbol; }
    function decimals() external pure override returns (uint8) { return _decimals; }
    function totalSupply() external view override returns (uint256) { return _totalSupply; }
    function balanceOf(address account) external view override returns (uint256) { return _balances[account]; }
    function isMinter(address account) external view override returns (bool) { return _minters[account]; }

    function setMinter(address minterAddress, bool status) external onlyOwner {
        require(minterAddress != address(0), "ADAI: zero address");
        _minters[minterAddress] = status;
        emit MinterStatusUpdated(minterAddress, status);
    }

    function transfer(address to, uint256 value) external override returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function allowance(address tokenOwner, address spender) external view override returns (uint256) {
        return _allowances[tokenOwner][spender];
    }

    function approve(address spender, uint256 value) external override returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external override returns (bool) {
        address spender = msg.sender;
        uint256 currentAllowance = _allowances[from][spender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= value, "ADAI: insufficient allowance");
            unchecked { _approve(from, spender, currentAllowance - value); }
        }
        _transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 amount) external override onlyMinter {
        require(to != address(0), "ADAI: mint to zero address");
        _totalSupply += amount;
        unchecked { _balances[to] += amount; }
        emit Transfer(address(0), to, amount);
    }

    function burn(uint256 amount) external override {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) external override {
        uint256 currentAllowance = _allowances[account][msg.sender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ADAI: allowance too low");
            unchecked { _approve(account, msg.sender, currentAllowance - amount); }
        }
        _burn(account, amount);
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(from != address(0) && to != address(0), "ADAI: zero address transfer");
        uint256 fromBalance = _balances[from];
        require(fromBalance >= value, "ADAI: transfer exceeds balance");
        unchecked {
            _balances[from] = fromBalance - value;
            _balances[to] += value;
        }
        emit Transfer(from, to, value);
    }

    function _approve(address tokenOwner, address spender, uint256 value) internal {
        require(tokenOwner != address(0) && spender != address(0), "ADAI: zero address approval");
        _allowances[tokenOwner][spender] = value;
        emit Approval(tokenOwner, spender, value);
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ADAI: burn from zero address");
        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ADAI: burn exceeds balance");
        unchecked {
            _balances[account] = accountBalance - amount;
            _totalSupply -= amount;
        }
        emit Transfer(account, address(0), amount);
    }
}

// ------------------------------------------------------------------------------
// 7. ANYDEXAI NFT (ERC-721 Entry Pass + 8 Royal Grades with ERC165)
// ------------------------------------------------------------------------------
contract AnyDexAINFT is IAnyDexAINFT, Ownable {
    error ZeroAddress();
    error NonexistentToken();
    error NotAuthorized();
    error AlreadyHasEntryPass();
    error AlreadyHasGrade();
    error InvalidRoyalGrade();
    error UnsafeRecipient();

    string private constant _name = "AnyDexAI NFT Collection";
    string private constant _symbol = "ADAI-NFT";
    uint256 private _nextTokenId = 1;
    string public baseTokenURI;

    mapping(uint8 => string) public gradeNames;
    mapping(uint256 => uint8) public tokenGrade;
    mapping(address => bool) private _hasEntryPass;
    mapping(address => mapping(uint8 => bool)) private _userHasGrade;
    mapping(address => uint8) private _userHighestGrade;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(address => bool) public minters;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event BaseURIUpdated(string newBaseURI);
    event MinterUpdated(address indexed minter, bool status);

    modifier onlyMinter() {
        if (!minters[msg.sender] && owner() != msg.sender) revert NotAuthorized();
        _;
    }

    constructor(address initialOwner, string memory initialBaseURI) Ownable(initialOwner) {
        baseTokenURI = initialBaseURI;
        minters[initialOwner] = true;

        gradeNames[0] = "Entry Pass NFT";
        gradeNames[1] = "Token Squire";
        gradeNames[2] = "Coin Knight";
        gradeNames[3] = "Captain Creator";
        gradeNames[4] = "Lord Validator";
        gradeNames[5] = "Baren Hash";
        gradeNames[6] = "Alpha Duke";
        gradeNames[7] = "Royal Archon";
        gradeNames[8] = "AnyDex Sovereign";
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x01ffc9a7 || interfaceId == 0x80ac58cd || interfaceId == 0x5b5e139f;
    }

    function name() external pure returns (string memory) { return _name; }
    function symbol() external pure returns (string memory) { return _symbol; }
    function totalSupply() external view returns (uint256) { return _nextTokenId - 1; }

    function balanceOf(address account) external view returns (uint256) {
        if (account == address(0)) revert ZeroAddress();
        return _balances[account];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        if (tokenOwner == address(0)) revert NonexistentToken();
        return tokenOwner;
    }

    function hasEntryPass(address user) external view override returns (bool) { return _hasEntryPass[user]; }
    function hasGrade(address user, uint8 gradeId) external view override returns (bool) { return _userHasGrade[user][gradeId]; }
    function userHighestGrade(address user) external view override returns (uint8) { return _userHighestGrade[user]; }

    function mintEntryPass(address to) external override onlyMinter returns (uint256) {
        if (to == address(0)) revert ZeroAddress();
        if (_hasEntryPass[to]) revert AlreadyHasEntryPass();
        uint256 tokenId = _nextTokenId++;
        _hasEntryPass[to] = true;
        tokenGrade[tokenId] = 0;
        _mint(to, tokenId);
        emit NFTMinted(to, tokenId, 0);
        return tokenId;
    }

    function mintRoyalNFT(address to, uint8 gradeId) external override onlyMinter returns (uint256) {
        if (to == address(0)) revert ZeroAddress();
        if (gradeId < 1 || gradeId > 8) revert InvalidRoyalGrade();
        if (_userHasGrade[to][gradeId]) revert AlreadyHasGrade();
        uint256 tokenId = _nextTokenId++;
        _userHasGrade[to][gradeId] = true;
        tokenGrade[tokenId] = gradeId;
        if (gradeId > _userHighestGrade[to]) {
            _userHighestGrade[to] = gradeId;
        }
        _mint(to, tokenId);
        emit NFTMinted(to, tokenId, gradeId);
        return tokenId;
    }

    function setMinter(address minterAddress, bool status) external onlyOwner {
        if (minterAddress == address(0)) revert ZeroAddress();
        minters[minterAddress] = status;
        emit MinterUpdated(minterAddress, status);
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        if (_owners[tokenId] == address(0)) revert NonexistentToken();
        return string(abi.encodePacked(baseTokenURI, "/", _toString(tokenGrade[tokenId]), ".json"));
    }

    function _mint(address to, uint256 tokenId) internal {
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
    }

    function approve(address to, uint256 tokenId) external {
        address tokenOwner = ownerOf(tokenId);
        if (to == tokenOwner || (msg.sender != tokenOwner && !isApprovedForAll(tokenOwner, msg.sender))) revert NotAuthorized();
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        if (_owners[tokenId] == address(0)) revert NonexistentToken();
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        if (operator == msg.sender) revert NotAuthorized();
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address ownerAccount, address operator) public view returns (bool) {
        return _operatorApprovals[ownerAccount][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        if (!_isApprovedOrOwner(msg.sender, tokenId)) revert NotAuthorized();
        if (ownerOf(tokenId) != from || to == address(0)) revert NotAuthorized();
        delete _tokenApprovals[tokenId];
        unchecked {
            _balances[from] -= 1;
            _balances[to] += 1;
        }
        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        transferFrom(from, to, tokenId);
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                if (retval != IERC721Receiver.onERC721Received.selector) revert UnsafeRecipient();
            } catch {
                revert UnsafeRecipient();
            }
        }
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || isApprovedForAll(tokenOwner, spender) || getApproved(tokenId) == spender);
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

// ------------------------------------------------------------------------------
// 8. ANYDEXAI MAIN PLAN (Production-Hardened, Gas-Optimized)
// ------------------------------------------------------------------------------
contract AnyDexAIMainPlan is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

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

    IERC20 public immutable usdtToken;
    IADAIToken public adaiToken;
    IAnyDexAINFT public nftContract;

    address public tokenLiquidityWallet;
    address public nftLiquidityWallet;
    uint256 public tokenLiquidityBps = 50; // 0.5%
    uint256 public nftLiquidityBps = 50;   // 0.5%

    uint256 public directReferralL1Bps = 700; // 7%
    uint256 public directReferralL2Bps = 200; // 2%
    uint256 public directReferralL3Bps = 100; // 1%

    uint256 public minWithdrawal = 10 * 1e18; // 10 USDT min
    uint256 public constant MAX_EARNINGS_MULTIPLIER = 2; // Monthly ceiling: 2x capital
    uint256 public constant ACTIVITY_WINDOW_DAYS = 120 days; // 120-day referral rule
    uint256 public constant MONTH_DURATION = 30 days;
    uint256 public constant BPS_DENOMINATOR = 10000;

    uint256 public adaiCapitalRefundRate = 1e18; // 1 USDT = 1 ADAI default

    struct Package {
        uint256 amount;
        uint256 roiBasisPoints;
        uint256 durationDays;
        uint256 tokenReward;
        bool isActive;
    }

    uint256 public packageCount;
    mapping(uint256 => Package) public packages;

    // Packed 2-Slot Investment Record with Term Snapshotting
    struct Investment {
        uint128 capital;
        uint128 totalRoiClaimed;
        uint48 startTime;
        uint48 lastClaimTime;
        uint32 packageId;
        uint16 roiBasisPoints;
        uint16 durationDays;
        bool completed;
    }

    struct LevelCriteria {
        uint256 roiBps;
        uint256 requiredMembers;
        uint256 requiredTeamVolume;
    }
    mapping(uint8 => LevelCriteria) public levelConfigs;

    struct NFTGradeCriteria {
        uint8 level;
        uint256 requiredMembers;
        uint256 requiredVolume;
    }
    mapping(uint8 => NFTGradeCriteria) public nftGradeConfigs;

    struct User {
        bool isRegistered;
        address sponsor;
        uint256 activeCapital;
        uint256 totalCapitalInvested;
        uint256 lastReferralTimestamp;
        uint256 pendingLevelIncome;   // Carried forward unlost income
        uint256 lastLevelAccrualTime;
        uint256 currentMonthStartTime;
        uint256 currentMonthEarnings;
        uint256 directCount;
        uint256 level1Business;
        uint256 totalTeamBusiness;
    }

    mapping(address => User) public users;
    mapping(address => Investment[]) public userInvestments;
    mapping(address => mapping(uint8 => uint256)) public userDownlineCount;
    mapping(address => mapping(uint8 => uint256)) public userDownlineVolume;

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
        if (_usdtAddress == address(0) || _tokenLiqWallet == address(0) || _nftLiqWallet == address(0)) revert ZeroAddress();

        usdtToken = IERC20(_usdtAddress);
        tokenLiquidityWallet = _tokenLiqWallet;
        nftLiquidityWallet = _nftLiqWallet;

        _createPackage(1000 * 1e18, 500, 30, 10 * 1e18);
        _createPackage(5000 * 1e18, 550, 30, 50 * 1e18);
        _createPackage(10000 * 1e18, 600, 30, 100 * 1e18);

        levelConfigs[1] = LevelCriteria(100, 5, 5000 * 1e18);
        levelConfigs[2] = LevelCriteria(50, 2, 9000 * 1e18);
        levelConfigs[3] = LevelCriteria(50, 2, 14000 * 1e18);
        levelConfigs[4] = LevelCriteria(25, 4, 18000 * 1e18);
        levelConfigs[5] = LevelCriteria(25, 5, 25000 * 1e18);

        nftGradeConfigs[1] = NFTGradeCriteria(1, 3, 5000 * 1e18);
        nftGradeConfigs[2] = NFTGradeCriteria(2, 9, 15000 * 1e18);
        nftGradeConfigs[3] = NFTGradeCriteria(3, 27, 45000 * 1e18);
        nftGradeConfigs[4] = NFTGradeCriteria(4, 81, 135000 * 1e18);
        nftGradeConfigs[5] = NFTGradeCriteria(5, 243, 405000 * 1e18);
        nftGradeConfigs[6] = NFTGradeCriteria(6, 729, 1215000 * 1e18);
        nftGradeConfigs[7] = NFTGradeCriteria(7, 2187, 3645000 * 1e18);
        nftGradeConfigs[8] = NFTGradeCriteria(8, 6561, 10935000 * 1e18);
    }

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

    function registerAndInvest(address sponsor, uint256 packageId) external nonReentrant {
        if (packageId < 1 || packageId > packageCount) revert InvalidPackage();
        Package memory pkg = packages[packageId];
        if (!pkg.isActive) revert PackageInactive();

        address userAddr = msg.sender;
        User storage user = users[userAddr];

        if (!user.isRegistered) {
            if (sponsor == address(0) || sponsor == userAddr) revert InvalidSponsor();
            if (!users[sponsor].isRegistered && sponsor != owner()) revert SponsorNotActive();

            user.isRegistered = true;
            user.sponsor = sponsor;
            user.lastReferralTimestamp = block.timestamp;
            user.currentMonthStartTime = block.timestamp;
            user.lastLevelAccrualTime = block.timestamp;

            users[sponsor].directCount += 1;
            users[sponsor].lastReferralTimestamp = block.timestamp;

            if (address(nftContract) != address(0)) {
                nftContract.mintEntryPass(userAddr);
            }
            emit Registered(userAddr, sponsor, packageId, block.timestamp);
        }

        usdtToken.safeTransferFrom(userAddr, address(this), pkg.amount);

        uint256 tokenLiqAmount = (pkg.amount * tokenLiquidityBps) / BPS_DENOMINATOR;
        uint256 nftLiqAmount = (pkg.amount * nftLiquidityBps) / BPS_DENOMINATOR;
        usdtToken.safeTransfer(tokenLiquidityWallet, tokenLiqAmount);
        usdtToken.safeTransfer(nftLiquidityWallet, nftLiqAmount);

        user.activeCapital += pkg.amount;
        user.totalCapitalInvested += pkg.amount;

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

        if (address(adaiToken) != address(0) && pkg.tokenReward > 0) {
            adaiToken.mint(userAddr, pkg.tokenReward);
            adaiToken.mint(user.sponsor, pkg.tokenReward / 2);
        }

        _processReferralAndDownlines(userAddr, pkg.amount);
        emit Invested(userAddr, packageId, pkg.amount);
    }

    function _processReferralAndDownlines(address buyer, uint256 amount) internal {
        address upline = users[buyer].sponsor;
        if (upline != address(0)) {
            _creditReferralBonus(upline, buyer, 1, (amount * directReferralL1Bps) / BPS_DENOMINATOR);
            userDownlineCount[upline][1] += 1;
            userDownlineVolume[upline][1] += amount;
            users[upline].level1Business += amount;
            users[upline].totalTeamBusiness += amount;

            address upline2 = users[upline].sponsor;
            if (upline2 != address(0)) {
                _creditReferralBonus(upline2, buyer, 2, (amount * directReferralL2Bps) / BPS_DENOMINATOR);
                userDownlineCount[upline2][2] += 1;
                userDownlineVolume[upline2][2] += amount;
                users[upline2].totalTeamBusiness += amount;

                address upline3 = users[upline2].sponsor;
                if (upline3 != address(0)) {
                    _creditReferralBonus(upline3, buyer, 3, (amount * directReferralL3Bps) / BPS_DENOMINATOR);
                    userDownlineCount[upline3][3] += 1;
                    userDownlineVolume[upline3][3] += amount;
                    users[upline3].totalTeamBusiness += amount;

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

    function calculateClaimableRoi(address userAddr, uint256 invIndex) public view returns (uint256) {
        if (invIndex >= userInvestments[userAddr].length) return 0;
        Investment memory inv = userInvestments[userAddr][invIndex];
        if (inv.completed) return 0;

        uint256 durationSec = uint256(inv.durationDays) * 1 days;
        if (durationSec == 0) durationSec = 30 days;

        uint256 timeElapsed = block.timestamp - inv.lastClaimTime;
        uint256 maxRoi = uint256(inv.capital) * 2;
        if (inv.totalRoiClaimed >= maxRoi) return 0;

        uint256 accrued = (uint256(inv.capital) * uint256(inv.roiBasisPoints) * timeElapsed) / (durationSec * BPS_DENOMINATOR);
        if (inv.totalRoiClaimed + accrued > maxRoi) {
            accrued = maxRoi - inv.totalRoiClaimed;
        }
        return accrued;
    }

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

        usdtToken.safeTransfer(userAddr, claimable);
        emit RoiClaimed(userAddr, invIndex, claimable);

        if (inv.totalRoiClaimed >= maxRoi) {
            inv.completed = true;
            if (users[userAddr].activeCapital >= inv.capital) {
                users[userAddr].activeCapital -= inv.capital;
            } else {
                users[userAddr].activeCapital = 0;
            }
            if (address(adaiToken) != address(0)) {
                uint256 adaiToMint = (uint256(inv.capital) * adaiCapitalRefundRate) / 1e18;
                adaiToken.mint(userAddr, adaiToMint);
                emit CapitalReturnedViaADAI(userAddr, invIndex, adaiToMint);
            }
        }
    }

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

    function is120DaysActive(address userAddr) public view returns (bool) {
        if (!users[userAddr].isRegistered) return false;
        return (block.timestamp - users[userAddr].lastReferralTimestamp <= ACTIVITY_WINDOW_DAYS);
    }

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

    function withdrawLevelIncome() external nonReentrant {
        address userAddr = msg.sender;
        User storage u = users[userAddr];
        if (!u.isRegistered) revert InvalidSponsor();
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

        // Carried-Forward Remainder
        uint256 unpaidRemainder = totalClaimable - payableAmount;
        u.pendingLevelIncome = unpaidRemainder;
        u.lastLevelAccrualTime = block.timestamp;
        u.currentMonthEarnings += payableAmount;

        usdtToken.safeTransfer(userAddr, payableAmount);
        emit LevelIncomeWithdrawn(userAddr, payableAmount, unpaidRemainder);
    }

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

    function adminWithdrawUSDT(uint256 amount, address recipient) external onlyOwner nonReentrant {
        if (recipient == address(0)) revert ZeroAddress();
        uint256 contractBalance = usdtToken.balanceOf(address(this));
        if (amount > contractBalance) revert InsufficientUSDTBalance();

        usdtToken.safeTransfer(recipient, amount);
        emit AdminWithdrawal(recipient, amount);
    }

    function getUserInvestmentsCount(address user) external view returns (uint256) {
        return userInvestments[user].length;
    }

    function getUserInvestment(address user, uint256 index) external view returns (Investment memory) {
        if (index >= userInvestments[user].length) revert IndexOutOfBounds();
        return userInvestments[user][index];
    }
}
