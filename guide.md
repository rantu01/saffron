# SaffronEdge প্ৰজেক্ট meghna.hostseba.com-এ ডিপ্লয় গাইড (বাংলা)

এই গাইডে আমরা `saffronedge` (Next.js 16) প্রজেক্টটি **meghna.hostseba.com** হোস্টিং-এ ডিপ্লয় করার ধাপগুলো দেখাবো।

---

## ১. প্রজেক্ট সম্পর্কে প্রাথমিক তথ্য

- **ফ্রেমওয়ার্ক:** Next.js 16 (App Router)
- **Node.js ভার্সন:** 18.18+ অথবা 20+ (প্রস্তাবিত: Node 20 LTS)
- **ডাটাবেজ:** MongoDB (এনভায়রনমেন্ট ভেরিয়েবলের মাধ্যমে কানেক্ট)
- **বিল্ড কমান্ড:** `npm run build`
- **রান কমান্ড:** `npm run start`
- **পোর্ট:** 3000 (হোস্টিং কন্ট্রোল প্যানেল থেকে সেট করতে হতে পারে)

---

## ২. লোকাল থেকে প্রস্তুতি (Build চেক)

ডিপ্লয়য়ের আগে লোকালে বিল্ড সফল কিনা দেখে নিন:

```bash
npm install
npm run build
```

বিল্ড সফল হলে `npm run start` দিয়ে লোকালে টেস্ট করুন (`http://localhost:3000`)।

---

## ৩. `.env` / এনভায়রনমেন্ট ভেরিয়েবল সেট করুন

প্রজেক্টে MongoDB ও Firebase ব্যবহার হয়েছে। হোস্টিং প্যানেলের **Environment Variables** সেকশনে নিচের ভেরিয়েবলগুলো যোগ করুন:

| Variable | বিবরণ |
|----------|-------|
| `MONGODB_URI` | আপনার MongoDB কানেকশন স্ট্রিং |
| `FIREBASE_API_KEY` | Firebase কনফিগ |
| `FIREBASE_AUTH_DOMAIN` | Firebase কনফিগ |
| `FIREBASE_PROJECT_ID` | Firebase কনফিগ |
| `FIREBASE_...` | বাকি Firebase কনফিগগুলো |
| `NODE_ENV` | `production` |

> টিপ: লোকাল `.env.local` ফাইলটি Git-এ থাকবে না, তাই হোস্টিং প্যানেলে ম্যানুয়ালি যোগ করা বাধ্যতামূলক।

---

## ৪. meghna.hostseba.com-এ ডিপ্লয় করার ধাপ

### পদ্ধতি ক: cPanel / File Manager (Shared Hosting)

যদি meghna.hostseba.com একটি cPanel-ভিত্তিক শেয়ার্ড হোস্টিং হয়:

1. **Node.js সেটআপ:**
   - cPanel → **Setup Node.js App** (বা "Application Manager")-এ যান।
   - New Application তৈরি করুন:

     | ফিল্ড | ভ্যালু |
     |-------|--------|
     | Node.js version | `20.x` (অথবা 18.18+) |
     | Application mode | `Production` |
     | Application root | `/home/username/public_html` (যেখানে ফাইল আছে) |
     | Application URL | `meghna.hostseba.com` |
     | Application path | অটো-জেনারেটেড — হাত দিয়ে নয় |
     | Application startup file | `npm` (স্ক্রিপ্ট: `start`) অথবা `node_modules/next/dist/bin/next` |
     | Environment variables | `NODE_ENV=production` + বাকি `.env` ভেরিয়েবলগুলো |

2. **ফাইল আপলোড (`.next` ও `node_modules` ছাড়া):**
   - `.next`, `node_modules`, `.git` ফোল্ডার বাদ দিয়ে বাকি সব ফাইল (`public`, `app`, `package.json`, `next.config.*` ইত্যাদি) জিপ করে File Manager-এ আপলোড ও এক্সট্রাক্ট করুন।
   - `.next` ও `node_modules` আকারে বড় (৫GB+) হতে পারে, তাই আপলোড না করে হোস্টিংয়ের টার্মিনালে তৈরি করবেন।

3. **টার্মিনালে বিল্ড ও রান:**
   ```bash
   cd public_html   # বা আপনার অ্যাপ ফোল্ডার
   npm install
   npm run build
   npm run start
   ```

4. cPanel-এর **Setup Node.js App** সেকশন থেকে startup file `npm run start` (অথবা `node_modules/next/dist/bin/next`) সেট করে **Restart** দিন।

### পদ্ধতি খ: Git Deployment

যদি হোস্টিং Git সাপোর্ট করে:

1. cPanel → **Git Version Control** → Clone Repo (GitHub/Bitbucket থেকে)।
2. Deployment সেটআপ করুন, Deploy script-এ যোগ করুন:
   ```bash
   npm install
   npm run build
   npm run start
   ```
3. **Deploy** বাটনে ক্লিক করুন।

---

## ৫. ডোমেইন ও DNS (প্রয়োজনীয় হলে)

- যদি `meghna.hostseba.com` সাবডোমেইন হয়, cPanel থেকে সাবডোমেইন তৈরি করে এর Document Root আপনার অ্যাপ ফোল্ডারে পয়েন্ট করুন।
- DNS-এর A রেকর্ড ইতিমধ্যে হোস্টসেবা কন্ট্রোল করলে আলাদা সেট করার দরকার নেই।

---

## ৬. পরবর্তী যাচাই (Verification)

ডিপ্লয় শেষে নিচেরগুলো চেক করুন:

- [ ] `https://meghna.hostseba.com/` হোম পেজ লোড হচ্ছে কিনা
- [ ] `/user-dashboard` পেজ ওপেন হচ্ছে কিনা
- [ ] লগইন / সাইনআপ কাজ করছে কিনা (Firebase)
- [ ] ডাটাবেজ ডাটা লোড হচ্ছে কিনা (MongoDB URI সঠিক কিনা)
- [ ] কনসোলে কোনো এনভায়রনমেন্ট এরর নেই কিনা

---

## ৭. সমস্যা সমাধান (Troubleshooting)

| সমস্যা | সমাধান |
|--------|--------|
| 500 Error | `.env` ভেরিয়েবলগুলো ঠিকমতো সেট কিনা দেখুন |
| 404 on routes | `npm run build` ঠিকমতো হয়েছে কিনা চেক করুন |
| White screen | Browser console চেক করুন, build logs দেখুন |
| Port issue | হোস্টিং প্যানেলে অ্যাপ্লিকেশন পোর্ট 3000 সেট আছে কিনা নিশ্চিত করুন |

---

## ৮. দ্রুত রেফারেন্স কমান্ড

```bash
# লোকাল ডেভেলপমেন্ট
npm run dev

# প্রোডাকশন বিল্ড ও রান
npm run build
npm run start
```

> **নোট:** প্রকৃত ডিপ্লয় স্টেপ meghna.hostseba.com-এর কন্ট্রোল প্যানেল (cPanel/Plesk/কাস্টম) অনুযায়ী সামান্য ভিন্ন হতে পারে। উপরের পদ্ধতি দুটি সাধারণ হোস্টিংয়ের জন্য প্রযোজ্য।
