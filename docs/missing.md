# Dreamery Project Audit Report

> **Generated:** 2026-06-03
>
> **Project:** Saffron Edge / Dreamery
>
> **Stack:** Next.js 16 (App Router), MongoDB, Firebase Auth, Tailwind CSS

---

## Completed Features

### Authentication
- Firebase email/password authentication
- Login and registration with invitation code validation
- Role-based redirect (admin → `/admin`, user → `/user-dashboard`)
- Firebase-to-MongoDB user sync on registration/login

### Dashboard
- Current balance display
- Total earnings (lifetime)
- Pending tasks count
- Completed tasks count
- Deposit history (recent + full)
- Withdrawal history (recent + full)

### Deposit System
- Screenshot upload for payment proof
- Manual admin approval/rejection workflow
- Balance credit on approval
- Deposit history viewing

### Withdrawal System
- Wallet address submission
- Withdrawal request creation
- Admin approval/rejection workflow
- Balance deduction on approval
- Withdrawal record viewing

### Task System
- 30 tasks per task set
- Sequential completion enforcement
- Daily task sets
- Single task type
- Combination task type (5 randomly assigned positions in range 10-25 with 5x multiplier)
- Automatic combination task generation on task set creation
- Balance validation before combination trigger
- Up to 25% profit on combination tasks

### Balance Requirement Logic
- Variable required balance per task
- Insufficient balance detection
- Account freeze on insufficient balance
- Recharge-to-unfreeze workflow

### Demo Account System
- Admin-created demo accounts via invitation codes
- 20% profit sharing from demo accounts to inviter
- Demo account tracking

### Admin Panel - User Management
- User listing (with filters, 200 limit)
- Inline user editing (role, balance, accountType, status)
- Invitation code generation (global and per-user)
- Demo account creation

### Referral System
- User-facing referral dashboard at `/user-dashboard/referrals`
- Referral link generation with copy-to-clipboard
- User referral code generation
- Referral tracking UI (invited users, earnings from referrals)
- Referral API endpoint (`/api/user/referral`)

### Balance History / Audit Trail
- Dedicated `balanceLogs` MongoDB collection
- Automatic logging of all balance changes (deposits, withdrawals, task earnings, referral commissions)
- Date range filtering on balance history page
- Type filtering (deposits, withdrawals, task earnings, referral commissions)
- CSV export of balance history
- Pagination for history table

### Profile Management
- Display name editing
- Phone number editing
- Avatar URL editing
- Password change with Firebase reauthentication
- Email verification status display with send-verification action
- Account deletion with data cleanup

### Task Records
- Date range filtering on tasks page
- Pagination (15 tasks per page)
- Daily earnings chart (last 14 days bar chart)
- Task count and completion stats display

### Admin Panel - Task Management
- Task assignment to users
- Task listing with filters
- Task set creation (admin)

### Admin Panel - Deposit Management
- Deposit request listing with status filter
- Screenshot image preview
- Approve/reject with reason

### Admin Panel - Withdrawal Management
- Withdrawal request listing with status filter
- Approve/reject with reason

### Public Pages
- Homepage lander (Hero, Services, Stats, Features, etc.)
- Services listing page
- Service detail pages (9 services)
- Case studies listing
- Resources page
- Terms & Conditions page
- Privacy Policy page

---

## Missing Features

### Customer Service
| # | Feature | Priority | Description |
|---|---|---|---|
| 1 | **Live Chat Support** | HIGH | Real-time live support widget; no WebSocket/Socket.io integration |
| 2 | **WhatsApp Support Integration** | HIGH | WhatsApp click-to-chat widget or API integration |
| 3 | **CRM Admin Panel** | HIGH | Customer relationship management dashboard for tracking interactions |

### Certificates
| # | Feature | Priority | Description |
|---|---|---|---|
| 4 | **PDF Certificate Viewer** | MEDIUM | In-browser PDF certificate viewing |
| 5 | **PDF Certificate Download** | MEDIUM | Certificate download functionality |
| 6 | **Certificate Admin Management** | MEDIUM | Admin upload/grant/revoke certificates |

### Events & Offers
| # | Feature | Priority | Description |
|---|---|---|---|
| 7 | **Offers CRUD** | MEDIUM | Create, read, update, delete promotional offers |
| 8 | **Combination Offers** | MEDIUM | Special bundle offers with bonuses |
| 9 | **Bonus Campaigns** | MEDIUM | Time-limited bonus campaigns |
| 10 | **User-facing Offers Display** | MEDIUM | Display active offers/promotions to users |
| 11 | **Admin Offer Management** | MEDIUM | Admin panel for managing offers |

### FAQ
| # | Feature | Priority | Description |
|---|---|---|---|
| 12 | **FAQ Page (standalone)** | MEDIUM | Dedicated FAQ page (currently only accordion in services) |
| 13 | **Deposit Guide** | LOW | Step-by-step deposit instructions |
| 14 | **Withdrawal Guide** | LOW | Step-by-step withdrawal instructions |
| 15 | **Task Guide** | LOW | How task system works |
| 16 | **Security Guide** | LOW | Account security best practices |
| 17 | **Admin FAQ Management** | MEDIUM | CRUD for FAQ entries |

### About Us
| # | Feature | Priority | Description |
|---|---|---|---|
| 18 | **Company Profile Page** | LOW | Company information, mission, vision, team |
| 19 | **Contact Information** | LOW | Contact details, location map |

### Security
| # | Feature | Priority | Description |
|---|---|---|---|
| 20 | **Firebase ID Token Verification** | CRITICAL | No token verification on any API route; any uid can be used |
| 21 | **Rate Limiting** | HIGH | No rate limiting on any API endpoint |
| 22 | **Audit Logging** | HIGH | No action/event logging anywhere in the system |
| 23 | **Input Validation** | HIGH | No server-side validation library (Zod/Yup); minimal validation |
| 24 | **API Authentication Middleware** | CRITICAL | Admin routes have no authentication; layout checks are client-side only |
| 25 | **Admin Route Protection** | CRITICAL | Admin routes rely on client-side role check; no server-side middleware |
| 26 | **CSRF Protection** | HIGH | No CSRF tokens on any forms |

### Demo Account System (Admin)
| # | Feature | Priority | Description |
|---|---|---|---|
| 27 | **Admin Demo Account Management Panel** | MEDIUM | Dedicated admin page for managing all demo accounts |

---

## Recommended Development Order

| Rank | Feature | Category | Effort | Justification |
|---|---|---|---|---|
| 1 | **Firebase ID Token Verification** | Security | 4-6h | CRITICAL — all APIs are completely unprotected |
| 2 | **API Authentication Middleware** | Security | 3-4h | CRITICAL — admin routes have no server-side protection |
| 3 | **Admin Route Protection** | Security | 2-3h | CRITICAL — server-side guard for admin pages |
| 4 | **Rate Limiting** | Security | 3-4h | HIGH — prevents abuse of all endpoints |
| 5 | **Audit Logging** | Security | 4-5h | HIGH — needed for compliance and debugging |
| 6 | **Input Validation (Zod)** | Security | 4-6h | HIGH — prevents malformed data attacks |
| 7 | **CSRF Protection** | Security | 2-3h | HIGH — prevents cross-site request forgery |
| 8 | **Live Chat Support** | Customer Service | 8-12h | HIGH — core customer communication channel |
| 9 | **WhatsApp Support Integration** | Customer Service | 4-6h | HIGH — important user communication channel |
| 10 | **CRM Admin Panel** | Customer Service | 8-12h | HIGH — customer management and tracking |
| 11 | **Offers / Events System** | Events & Offers | 8-12h | MEDIUM — promotional campaigns and bonuses |
| 12 | **Certificate System** | Certificates | 6-8h | MEDIUM — PDF generation and management |
| 13 | **FAQ System** | FAQ | 4-6h | MEDIUM — self-service knowledge base |
| 14 | **Demo Account Admin Panel** | Admin | 4-6h | MEDIUM — manage demo accounts separately |
| 15 | **About Us Page** | About Us | 2-3h | LOW — company information page |
