// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./common/Ownable.sol";
import "./interfaces/IAnyDexAINFT.sol";

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

/**
 * @title AnyDexAINFT
 * @notice Production-Hardened ERC-721 / BEP-721 NFT Contract with ERC165 & Receiver Support
 * @dev 9 NFTs Total:
 *   - Grade 0: Entry Pass NFT
 *   - Grade 1: Token Squire
 *   - Grade 2: Coin Knight
 *   - Grade 3: Captain Creator
 *   - Grade 4: Lord Validator
 *   - Grade 5: Baren Hash
 *   - Grade 6: Alpha Duke
 *   - Grade 7: Royal Tier 7
 *   - Grade 8: Royal Tier 8
 */
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

    constructor(
        address initialOwner,
        string memory initialBaseURI
    ) Ownable(initialOwner) {
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

    // --- Standard ERC165 Interface Detection ---
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x01ffc9a7 // ERC165
            || interfaceId == 0x80ac58cd // ERC721
            || interfaceId == 0x5b5e139f; // ERC721Metadata
    }

    function name() external pure returns (string memory) { return _name; }
    function symbol() external pure returns (string memory) { return _symbol; }

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
    function totalSupply() external view returns (uint256) { return _nextTokenId - 1; }

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

    function hasTierNFT(address user, uint8 tier) external view override returns (bool) {
        if (tier == 0) return _hasEntryPass[user];
        return _userHasGrade[user][tier];
    }

    function mintGradeNFT(address to, uint8 tier) external override onlyMinter returns (uint256) {
        if (tier == 0) {
            if (to == address(0)) revert ZeroAddress();
            if (_hasEntryPass[to]) revert AlreadyHasEntryPass();
            uint256 tokenId = _nextTokenId++;
            _hasEntryPass[to] = true;
            tokenGrade[tokenId] = 0;
            _mint(to, tokenId);
            emit NFTMinted(to, tokenId, 0);
            return tokenId;
        } else {
            if (to == address(0)) revert ZeroAddress();
            if (tier > 8) revert InvalidRoyalGrade();
            if (_userHasGrade[to][tier]) revert AlreadyHasGrade();
            uint256 tokenId = _nextTokenId++;
            _userHasGrade[to][tier] = true;
            tokenGrade[tokenId] = tier;
            if (tier > _userHighestGrade[to]) {
                _userHighestGrade[to] = tier;
            }
            _mint(to, tokenId);
            emit NFTMinted(to, tokenId, tier);
            return tokenId;
        }
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
        uint8 grade = tokenGrade[tokenId];
        return string(abi.encodePacked(baseTokenURI, "/", _toString(grade), ".json"));
    }

    function _mint(address to, uint256 tokenId) internal {
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
    }

    function approve(address to, uint256 tokenId) external {
        address tokenOwner = ownerOf(tokenId);
        if (to == tokenOwner) revert NotAuthorized();
        if (msg.sender != tokenOwner && !isApprovedForAll(tokenOwner, msg.sender)) revert NotAuthorized();
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
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        transferFrom(from, to, tokenId);
        if (_isContract(to)) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                if (retval != IERC721Receiver.onERC721Received.selector) revert UnsafeRecipient();
            } catch {
                revert UnsafeRecipient();
            }
        }
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        if (ownerOf(tokenId) != from) revert NotAuthorized();
        if (to == address(0)) revert ZeroAddress();

        delete _tokenApprovals[tokenId];
        unchecked {
            _balances[from] -= 1;
            _balances[to] += 1;
        }
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || isApprovedForAll(tokenOwner, spender) || getApproved(tokenId) == spender);
    }

    function _isContract(address account) internal view returns (bool) {
        return account.code.length > 0;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
