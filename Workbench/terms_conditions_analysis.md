# Saffron Edge – Terms & Conditions Analysis (Phase 1)

> **Status:** Analysis only. No terms page, VIP configuration, task logic, or financial rule was changed.
>
> **Documents reviewed:**
>
> 1. `Workbench/Terms & Conditions.txt` — the file explicitly named by the Master requirements as the primary source of truth.
> 2. `Workbench/Master Development Requirements.txt` — the development specification.
> 3. `app/(site)/terms-conditions/page.jsx` — the terms content currently shown by the application.
> 4. `lib/vipModel.js`, `lib/taskSetModel.js`, `lib/comboTaskModel.js`, `lib/userModel.js`, and the finance/task APIs — the rules currently enforced by code.

---

## 1. Executive Finding

**The supplied `Terms & Conditions.txt` is not a financial Terms & Conditions document.** It is a **developer implementation brief for a policy-management and user-acknowledgement module**. It describes how to build versioned policies, admin publishing, acceptance records, audit logs, and related APIs.

It does **not** contain:

- VIP-1 / VIP-2 / VIP-3 / VIP-4 financial rules.
- Maximum Properties Order Groups per day.
- Tasks per Properties Order Group.
- Declared profit rates.
- Withdrawal limits, fees, minimums, or daily counts.
- Task completion deadlines, credit-score rules, invitation thresholds, or operating hours.
- Any numbered financial clauses that can be extracted as business rules.

Therefore the Master requirements' instruction to extract VIP and financial rules from this file cannot be satisfied. The authoritative financial source is **missing or mis-supplied**. This is a documented blocker, not an assumption to fill in.

The brief does contain **binding safeguards** that must shape the eventual terms system:

> Do not use policy acceptance to confiscate, freeze, or arbitrarily restrict user funds. Do not require additional deposits, top-ups, fees, or credit-score payments to release an existing balance or process a withdrawal. Any restriction must have a valid, disclosed legal or contractual basis, documented reasons, and a support or dispute process.

---

## 2. What the Supplied Terms & Conditions File Actually Requires

The file is a complete implementation brief. Its requirements map directly to the Terms & Conditions system in Master Phase 6.

### 2.1 User-facing experience

| Requirement | Detail |
|---|---|
| Persistent navigation | Terms & Conditions item in Workbench navigation, desktop and mobile |
| Policy overview | Title, version, publication/effective date, last-updated date, full-document link |
| Readable sections | Withdrawals; Funds and Account Balances; Account Security and Confidentiality; Standard Properties Orders; Premium Properties Orders; Account Top-Ups; Properties Promotion System; Invitation and Referral Program; Operating Hours; Credit Score System |
| First-time acknowledgement | Review screen before restricted features if the current version is not acknowledged |
| No blocking of records/support/withdrawal initiation | Declining a new version must not block account records, support, or withdrawal initiation |
| Explicit acceptance | Initially unticked checkbox **plus** a separate "I Agree" action; opening/scrolling is not acceptance |
| Return access | Reopen current policy and retrieve previously acknowledged versions; print/download where practical |
| Change notice | Explain material changes, effective date, and whether renewed acknowledgement is requested; do not retroactively change completed transactions |
| Accessibility | Responsive, readable typography, numbered sections, accessible contrast, keyboard navigation, screen-reader labels; important financial conditions must not be hidden only in collapsed sections |
| Confirmation | Visible confirmation after acceptance and access to the accepted version |

### 2.2 Admin policy management

| Capability | Required behaviour |
|---|---|
| Create policy | New document organized into numbered sections |
| Edit draft | Edit unpublished content without changing the published policy |
| Preview | Preview as users see it on desktop and mobile |
| Review/approval | Draft → review → publish; record who approved publication |
| Publish version | Immutable version with identifier and effective date |
| Version history | Retrieve previous published versions; never overwrite history |
| Acceptance report | Search/export by user, policy version, and date |
| Notifications | Notify affected users when a material update is published |
| Audit log | Who created, edited, approved, published, or archived each policy |

### 2.3 Suggested database structure

**`policies`**

- `id`
- `title`
- `version`
- `status` (`draft` / `review` / `published` / `archived`)
- `content` or structured sections
- `content_hash`
- `created_by`
- `approved_by`
- `created_at`
- `published_at`
- `effective_at`
- `archived_at`

Published versions must be immutable.

**`policy_acceptances`**

- `id`
- `user_id`
- `policy_id` / `version`
- `accepted_at`
- `IP address` where lawful and disclosed
- `user-agent` where appropriate
- `content_hash`
- `acknowledgement_method`

Duplicate/misleading acceptance records must be prevented.

**`policy_audit_logs`**

- `id`
- `admin_user_id`
- `action`
- `policy_id`
- `old_version`
- `new_version`
- `timestamp`
- `reason` / change summary
- request metadata

Ordinary admins must not be able to edit or delete these logs.

### 2.4 Required APIs

| Endpoint | Access | Purpose |
|---|---|---|
| `GET /api/policies/current` | Authenticated user | Current published policy and version |
| `GET /api/policies/{version}` | Authenticated user | Specific published historical version |
| `POST /api/policies/{version}/accept` | Authenticated user | Record explicit acknowledgement; identity from server session |
| `GET /api/me/policy-status` | Authenticated user | Whether acknowledgement is current |
| `POST /api/admin/policies` | Admin | Create draft |
| `PUT /api/admin/policies/{id}` | Admin | Update draft; reject edits to published versions |
| `POST /api/admin/policies/{id}/publish` | Authorized publisher | Validate and publish immutable version |
| `GET /api/admin/policy-acceptances` | Authorized admin | Search/export acceptance records |
| `GET /api/admin/policy-audit-logs` | Admin/auditor | Inspect change history |

### 2.5 Acceptance and versioning workflow

1. User signs in.
2. Backend checks whether the user acknowledged the currently applicable version.
3. If required, show the complete policy plus a concise change summary.
4. User actively ticks an unchecked box and selects "I Agree".
5. Backend validates authenticated session, policy status, version, and content hash; records acceptance with a **server-generated** timestamp.
6. Workbench displays the accepted version and date in the user's policy history.
7. When a material new version is published, notify affected users and request renewed acknowledgement where legally appropriate.

### 2.6 Security, privacy, and integrity requirements

- Role-based access control; ordinary users must not access admin policy endpoints.
- Never trust `user_id`, timestamp, policy version, or acceptance status from the browser.
- Derive identity from the authenticated server session; generate timestamps server-side.
- HTTPS, CSRF protection where applicable, input validation, output encoding, rate limiting, secure session handling.
- Store a cryptographic content hash for each published policy and acceptance record.
- Log administrator actions; protect audit logs with restricted permissions and backups.
- Collect IP/device metadata only where lawful, necessary, disclosed, and retained for a defined period.
- Never expose one user's acceptance records or account information to another user.

### 2.7 Acceptance criteria from the brief

- Current policy readable on desktop and mobile.
- Unacknowledged required version triggers the acknowledgement flow.
- Checkbox is not preselected; explicit action required.
- Server stores correct user, version, hash, and server timestamp.
- Refresh/re-login does not lose or fabricate acceptance.
- Published content cannot be silently edited; a new version is created.
- Admins can preview, publish, and inspect version history.
- Acceptance reports are searchable and access-controlled.
- Material updates trigger notification and acknowledgement.
- Users retain support, transaction records, and withdrawal-request access if they decline updated terms.
- No feature requires an extra deposit or payment merely to unlock, release, or withdraw an existing balance.

### 2.8 Implementation and deployment notes from the brief

- First inspect the existing codebase, framework, authentication flow, database, admin roles, and Workbench navigation.
- Reuse the existing design system and infrastructure.
- Do not replace or migrate the production stack solely to add this module.
- Implement in staging, back up the database, test with test accounts, and obtain approval before production deployment.
- Expected deliverables: responsive policy page; first-time/material-update acknowledgement flow; admin editor/publishing workflow; immutable version history; acceptance report; audit log; API/database migrations; automated tests; deployment and rollback notes.

---

## 3. VIP and Financial Rules as Specified by the Master Requirements

These values are the Master specification. They are **not** present in `Terms & Conditions.txt`.

| VIP | Max Properties Order Groups / day | Tasks per Group | Declared Profit Rate per Transaction | Withdrawal Policy |
|---|---:|---:|---:|---|
| VIP-1 Beginner | 3 | 20 | 0.5% | Multiple requests per day, subject to applicable requirements |
| VIP-2 Advanced | 4 | 25 | 0.6% | Multiple requests per day, subject to applicable requirements |
| VIP-3 Expert | 5 | 35 | 0.8% | Multiple requests per day, subject to applicable requirements |
| VIP-4 Master | 6 | 60 | 1% | Multiple requests per day, subject to applicable requirements |

The Master spec also requires:

- Centralized, database-driven VIP configuration (names, descriptions, daily group limits, tasks per group, profit rates, withdrawal requirements, VIP-specific terms, associated task configuration, activation status).
- User-specific VIP assignment and change history.
- No retroactive changes to completed tasks/historical transactions.
- Effective-time policy for changes affecting active users.
- No hardcoded VIP configuration throughout the application.

---

## 4. Rules Currently Enforced by Code

### 4.1 `lib/vipModel.js`

| Level | Unlock balance | Label | `profitIncrease` | `tasksPerSet` |
|---|---:|---|---:|---:|
| 1 | 0 | Bronze | 0.5 | 20 |
| 2 | 1,500 | Silver | 2 | 25 |
| 3 | 5,000 | Gold | 6 | 30 |
| 4 | 10,000 | Diamond | 12 | 40 |

- Eligibility is `availableBalance + frozenBalance` against `unlockBalance`.
- Eligible users generate a pending `vipRequests` record; the level is not auto-applied.
- Admin approval or manual assignment updates `vipLevel`, `vipProfitIncrease`, `vipTasksPerSet`, and `vipNotifiedLevel`.
- There is no VIP daily group limit, VIP-specific terms, description field, or database configuration.

### 4.2 Task and set code

- `lib/taskSetModel.js`: `DAILY_SET_LIMIT = 3`, rolling 24 hours, then a 24-hour cooldown.
- `app/api/admin/task-groups/assign/route.js`: `DAILY_GROUP_LIMIT = 3`, with a `force` override.
- `app/api/user/tasks/complete/route.js`: profit uses the user's `vipProfitIncrease`; daily limit uses the fixed 3-set limit.
- `app/api/user/tasks/auto-assign/route.js`: tasks per set uses `user.vipTasksPerSet` or the hardcoded tier.
- Combined tasks use `lib/vipModel.js` for profit and the global `comboConfig` for positions/orders.

### 4.3 Withdrawal code

`app/api/user/withdrawal/route.js` enforces only:

- Positive amount.
- Existing user.
- Not demo/training.
- Not frozen.
- No `comboDebt`.
- No incomplete `userTaskSets`.
- Available balance ≥ requested amount at request time.
- Admin approval re-checks balance and debits at approval time.

No VIP-specific cap, daily request count, fee, minimum, or operating-hours rule is enforced.

---

## 5. Rules Currently Displayed on the Existing Terms Page

`app/(site)/terms-conditions/page.jsx` hardcodes eleven sections. The page requires login and has no acceptance mechanism.

### 5.1 Extracted content

**I. Car Optimization**

- A deposit of at least 60 USDT is required for restarting.
- After completing all orders, the user must request a full withdrawal and receive the withdrawal amount before requesting a restart.

**II. Withdrawal**

- Maximum withdrawal: VIP1 2,500 USDC; VIP2 8,000 USDC; no maximum for VIP3/VIP4.
- After completing all orders, users can request a full withdrawal.
- No withdrawals/refunds while an order is executing.
- Users must submit a withdrawal request to receive payment.

**III. Funds**

- Funds are stored in the user's account and can be withdrawn in full after order completion.
- Funds are managed by the system, not manually.
- The Platform assumes full responsibility for accidental loss of funds.

**IV. Account Security**

- One workbench account per user.
- Do not disclose passwords; the Platform is not liable for resulting loss.
- Do not use date of birth, ID card number, or mobile number as withdrawal/login password.
- Forgotten login/withdrawal passwords can be reset by contacting customer service.
- Orders are real-time data from real users; users must keep orders and the platform confidential.
- Every user with funds exceeding 10,000 USDC/T must open a "large-amount channel" to apply for withdrawal.
- Forgotten funds password: contact customer service; **a small verification deposit is required**. Changing a linked address requires unlocking by the security department and **payment of the required deposit**.

**V. Orders**

- VIP1: up to 3 task groups/day; 40 orders/group; 0.5% profit/order; withdraw 10 times; 0% charges.
- VIP2: up to 4 task groups/day; 50 orders/group; 0.6%; withdraw 10 times; 0% charges.
- VIP3: up to 4 activity groups/day; 55 orders/group; 0.8%; withdraw 10 times; 0% charges.
- VIP4: up to 5 activity groups/day; 60 orders/group; 1%; withdraw 10 times; 0% charges.
- The system automatically upgrades the user when VIP conditions are met, without manual application.
- Funds and rewards are returned immediately for each completed order.
- Orders are randomly allocated based on total funds.
- Once allocated, an order cannot be cancelled or ignored.
- Order amount is adjusted based on total account balance, and revenue increases accordingly.

**VI. About Car Packs (Bulk Orders)**

- Car packs are randomly allocated; each contains 1–3 cars.
- Funds are not refunded immediately after receiving a pack; refunds are issued only after the pack is completed.
- Pack orders are assigned based on total account balance range.
- Once assigned, a pack order cannot be cancelled or ignored.

**VII. Top-up**

- When recharge reaches the VIP upgrade standard, the system automatically detects and upgrades the level.
- The user chooses the recharge amount.
- For package orders, top up according to the negative amount shown.
- Users must request and confirm the wallet address with customer service before recharging.
- The Platform is not responsible for loss caused by an incorrect wallet address.

**VIII. Car Ordering System**

- Workbench updates car information every minute.
- Orders must be completed within eight hours; failure may lead to complaints and order freezing.
- Users can contact customer service to request an order extension.

**IX. Invitation**

- VIP3 members can use invitation codes.
- Users cannot invite others if they have not completed all car orders.
- Referrer receives 20% referral commission.

**X. Operation Time**

- Platform operating hours: 11:00–22:59.
- Online customer service hours: 11:00–22:59.
- Withdrawal time: 11:00–22:59.

**XI. Credit Value**

- Credit Score guarantees completion within a timeframe; failure causes automatic deduction.
- Withdrawal requires 100% credit score.
- The system checks credit score; below 100% requires contacting customer service to restore it.

### 5.2 Implementation status of those displayed rules

| Displayed section | Code support | Status |
|---|---|---|
| Car Optimization / restart deposit | None | Not implemented; conflicts with the supplied brief's no-extra-deposit safeguard |
| Withdrawal caps (2500/8000/none) | None | Not enforced |
| Withdrawal only after all orders | Partial: blocks active task sets | Implemented differently (set-based, not "all orders") |
| No withdrawal during an executing order | Partial: combo in progress/debt checks | Not identical |
| Funds managed by system | Partial: balance fields | Not an enforceable rule |
| One account per user | None | Not enforced |
| Password secrecy | Firebase handles auth | Not a business-rule check |
| Large-amount channel >10,000 | None | Not implemented |
| Verification deposit for password/address | None | Not implemented; conflicts with the supplied brief's safeguard |
| VIP order/group counts | Partial: hardcoded VIP tasks per set | Values conflict with displayed page |
| 10 withdrawals / 0% charges | None | Not enforced |
| Auto VIP upgrade | None | Code requires admin approval/manual assignment |
| Order cannot be cancelled | Yes: combined tasks cannot be cancelled; normal tasks can be frozen | Partial |
| Car packs | No car-pack model; combined tasks are the closest analogue | Not implemented as described |
| Auto top-up upgrade | None | Admin approval required |
| Wallet confirmation before recharge | None | Not enforced |
| 8-hour completion deadline / freezing | None | Not implemented |
| VIP3 invitation restriction | None | Not enforced |
| 20% referral commission | Yes: demo/training profit share | Implemented, but not for all referrals as described |
| Operating hours | None | Not enforced |
| Credit score | No model | Not implemented |

---

## 6. Conflict Matrix

### 6.1 VIP group and task values

| Source | VIP1 | VIP2 | VIP3 | VIP4 |
|---|---|---|---|---|
| Master spec — groups/day | 3 | 4 | 5 | 6 |
| Master spec — tasks/group | 20 | 25 | 35 | 60 |
| Existing terms page — groups/day | 3 | 4 | 4 | 5 |
| Existing terms page — orders/group | 40 | 50 | 55 | 60 |
| `lib/vipModel.js` — tasks/set | 20 | 25 | 30 | 40 |
| Code — group/day limit | 3 (global hardcoded) | 3 | 3 | 3 |

**Conflicts:**

- VIP2 groups: Master 4 vs terms 4 (agree); tasks: Master 25 vs terms 50 (disagree).
- VIP3 groups: Master 5 vs terms 4 (disagree); tasks: Master 35 vs terms 55 (disagree); code 30 (disagree with both).
- VIP4 groups: Master 6 vs terms 5 (disagree); tasks: Master 60 vs terms 60 (agree); code 40 (disagree).
- VIP1 tasks: Master 20 vs terms 40 vs code 20 (disagree with terms).
- No source other than the Master spec defines VIP2 as 4 groups/day or VIP3 as 5; the terms page uses 4 for VIP3 and 5 for VIP4.

### 6.2 Profit rates

| Source | VIP1 | VIP2 | VIP3 | VIP4 |
|---|---:|---:|---:|---:|
| Master spec | 0.5% | 0.6% | 0.8% | 1% |
| Existing terms page | 0.5% | 0.6% | 0.8% | 1% |
| `lib/vipModel.js` | 0.5% | 2% | 6% | 12% |

**Conflict:** the code's VIP2–VIP4 profit rates are 3.3×–12× the documented rates. This is the most financially dangerous discrepancy.

### 6.3 VIP unlock thresholds

- Master spec: **not defined**.
- Existing terms page: **not defined** (only says the system auto-upgrades when conditions are met).
- `lib/vipModel.js`: 0 / 1,500 / 5,000 / 10,000.

**Conflict:** the thresholds are invented relative to the two source documents. They may be an existing business decision, but no source document supports them.

### 6.4 VIP upgrade mechanism

| Source | Behaviour |
|---|---|
| Master spec | Admin assigns/changes VIP levels; history required; effective-time policy |
| Existing terms page | System automatically upgrades when conditions are met |
| Code | Creates a pending request; admin approval or manual assignment required |

**Conflict:** automatic vs admin-approved upgrade.

### 6.5 Withdrawal rules

| Source | Rule |
|---|---|
| Master spec | Multiple requests/day subject to applicable requirements; requirements not defined |
| Existing terms page | VIP1 max 2,500; VIP2 max 8,000; VIP3/VIP4 no max; 10 withdrawals; 0% charges; only after all orders |
| Code | No VIP caps/fees/count; blocks demo/frozen/debt/incomplete set; available balance check at request and approval |

**Conflict:** nothing in code enforces the displayed caps or counts.

### 6.6 Safeguard conflict (critical)

The supplied brief explicitly says:

> Do not require additional deposits, top-ups, fees, or credit-score payments to release an existing balance or process a withdrawal.

The existing terms page contains clauses that appear to require exactly that:

- "A deposit of at least 60 USDT is required for restarting."
- "Every user with funds exceeding 10,000 USDC/T needs to open a large-amount channel to apply for withdrawal."
- "A small verification deposit is required" to reset the funds password.
- "You will need to pay the required deposit to the security department" to change a linked address.

**Impact:** if the supplied brief is authoritative, these clauses must not be carried into the new terms page or enforced. If the existing page is authoritative, the brief's safeguard is violated. This requires a written business/legal decision.

---

## 7. Clause-to-Requirement Mapping

### 7.1 Supplied brief → Master Phase 6 → implementation area

| Supplied brief requirement | Master reference | Implementation area |
|---|---|---|
| Persistent T&C navigation | 6.5 UI/UX | User dashboard navigation / public site |
| Policy overview (title, version, dates) | 6.1, 6.4 | `policies` collection + user page |
| Expandable sections for 10 policy areas | 6.1 content | Structured policy sections |
| First-time acknowledgement | 6.2, 6.4 | `policy_acceptances` + access gate |
| Explicit unticked checkbox + separate action | 6.2 | Registration and re-acceptance UI |
| Return access to current/previous versions | 6.4 | Version history API/UI |
| Change notice | 6.4 | Publish workflow + notifications |
| Admin create/edit draft/preview | 6.4 + Phase 8 | Admin Policy Management page |
| Review → publish with approver | 6.4 | `policies.status`, `approved_by` |
| Immutable versions | 6.4 | No update route for published versions |
| Acceptance report | 6.3 | Admin acceptance search/export |
| Notifications on material update | 6.4 | `notifications` integration |
| Audit log | Phase 3 audit requirements | `policy_audit_logs` |
| Suggested collections | 6.3 | `policies`, `policy_acceptances`, `policy_audit_logs` |
| Required APIs | 6.2–6.4 | `/api/policies*`, `/api/admin/policies*` |
| Server-derived identity/timestamp/hash | 6.3 | Auth helper + content hashing |
| RBAC | Phase 2/8 | `requireAdmin` |
| Accessibility/responsive | 6.5 | UI implementation |
| No extra deposit to release funds | Safeguard | Policy content review + removal of conflicting clauses |
| Staging/backup/approval | Deployment notes | Release process |

### 7.2 Existing terms-page section → Master requirement → current state

| Existing section | Master requirement | Current state |
|---|---|---|
| I. Car Optimization | Not explicitly in Master spec | Hardcoded only; conflicts with safeguard |
| II. Withdrawal | 6.1 withdrawal requirements | Displayed; not enforced |
| III. Funds | 6.1 general terms | Displayed; not enforced |
| IV. Account Security | 6.1 general terms | Displayed; extra-deposit clauses conflict |
| V. Orders | 5.1–5.4, 6.1 | Displayed; values conflict with code/spec |
| VI. Car Packs | 3.x combined tasks (analogue) | Not implemented as described |
| VII. Top-up | 6.1; deposit APIs | Displayed; no auto-upgrade |
| VIII. Car Ordering System | 6.1 general terms | Displayed; no deadline enforcement |
| IX. Invitation | 6.1; referral APIs | Partially implemented (20% share) |
| X. Operation Time | 6.1 general terms | Displayed; not enforced |
| XI. Credit Value | 6.1 general terms | Displayed; no credit-score model |

---

## 8. Ambiguities Requiring Business Decisions

1. **Where is the real financial Terms & Conditions document?** The supplied file is a policy-system brief. Is the existing terms page the intended content, or is the file mis-supplied?
2. **Which VIP values are correct?** Master spec, existing page, and code disagree.
3. **Are VIP unlock thresholds a business rule or an implementation artifact?** No source document defines 1,500 / 5,000 / 10,000.
4. **Should VIP upgrades be automatic or admin-approved?** The page says automatic; code requires approval; the Master spec emphasises admin assignment.
5. **Do withdrawal caps exist?** If yes, what are the exact amounts, daily counts, fees, minimums, and operating hours?
6. **Are the "verification deposit" and "large-amount channel" clauses still policy?** They conflict with the supplied brief's safeguard.
7. **What is the credit-score model?** No data model, calculation, or enforcement exists.
8. **What are the task deadlines and extension rules?** The page says eight hours and customer-service extension; no code supports this.
9. **Is invitation limited to VIP3 and to users who completed all orders?** The page says yes; code does not enforce either.
10. **Which acceptance events require renewed acknowledgement?** Every published version or only material changes?
11. **What is the IP retention period and privacy notice basis?** Required before storing IP/user-agent in acceptance records.
12. **Which roles may publish policies?** The brief distinguishes admin from "authorized publisher"; the current system has only `admin`.

---

## 9. Recommended Resolution Path (No Assumptions)

1. **Do not change any VIP/task/withdrawal value in code yet.** The current values are inconsistent with both documents.
2. **Obtain the correct financial Terms & Conditions document** or written confirmation that the existing page's clauses are the intended business rules.
3. **Hold a business/legal review** of the four extra-deposit/large-amount clauses against the supplied brief's safeguard. Document the decision and remove any clause that cannot be legally supported.
4. **Freeze a single source-of-truth table** for VIP groups, tasks, profit rates, unlock thresholds, upgrade mechanism, and withdrawal rules. Record it in this file and use it for both UI and backend.
5. **Implement the policy-management module mechanics independently.** The supplied brief is sufficient for:
   - Policy CRUD/versioning/publishing.
   - Acceptance records and audit logs.
   - User policy page and acknowledgement flow.
   - Admin acceptance reports.
   These can proceed without resolving the financial-rule conflict, as long as the policy **content** is treated as draft pending approval.
6. **Keep the current terms page live and unchanged** until the replacement content is approved, so no user sees a partial or contradictory policy.
7. **When values are confirmed**, migrate them to a database-driven VIP configuration in Phase 5 and reference that configuration from the terms content. Do not hardcode them in the new page.

---

## 10. Phase 1 Conclusion

- The supplied `Terms & Conditions.txt` is fully reviewed and can drive the **policy-management system design**.
- It cannot drive the **financial/VIP rules**. That information is absent.
- The existing page and code contain three mutually inconsistent rule sets.
- The existing page contains clauses that directly conflict with the supplied brief's fund-protection safeguard.
- No business rule was invented, and no terms/VIP code was changed.
- Phase 5 (centralized VIP) and the content portion of Phase 6 (Terms page) are **blocked on business confirmation**. Phase 6's versioning/acceptance mechanics can proceed independently once authorized.

**Decision required before implementation:** confirm the authoritative financial terms and the fate of the conflicting clauses.

## Approved VIP Matrix (business-provided, 2026-11-06)

| Configuration | VIP-1 Beginner | VIP-2 Advanced | VIP-3 Expert | VIP-4 Master |
|---|---:|---:|---:|---:|
| Daily Group Limit | 3 | 4 | 5 | 6 |
| Tasks per Group | 20 | 25 | 35 | 60 |
| Profit Rate | 0.5% | 0.6% | 0.8% | 1% |
| Withdrawal Requests | Multiple per day | Multiple per day | Multiple per day | Multiple per day |

Unspecified financial clauses (extra verification deposit, large-amount channel thresholds, exact withdrawal caps, fund-freezing conditions) remain pending business/legal confirmation and are not published as approved rules.
