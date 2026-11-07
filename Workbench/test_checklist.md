# Integration Test Checklist — Saffron Edge (Phase 8 prep)

> Prepared 2026-11-06. To be executed against a staging database before delivery.

## 8.2 Admin permissions
- [ ] Every admin endpoint rejects non-admin tokens with 403.
- [ ] Admin endpoints reject missing/invalid tokens with 401.
- [ ] User endpoints bind `uid` to token subject (cross-user access returns 403).

## 8.3 VIP configuration enforcement
- [ ] VIP level values (tasks per set, profit rate, daily limit) come from config, not hardcoded.
- [ ] Backend enforces configured values on task assignment and profit credit.

## 8.4 Combined tasks
- [ ] Combo appears at configured position; freeze/release moves balance correctly.
- [ ] Commission credited once on completion (idempotent).
- [ ] Completed history preserved on config change.

## 8.5 Balance integrity
- [ ] Deposit approval credits balance once (idempotent, transactional).
- [ ] Withdrawal approval debits balance once (sufficient-balance guard).
- [ ] Task completion credits profit once; frozen principal returned.
- [ ] Admin balance adjustment writes a balance log.
- [ ] `balanceLogs` are append-only.

## 8.6 History preservation
- [ ] Task/withdrawal/deposit records survive config and VIP changes.

## 8.7 Terms & Conditions
- [ ] Blocked on Phase 6 (B1/B3).

## 8.8 Language persistence
- [ ] Language persists across reload, login, logout (localStorage + profile).
- [ ] Date/number/currency format per locale.

## 8.9 Responsive layouts
- [ ] Mobile, tablet, desktop for all pages in EN/FR/ES.

## 8.10 API errors / duplicates / orphans
- [ ] No duplicate records on retry.
- [ ] No orphaned records after user deletion.
- [ ] No balance mismatches (reconcile balanceLogs sum vs. user.availableBalance).

## Environment prerequisites
- Staging MongoDB (replica set) — confirmed available (Atlas).
- Firebase test accounts (admin + user + demo).
- Seed data: users, tasks, deposits, withdrawals.

## Database Safety (Phase 8)
- [ ] Existing database treated as READ-ONLY during testing.
- [ ] No test records inserted into production database.
- [ ] No updates/deletes to existing users, balances, transactions, tasks, deposits, withdrawals.
- [ ] No seed scripts run against existing database.
- [ ] No destructive migrations or resets.
- [ ] Real user accounts never used for balance/combo/deposit/withdrawal tests.
- [ ] Database write tests only against an isolated temporary DB with a different name, or marked BLOCKED.

## Safe Testing Approach
1. Unit tests with mocks for business logic.
2. API tests with mocked DB or isolated temp DB.
3. Build/lint/static analysis (non-destructive).
4. Document any test that cannot run without DB writes as BLOCKED.

## Expected Results (key scenarios)
- Combined task at positions 6→9→14→16→18 triggers sequentially; duplicate trigger prevented.
- Combo freeze moves available→frozen; unfreeze on matching deposit; audit log recorded.
- Deposit approval credits once (idempotent, transactional); 409 on repeat.
- Withdrawal approval debits once; insufficient balance rejected.
- VIP levels 1-4 enforce tasksPerSet/profitIncrease/dailyGroupLimit from config.
- Terms acceptance recorded with uid/version/timestamp/IP/UA/source; re-acceptance on new version.
- Language persists across reload/login/logout; EN fallback.