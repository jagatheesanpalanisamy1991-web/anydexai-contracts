// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./common/IERC20.sol";
import "./common/Ownable.sol";
import "./interfaces/IADAIToken.sol";

/**
 * @title ADAIToken (AnyDexAI Coin)
 * @notice BEP-20 / ERC-20 Token for AnyDexAI Ecosystem
 * @dev Controlled minting architecture for Main Plan rewards and Gaming Engine
 */
contract ADAIToken is IADAIToken, Ownable {
    string private _name = "AnyDexAI Coin";
    string private _symbol = "ADAI";
    uint8 private constant _decimals = 18;
    uint256 private _totalSupply;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => bool) private _minters;

    event MinterStatusUpdated(address indexed account, bool isMinter);

    modifier onlyMinter() {
        require(_minters[msg.sender] || owner() == msg.sender, "ADAI: caller is not authorized minter");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        // Owner is authorized minter by default
        _minters[initialOwner] = true;
        emit MinterStatusUpdated(initialOwner, true);
    }

    function name() external pure override returns (string memory) {
        return "AnyDexAI Coin";
    }

    function symbol() external pure override returns (string memory) {
        return "ADAI";
    }

    function decimals() external pure override returns (uint8) {
        return _decimals;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return _balances[account];
    }

    function isMinter(address account) external view override returns (bool) {
        return _minters[account];
    }

    function setMinter(address minterAddress, bool status) external onlyOwner {
        require(minterAddress != address(0), "ADAI: zero address minter");
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
            unchecked {
                _approve(from, spender, currentAllowance - value);
            }
        }
        _transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 amount) external override onlyMinter {
        require(to != address(0), "ADAI: mint to zero address");
        _totalSupply += amount;
        unchecked {
            _balances[to] += amount;
        }
        emit Transfer(address(0), to, amount);
    }

    function burn(uint256 amount) external override {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) external override {
        uint256 currentAllowance = _allowances[account][msg.sender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ADAI: insufficient allowance to burn");
            unchecked {
                _approve(account, msg.sender, currentAllowance - amount);
            }
        }
        _burn(account, amount);
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(from != address(0), "ADAI: transfer from zero address");
        require(to != address(0), "ADAI: transfer to zero address");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= value, "ADAI: transfer amount exceeds balance");
        unchecked {
            _balances[from] = fromBalance - value;
            _balances[to] += value;
        }
        emit Transfer(from, to, value);
    }

    function _approve(address tokenOwner, address spender, uint256 value) internal {
        require(tokenOwner != address(0), "ADAI: approve from zero address");
        require(spender != address(0), "ADAI: approve to zero address");
        _allowances[tokenOwner][spender] = value;
        emit Approval(tokenOwner, spender, value);
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ADAI: burn from zero address");
        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ADAI: burn amount exceeds balance");
        unchecked {
            _balances[account] = accountBalance - amount;
            _totalSupply -= amount;
        }
        emit Transfer(account, address(0), amount);
    }
}
