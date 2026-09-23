// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../common/IERC20.sol";

/**
 * @title IADAIToken
 * @notice Interface for AnyDexAI Coin (ADAI) BEP-20 token
 */
interface IADAIToken is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
    function isMinter(address account) external view returns (bool);
}
