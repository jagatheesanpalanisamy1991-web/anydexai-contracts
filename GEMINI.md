# Smart Contract Architecture & Business Rules Memory

## Global & Project Rule: Deployer Ownership & Root User Initialization

1. **Deployer is Always the Owner**:
   - On every smart contract project, the deployer (`msg.sender` / `initialOwner`) is assigned as the contract `owner`.
   - Default ownership pattern must strictly bind the deployer address to the root administration role.

2. **Constructor Root User Initialization**:
   - The constructor must automatically initialize the deployer/owner with complete root user information in storage (`users[owner]`).
   - Root user setup must include:
     - `users[owner].isRegistered = true`
     - `users[owner].sponsor = address(0)`
     - `users[owner].lastReferralTimestamp = block.timestamp`
     - `users[owner].currentMonthStartTime = block.timestamp`
     - `users[owner].lastLevelAccrualTime = block.timestamp`
     - Emit registration event (e.g., `emit Registered(owner, address(0), 0, block.timestamp)`).

3. **Default Maximum Level Qualification for Owner**:
   - The owner is situated at the root of the downline tree and must defaultly have **maximum levels unlocked**:
     - `isLevelEligible(userAddr, level)` must return `true` for all levels (e.g., Levels 1 to 5) when `userAddr == owner()`, without requiring downline member or volume criteria.
     - `is120DaysActive(userAddr)` must return `true` when `userAddr == owner()`, ensuring the owner is never penalized or locked out by activity rules.
     - Level commission accrual and withdrawals must allow the owner to accrue and collect across all downline levels.
