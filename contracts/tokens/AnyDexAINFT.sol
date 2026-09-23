// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../utils/Ownable.sol";

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

/**
 * @title AnyDexAINFT
 * @notice ERC-721 NFT contract for AnyDexAI.
 * @dev Supports 9 distinct tiers:
 *      Tier 0: Entry Pass NFT (Welcome pass upon registration)
 *      Tier 1: Token Squire
 *      Tier 2: Coin Knight
 *      Tier 3: Captain Creator
 *      Tier 4: Lord Validator
 *      Tier 5: Baren Hash
 *      Tier 6: Alpha Duke
 *      Tier 7: Royal Archon
 *      Tier 8: Royal Sovereign
 */
contract AnyDexAINFT is Ownable {
    string public name = "AnyDexAI NFT";
    string public symbol = "ADAI-NFT";

    uint256 private _nextTokenId = 1;
    string private _baseTokenURI;

    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;
    // Mapping owner address to token count
    mapping(address => uint256) private _balances;
    // Mapping from token ID to approved address
    mapping(uint256 => address) private _tokenApprovals;
    // Mapping from owner to operator approvals
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // Token metadata / tier mapping
    mapping(uint256 => uint8) public tokenTier;
    // User => Tier => has received
    mapping(address => mapping(uint8 => bool)) public hasTierNFT;
    // List of tokens owned by address
    mapping(address => uint256[]) private _ownedTokens;
    // Token ID => index in owner's array
    mapping(uint256 => uint256) private _ownedTokensIndex;

    // Authorized minters (Main Contract)
    mapping(address => bool) public isMinter;

    string[9] public tierNames = [
        "Entry Pass",
        "Token Squire",
        "Coin Knight",
        "Captain Creator",
        "Lord Validator",
        "Baren Hash",
        "Alpha Duke",
        "Royal Archon",
        "Royal Sovereign"
    ];

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event NFTMinted(address indexed recipient, uint256 indexed tokenId, uint8 indexed tier, string tierName);
    event MinterStatusUpdated(address indexed account, bool isMinter);

    error NotAuthorizedMinter();
    error InvalidTier();
    error TierAlreadyClaimed();
    error NonexistentToken();

    modifier onlyMinter() {
        if (!isMinter[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedMinter();
        }
        _;
    }

    constructor(string memory baseURI) Ownable(msg.sender) {
        _baseTokenURI = baseURI;
        isMinter[msg.sender] = true;
    }

    function setMinter(address account, bool status) external onlyOwner {
        require(account != address(0), "Invalid address");
        isMinter[account] = status;
        emit MinterStatusUpdated(account, status);
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function mintGradeNFT(address recipient, uint8 tier) external onlyMinter returns (uint256) {
        if (tier > 8) revert InvalidTier();
        if (hasTierNFT[recipient][tier]) revert TierAlreadyClaimed();

        uint256 tokenId = _nextTokenId++;
        hasTierNFT[recipient][tier] = true;
        tokenTier[tokenId] = tier;

        _safeMint(recipient, tokenId);
        emit NFTMinted(recipient, tokenId, tier, tierNames[tier]);

        return tokenId;
    }

    function balanceOf(address account) public view returns (uint256) {
        require(account != address(0), "Zero address balance");
        return _balances[account];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address tokenOwner = _owners[tokenId];
        if (tokenOwner == address(0)) revert NonexistentToken();
        return tokenOwner;
    }

    function tokensOfOwner(address account) external view returns (uint256[] memory) {
        return _ownedTokens[account];
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        if (_owners[tokenId] == address(0)) revert NonexistentToken();
        uint8 tier = tokenTier[tokenId];
        return string(abi.encodePacked(_baseTokenURI, _toString(tier), ".json"));
    }

    function approve(address to, uint256 tokenId) external {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "Approval to current owner");
        require(msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender), "Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        if (_owners[tokenId] == address(0)) revert NonexistentToken();
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        require(operator != msg.sender, "Approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address tokenOwner, address operator) public view returns (bool) {
        return _operatorApprovals[tokenOwner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        _safeTransfer(from, to, tokenId, data);
    }

    function _safeMint(address to, uint256 tokenId) internal {
        _mint(to, tokenId);
        require(_checkOnERC721Received(address(0), to, tokenId, ""), "Transfer to non ERC721Receiver");
    }

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "Mint to zero address");
        _balances[to] += 1;
        _owners[tokenId] = to;

        // Enumerable index tracking
        _ownedTokensIndex[tokenId] = _ownedTokens[to].length;
        _ownedTokens[to].push(tokenId);

        emit Transfer(address(0), to, tokenId);
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "Transfer to non ERC721Receiver");
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "Transfer from incorrect owner");
        require(to != address(0), "Transfer to zero address");

        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        // Re-index tokens for enumeration
        uint256 tokenIndex = _ownedTokensIndex[tokenId];
        uint256 lastTokenIndex = _ownedTokens[from].length - 1;
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }
        _ownedTokens[from].pop();

        _ownedTokensIndex[tokenId] = _ownedTokens[to].length;
        _ownedTokens[to].push(tokenId);

        emit Transfer(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || isApprovedForAll(tokenOwner, spender) || getApproved(tokenId) == spender);
    }

    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory data) private returns (bool) {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch {
                return false;
            }
        }
        return true;
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
