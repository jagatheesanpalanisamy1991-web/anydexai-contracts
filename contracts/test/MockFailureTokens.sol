// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../common/IERC20.sol";

// 1. Returns false on failure/transfer
contract FalseReturnToken is IERC20 {
    string public name = "False Return Token";
    string public symbol = "FRT";
    uint8 public decimals = 18;

    function totalSupply() external pure override returns (uint256) { return 1e27; }
    function balanceOf(address) external pure override returns (uint256) { return 1e27; }
    function transfer(address, uint256) external pure override returns (bool) { return false; }
    function allowance(address, address) external pure override returns (uint256) { return 1e27; }
    function approve(address, uint256) external pure override returns (bool) { return false; }
    function transferFrom(address, address, uint256) external pure override returns (bool) { return false; }
}

// 2. Reverts on any transfer/transferFrom
contract RevertingToken is IERC20 {
    string public name = "Reverting Token";
    string public symbol = "REV";
    uint8 public decimals = 18;

    function totalSupply() external pure override returns (uint256) { return 1e27; }
    function balanceOf(address) external pure override returns (uint256) { return 1e27; }
    function transfer(address, uint256) external pure override returns (bool) { revert("RevertingToken: failed"); }
    function allowance(address, address) external pure override returns (uint256) { return 1e27; }
    function approve(address, uint256) external pure override returns (bool) { revert("RevertingToken: failed"); }
    function transferFrom(address, address, uint256) external pure override returns (bool) { revert("RevertingToken: failed"); }
}

// 3. Returns nothing (no bool returned, common in USDT on mainnet / BNB)
contract NoReturnToken {
    string public name = "No Return Token";
    string public symbol = "NRT";
    uint8 public decimals = 18;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor() {
        balanceOf[msg.sender] = 1e27;
    }

    function transfer(address to, uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "NRT: low balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external {
        allowance[msg.sender][spender] = amount;
    }

    function transferFrom(address from, address to, uint256 amount) external {
        require(balanceOf[from] >= amount, "NRT: low balance");
        if (allowance[from][msg.sender] != type(uint256).max) {
            require(allowance[from][msg.sender] >= amount, "NRT: low allowance");
            allowance[from][msg.sender] -= amount;
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
    }
}

// 4. Malicious Reentrant Token: attempts to call back into target during transferFrom
contract MaliciousReentrantToken is IERC20 {
    string public name = "Malicious Reentrant Token";
    string public symbol = "MRT";
    uint8 public decimals = 18;

    address public target;
    address public attacker;
    bool public attacking;
    bool public reentrancyBlocked;
    bytes public lastRevertData;

    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;

    constructor() {
        balances[msg.sender] = 1e27;
    }

    function setTarget(address _target, address _attacker) external {
        target = _target;
        attacker = _attacker;
    }

    function totalSupply() external pure override returns (uint256) { return 1e27; }
    function balanceOf(address account) external view override returns (uint256) { return balances[account]; }
    function allowance(address owner, address spender) external view override returns (uint256) { return allowances[owner][spender]; }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowances[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        balances[from] -= amount;
        balances[to] += amount;

        // Perform reentrant call
        if (!attacking && target != address(0)) {
            attacking = true;
            (bool success, bytes memory returnData) = target.call(
                abi.encodeWithSignature("registerAndInvest(address,uint256)", attacker, 1)
            );
            if (!success) {
                reentrancyBlocked = true;
                lastRevertData = returnData;
            }
        }

        return true;
    }
}
