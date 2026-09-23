# Smart Contract Deployer Ownership & Root User Rules

## Rule: Deployer Ownership & Root User Initialization
- **Deployer is Owner**: Every smart contract must set the deployer (`msg.sender` / `initialOwner`) as the contract `owner`.
- **Root User Initialization in Constructor**:
  - The constructor must register the deployer/owner as a registered user (`users[owner].isRegistered = true`).
  - Active timestamps must be initialized (`lastReferralTimestamp`, `currentMonthStartTime`, `lastLevelAccrualTime` set to `block.timestamp`).
  - Root registration event must be emitted (`emit Registered(owner, address(0), 0, block.timestamp)`).
- **Default Maximum Levels for Owner**:
  - The owner is at the root of the downline hierarchy and must defaultly have maximum levels (Levels 1 through 5) fully unlocked.
  - `isLevelEligible(owner, level)` must always return `true` for all valid levels.
  - `is120DaysActive(owner)` must always return `true`.
  - Level income calculations and withdrawals must recognize the owner's maximum level qualification without requiring personal deposit thresholds or downline member counts.
