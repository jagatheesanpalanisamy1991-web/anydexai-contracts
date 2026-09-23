// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../interfaces/IERC20.sol";
import "../utils/Ownable.sol";

/**
 * @title AnyDexAI Coin (ADAI)
 * @notice BEP20 utility token for the AnyDexAI ecosystem.
 * @dev Controlled minting mechanism for staking welcome bonuses, sponsor rewards, gaming, and 200% ROI capital refunds.
 */
contract ADAI is IERC20, Ownable {
    string public name = "AnyDexAI Coin";
    string public symbol = "ADAI";
    uint8 public constant decimals = 18;
    uint256 private _totalSupply;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    /// @notice Authorized minters (e.g., Main Plan contract, Game reward contracts)
    mapping(address => bool) public isMinter;

    event MinterStatusUpdated(address indexed account, bool isMinter);

    error NotAuthorizedMinter();

    modifier onlyMinter() {
        if (!isMinter[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedMinter();
        }
        _;
    }

    constructor() Ownable(msg.sender) {
        // Owner is default minter until main contract is set
        isMinter[msg.sender] = true;
    }

    function setMinter(address account, bool status) external onlyOwner {
        require(account != address(0), "Invalid minter address");
        isMinter[account] = status;
        emit MinterStatusUpdated(account, status);
    }

    function mint(address to, uint256 amount) external onlyMinter returns (bool) {
        _mint(to, amount);
        return true;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
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
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= value, "ERC20: insufficient allowance");
        unchecked {
            _approve(from, msg.sender, currentAllowance - value);
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(from != address(0), "ERC20: transfer from zero address");
        require(to != address(0), "ERC20: transfer to zero address");
        uint256 fromBalance = _balances[from];
        require(fromBalance >= value, "ERC20: transfer exceeds balance");
        unchecked {
            _balances[from] = fromBalance - value;
            _balances[to] += value;
        }
        emit Transfer(from, to, value);
    }

    function _mint(address account, uint256 value) internal {
        require(account != address(0), "ERC20: mint to zero address");
        _totalSupply += value;
        unchecked {
            _balances[account] += value;
        }
        emit Transfer(address(0), account, value);
    }

    function _approve(address tokenOwner, address spender, uint256 value) internal {
        require(tokenOwner != address(0), "ERC20: approve from zero address");
        require(spender != address(0), "ERC20: approve to zero address");
        _allowances[tokenOwner][spender] = value;
        emit Approval(tokenOwner, spender, value);
    }
}
