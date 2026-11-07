# API Status — Saffron Edge

> Phase 1 analysis. Generated from the actual route files under `app/api/`.
> Phase 2 updates (2026-11-05): selected integrity and validation fixes were applied during Phase 2; see `progress.md` and `backend_analysis.md` before relying on this document as final.
> No route, schema, or data was modified while producing this document.

## Scope and method

- Enumerated every `app/api/**/route.js` file and every exported HTTP handler.
- Result: **64 route files, 89 exported handlers** (50 admin, 24 user, 4 auth, 6 chat, 4 notification, 1 realtime).
- Purposes, validation rules, and behaviour below were read from the source, not inferred from the UI.
- "Status" describes whether the handler works for its intended happy path. Security and integrity findings are recorded separately in `backend_analysis.md` and repeated where they affect a specific endpoint.

## Global conventions and cross-cutting facts

| Item | Finding |
|---|---|
| Response shape | JSON `{ success: boolean, ... }`; errors normally include `message` and an HTTP 4xx/5xx status. A few endpoints return HTTP 200 with `success: false` (for example `start-order` insufficient balance and `task-groups/assign` daily-limit confirmation). |
| Authentication | **All handlers except `check-username` and `validate-invitation` now require a Firebase ID token** via `Authorization: Bearer` or (for SSE) a `token` query parameter. Admin handlers additionally require `users.role === "admin"` in MongoDB. User handlers bind `uid` to the verified token subject. `sync-user` verifies the token and checks `uid`/`email` match. |
| Authorization | No admin route checks the caller's role server-side. Admin UI guards are client-side only. Knowing an admin URL is sufficient to call it. |
| Object ownership | User routes validate that the supplied `uid` exists but do not prove that the caller owns it. Any caller can read or act on another user's data by changing `uid`. |
| Transactions | No MongoDB session/transaction is used anywhere. Multi-document financial and task flows are still non-atomic. |
| Idempotency | Deposit, withdrawal, task-complete, combo-order, and commission-credit operations now use atomic status/claim guards (`pending` → target, or single claim flag), so a repeat or racing request is rejected with `409` instead of double-applying value. Transactions remain future work. |
| Pagination | Most list endpoints accept `page`/`limit`; several admin lists are unbounded (`withdrawals`, `invitations`, `whatsapp/logs`, VIP users are capped). |
| Error leakage | Many catch blocks return raw `error.message` to the client. |
| Rate limiting | No route implements rate limiting. |
| CSRF | No explicit CSRF protection; reliance is on same-origin behaviour only. |

### Status legend

- **Implemented** — works on the intended happy path.
- **Implemented – risk** — works but has a confirmed data-integrity, idempotency, or authorization weakness.
- **Partial** — only part of the expected behaviour exists.
- **Stub / refusal** — the endpoint exists but intentionally performs no mutation.

---

## 1. Authentication and onboarding (4 handlers)

| Method | Endpoint | Purpose | Auth / permission | Validation | Response | Status |
|---|---|---|---|---|---|---|
| POST | `/api/auth/check-username` | Check whether a username is available | None; public | `username` required | `{ success, available }` | Implemented |
| GET | `/api/auth/role` | Verify Firebase ID token and return the MongoDB role | **Firebase ID token verified** via `Authorization: Bearer` | Token must be valid; user must exist and have a role | `{ success, role, uid, ... }` | Implemented |
| POST | `/api/auth/sync-user` | Create/update the MongoDB user document after Firebase signup | None; trusts `uid` and `email` | `uid`, `email` required | `{ success, user, message }` | Implemented – risk (identity spoofing; no token check) |
| POST | `/api/auth/validate-invitation` | Validate an invitation/referral code before signup | None; public | `code` required; code must exist, be active, and unused unless reusable | `{ success, message, invitation? }` | Implemented |

**Notes**
- Phase 2 added a shared helper (`lib/apiAuth.js`) with `getBearerToken`, `requireFirebaseAuth`, and `requireAdminUser`; `/api/auth/role` now consumes it.
- `auth/role` remains the only handler currently wired to server-side token verification; enforcement across other handlers is pending Phase 2 task 2.3/2.4.
- `sync-user` is the account-creation path; it can create a user document for any supplied `uid`/`email`.
- `validate-invitation` does not consume the code; consumption happens later during sync/signup.

---

## 2. User APIs (24 handlers)

| Method | Endpoint | Purpose | Auth / permission | Validation | Response | Status |
|---|---|---|---|---|---|---|
| GET | `/api/user/dashboard` | Dashboard aggregate: user, balances, task set progress, current tasks | None; trusts `uid` query | `uid` required | `{ success, user, tasks, taskSet, stats }` | Implemented – risk |
| GET | `/api/user/profile` | Read the user's profile | None; trusts `uid` query | `uid` required; user must exist | `{ success, user }` | Implemented – risk |
| PATCH | `/api/user/profile` | Update display name, username, phone, etc. | None; trusts `uid` in body | `uid` required; username uniqueness checked | `{ success, message, user? }` | Implemented – risk |
| DELETE | `/api/user/profile` | Self-delete account and selected related records | None; trusts `uid` in body | `uid` required; user must exist | `{ success, message }` | Partial – cascade incomplete |
| POST | `/api/user/profile/avatar` | Upload/update profile avatar | None; trusts `uid` form field | File and `uid` required; image type/size checked | `{ success, url/user }` | Implemented – risk |
| GET | `/api/user/balance-logs` | Paginated balance ledger for the user | None; trusts `uid` query | `uid` required | `{ success, logs, total, ... }` | Implemented – risk |
| GET | `/api/user/balance-logs/export` | Export balance ledger | None; trusts `uid` query | `uid` required | CSV/JSON download | Implemented – risk |
| GET | `/api/user/records` | Task/combined-task history, including frozen pending records | None; trusts `uid` query | `uid` required | `{ success, records }` | Implemented |
| GET | `/api/user/referral` | Referral summary: code, invited users, earnings | None; trusts `uid` query | `uid` required; user must exist | `{ success, referralCode, referrals, stats }` | Implemented – risk |
| POST | `/api/user/referral/generate-code` | Generate a unique referral code for the user | None; trusts `uid` in body | `uid` required; retries on collision; one code per user | `{ success, code }` | Implemented – risk |
| POST | `/api/user/deposit` | Submit a deposit request with screenshot | None; trusts `uid`/`email` | `uid`, `email`, `amount`, `screenshot` required; amount must be a finite positive number | `{ success, deposit }` | Implemented – risk (no auth/idempotency; client chooses identity) |
| GET | `/api/user/deposit` | List the user's deposit requests | None; trusts `uid` query | `uid` required | `{ success, deposits }` | Implemented – risk |
| POST | `/api/user/withdrawal` | Submit a withdrawal request | None; trusts `uid`/`email` | Required fields; amount must be a finite positive number; user exists; not demo/frozen; no combo debt; no active task set; sufficient balance | `{ success, withdrawal }` or 4xx | Implemented – risk |
| GET | `/api/user/withdrawal` | List the user's withdrawal requests | None; trusts `uid` query | `uid` required | `{ success, withdrawals }` | Implemented – risk |
| GET | `/api/user/ad-accounts` | List assigned ad accounts and summary totals | None; trusts `uid` query | `uid` required | `{ success, adAccounts, summary }` | Implemented – risk |
| POST | `/api/user/ad-accounts` | Create an ad account record for the user | None; trusts `uid` in body | `uid` required | `{ success, adAccount }` | Implemented – risk (user can self-create account records) |
| POST | `/api/user/tasks/auto-assign` | Assign the next available task group and create a task set | None; trusts `uid` in body | `uid` required; user exists; daily set limit; group/template availability | `{ success, assigned, groupName, createdCount, hasComboTask, comboPosition }` | Implemented – risk |
| POST | `/api/user/tasks/cancel` | Cancel a pending assigned task | Phase 2 task 2.4 third slice: Firebase token verified and `uid` bound to token subject; task assignee check retained | Task exists; assignee matches; pending only; combo guards; holds amount if required | `{ success, message }` | Implemented – risk (transactions remain; pending-only and hold logic intact) |
| POST | `/api/user/tasks/complete` | Submit/complete a normal task and credit profit | Phase 2 task 2.4 first slice: Firebase token verified and `uid` bound to token subject; task assignee check retained | Task exists; assignee matches; not already completed/cancelled; combo-order ordering; rating required when configured | `{ success, message, profit, ... }` | Implemented – risk (transactions remain; status transition now guarded atomically) |
| GET | `/api/user/tasks/combo` | Load the active or position-specific combined task with balance context | None; trusts `uid` query | `uid` required; optional `setNumber`, `position` | `{ success, combo }` | Implemented |
| POST | `/api/user/tasks/combo/start-order` | Start the current combined-task order; freeze required balance | None; trusts `uid`/`comboId` | Both required; ownership checked in model; sufficient balance | `{ success, order, orderIndex }` or 200 with `insufficientBalance` | Implemented – risk |
| POST | `/api/user/tasks/combo/complete-order` | Complete the current combined-task order and credit commission when all orders finish | Phase 2 task 2.4 second slice: Firebase token verified and `uid` bound to token subject; task/combo ownership checks remain in model | Both required; ordering and balance checks in model; daily set limit checked at final step | `{ success, allComplete, commission?, ... }` | Implemented – risk (transactions remain; status and commission claims now atomic) |
| POST | `/api/user/tasks/combo/cancel` | Refuse cancellation of a combined task | None | None | `{ success: false, message }`, HTTP 403 | Stub / refusal (deliberate) |
| POST | `/api/user/tasks/sync-combo` | Apply per-user combo configuration to the user's combo state | None; trusts `uid` in body | `uid` required | `{ success, ...result }` | Implemented – risk |

**Notes**
- `records` correctly distinguishes normal tasks, frozen tasks, and combined tasks, and hides combined tasks that have not appeared yet.
- `complete-order` marks absorbed normal positions as completed with a bulk update, so progress cannot deadlock; this is also a mutation that cannot be rolled back if a later step fails.
- `auto-assign` reuses groups when all have been assigned; it slices templates to the VIP task count and may replace one position with a combined task.
- `withdrawal` enforces business states in code (demo/frozen, debt, active set), which conflicts with some clauses in the supplied Terms & Conditions text.

---

## 3. Admin APIs (50 handlers)

### 3.1 Users, balances, demo accounts

| Method | Endpoint | Purpose | Auth / permission | Validation | Response | Status |
|---|---|---|---|---|---|---|
| GET | `/api/admin/users` | Search/list users with pagination | None; no admin role check | Optional `search`, `page`, `limit` | `{ success, users, total, ... }` | Implemented – risk |
| POST | `/api/admin/users` | Create a demo/training account from an original user | None; trusts `uid`/`password` | `uid` and `password` required; original user must exist | `{ success, message, user }` | Implemented – risk |
| PATCH | `/api/admin/users` | Update user fields, including `availableBalance`, `freezeThreshold`, demo profit share | Phase 2 task 2.3 enforcement slice: Firebase token verified + admin role required; still uses caller-supplied `approverUid` for audit metadata | Numeric checks for balance/freeze/profit fields | `{ success, user }` | Implemented – risk (full admin enforcement and verified audit identity remain); Phase 2 added ledger-backed before/after balance log for `availableBalance` changes |
| DELETE | `/api/admin/users` | Delete a user and related records | Phase 2 task 2.3 enforcement slice: Firebase token verified + admin role required | `uid` required | `{ success, message }` | Partial – cascade incomplete; Phase 2 replaced ad-hoc deletes with shared cleanup helper (tasks, task sets, combos, groups, VIPs, records, balances, notifications, deposits, withdrawals, messages, invitations, unassigned ad accounts) |
| POST | `/api/admin/users/balance` | Add or deduct balance with a balance log and optional WhatsApp notice | Phase 2 task 2.3 slice: Firebase token verified + admin role required; still uses caller-supplied `approverUid` for audit metadata | `uid`, `action` (`add`/`deduct`), amount > 0; deduct cannot exceed balance | `{ success, balanceBefore, balanceAfter, message }` | Implemented – risk (full admin enforcement and verified audit identity remain) |
| POST | `/api/admin/users/change-password` | Set a user's Firebase password | None; trusts `uid` | `uid`, `newPassword` >= 6 chars | `{ success, message }` | Implemented – risk |

### 3.2 Deposits and withdrawals

| Method | Endpoint | Purpose | Auth / permission | Validation | Response | Status |
|---|---|---|---|---|---|---|
| GET | `/api/admin/deposits` | List deposits by status with pagination | None; no role check | Optional `status`, `page`, `limit` | `{ success, deposits, total, ... }` | Implemented – risk |
| PATCH | `/api/admin/deposits` | Approve/reject a deposit; credit balance, clear combo debt, release frozen balance, log, notify | Phase 2 task 2.3 enforcement slice: Firebase token verified + admin role required; still uses caller-supplied `approverUid` | `depositId`, `status` in `approved`/`rejected`; deposit and user must exist | `{ success, deposit }` | Implemented – **risk**: auth/audit/transactions remain; deposit approval is now admin-enforced and idempotency-guarded. |
| GET | `/api/admin/withdrawals` | List all withdrawals, optionally filtered by status | None; no role check | Optional `status` | `{ success, withdrawals }` | Implemented – risk |
| PATCH | `/api/admin/withdrawals` | Approve/reject a withdrawal; debit balance, log, notify | Phase 2 task 2.3 enforcement slice: Firebase token verified + admin role required; still uses caller-supplied `approverUid` | IDs/status required; user exists; not demo/frozen; sufficient balance | `{ success, withdrawal }` | Implemented – **risk**: auth/audit/transactions remain; withdrawal approval is now admin-enforced and idempotency-guarded. |

### 3.3 Tasks, task groups, task sets

| Method | Endpoint | Purpose | Auth / permission | Validation | Response | Status |
|---|---|---|---|---|---|---|
| GET | `/api/admin/tasks` | List/search task templates or assigned tasks with filters | None; no role check | Optional `assigneeUid`, `filterType`, `filterGroupId`, `page`, `limit` | `{ success, tasks, total, ... }` | Implemented |
| POST | `/api/admin/tasks` | Create a task template; computes profit at 0.5% of amount | None; no role check | `appName`, `totalAmount` required; normalises `submissionConfig` | `{ success, message, task }` | Implemented |
| PUT | `/api/admin/tasks/[id]` | Edit a task template | None; no role check | `appName`, `totalAmount` required | `{ success, message, task }` | Implemented |
| DELETE | `/api/admin/tasks/[id]` | Delete a task template | None; no role check | Task must exist | `{ success, message, taskGroupId }` | Implemented – risk (does not clean child assignments) |
| POST | `/api/admin/tasks/assign` | Clone selected templates to a user | None; no role check | `taskIds`, `assigneeUid`; VIP max; duplicate detection | `{ success, tasks, createdCount, duplicates }` | Implemented – risk (uses generated amounts, ignores template `totalAmount`) |
| GET | `/api/admin/task-groups` | List task groups with task counts | None; no role check | None | `{ success, groups }` | Implemented |
| POST | `/api/admin/task-groups` | Create a task group | None; no role check | `name` required | `{ success, message, group }` | Implemented |
| POST | `/api/admin/task-groups/assign` | Assign a group to a user; creates a new set with exactly VIP-count tasks | Phase 2 task 2.3 enforcement slice: Firebase token verified + admin role required | `groupId`, `assigneeUid`; group/templates exist; group has enough templates; duplicate in-progress check; daily group limit = 3 unless `force` | `{ success, tasks, createdCount, ... }` or 200 with `needsConfirmation` | Implemented – risk (hardcoded limit; multiple writes non-atomic) |
| GET | `/api/admin/task-sets` | List a user's tasks, optionally by set | None; no role check | `uid` required | `{ success, tasks }` | Implemented |
| POST | `/api/admin/task-sets` | Create a task set from supplied task descriptors | None; no role check | `uid`, non-empty `tasks`; count must equal VIP `tasksPerSet` | `{ success, message, taskCount }` | Implemented – risk |
| GET | `/api/admin/task-sets/progress` | Task-set progress plus daily-limit status | None; no role check | `uid` required | `{ success, taskSets, dailyLimit }` | Implemented |

### 3.4 Combined-task configuration

| Method | Endpoint | Purpose | Auth / permission | Validation | Response | Status |
|---|---|---|---|---|---|---|
| GET | `/api/admin/combo-config` | Read the global combined-task configuration | None; no role check | None | `{ success, config }` | Implemented |
| POST | `/api/admin/combo-config` | Replace/update the global combined-task configuration | None; no role check | Passed through to `updateComboConfig` (model-level checks only) | `{ success, message, config }` | Implemented – risk |
| GET | `/api/admin/combo-config/users` | List users with combo stage, current group, active combo, and per-user overrides | None; no role check | Optional `search`, `page`, `limit` | `{ success, users, total, ... }` | Implemented |
| GET | `/api/admin/combo-config/user` | Read one user's combo settings/state and diagnostics | None; trusts `uid` query | `uid` required; user must exist | `{ success, ... }` | Implemented – risk |
| POST | `/api/admin/combo-config/user` | Save per-user combo overrides | None; trusts `uid` | `uid`, `settings` required | `{ success, message }` | Implemented – risk |
| DELETE | `/api/admin/combo-config/user` | Remove per-user combo overrides | None; trusts `uid` query | `uid` required | `{ success, message }` | Implemented – risk |

### 3.5 VIP management

| Method | Endpoint | Purpose | Auth / permission | Validation | Response | Status |
|---|---|---|---|---|---|---|
| GET | `/api/admin/vip/requests` | List VIP upgrade requests by status with search/pagination | None; no role check | `status` defaults to `pending`; page/limit bounded | `{ success, requests, total, ... }` | Implemented |
| POST | `/api/admin/vip/requests/[id]` | Approve or reject a VIP request | None; trusts `adminUid` | `action` must be `approve` or `reject`; request must exist | `{ success, request }` | Implemented – risk (no role check, no transaction) |
| GET | `/api/admin/vip/users` | List users with VIP fields | None; no role check | Optional `search`, `page`, `limit` | `{ success, users, total, ... }` | Implemented |
| POST | `/api/admin/vip/users/[uid]` | Set/adjust a user's VIP level and record history | None; trusts `adminUid` | `level` >= 1; action passed through | `{ success, ...result }` | Implemented – risk (source of truth for tier values is contested) |

### 3.6 Ad accounts and Meta integration

| Method | Endpoint | Purpose | Auth / permission | Validation | Response | Status |
|---|---|---|---|---|---|---|
| GET | `/api/admin/ad-accounts` | List ad accounts | None; no role check | Optional query filters | `{ success, adAccounts }` | Implemented |
| POST | `/api/admin/ad-accounts` | Create an ad account | None; no role check | Model-level required fields | `{ success, adAccount }` | Implemented |
| PATCH | `/api/admin/ad-accounts` | Update an ad account | None; no role check | `_id` required | `{ success, adAccount }` | Implemented |
| DELETE | `/api/admin/ad-accounts` | Delete an ad account | None; no role check | `id` required | `{ success, message }` | Implemented |
| POST | `/api/admin/ad-accounts/assign` | Assign one or more ad accounts to a user | None; trusts `assignedBy` | `accountIds`, `uid`, `assignedBy`; user must exist | `{ success, assigned, errors, adAccounts }` | Implemented – risk |
| DELETE | `/api/admin/ad-accounts/assign` | Unassign an ad account | None; no role check | `accountId` query required | `{ success, adAccount }` | Implemented |
| GET | `/api/admin/meta-api` | Read Meta API settings with secrets masked | None; no role check | None | `{ success, settings }` | Implemented – risk |
| PUT | `/api/admin/meta-api` | Update Meta API settings and optionally test the connection | None; no role check | Partial updates accepted; no schema validation | `{ success, settings, connectionTest? }` | Implemented – risk |
| POST | `/api/admin/meta-api/sync` | Fetch Meta ad accounts, sync spend, or test connection | None; no role check | `action` in `fetch-accounts`/`sync-spend`/`test-connection` | `{ success, ... }` | Implemented |
| GET | `/api/admin/meta-api/sync` | List cached Meta accounts or sync logs | None; no role check | `type` in `meta-accounts`/`logs` | `{ success, accounts/logs }` | Implemented |

### 3.7 Referral/invitation codes, reports, WhatsApp, notifications

| Method | Endpoint | Purpose | Auth / permission | Validation | Response | Status |
|---|---|---|---|---|---|---|
| GET | `/api/admin/invitations` | List the 100 most recent invitation codes | None; no role check | None | `{ success, invitations }` | Implemented |
| POST | `/api/admin/invitations` | Generate an invitation/referral code for a user or campaign | None; trusts `createdByUid` | Reuses an existing active code; generates a unique 8-char code | `{ success, invitation, message }` | Implemented – risk |
| GET | `/api/admin/reports` | Overview, financial, user-activity, or ad-spend report | None; no role check | `type` in `overview`/`financial`/`users`/`ad-spend`; optional dates/period | `{ success, data }` | Implemented |
| GET | `/api/admin/reports/export` | Export a report as CSV or PDF-printable HTML | None; no role check | `type` in `financial`/`users`/`ad-spend`; `format` in `csv`/`pdf` | File download | Implemented |
| GET | `/api/admin/notifications/counts` | Sidebar counts: pending deposits, unread messages, pending VIP requests | None; no role check | None | `{ success, pendingDeposits, unreadMessages, pendingVipRequests }` | Implemented |
| GET | `/api/admin/whatsapp` | Read WhatsApp settings with token masked | None; no role check | None | `{ success, settings }` | Implemented – risk |
| PUT | `/api/admin/whatsapp` | Update WhatsApp settings and notification toggles | None; no role check | Partial updates accepted | `{ success, settings }` | Implemented – risk |
| GET | `/api/admin/whatsapp/logs` | List WhatsApp notification logs | None; no role check | None | `{ success, logs }` | Implemented |
| POST | `/api/admin/whatsapp/test` | Send a test WhatsApp message | None; no role check | `phone`, `message` required | `{ success, ...result }` | Implemented – risk (open message-send endpoint) |

---

## 4. Chat APIs (6 handlers)

| Method | Endpoint | Purpose | Auth / permission | Validation | Response | Status |
|---|---|---|---|---|---|---|
| GET | `/api/chat/conversations` | List all support conversations for the admin inbox | None; no admin role check | None | `{ success, conversations }` | Implemented – risk |
| GET | `/api/chat/messages` | Fetch messages for a conversation, or messages after an ID | None; any `conversationId` can be read | `conversationId` required; `afterId` optional; `limit` | `{ success, messages }` | Implemented – risk (no membership check) |
| POST | `/api/chat/messages` | Send a message, create notifications, publish realtime events | None; trusts `senderUid` and `senderRole` | `conversationId`, `senderUid`, `senderRole`; message or image required | `{ success, message }`, HTTP 201 | Implemented – risk (role spoofable) |
| PUT | `/api/chat/read` | Mark a conversation as read for a user | None; trusts `byUid` | `conversationId`, `byUid` required | `{ success, ... }` | Implemented – risk |
| GET | `/api/chat/unread-count` | Unread chat count for a user | None; trusts `uid` query | `uid` required | `{ success, count }` | Implemented – risk |
| POST | `/api/chat/upload-image` | Upload a chat image to storage | None; trusts `uid` form field | File and `uid`; JPG/JPEG/PNG/WEBP; max 5 MB | `{ success, url }` | Implemented – risk |

**Notes**
- `conversationId` is the customer's `uid`; admins can read all conversations and users can read any conversation ID they know.
- `senderRole` is accepted from the client, so a user can post as `admin` and trigger admin-style notifications.
- Realtime fan-out is best-effort and never blocks the response.

---

## 5. Notification APIs (4 handlers)

| Method | Endpoint | Purpose | Auth / permission | Validation | Response | Status |
|---|---|---|---|---|---|---|
| GET | `/api/notifications` | List a user's notifications with pagination | None; trusts `uid` query | `uid` required | `{ success, notifications, total, ... }` | Implemented – risk |
| POST | `/api/notifications` | Create a notification for a user | None; trusts body `uid` | `uid`, `type`, `title`, `message` required | `{ success, notification }`, HTTP 201 | Implemented – risk (anyone can notify anyone) |
| PATCH | `/api/notifications/mark-read` | Mark selected notifications, or all, as read | None; trusts `uid` in body | `uid`; if `all` is false, `ids` required | `{ success, message }` | Implemented – risk |
| GET | `/api/notifications/unread-count` | Unread notification count | None; trusts `uid` query | `uid` required | `{ success, count }` | Implemented – risk |

---

## 6. Realtime API (1 handler)

| Method | Endpoint | Purpose | Auth / permission | Validation | Response | Status |
|---|---|---|---|---|---|---|
| GET | `/api/realtime/stream` | Server-Sent Events stream for chat messages, notifications, and sidebar counts | None; `role` and `uid` come from the query string | `role=admin` enables admin streams; `uid` enables user streams; no identity proof | `text/event-stream`; events `connected`, `counts`, `chat-message`, `notification`; 3-second polling fallback + heartbeat | Implemented – risk (any caller can request `role=admin` and receive admin events) |

---

## 7. Endpoint-level issue index

| Severity | Endpoint(s) | Issue |
|---|---|---|
| Critical | All admin routes | No server-side admin authorization; open to any caller |
| Critical | `/api/realtime/stream` | `role=admin` grants the admin event stream without authentication |
| Critical | `/api/chat/messages` (POST), `/api/notifications` (POST) | Sender/recipient and role are fully client-controlled |
| High | `/api/admin/deposits` (PATCH) | Duplicate approval can credit the balance again; `roundCurrency` is not imported |
| High | `/api/admin/withdrawals` (PATCH) | Duplicate approval can debit the balance again |
| High | `/api/user/tasks/complete` (POST) | Non-atomic, replayable profit credit |
| High | `/api/user/tasks/combo/complete-order` (POST) | Non-atomic commission credit and progress mutation |
| High | `/api/admin/users` (PATCH) | Direct `availableBalance` overwrite without a balance log |
| High | `/api/user/profile` (DELETE), `/api/admin/users` (DELETE) | Incomplete cascades leave orphaned financial/task records |
| Medium | `/api/admin/tasks/assign` (POST) | Ignores template `totalAmount`, generates a new amount per assignment |
| Medium | `/api/admin/task-groups/assign` (POST) | Hardcoded daily limit of 3; non-atomic multi-write assignment |
| Medium | `/api/user/tasks/auto-assign` (POST) | Hardcoded daily set limit of 3; group slicing depends on template order |
| Medium | `/api/admin/meta-api`, `/api/admin/whatsapp`, `/api/admin/whatsapp/test` | Secret-management and outbound-message endpoints are unauthenticated |
| Medium | All list endpoints | No rate limiting and, for some, no pagination |
| Low | `/api/user/tasks/combo/cancel` | Deliberate refusal endpoint; clients must handle HTTP 403 as a normal state |

---

## 8. Implementation status summary

| Area | Handlers | Summary |
|---|---:|---|
| Auth/onboarding | 4 | Functional; only `role` is token-verified. |
| User | 24 | All main flows exist; identity and financial integrity are the main gaps. |
| Admin – users/balances | 6 | Functional; audit and cascade gaps. |
| Admin – deposits/withdrawals | 4 | Functional; duplicate-execution risk. |
| Admin – tasks/sets/groups | 12 | Functional; assignment and daily-limit logic is hardcoded. |
| Admin – combo config | 6 | Functional; no validation of configuration values against the spec. |
| Admin – VIP | 4 | Functional; tier values are contested by the supplied terms. |
| Admin – ad accounts/Meta | 10 | Functional; credentials and sync endpoints are unauthenticated. |
| Admin – invitations/reports/WhatsApp/notifications | 9 | Functional; some lists unbounded and secrets open. |
| Chat | 6 | Functional; no membership or role verification. |
| Notifications | 4 | Functional; recipient is caller-controlled. |
| Realtime | 1 | Functional; admin stream is caller-selected. |
| **Total** | **89** | |

## 9. Phase 1 conclusion for APIs

- Every endpoint listed above exists in the codebase and is reachable.
- There are **no placeholder routes** except `combo/cancel`, which is intentionally a refusal.
- The API surface is functionally broad but **not production-safe**: authentication, authorization, idempotency, and transactional integrity are the four systemic gaps that later phases must address before adding new features.
- No API contract, route, or schema was changed in Phase 1.
