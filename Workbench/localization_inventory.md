# Localization Inventory — Saffron Edge

> Phase 7 prep work. Captures user-facing strings by area to drive EN/FR/ES translation.
> Source of truth for strings: `app/user-dashboard/components/translations.js` (existing dashboard strings).
> Status: inventory captured at area level; per-string extraction is ongoing.

## 1. Homepage (`app/(site)/home`, `app/page.jsx`)
- Hero headline, subheadline, CTA buttons (Get Started, Learn More).
- Feature section titles/descriptions (Task Earnings, Referrals, VIP tiers, Secure Deposits).
- Footer links (Terms & Conditions, Privacy Policy, Contact, Resources).
- Navigation: Home, Services, Case Study, Resources, Testimonials, Contact.

## 2. Authentication (`app/login`, `app/signup`, `app/(auth)`)
- Login form: email, password, "Sign in", "Forgot password?", "Don't have an account? Sign up".
- Signup form: email, password, username, referral/invitation code, terms acceptance checkbox, "Create account".
- Validation messages: "Invalid email", "Password too short", "Username taken", "Terms must be accepted".
- Auth errors surfaced from Firebase (invalid-credential, email-already-in-use, etc.).

## 3. Terms & Conditions (`app/(site)/terms-conditions`)
- Section headings and clause text (currently hardcoded in page).
- Acceptance checkbox label and "I agree" button.
- Re-acceptance prompt when a new version is published.

## 4. User Dashboard (`app/user-dashboard`)
- Sidebar labels: Dashboard, Tasks, Deposits, Withdrawals, Balance, Records, Referrals, Ad Accounts, Chat, Profile.
- Dashboard cards: Available Balance, Frozen Balance, Total Earned, VIP Level, Tasks Completed.
- Empty states: "No tasks yet", "No transactions yet".
- Language selector labels (English, Français, Español) already in `LanguageContext`.

## 5. Tasks (`app/user-dashboard/tasks`, `app/user-dashboard/records`)
- Task card: app name, amount, profit, "Submit", "Cancel", "Hold".
- Task submission modal: rating options, feedback placeholder, submit button.
- Records: status labels (Completed, Pending, Cancelled, Frozen), "Combined Task", order progress.
- Combined task: "Start Order", "Complete Order", "Insufficient balance", commission labels.

## 6. Deposits (`app/user-dashboard/deposits`)
- Deposit form: amount, screenshot upload, "Submit deposit".
- Status labels: Pending, Approved, Rejected.
- Messages: "Deposit submitted", "Deposit approved", "Deposit rejected: {reason}".

## 7. Withdrawals (`app/user-dashboard/withdrawals`, `app/user-dashboard/payments`)
- Withdrawal form: amount, wallet address, network, "Request withdrawal".
- Status labels: Pending, Approved, Rejected.
- Business-state messages: "Demo accounts cannot withdraw", "Account frozen", "Outstanding debt", "Insufficient balance", "Active task set".

## 8. Support / Chat (`app/user-dashboard/chat`)
- Chat input placeholder, send button, "Mark as read", unread count.
- Admin inbox labels: conversations, last message, unread badge.
- Notification toasts: "Message sent", "Failed to send".

## 9. Admin panel (`app/(admin)/admin/*`)
- Sidebar labels and page titles (Users, Deposits, Withdrawals, Tasks, Task Groups, Task Sets, Combo Config, VIP, Ad Accounts, Meta API, Invitations, Reports, WhatsApp, Notifications, Activity Logs, Login History, Balance Logs).
- Action buttons: Approve, Reject, Delete, Assign, Create, Save, Export.
- Confirmation dialogs (SweetAlert) text.
- Status badges: Active, Frozen, Demo, Pending, Approved, Rejected.

## 10. Shared / global
- Loading skeletons, error toasts, empty states.
- Date/number/currency formatting (currently `toLocaleString` with defaults; needs per-locale formatting per 7.8).
- Pagination labels ("Previous", "Next", "Page X of Y").

## Existing translation coverage
- `app/user-dashboard/components/translations.js` (161 lines) covers dashboard sidebar + a subset of dashboard strings in EN/FR/ES.
- `LanguageContext.jsx` provides `t(key)` with dot-notation lookup and `localStorage` persistence under `saffron-edge-lang`.

## Gaps to address (7.2–7.10)
- Homepage, auth, terms, admin, chat, and support strings are not yet in `translations.js`.
- No homepage language selector (7.3).
- Language choice not persisted on user profile (7.4) or available before login (7.5).
- Date/number/currency formatting not locale-aware (7.8).