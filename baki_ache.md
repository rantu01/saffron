# বাকি আছে — Pending Features Analysis

> dreamery-features.md এর সাথে তুলনা করে দেখা হয়েছে। নিচের ফিচারগুলো এখনও **সম্পূর্ণরূপে implement** হয়নি।

---

## 🔴 সম্পূর্ণ বাকি (Not Implemented)

### 1. Customer Service — Live Chat System
- **কি লাগবে:** Live customer support system (WebSocket/Socket.io based real-time chat)
- **স্ট্যাটাস:** ❌完全没有 implement করা হয়নি
- **বর্তমান অবস্থা:** কোনো live chat widget, chat UI, বা WebSocket connection নেই
- **দ্রষ্টব্য:** শুধু WhatsApp API টা admin side এ notification পাঠানোর জন্য আছে

### 2. Certificate Section
- **কি লাগবে:** Users দেখতে এবং download করতে পারবে company certificates PDF format এ
- **স্ট্যাটাস:** ❌完全没有 implement করা হয়নি
- **বর্তমান অবস্থা:** কোনো certificate page, PDF generation, বা admin certificate management নেই

### 3. About Us Page
- **কি লাগবে:** Company introduction, Mission & vision, Platform details, Contact information
- **স্ট্যাটাস:** ❌完全没有 implement করা হয়নি
- **বর্তমান অবস্থা:** `/about-us` route টা exist করে না

### 4. Events / Offer Section — User Facing Page
- **কি লাগবে:** Display all available offers, Combination task offers, Special bonus campaigns, Limited-time promotions
- **স্ট্যাটাস:** ❌ User-facing page টি implement করা হয়নি
- **বর্তমান অবস্থা:** Admin panel এ offer CRUD নেই, user side এ offer দেখানোর কোনো page নেই

### 5. FAQ Page (Standalone)
- **কি লাগবে:** Common questions and answers, Deposit guide, Withdrawal guide, Task completion guide, Account safety instructions
- **স্ট্যাটাস:** ❌ Standalone FAQ page নেই
- **বর্তমান অবস্থা:** শুধু service detail page এ FaqAccordion component টা আছে (service-specific)

---

## 🟡 আংশিক বাকি (Partially Implemented)

### 6. WhatsApp Support Integration (User-facing)
- **কি লাগবে:** User side এ WhatsApp click-to-chat widget, direct support button
- **যা আছে:** ✅ WhatsApp Business API backend, admin notification system, settings panel
- **যা বাকি:** ❌ User side এ কোনো WhatsApp chat widget বা support button নেই — শুধু admin-এর জন্য outbound notification

### 7. Demo / Training Account Management
- **কি লাগবে:** Dedicated demo account management panel
- **যা আছে:** ✅ User model এ demo account flag, registration এ demo account creation, 20% profit share logic
- **যা বাকি:** ❌ Admin panel এ dedicated demo account management section নেই (শুধু user management page-এ basic demo account creation আছে)

### 8. Combination Task System — User Documentation
- **কি লাগবে:** User-friendly explanation of how combination tasks work
- **যা আছে:** ✅ Backend logic সম্পূর্ণ (combination positions, 5x multiplier, random triggers)
- **যা বাকি:** ❌ User dashboard/tasks page এ combination task নিয়ে adequate documentation/info নেই

---

## 🟠 Security Issues (docs/missing.md থেকে)

- ❌ Firebase ID Token verification নেই কোনো API route এ
- ❌ Rate limiting নেই
- ❌ Server-side input validation library (Zod/Yup) ব্যবহার করা হয়নি
- ❌ Admin routes এ proper server-side middleware protection নেই (শুধু client-side role check)
- ❌ CSRF tokens নেই
- ❌ Audit logging শুধু balance logs-এর মধ্যে limited

---

## Summary Table

| # | Feature | Status | Priority |
|---|---------|--------|----------|
| 1 | Customer Service — Live Chat | ❌ Not Implemented | High |
| 2 | Certificate Section | ❌ Not Implemented | Medium |
| 3 | About Us Page | ❌ Not Implemented | Medium |
| 4 | Events/Offers Page | ❌ Not Implemented | Medium |
| 5 | Standalone FAQ Page | ❌ Not Implemented | Medium |
| 6 | WhatsApp User Widget | 🟡 Partial | Medium |
| 7 | Demo Account Panel | 🟡 Partial | Low |
| 8 | Security Hardening | 🟠 Missing | **Critical** |

---

> **Note:** Dashboard, Deposit System, Withdrawal System, Task System (30 tasks sequential + combination), Referral Program, Ad Account Management (Meta API), Terms & Conditions, Reports & Analytics, User/Admin Management — এই ফিচারগুলো **সম্পূর্ণ implement করা হয়েছে** ✅
