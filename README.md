# Documentation

## State Management

### `currentRotation` (Number)

- **Purpose:** Stores the cumulative rotation (in degrees) applied to the wheel element
- **Example:** `0`, `360`, `1820`, `3960`
- **Usage:** Ensures each new spin continues forward smoothly instead of snapping back

### `isSpinning` (Boolean)

- **Purpose:** Prevents starting a new spin while the current spin animation is running
- **Example:** `true` during 5s animation, `false` when finished
- **Usage:** Guard inside `spinWheel()` to avoid double clicks / broken state

### `totalSpins` (Number)

- **Purpose:** Tracks the current spin index inside the 10 spin cycle (`0-10`)
- **Example:** `0-9` used to pick from `winSequence`, resets when reaches `10`
- **Usage:** Controls `winSequence[totalSpins]` and triggers new sequence after 10 spins

### `desiredSector1` (Number)

- **Purpose:** Sector index that must appear 3 times per 10 spins
- **Example:** `3`
- **Usage:** Inserted into `winSequence` to guarantee 3 appearances

### `desiredSector2` (Number)

- **Purpose:** Sector index that must appear 2 times per 10 spins
- **Example:** `7`
- **Usage:** Inserted into `winSequence` to guarantee 2 appearances

### `isInFreeSpinMode` (Boolean)

- **Purpose:** Indicates whether the game is currently running 3 automatic bonus spins
- **Example:** `false` normally, `true` during bonus spins
- **Usage:** Changes prize flow in `handlePrize()` and counts bonus winnings

### `freeSpinWinnings` (Array)

- **Purpose:** Collects the prize values won during the 3 bonus spins
- **Structure:** `[Number, Number, Number]`
- **Example:** `[20, 65, 100]`
- **Usage:** Summed in `finishFreeSpins()` to show the total bonus payout

### `winSequence` (Array)

- **Purpose:** Stores a pre-planned 10 spin sequence for deterministic outcomes
- **Structure:** `[Number, Number, ...]` length = `10` (sector indexes)
- **Example:** `[5, 3, 7, 1, 3, 12, 3, 8, 7, 0]`
- **Usage:** `spinWheel()` picks `winningSector = winSequence[totalSpins]`

### `prizes` (Array)

- **Purpose:** Maps sector index → displayed prize value
- **Structure:** `[Number | "FreeSpins"]`
- **Example:** `prizes[0] = 100`, `prizes[9] = "FreeSpins"`
- **Usage:** `const prize = prizes[winningSector]`

### `TOTAL_SECTORS / DEGREE_PER_SECTOR` (Constants)

- **Purpose:** Defines wheel geometry (how many slices and how many degrees per slice)
- **Example:** `TOTAL_SECTORS = 18`, `DEGREE_PER_SECTOR = 20`
- **Usage:** Used for placing labels and for rotating to the winning sector

---

## User Interactions

### Mouse Actions

1. **Click "Start" button**  
   → Runs `spinWheel()` which rotates the wheel and later shows a popup with the prize

2. **Click popup "OK"**  
   → Closes the popup and runs the popup callback (e.g. `startFreeSpins()` or re-enables start button)

### Bonus Mode Behavior

- If prize is `"FreeSpins"` in normal mode  
  → `showPopup()` explains bonus  
  → `startFreeSpins()` sets `isInFreeSpinMode = true` and triggers 3 auto spins

- During bonus spins  
  → each result is pushed into `freeSpinWinnings`  
  → after 3 results, `finishFreeSpins()` shows the summed total

---

## Data Flow

### Normal Spin

User clicks Start  
↓  
`spinWheel()`  
↓  
(Guard) `if (isSpinning) return`  
↓  
`if (totalSpins === 10)` → reset `totalSpins` + `generateWinSequence()`  
↓  
`winningSector = winSequence[totalSpins]`  
↓  
Rotate wheel element to `targetRotation` (5 full spins + alignment)  
↓ (wait 5 seconds)  
`setTimeout` callback  
↓  
`totalSpins++`  
↓  
`prize = prizes[winningSector]`  
↓  
`handlePrize(prize)`  
↓

- If prize is `"FreeSpins"` and not in bonus mode → `showPopup()` → `startFreeSpins()`
- Else → show normal prize popup → re-enable Start after OK

### Free Spins (Bonus) Flow

Prize is `"FreeSpins"`  
↓  
`startFreeSpins()`  
↓  
`isInFreeSpinMode = true`, `freeSpinWinnings = []`  
↓ (after short delay)  
`spinWheel(true)`  
↓ (3 times total)  
Each spin ends → `handlePrize(prize)`  
↓  
`handleFreeSpinResult(prize)` → push into `freeSpinWinnings`  
↓  
If `freeSpinWinnings.length < 3` → schedule next spin  
Else → `finishFreeSpins()`  
↓  
`finishFreeSpins()` sums winnings and shows "total won" popup

---

## Core Functions

### `generateWinSequence()`

- **Purpose:** Builds a 10 spin plan containing `desiredSector1` (3 times), `desiredSector2` (2 times), and random filler sectors
- **Output:** Array of sector indexes length `10`
- **Why:** Guarantees certain outcomes within each 10 spin cycle

### `getRandomNumberWithExclude(excludeNumbers)`

- **Purpose:** Returns a random number from `0-17` that is not in `excludeNumbers`
- **Why:** Used to fill winSequence “random slots” without accidentally using desired sectors

### `createSectorLabels()`

- **Purpose:** Creates and positions prize label elements around the wheel
- **Key Geometry:**
  - `angle = i * DEGREE_PER_SECTOR - 90`
  - **Explanation:** sector 0 should start at 12 o’clock, but CSS 0° points right (3 o’clock), so we shift by `-90°`

### `spinWheel()`

- **Purpose:** Runs a single spin animation and triggers prize handling when animation ends
- **Rotation Math:**
  - `sectorCenterAngle = winningSector * DEGREE_PER_SECTOR`
  - `targetRotation = 360 * 5 - sectorCenterAngle`
  - **Explanation:** do 5 full spins, then subtract the sector angle so that sector aligns under the arrow
  - Base rotation logic keeps the wheel always rotating forward smoothly

### `handlePrize(prize)`

- **Purpose:** Routes the prize to the correct flow (normal prize vs FreeSpins flow)

### `handleNormalResult(prize)`

- **Purpose:** Shows the normal “You won X” popup and re-enables start button

### `startFreeSpins()`

- **Purpose:** Enables bonus mode, clears bonus winnings, and triggers the first auto spin

### `handleFreeSpinResult(prize)`

- **Purpose:** Saves each bonus prize and triggers next auto spin until 3 spins are completed

### `finishFreeSpins()`

- **Purpose:** Sums bonus winnings and shows the final bonus popup, then resets bonus state

### `showPopup(title, message, callback)`

- **Purpose:** Displays the popup overlay and runs callback when user clicks OK
