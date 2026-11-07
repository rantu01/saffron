# Saffron Edge – Backend Analysis (Phase 1 / Phase 2)

> **Phase 1 status:** Analysis only. No backend code, database records, indexes, or configuration were modified.
>
> **Phase 2 status:** In progress (2026-11-05). See the Phase 2 section at the end of this report.
>
> **Scope:** `app/api/**/route.js`, `lib/*.js`, MongoDB usage patterns, Firebase integration, and the frontend call sites that exercise them.
>
> **Companion documents:** `project_overview.md`, `terms_conditions_analysis.md`, `api_status.md`, `progress.md`, `todo.md`.

---

## 1. Backend Structure

### 1.1 Runtime model

- Next.js App Router Route Handlers (`app/api/**/route.js`).
- **64 route files / 89 exported HTTP handlers.**
- All handlers run in the Node.js runtime unless otherwise noted.
- Response convention: JSON with `success` plus either data or `message`.
- Errors are caught per handler and generally converted to HTTP 400, 401, 403, 404, or 500.

### 1.2 Data access model

- One cached `MongoClient` promise (`lib/mongodb.js`), `maxPoolSize: 10`.
- Each model opens the database with `client.db(process.env.MONGODB_DB_NAME || "saffron")`.
- Idempotent additive index bootstrap is wired through `lib/dbIndexes.js` and executed from `lib/mongodb.js`.
- No repository abstraction or transaction wrapper.
- No schema validation (`$jsonSchema`) or Mongoose models.
- Dates are stored as native `Date` objects; numeric money values are stored as JavaScript numbers (floating point), not integer cents or `Decimal128`.

### 1.3 Cross-cutting helpers

- `lib/userModel.js` for user/balance operations.
- `lib/balanceLog.js` for financial logs.
- `lib/notificationModel.js` for notifications.
- `lib/vipModel.js` for VIP configuration/eligibility.
- `lib/taskSetModel.js` and `lib/comboTaskModel.js` for task state.
- `lib/realtimeHub.js` for in-process SSE fan-out.

---

## 2. Database Query Patterns

### 2.1 Positive patterns

- Pagination is present on the main list endpoints (`admin/users`, `admin/tasks`, `admin/deposits`, `admin/withdrawals`, notifications, balance logs, VIP lists).
- `Promise.all` is used for independent reads in several routes.
- `$inc` is used for balance changes, which avoids lost updates **within a single document field update**.
- Search input is escaped before constructing regular expressions in most admin/user list routes.
- Projections are used in some places to exclude large or sensitive fields (`password`, `submissionConfig`).

### 2.2 Performance issues found

| # | Location | Finding | Impact |
|---|---|---|---|
| P1 | `app/api/admin/withdrawals/route.js:15-17` | `getAllWithdrawals()` loads every withdrawal, then filters `status` in memory. | Unbounded memory/response growth as withdrawals accumulate; no pagination. |
| P2 | `app/api/user/dashboard/route.js:32-36` | Loads **all** tasks for the user with no limit. | Dashboard response grows with account history; slow mobile loads. |
| P3 | `app/api/user/dashboard/route.js:49-63` | Every dashboard GET can call `activateComboFreeze`, which performs multiple reads/writes. | Read endpoint has side effects and repeated write overhead. |
| P4 | `lib/vipModel.js:187-211` | Fetches latest tasks via aggregation, then loads **all** task groups to build a name map. | Unnecessary full scan of `taskGroups` on every VIP-users request. |
| P5 | `lib/reportService.js:107-123` | User activity report loads every user, then runs `$in` aggregations over all UIDs. | Large `$in` arrays and full user collection scans; poor scaling. |
| P6 | `lib/reportService.js:101-147` | Report rows are built for all users with no pagination. | Admin report can exhaust memory for large user bases. |
| P7 | `app/api/admin/tasks/route.js:29-38` | Task list sorts on `createdAt` with no supporting compound index. | In-memory sort / collection scan as data grows. |
| P8 | `app/api/admin/users/route.js:29-39` | User list sorts on `createdAt` with no supporting index. | Collection scan + sort. |
| P9 | `app/api/admin/vip/requests/route.js` and `.../users/route.js` | Sort by `createdAt`; regex search across multiple fields. | No supporting indexes; regex `i` cannot use a standard index efficiently. |
| P10 | Mixed | Repeated `getUserByUid` calls within one request (e.g. task completion, deposits, withdrawals). | Redundant round-trips and inconsistent snapshots. |
| P11 | `lib/mongodb.js:30-44` | Only four indexes are created, and `createIndexes()` runs at import time without awaiting/error surfacing. | Core query paths are unindexed; index creation failures are swallowed. |
| P12 | `app/api/realtime/stream/route.js:6,56-73` | Every connected client triggers count queries every 3 seconds. | Polling load multiplies with concurrent users; each client causes 2–3 database queries per tick. |
| P13 | `app/api/chat/*` and notifications | Polling fallbacks (3s chat, 15s counts, 30s notifications) plus SSE. | Duplicate traffic and database load. |
| P14 | `lib/comboTaskModel.js` | Combo application performs many sequential reads/writes without aggregation or bulk operations. | Slow task page loads and partial-state risk. |

### 2.3 Query-shape recommendations

- Add filters and pagination at the database, never in memory.
- Project only fields needed by the UI.
- Replace per-user iterative lookups with `$in`/aggregation where safe.
- Cap dashboard task history (e.g. recent N) and paginate records separately.
- Add compound indexes (see §7).

---

## 3. Authentication and Security Concerns

### 3.1 Critical: no server-side authorization

Only `GET /api/auth/role` verifies a Firebase ID token:

```text
Authorization: Bearer <Firebase ID token>
  → getAdminAuth().verifyIdToken(token)
  → users.role
```

`POST /api/admin/users/change-password` uses Firebase Admin but does **not** verify the caller.

Every other route trusts client-supplied identifiers:

- `uid`, `email`, `approverUid`, `adminUid` in JSON bodies.
- `uid`, `role` in query strings (including the SSE stream).
- `senderUid`, `senderRole`, `senderName` in chat.

**Impact:** Any unauthenticated network client that can reach the deployment can:

- Read any user's profile, dashboard, balance logs, referrals, deposits, withdrawals, tasks, and ad accounts by supplying a `uid`.
- Invoke admin mutations (balance adjustment, deposit/withdrawal approval, user role changes, VIP assignment, combo configuration, WhatsApp settings, reports).
- Delete users and their related data.
- Subscribe to the realtime stream as `role=admin` and receive admin event data.
- Read or write chat messages for arbitrary conversations and impersonate an admin sender.

This is the highest-priority blocker for Phase 2.

### 3.2 Critical: identity spoofing in `/api/auth/sync-user`

`syncAuthenticatedUser` searches by `uid` **or** email from the request body and then `$set`s `email`, `displayName`, `phoneNumber`, `invitationCode`, and related fields.

Consequences:

- A caller can submit an existing user's `uid` with a different email and overwrite that user's email.
- A caller can submit an existing email with a new `uid` and attach/merge onto the record.
- No verification that the Firebase token's `uid` matches the body's `uid`.

### 3.3 Critical: chat and realtime trust client role

- `POST /api/chat/messages` accepts `senderRole` from the body. A user can post as `admin`.
- `GET /api/chat/messages` accepts any `conversationId`; no membership check.
- `GET /api/realtime/stream` accepts `role=admin`; no token check.
- `GET /api/chat/unread-count`, notifications, and balance logs accept arbitrary `uid`.

### 3.4 High: sensitive data exposure

- `GET /api/user/profile?uid=...` returns the full user document (minus `password`) to anyone with the UID, including balance, role, freeze state, invitation data, and wallet address.
- Admin APIs return complete user/task/finance records.
- Deposit screenshots are stored and returned as base64 (potential large payload and PII exposure).
- No field-level authorization or redaction by role.

### 3.5 High: admin operations with no audit identity

- `adminUid`, `approverUid`, and `adminUid` come from the request body.
- Audit fields in `balanceLogs` and `vipRequests` can be forged or omitted.
- There is no server-side admin activity log.

### 3.6 High: no rate limiting / abuse controls

- No rate limiting on login-adjacent endpoints, username checks, invitation validation, chat upload, notifications, or financial requests.
- Chat image upload accepts base64 without visible size/type enforcement in the route.
- Deposit screenshots are unbounded base64.

### 3.7 Medium: error handling leaks internals

- Many handlers return `error.message` directly to the client (database errors, Firebase errors, stack-adjacent details).
- `console.error` output may include user identifiers.

### 3.8 Medium: CSRF/session model

- Firebase client sessions are bearer-like; there are no cookies or CSRF tokens.
- Once server verification is added, the API should require `Authorization: Bearer` on every protected route and reject unauthenticated requests.

---

## 4. Existing Business Logic (as implemented)

### 4.1 User creation and onboarding

- New Firebase user → `/api/auth/sync-user`.
- Creates/updates `users` with role `user`, `vipLevel: 1`, `vipProfitIncrease: 0.5`, `vipTasksPerSet: 20`.
- Credits a `$5` welcome bonus once.
- Creates a unique referral code.
- For main accounts, creates a `training_<uid>` child with `$800`, role `training`, and 20 auto-completed training tasks; 20% of training profit goes to the parent.
- Invitation-code registration creates a demo account linked to the inviter; the inviter receives 20% of demo profit.

### 4.2 Task assignment

- Admin group assignment clones templates into `tasks` and creates a `userTaskSets` record.
- User auto-assignment selects an unused group (or recycles), takes the first `vipTasksPerSet` templates, and may inject one combined task.
- VIP `tasksPerSet` comes from `user.vipTasksPerSet` or the hardcoded tier.

### 4.3 Task completion

- Profit = `totalAmount × (vipProfitIncrease / 100)`.
- Task principal (if previously frozen) is returned to available balance.
- Only profit is credited to `availableBalance`/`totalEarned`.
- A `balanceLogs` entry is written.
- VIP eligibility is evaluated (request creation only).
- Set progress is incremented; the set is marked complete when `completedTasks >= totalTasks`.
- Demo/training profit share is credited to the inviter/parent.

### 4.4 Task cancellation/freezing

- Default `mode` freezes the task amount (`availableBalance` → `frozenBalance`) and leaves the task pending.
- `mode: "cancel"` marks the task cancelled and permanently debits the amount.
- Combined tasks cannot be cancelled.

### 4.5 Combined tasks

- Config lives in `comboConfig` (`_id: "global"`).
- Eligibility stage 1: `totalEarned >= profitThreshold` and account age ≥ `daysUntilFirstCombo`.
- Stage 2: `comboStage === 2`.
- Combined tasks can create negative balances and `comboDebt`, which blocks task completion and withdrawals until a deposit clears it.
- Only the first configured position is used; per-user settings can set one position and optional fixed order amounts.

### 4.6 Deposits/withdrawals

- Deposit approval credits the user, clears combo debt, releases frozen balance when debt is zero, unblocks a waiting combo, writes a log, and evaluates VIP eligibility.
- Withdrawal approval checks user status, debt, balance, then debits and logs.
- Withdrawal creation validates account state and available balance but does not reserve funds.

### 4.7 VIP

- Hardcoded thresholds and task/profit rates.
- Eligibility creates a pending request; admin approval changes the level and writes task config fields.
- Manual assignment inserts a `vipRequests` record with `status: "manual"`.

---

## 5. Data Integrity Risks

### 5.1 No transactions

Financial and task workflows are multi-step and non-atomic. A failure between steps can leave:

- A completed task without a balance credit, or a credit without a completed task.
- A deposit/withdrawal marked approved without a matching balance log.
- Frozen balance moved but task state unchanged.
- Combo debt cleared but combo still waiting.

### 5.2 Duplicate execution

| Risk | Location | Detail |
|---|---|---|
| Duplicate deposit credit | `app/api/admin/deposits/route.js` | No check that current status is `pending`; repeated `PATCH approved` credits again. |
| Duplicate withdrawal debit | `app/api/admin/withdrawals/route.js` | No check that current status is `pending`; repeated `PATCH approved` debits again. |
| Duplicate task credit | `app/api/user/tasks/complete/route.js` | Read-then-write status check; two concurrent requests can both pass. No idempotency key or conditional update. |
| Duplicate freeze | `app/api/user/tasks/cancel/route.js` | Freeze mode does not check `task.frozenAmount`; repeated calls move the amount again and can overdraw. |
| Duplicate combo activation | `lib/comboTaskModel.js` | Freeze/unfreeze paths perform read-modify-write on balances rather than conditional `$inc`/guards. |

### 5.3 Direct balance overwrite

`PATCH /api/admin/users` accepts `availableBalance` and `$set`s it directly.

- No balance log is created.
- No adjustment reason is required.
- Historical transaction records remain but the balance can silently diverge from the log total.
- This violates the Master requirement that balance adjustments be auditable and never silently overwrite history.

### 5.4 Completed-task mutability

- `PUT /api/admin/tasks/[id]` can update any task, including assigned/completed tasks.
- `DELETE /api/admin/tasks/[id]` can delete completed tasks.
- This violates the requirement that completed task records and historical financial references remain immutable.

### 5.5 Incomplete user deletion

`DELETE /api/admin/users` removes the user, Firebase account, tasks, legacy `taskSets`, taskGroups, records, balanceLogs, notifications, deposits, withdrawals, messages, and invitationCodes.

It does **not** remove:

- `userTaskSets`
- `comboTasks`
- `vipRequests`
- `groupAssignments`
- `adAccounts`
- `metaAdAccounts` / related settings

This leaves orphaned financial and task records after account deletion.

### 5.6 Missing `roundCurrency` import

`app/api/admin/deposits/route.js` calls `roundCurrency(...)` but did not import it. If `comboDebt > 0`, approval would throw a `ReferenceError` after the user document had been updated.

**Status (Phase 2, 2026-11-05):** fixed by importing `roundCurrency` from `lib/taskModel.js` in `app/api/admin/deposits/route.js`. Targeted ESLint and `npm run build` passed.

### 5.7 Inconsistent profit calculation

- Admin task templates compute and store `profit = totalAmount × 0.005` (0.5%).
- Task completion recomputes profit from the user's VIP rate.
- Combined tasks use `lib/vipModel.js` rates.
- The stored template `profit`/`reward` can therefore disagree with the credited amount.

### 5.8 Floating-point money

- Amounts are stored as JS numbers.
- `roundCurrency` uses `Math.round(value * 100) / 100`.
- Repeated additions, commissions, debt clearing, and partial withdrawals can accumulate rounding drift.
- No `Decimal128` or integer-cent representation is used.

### 5.9 Pending withdrawals are not reserved

- A user can create multiple pending withdrawals whose total exceeds the available balance.
- Approval-time checks protect the balance, but later requests fail and the user experience/audit trail is misleading.
- There is no idempotent request key.

### 5.10 Task position enforcement

- `taskSetModel.canCompleteTask` exists but is not used by `POST /api/user/tasks/complete`.
- Completion is not gated on the task being the next sequential position.
- Admin task assignment can create sets with gaps or custom positions.

### 5.11 Set-limit inconsistency

- User task completion enforces a rolling 24-hour `DAILY_SET_LIMIT = 3`.
- Admin group assignment enforces a separate `DAILY_GROUP_LIMIT = 3` with a `force` override.
- The Master specification requires VIP-specific group limits (3/4/5/6).
- No single source of truth exists.

### 5.12 Combo configuration is mutable and unversioned

- `comboConfig` is a single mutable `_id: "global"` document.
- `updateComboConfig` overwrites fields with no version, effective time, or change log.
- `applyUserComboConfig` deletes/recreates pending combos, which can alter upcoming tasks without a configuration version history.
- There is no record of the previous config, administrator, timestamp, or affected positions.

### 5.13 VIP assignment history is partial

- Manual VIP changes create a `vipRequests` record with `status: "manual"`.
- There is no immutable audit entry for who changed what, the previous/new task configuration, or the effective time.
- Pending requests can be approved after the user's balance has changed.

---

## 6. API Performance and Reliability

### 6.1 Reliability findings

- No global error boundary or structured logger.
- No retry/backoff for transient MongoDB errors.
- No timeout on individual queries beyond the client connection settings.
- Long-running loops (training task auto-completion, combo order generation) run inside request handlers.
- `createIndexes()` is fire-and-forget; startup failures are silent.
- SSE connections are held open per client; the in-process hub does not survive multi-instance deployments or server restarts.

### 6.2 Scalability findings

- In-process `realtimeHub` works only on a single server instance. Multiple instances will not share events.
- Per-client 3-second count polling amplifies database load.
- `maxPoolSize: 10` may be insufficient for concurrent SSE + polling + admin report traffic, depending on deployment size.
- No caching layer for settings, VIP config, combo config, or report aggregates.
- Report generation is synchronous in the request path.

### 6.3 Response-size findings

- Dashboard returns every task.
- Deposit list returns base64 screenshots.
- Admin user list returns full user documents (except password).
- Reports return all rows.

---

## 7. Required Indexes

The following indexes are recommended based on actual query shapes. They were proposed in Phase 1 and created idempotently through `lib/dbIndexes.js` during Phase 2 on 2026-11-05. All 33 proposed indexes were created successfully; no documents were changed.

### 7.1 Users

```js
db.users.createIndex({ uid: 1 }, { unique: true })
db.users.createIndex({ authUid: 1 }, { sparse: true })
db.users.createIndex({ email: 1 })
db.users.createIndex({ createdAt: -1 })
db.users.createIndex({ role: 1, createdAt: -1 })
```

> `users.username` already has a unique sparse index created by `lib/userModel.js`.

### 7.2 Tasks

```js
db.tasks.createIndex({ assigneeUid: 1, setNumber: 1, position: 1 })
db.tasks.createIndex({ assigneeUid: 1, createdAt: -1 })
db.tasks.createIndex({ taskGroupId: 1, isTemplate: 1 })
db.tasks.createIndex({ parentTaskGroupId: 1 })
db.tasks.createIndex({ status: 1, createdAt: -1 })
db.tasks.createIndex({ isComboTask: 1, comboId: 1 })
```

### 7.3 Task sets and combos

```js
db.userTaskSets.createIndex({ uid: 1, setNumber: -1 })
db.userTaskSets.createIndex({ uid: 1, status: 1, completedAt: -1 })
db.comboTasks.createIndex({ uid: 1, setNumber: 1, position: 1 })
db.comboTasks.createIndex({ uid: 1, status: 1 })
```

### 7.4 Finance

```js
db.deposits.createIndex({ uid: 1, createdAt: -1 })
db.deposits.createIndex({ status: 1, createdAt: -1 })
db.withdrawals.createIndex({ uid: 1, createdAt: -1 })
db.withdrawals.createIndex({ status: 1, createdAt: -1 })
db.balanceLogs.createIndex({ uid: 1, createdAt: -1 })
db.balanceLogs.createIndex({ type: 1, createdAt: -1 })
db.balanceLogs.createIndex({ referenceType: 1, referenceId: 1 })
```

### 7.5 Notifications, chat, VIP, audit

```js
db.notifications.createIndex({ uid: 1, isRead: 1, createdAt: -1 })
db.notifications.createIndex({ recipient: 1, isRead: 1, createdAt: -1 })
db.messages.createIndex({ conversationId: 1, createdAt: -1 })
db.vipRequests.createIndex({ uid: 1, createdAt: -1 })
db.vipRequests.createIndex({ status: 1, createdAt: -1 })
db.groupAssignments.createIndex({ assigneeUid: 1, createdAt: -1 })
```

Index creation must be planned as a backward-compatible, monitored migration in Phase 2 (not at module import time).

---

## 8. Recommended Implementation Approach (Phase 2)

### 8.1 First: establish server-side auth

1. Add a shared server helper, e.g. `requireAuth(request)`:
   - Read `Authorization: Bearer <token>`.
   - `getAdminAuth().verifyIdToken(token)`.
   - Load the MongoDB user by `decodedToken.uid`.
   - Return `{ uid, role, user }` or throw 401/403.
2. Add `requireAdmin(request)` that also checks `normalizeRole(user.role) === "admin"`.
3. Add `requireOwnerOrAdmin(request, targetUid)` for user-scoped routes.
4. Apply to every route in `app/api/**` except intentionally public endpoints (health, public content, `auth/check-username`, `auth/validate-invitation`, and registration sync with strict token verification).
5. Update frontend fetches to send the Firebase ID token.
6. Remove all client-supplied `adminUid`/`approverUid` as the source of audit identity; derive it from the token.

### 8.2 Then: make financial operations idempotent

- Use conditional updates on `status: "pending"` for deposit/withdrawal approval.
- Use `findOneAndUpdate({ _id, status: "pending" }, ...)` and verify the matched document before crediting/debiting.
- Add an idempotency key or unique operation reference for balance logs.
- Wrap multi-document financial flows in MongoDB transactions **after** confirming the deployment is a replica set.
- Add explicit guards for existing `frozenAmount` in task freezing.
- Add unique `(referenceType, referenceId, type)` constraints where appropriate (carefully, with a migration plan).

### 8.3 Then: add audit/login infrastructure

- `loginHistory` collection with uid, timestamp, IP, user agent, status, failure reason.
- `adminAuditLogs` collection with actor uid, action, target type/id, before/after values, reason, timestamp, request metadata.
- Append-only behavior; no ordinary admin delete/update route.
- Login history can be recorded client-side only as a hint; authoritative IP/device must come from the request/server proxy headers.

### 8.4 Then: centralize configuration

- Replace hardcoded VIP values with a `vipConfig` collection.
- Add configuration versioning/effective time and an audit record for changes.
- Enforce VIP daily group limits in one place used by both admin assignment and user auto-assignment.
- Store VIP-specific terms content/version references.

### 8.5 Then: combined-task engine

- Replace single `position` with an ordered configuration list.
- Support multiple independent combos per set.
- Store configuration versions and effective timestamps.
- Apply changes only to pending positions.
- Preserve completed task/order/financial records.
- Add transactions/conditional updates for freeze, debt, and completion.

### 8.6 Then: terms and localization

- Add collections and APIs per the supplied policy brief.
- Enforce backend acceptance records before restricted features.
- Add public language provider and selector; keep dashboard translations working.

### 8.7 Verification gates

Before each phase is marked complete:

- Run lint and targeted tests.
- Exercise both allowed and forbidden requests with a non-admin token.
- Verify balance totals against `balanceLogs`.
- Verify completed tasks/transactions are unchanged by configuration edits.
- Confirm no production data or schema is destroyed.

---

## 9. Phase 2 Blocking Decisions

1. **Which VIP values are authoritative?** The supplied terms file does not define them. The Master spec, `lib/vipModel.js`, and the hardcoded terms page disagree. Do not migrate values until the business owner confirms.
2. **Is the deployment a MongoDB replica set?** Transactions require one. Confirm before promising atomic financial flows.
3. **What are the production operating constraints?** Index creation and schema changes need a maintenance/rollout plan.
4. **Is a reverse proxy/CDN trusted for IP headers?** Login-history IP capture must define the trusted source of `x-forwarded-for`.
5. **How should demo/training accounts behave under the new auth rules?** They do not have Firebase Auth users in all cases, so they cannot obtain ID tokens. A deliberate policy is required.

---

## 10. Summary of Findings

The backend is functional but currently optimized for rapid feature delivery rather than production safety:

- Rich domain logic exists for tasks, sets, combos, VIP, finance, referrals, and chat.
- The single largest risk is the complete absence of server-side authentication/authorization.
- The second largest risk is non-atomic, repeatable financial mutations.
- The third is the absence of audit/login history and centralized configuration.
- Performance work should follow security work, because adding auth changes every request path.

### 10.1 Phase 2 status (2026-11-05)

- Stability and integrity work completed: missing `roundCurrency` import, MongoDB driver v7 result handling, atomic financial/task guards, admin balance ledger logging, user deletion cascade.
- Performance work completed: idempotent index set (33 indexes created), dashboard query concurrency, daily-limit counting, finite financial amount validation.
- Auth helper work completed: shared Firebase helper added; admin enforcement slices added to `POST /api/admin/users/balance`, `PATCH /api/admin/deposits`, `PATCH /api/admin/withdrawals`, `PATCH /api/admin/users`, `DELETE /api/admin/users`, and `POST /api/admin/task-groups/assign`; user-scoped enforcement slices added to `POST /api/user/tasks/complete`, `POST /api/user/tasks/combo/complete-order`, and `POST /api/user/tasks/cancel`.
- Build and lint verification: targeted files clean; production build successful.
- Not yet completed: server-side auth enforcement on the remaining admin routes, transactions, log immutability, remaining performance hardening, rate limiting, error handling standardization.

No code was changed in Phase 1; all recommendations above were pending until Phase 2 execution began.
