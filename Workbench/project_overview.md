# Saffron Edge – Project Overview (Phase 1)

> **Status:** Phase 1 analysis complete. This document describes the project **as it exists today**. No application code, database records, or configurations were changed during Phase 1.
>
> **Analysis date:** 2026-11-05
>
> **Authoritative requirements:** `Workbench/Master Development Requirements.txt`
>
> **Referenced Terms & Conditions file:** `Workbench/Terms & Conditions.txt` (see the source-of-truth conflict in `terms_conditions_analysis.md`).

---

## 1. Purpose and Scope

Saffron Edge is a Next.js application that combines:

1. A public marketing-agency website (home, services, case studies, resources, about, contact, testimonials, privacy policy, terms page).
2. A user Workbench dashboard for task-based work, balances, deposits, withdrawals, referrals, chat, ad accounts, and VIP levels.
3. An admin dashboard for user, task, finance, VIP, combo-task, ad-account, WhatsApp, and report management.

The current development programme covers backend optimization, account management and audit logs, multiple combined-task positions, homepage language selection, centralized VIP configuration, and a versioned Terms & Conditions acceptance system.

---

## 2. Technology Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Framework | Next.js App Router | `16.2.6` |
| UI | React | `19.2.4` |
| Styling | Tailwind CSS | v4 via `@tailwindcss/postcss` |
| Animation | framer-motion | `12.38.0` |
| Icons | lucide-react | `1.16.0` |
| Alerts | sweetalert2 | `11.26.24` |
| Database | MongoDB Node driver | `7.2.0`, database name from `MONGODB_DB_NAME` (default `saffron`) |
| Client auth | Firebase Web SDK | `12.13.0` |
| Server auth/admin | Firebase Admin SDK | `14.2.0` |
| Runtime | Node.js / Next server | `next dev`, `next build --webpack`, `next start` |

A custom `server.js` exists but the `package.json` scripts use the standard Next.js server, so `server.js` is not part of the active start path.

Important environment variables referenced by the code (values are not reproduced here):

- `MONGODB_URI`
- `MONGODB_DB_NAME` (optional, defaults to `saffron`)
- `NEXT_PUBLIC_FIREBASE_API_KEY` and other `NEXT_PUBLIC_FIREBASE_*` client settings
- Firebase Admin service-account variables consumed by `lib/firebaseAdmin.js`
- Meta API and WhatsApp configuration values consumed by their respective services

---

## 3. Repository Structure

```text
app/
  (site)/                 Public marketing site, login, signup, terms page
  (admin)/admin/          Admin dashboard (client-guarded)
  user-dashboard/         User Workbench dashboard (client-guarded)
  api/                    Next.js Route Handlers (backend)
  Component/              Shared site, auth, chat, notification components
components/               Site-wide components (maintenance popup)
lib/                      MongoDB models, Firebase, task/VIP/finance services
public/                   Static assets
scripts/                  Utility scripts
Workbench/                Requirements and Phase 1 documentation
```

---

## 4. Frontend Architecture

### 4.1 Public site

- `app/(site)/layout.js` wraps public pages with the site layout.
- `app/(site)/page.js` renders the marketing home page.
- `app/page.js` at the root handles post-login routing based on the Firebase user and role.
- Public pages include home, services, service detail, case studies, resources, about us, contact, testimonials, privacy policy, and terms & conditions.
- Public pages have **no language selector**. Localization exists only inside the user dashboard (see §4.4).

### 4.2 Authentication UI

- `app/Component/Auth/AuthProvider.jsx` subscribes to Firebase `onAuthStateChanged` and exposes `{ user, loading, logout }`.
- `app/Component/Auth/SignUpForm.jsx` performs Firebase client registration (`createUserWithEmailAndPassword`), username and invitation validation, then calls `POST /api/auth/sync-user`.
- `app/Component/Auth/getAuthorizedRole.js` sends the Firebase ID token to `GET /api/auth/role` and returns the MongoDB role.
- `app/Component/Auth/getDashboardPath.js` maps roles to dashboard paths.
- `app/(site)/login/page.jsx` and the legacy-named `app/(site)/login..lasdfhpasdhg/page.jsx` provide login screens.
- Registration includes an `agreeToTerms` checkbox, but acceptance is validated **only in the browser**. The checkbox is not persisted and no version is recorded.

### 4.3 Admin dashboard

- Route group: `app/(admin)/admin/`.
- `app/(admin)/admin/layout.js` is a client component. It verifies the role through `/api/auth/role`, redirects non-admins to `/`, and renders the admin shell.
- Admin pages: overview, user management, task management, combo settings, VIP levels, deposits ("Fund Verification"), withdrawals, balance logs, referrals, live chat, reports, ad accounts, Meta API, and WhatsApp.
- Role protection is **client-side only**. The backend admin routes do not verify the caller's Firebase token or role (see `backend_analysis.md`).

### 4.4 User dashboard

- Route group: `app/user-dashboard/`.
- `app/user-dashboard/layout.js` wraps pages in `AuthProvider`; `ClientLayout.js` verifies the Firebase user and role, redirects admins to `/admin`, and renders the shell.
- Pages: dashboard, tasks, deposits, payments, withdrawals, balance, balance history, records, referrals, profile, ad account, and chat.
- `LanguageContext.jsx` provides EN/FR/ES and persists the choice in `localStorage` under `saffron-edge-lang`.
- `translations.js` currently covers only dashboard navigation/shell strings, not page content, task data, terms, or the public site.

### 4.5 Terms & Conditions UI

- `app/(site)/terms-conditions/page.jsx` is a client component that requires a Firebase user and redirects unauthenticated visitors to `/`.
- Policy text is **hardcoded** in the frontend as eleven sections (Car Optimization, Withdrawal, Funds, Account Security, Orders, Car Packs, Top-up, Car Ordering System, Invitation, Operation Time, Credit Value).
- There is no version identifier, effective date, acceptance checkbox, acceptance record, admin editor, version history, or audit log.

---

## 5. Backend Architecture

### 5.1 Route handlers

The backend is implemented as Next.js App Router Route Handlers under `app/api/**/route.js`. There are **89 exported HTTP handlers** across 59 route files.

Response shape is generally:

```json
{ "success": true, "...": "..." }
```

or:

```json
{ "success": false, "message": "..." }
```

Most routes wrap their logic in `try/catch` and return HTTP 400/401/403/404/500 with a `message`.

### 5.2 Database access

- `lib/mongodb.js` creates a single `MongoClient` promise, cached on `global._mongoClientPromise`.
- Connection options: `serverSelectionTimeoutMS: 15000`, `connectTimeoutMS: 10000`, `maxPoolSize: 10`.
- Database name: `process.env.MONGODB_DB_NAME || "saffron"`.
- A startup `createIndexes()` call creates indexes on:
  - `deposits.status`
  - `messages.readAt`
  - `messages.senderRole + readAt`
  - `messages.conversationId + readAt`
- `lib/userModel.js` additionally creates a unique sparse index on `users.username`.

No MongoDB transactions are used anywhere in the codebase. Financial and task operations are sequences of independent writes.

### 5.3 Service/model layer

| File | Responsibility |
|---|---|
| `lib/userModel.js` | User lookup/sync, welcome bonus, training account creation, freeze/unfreeze, credit/debit, withdrawal eligibility |
| `lib/taskModel.js` | Task financial profiles, combination positions, reward multipliers |
| `lib/taskSetModel.js` | Task set initialization/progress, rolling 24-hour set limit (`DAILY_SET_LIMIT = 3`) |
| `lib/comboTaskModel.js` | Combined-task config, order generation, freeze/commission/debt logic, per-user combo settings |
| `lib/vipModel.js` | Hardcoded VIP thresholds, eligibility requests, approval/rejection, manual VIP assignment |
| `lib/depositModel.js` | Deposit creation and status updates |
| `lib/withdrawalModel.js` | Withdrawal creation and status updates |
| `lib/balanceLog.js` | Balance log creation/query |
| `lib/notificationModel.js` | In-app notifications |
| `lib/chatModel.js` | Chat conversations/messages/unread counts |
| `lib/adAccountModel.js` | Ad account CRUD/assignment |
| `lib/metaApiService.js` | Meta Marketing API connection, accounts, insights, spend caps |
| `lib/metaSettingsModel.js` | Meta settings, synced accounts, sync logs |
| `lib/reportService.js` | Overview, financial, user activity, and ad-spend reports |
| `lib/whatsappService.js` | WhatsApp notifications |
| `lib/whatsappSettingsModel.js` | WhatsApp settings and notification logs |
| `lib/realtimeHub.js` | In-process pub/sub for SSE realtime events |
| `lib/firebaseAdmin.js` | Firebase Admin app/auth initialization |

---

## 6. Database Collections

Observed collection names across `app/` and `lib/`:

| Collection | Purpose | Key fields observed |
|---|---|---|
| `users` | User accounts and balances | `uid`, `authUid`, `email`, `displayName`, `username`, `role`, `accountType`, `accountStatus`, `availableBalance`, `frozenBalance`, `totalEarned`, `vipLevel`, `vipProfitIncrease`, `vipTasksPerSet`, `vipNotifiedLevel`, `inviterUid`, `invitationCode`, `referralCode`, `comboDebt`, `comboStage`, `firstTaskStarted`, `welcomeBonusReceived`, `freezeReason`, `freezeThreshold` |
| `tasks` | Templates and assigned tasks | `appName`, `totalAmount`, `profit`, `reward`, `earnedAmount`, `status`, `assigneeUid`, `position`, `setNumber`, `isTemplate`, `taskGroupId`, `parentTaskGroupId`, `taskType`, `isComboTask`, `comboId`, `frozenAmount`, `submissionConfig`, `feedback`, `ratingOption`, `combinationPositions` |
| `taskGroups` | Admin-created task groups | `name`, `description`, `createdAt` |
| `userTaskSets` | Per-user set progress | `uid`, `setNumber`, `currentPosition`, `completedTasks`, `totalTasks`, `status`, `completedAt` |
| `comboTasks` | Combined-task instances | `uid`, `setNumber`, `position`, `status`, `orders[]`, `currentOrderIndex`, `commissionPercent`, `totalRequiredAmount`, `totalCommission`, `frozenAmount`, `balanceFrozen`, `debtCreated`, `comboStage` |
| `comboConfig` | Global combo configuration | `_id: "global"`, `enabled`, `probability`, `minOrders`, `maxOrders`, `positions`, `firstComboMin/Max`, `secondComboMin/Max`, `profitThreshold`, `daysUntilFirstCombo`, `targetNegativeBalance`, `userComboSettings`, `userPositionOverrides` |
| `groupAssignments` | Audit of admin group assignments | `groupId`, `groupName`, `assigneeUid`, `assignedBy`, `createdAt` |
| `deposits` | Deposit requests | `uid`, `email`, `amount`, `screenshot`, `status`, `approvedAt`, `rejectedAt`, `rejectionReason`, `approverUid` |
| `withdrawals` | Withdrawal requests | `uid`, `email`, `walletAddress`, `network`, `amount`, `status`, `approvedAt`, `rejectedAt`, `approverUid` |
| `balanceLogs` | Financial audit trail | `uid`, `email`, `type`, `amount`, `balanceBefore`, `balanceAfter`, `description`, `referenceId`, `referenceType`, `metadata` |
| `notifications` | In-app notifications | `uid` or `recipient`, `type`, `title`, `message`, `isRead`, `metadata` |
| `messages` | Live chat messages | `conversationId`, `senderUid`, `senderRole`, `message`, `imageUrl`, `readAt` |
| `adAccounts` | Meta ad accounts | `uid`, `email`, `name`, `accountId`, `metaAccountId`, `budget`, `spent`, `status`, `lastSyncedAt` |
| `invitationCodes` | Referral/invitation codes | `code`, `createdByUid`, `createdByEmail`, `reusable`, `usedByUid`, `usedAt`, `isActive` |
| `vipRequests` | VIP upgrade requests and manual assignment records | `uid`, `fromLevel`, `toLevel`, `status`, `resolvedBy`, `adminNote`, `action` |
| `metaSettings` | Meta API settings | connection and sync configuration |
| `metaAdAccounts` | Synced Meta account cache | account metadata and insights |
| `syncLogs` | Meta sync history | `type`, `status`, `message`, timestamps |
| `whatsappSettings` | WhatsApp notification settings | `enabled`, notification toggles, provider config |
| `notificationLogs` | WhatsApp notification log | recipient, message, status, timestamps |
| `records` | Legacy/auxiliary records collection | referenced only in user-delete cleanup |
| `taskSets` | Legacy task-set collection | referenced only in user-delete cleanup |

No schema validation is implemented at the database level.

---

## 7. Authentication and Authorization

### 7.1 Authentication

- Users authenticate through **Firebase Authentication** (email/password).
- The browser holds the Firebase session; `AuthProvider` exposes the Firebase user.
- The application role is stored in MongoDB `users.role` (`user`, `admin`, `training`, `demo`).
- `GET /api/auth/role` is the **only API route that verifies a Firebase ID token** (`Authorization: Bearer <token>` via `getAdminAuth().verifyIdToken`).
- `POST /api/admin/users/change-password` calls Firebase Admin `updateUser`, but does **not** verify the caller's token or admin role.
- Every other API trusts identity values supplied by the client (`uid`, `email`, `approverUid`, `adminUid`, `role` in the SSE stream, etc.).

### 7.2 Authorization

- Admin UI access is enforced by `app/(admin)/admin/layout.js` calling `/api/auth/role` in the browser.
- User dashboard access is enforced by `app/user-dashboard/ClientLayout.js` calling the same endpoint.
- There is no middleware, server layout guard, or shared `requireAdmin` helper.
- Admin API routes therefore have **no server-side role enforcement**. Anyone who can reach the route can invoke it.

### 7.3 Roles observed

| Role | Meaning |
|---|---|
| `user` | Standard Workbench user |
| `admin` | Admin dashboard access |
| `training` | Auto-created training child account for a main user; role `training` |
| `demo` | Demo account, either created by admin or through an invitation code |

`normalizeRole()` lowercases and defaults to `user`.

---

## 8. Existing User Management

Implemented in admin UI (`app/(admin)/admin/user-management/page.jsx`) with API support:

- List/search users with pagination (`GET /api/admin/users`).
- Create a demo Firebase user and MongoDB record (`POST /api/admin/users`).
- Update role, balance, account status, account type, freeze state, inviter, demo profit share, and referral-code reusability (`PATCH /api/admin/users`).
- Delete user plus selected related data (`DELETE /api/admin/users`).
- Manual balance add/deduct (`POST /api/admin/users/balance`).
- Change Firebase password (`POST /api/admin/users/change-password`).
- Balance audit view (`/admin/balance-logs`, backed by balance-log APIs).

Gaps against the Master requirements:

- No login history collection or API.
- No IP address tracking.
- No general administrative activity/audit log collection.
- Balance can be overwritten directly through `PATCH /api/admin/users` without a balance log.
- User deletion cascades do not cover `userTaskSets`, `comboTasks`, `vipRequests`, `groupAssignments`, `adAccounts`, or `meta*` data.
- No server-side authorization on any of the user-management APIs.

---

## 9. Existing Task Management

### 9.1 Templates and groups

- Admins create task templates and task groups.
- Template tasks have `isTemplate: true` and optional `taskGroupId`.
- Admins assign a group to a user; the assign route clones templates into user tasks with positions and set numbers.
- Admin task creation currently stores `profit = totalAmount * 0.005` (0.5%) regardless of the user's VIP level.

### 9.2 Sets and progress

- Each assigned group becomes a `userTaskSets` record with `setNumber`, `currentPosition`, `completedTasks`, `totalTasks`.
- `lib/taskSetModel.js` supports:
  - `initializeUserTaskSet`
  - `getUserTaskSetProgress`
  - `updateTaskSetProgress`
  - `getNextAvailableTask`
  - `canCompleteTask`
  - `completeTaskInSet`
  - `isSetComplete`
  - `markSetCompletedToday`
  - `getDailyLimitStatus`
- `DAILY_SET_LIMIT = 3` is hardcoded. The limit uses a rolling 24-hour window based on `completedAt`, followed by a 24-hour cooldown.
- The admin group-assignment route has a **separate** hardcoded `DAILY_GROUP_LIMIT = 3`, with a `force` flag to override.

### 9.3 Task completion

`POST /api/user/tasks/complete`:

1. Reads `{ taskId, uid, feedback, ratingOption }` from the request body.
2. Loads the task and checks `task.assigneeUid === uid` (client-supplied `uid`).
3. Rejects already completed/cancelled tasks.
4. Validates required rating/feedback from `submissionConfig`.
5. Rejects frozen/debt states and users who hit the daily set limit.
6. Computes profit as `totalAmount × (vipProfitIncrease / 100)`.
7. Marks the task completed, returns the task's frozen principal to available balance, credits only the profit, writes a balance log, evaluates VIP eligibility, and updates set progress.
8. Credits referral/training share when the completing account is demo/training.

The route does **not** call `canCompleteTask`, so it does not independently enforce sequential task positions. It also performs a read-then-write status change, leaving a concurrent double-completion window.

### 9.4 Freeze/cancel flow

`POST /api/user/tasks/cancel` defaults to "freeze mode": it moves the task amount from available to frozen balance and leaves the task pending. A second call can move the same amount again because the route does not guard on an existing `frozenAmount`. The legacy `mode: "cancel"` permanently deducts the amount.

### 9.5 Combined tasks

- `lib/comboTaskModel.js` implements combined tasks with orders, progression levels, commission, balance freezing, debt creation, and target-negative-balance behavior.
- The global config stores a `positions` array (default `[8, 18, 27]`), but runtime selection uses only the **first** position. Per-user settings can override one position.
- `applyUserComboConfig` deletes extra pending combos so each set has exactly one combo.
- Combined tasks cannot be cancelled by users (`POST /api/user/tasks/combo/cancel` always returns 403).
- Current stage-1/stage-2 eligibility is based on `totalEarned >= profitThreshold` and account age; stage 2 is `comboStage === 2`.
- Required multi-position support (6, 9, 14, 16, 18), independent configurations, configuration versioning, and mid-execution editing are **not implemented**.

---

## 10. Existing VIP Functionality

VIP configuration is hardcoded in `lib/vipModel.js`:

| Level | Unlock balance | Name / label | `profitIncrease` | `tasksPerSet` |
|---|---:|---|---:|---:|
| 1 | 0 | VIP 1 / Bronze | 0.5 | 20 |
| 2 | 1,500 | VIP 2 / Silver | 2 | 25 |
| 3 | 5,000 | VIP 3 / Gold | 6 | 30 |
| 4 | 10,000 | VIP 4 / Diamond | 12 | 40 |

Behavior:

- New users are created with `vipLevel: 1`, `vipProfitIncrease: 0.5`, `vipTasksPerSet: 20`.
- `evaluateVipEligibility(uid)` compares `availableBalance + frozenBalance` against thresholds and creates a pending `vipRequests` document plus an admin notification.
- It never changes the user's VIP level directly; only admin approval (`approveVipRequest`) or manual assignment (`setUserVipLevel`) changes it.
- User tasks read `user.vipTasksPerSet` first, then the hardcoded tier.
- Admin VIP pages display the hardcoded thresholds from the frontend and API.
- VIP changes are recorded in `vipRequests` (`status: "manual"` for manual assignments), but there is no separate immutable VIP-change audit log.

Gaps against the Master requirements:

- No database-driven VIP configuration collection or admin editor for names, descriptions, group limits, profit rates, withdrawal rules, VIP-specific terms, or availability.
- No per-VIP daily group limit enforcement (the admin assignment route uses the fixed value 3; completion uses a fixed 3 sets per rolling 24 hours).
- No VIP-specific Terms & Conditions.
- No effective-time policy for VIP changes.
- Existing values conflict with the Master specification (see `terms_conditions_analysis.md`).

---

## 11. Financial and Withdrawal Logic

### 11.1 Balance fields

- `availableBalance`
- `frozenBalance`
- `totalEarned`
- `comboDebt`

`creditUserBalance` and `debitUserBalance` use atomic `$inc` on a single user document, but the surrounding log/notification/progress writes are separate.

### 11.2 Deposits

- `POST /api/user/deposit` creates a pending deposit with an amount and screenshot.
- Admin `PATCH /api/admin/deposits` approves or rejects.
- Approval can clear `comboDebt`, release frozen balance when debt reaches zero, unblock a waiting combo, credit the balance, evaluate VIP eligibility, write a balance log, and notify the user.
- There is no guard against approving the same deposit twice, so repeated approval can credit twice.
- The route uses `roundCurrency` without importing it in the visible top-of-file imports; if the import is absent, approval with debt would throw a `ReferenceError`. This must be verified in Phase 2 before changing behavior.

### 11.3 Withdrawals

- `POST /api/user/withdrawal` validates required fields, amount > 0, user existence, freeze/demo/debt status, incomplete task sets, and available balance.
- It does **not** reserve or debit the requested amount when the request is created.
- Multiple pending requests can therefore exceed the available balance.
- Admin approval re-checks balance and debits; repeated approval of the same withdrawal can debit twice.
- `canUserWithdraw` blocks frozen accounts, demo/training accounts, and users with `comboDebt > 0`.
- No VIP-specific withdrawal cap, daily request count, fee, minimum, or operating-hours enforcement exists in the backend. The hardcoded terms page mentions such rules but they are not implemented.

### 11.4 Referrals and training/demo accounts

- Every new main user receives a unique referral/invitation code and a `training_<uid>` child account.
- Training accounts start with `$800`, auto-complete 20 training tasks, and share 20% of training profit with the parent.
- Invitation codes create demo accounts (`accountType: "demo"`); admin-created demo accounts also share 20% of profit with the parent.
- Referral commissions are credited during task completion for demo/training accounts.
- A welcome bonus of `$5` is credited on first sync.

### 11.5 Combo debt and freezing

- Combined tasks can drive available balance negative and create `comboDebt`.
- Debt blocks task completion and withdrawal until a deposit clears it.
- Freeze state is represented by `accountStatus: "frozen"`, `isFrozen`, `freezeReason`, `freezeThreshold`, and `freezeContext`.

---

## 12. Notifications, Chat, Realtime, and Integrations

- In-app notifications are stored in `notifications` and read through `/api/notifications*`.
- Admin notification counts are exposed through `/api/admin/notifications/counts`.
- Chat is MongoDB-backed (`messages`) with REST endpoints for conversations, messages, read status, unread counts, and image upload.
- `app/api/realtime/stream` exposes Server-Sent Events using the in-process `lib/realtimeHub.js`. It trusts `uid` and `role` query parameters.
- WhatsApp notifications are optional (`whatsappSettings.enabled`) and cover deposits, withdrawals, task completion, balance pushes, and balance freezes.
- Meta integration supports connection testing, ad-account sync, insights, and spend-cap updates.

---

## 13. Key Frontend Pages

| Area | Path | Purpose |
|---|---|---|
| Public | `/` | Marketing home |
| Public | `/about-us`, `/services`, `/services/[slug]`, `/case-study`, `/resources`, `/contact`, `/testimonials`, `/privacy-policy` | Marketing content |
| Public | `/terms-conditions` | Hardcoded terms page, login required |
| Auth | `/login`, `/login..lasdfhpasdhg` | Login screens |
| User | `/user-dashboard` | User overview |
| User | `/user-dashboard/tasks` | Task execution and combo modal |
| User | `/user-dashboard/deposits`, `/payments` | Funding |
| User | `/user-dashboard/withdrawals` | Withdrawal requests |
| User | `/user-dashboard/balance`, `/balance-history`, `/records` | Balance and transaction history |
| User | `/user-dashboard/referrals` | Referral program |
| User | `/user-dashboard/profile` | Profile, password, account deletion |
| User | `/user-dashboard/ad-account` | Assigned Meta ad accounts |
| User | `/user-dashboard/chat` | Support chat |
| Admin | `/admin` | Admin overview |
| Admin | `/admin/user-management` | User administration |
| Admin | `/admin/task-management` | Templates, groups, assignments |
| Admin | `/admin/combo-settings` | Combined-task configuration and per-user settings |
| Admin | `/admin/vip-levels` | VIP requests and assignments |
| Admin | `/admin/deposits`, `/admin/withdrawals` | Finance approval |
| Admin | `/admin/balance-logs` | Balance audit view |
| Admin | `/admin/reports` | Reports and export |
| Admin | `/admin/ad-accounts`, `/admin/meta-api` | Meta integration |
| Admin | `/admin/whatsapp` | WhatsApp settings/logs |
| Admin | `/admin/referrals`, `/admin/chat` | Referral and support management |

---

## 14. Module Dependencies

```text
Firebase client auth
  └─ /api/auth/sync-user ──► users + invitationCodes + training child + welcome bonus
  └─ /api/auth/role ───────► users.role
       └─ admin/user dashboard client guards

Task assignment
  └─ taskGroups + tasks (templates)
       └─ /api/admin/task-groups/assign ──► tasks + userTaskSets + groupAssignments
       └─ /api/user/tasks/auto-assign ────► tasks + userTaskSets + comboTasks
            └─ vipModel (tasksPerSet / profit rate)
            └─ comboTaskModel (single combo position, freeze, debt)

Task completion
  └─ tasks + userTaskSets + users + balanceLogs + notifications
       └─ vipModel eligibility
       └─ referral/training share

Finance
  └─ deposits ──► admin approval ──► users + balanceLogs + combo debt/freeze + VIP eligibility
  └─ withdrawals ──► admin approval ──► users + balanceLogs
  └─ manual balance adjustment ──► users + balanceLogs
  └─ combo freeze/debt ──► users + comboTasks + balanceLogs

Terms acceptance (planned)
  └─ policies + policy_acceptances + policy_audit_logs
       └─ registration and Workbench access gate
```

---

## 15. Existing Issues Relevant to the Development Programme

1. **Missing authoritative financial terms.** The supplied `Terms & Conditions.txt` is a policy-management implementation brief, not the VIP/financial terms described by the Master requirements. VIP rules cannot be finalized from it.
2. **Three conflicting VIP value sets** exist: Master specification, hardcoded `lib/vipModel.js`, and the hardcoded terms page.
3. **No server-side authorization** on almost all APIs.
4. **No atomic financial transactions**; duplicate approval/completion/freeze paths exist.
5. **No admin audit log or login/IP history.**
6. **Combined tasks support one position per set**, not multiple independent positions.
7. **No versioned Terms & Conditions or backend acceptance record.**
8. **Language support is dashboard-only** and covers only navigation strings.
9. **Lint baseline is failing** (80 errors, 24 warnings on 2026-11-05), including undefined `ArrowUpRight`/`ArrowDownRight` icons in `app/user-dashboard/page.jsx`.
10. **Frontend/backend inconsistencies:** template profit uses 0.5% while completion uses the user's VIP rate; terms page values are not enforced by APIs.

---

## 16. Documentation Set

| File | Purpose |
|---|---|
| `project_overview.md` | This document |
| `backend_analysis.md` | Backend structure, performance, security, data integrity, optimization plan |
| `terms_conditions_analysis.md` | Source-document review, extracted rules, conflicts, mapping |
| `api_status.md` | Inventory of all 89 existing route handlers |
| `todo.md` | Phase-based development checklist with statuses |
| `progress.md` | Chronological Phase 1 report |
