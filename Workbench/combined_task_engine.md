# Combined Task Engine — Current Implementation (Phase 4.1)

## Overview

Combined (combo) tasks are multi-order tasks injected into a user's normal task set at a configured position. They freeze the user's balance, require sequential order completion, and credit a commission on completion.

## Configuration source

- Single mutable document in `comboConfig` with `_id: "global"`.
- Defaults defined in `lib/comboTaskModel.js` (`DEFAULT_CONFIG`).
- Editable via `POST /api/admin/combo-config`; per-user overrides via `userComboSettings` and `userPositionOverrides`.

## Key config fields

| Field | Purpose |
|---|---|
| `enabled` | Master on/off switch. |
| `positions` | Global 1-based task numbers where a combo may appear (currently only `positions[0]` is used). |
| `demoPositions` / `mainPositions` | Account-type specific position lists (first element used). |
| `userPositionOverrides` | Per-user position lists (first element used). |
| `probability` | Chance a combo is generated. |
| `minOrders` / `maxOrders` | Range for number of orders per combo. |
| `commissionPercent` | Commission rate on completion. |
| `progressionLevels` | Amount ranges per progression level (1–3). |
| `firstComboMin/Max`, `secondComboMin/Max` | Stage-specific order amount ranges. |
| `profitThreshold`, `daysUntilFirstCombo` | Eligibility for stage-1 combo. |
| `targetNegativeBalance` | Drives wallet negative by this amount. |
| `userComboSettings` | Per-user overrides (position, numOrders, orderAmounts, targetNegativeBalance, commissionPercent). |

## Position resolution (`getComboPosition`)

Priority order:
1. Per-user `userComboSettings.position`.
2. Per-user `userPositionOverrides[uid][0]`.
3. Account-type positions (`demoPositions`/`mainPositions` first element).
4. Global `positions[0]`.

Only the **first** configured position is used in all cases. Multiple positions (`6, 9, 14, 16, 18` referenced in older code) are not independently implemented.

## Combo lifecycle

1. **Eligibility** — `isEligibleForFirstCombo`: `totalEarned >= profitThreshold` and account age ≥ `daysUntilFirstCombo`. Stage-2 requires `comboStage === 2`.
2. **Creation** — `createStageComboTask` / `createComboTask` inserts a `comboTasks` doc and marks the corresponding task doc as `isComboTask`.
3. **Freeze** — `activateComboFreeze` freezes the required capital when the user reaches the combo's position (deferred so balance stays normal until then).
4. **Start order** — `startComboOrder` requires non-negative balance; claims order atomically.
5. **Complete order** — `completeComboOrder` advances orders; on final order marks combo completed and credits commission (`creditComboCommission`), releasing frozen capital.
6. **Cancel** — `cancelComboTask` releases frozen capital and cancels.

## Data collections

- `comboConfig` (global + per-user settings nested).
- `comboTasks` (per user/set/position, with orders).
- `tasks` (combo task doc marked `isComboTask`, with `comboId`, `comboBackup` for restore).
- `userTaskSets` (tracks `currentPosition`).

## Known limitations (Phase 4 scope)

- Only the first configured position is used; multiple independent positions are not implemented.
- No configuration versioning or effective dates; `updateComboConfig` overwrites in place.
- `applyUserComboConfig` deletes/recreates pending combos without a version history.
- Completed task/order/financial records are not explicitly protected from config changes (rely on status guards).
- No transactions; multi-step flows are non-atomic (Phase 2 work).

## Phase 4 implementation update (2026-11-06)

- Business-approved positions: 6, 9, 14, 16, 18.
- `getComboPositions()` now returns all configured positions (resolved).
- Auto-assign creates a combined task for each configured position; task docs at those positions are marked as combo.
- Config versioning added via `lib/comboConfig.js` (`comboConfigVersions` collection) with create/publish/list/getActive.
- `configVersion` pinned on comboTasks for traceability.
- `getComboPosition()` retained for backward compatibility (returns first position).

## Phase 4 tasks pending business confirmation (B6)

- Resolved: positions 6, 9, 14, 16, 18.
- Remaining: integration verification (4.10).