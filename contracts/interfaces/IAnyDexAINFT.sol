// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title IAnyDexAINFT
 * @notice Interface for AnyDexAI Entry Pass & Royal NFT Collection
 */
interface IAnyDexAINFT {
    event NFTMinted(address indexed recipient, uint256 indexed tokenId, uint8 indexed gradeId);

    function mintEntryPass(address to) external returns (uint256);
    function mintRoyalNFT(address to, uint8 gradeId) external returns (uint256);
    function mintGradeNFT(address to, uint8 tier) external returns (uint256);
    function hasEntryPass(address user) external view returns (bool);
    function hasGrade(address user, uint8 gradeId) external view returns (bool);
    function hasTierNFT(address user, uint8 tier) external view returns (bool);
    function userHighestGrade(address user) external view returns (uint8);
}
