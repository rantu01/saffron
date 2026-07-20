# Hosting & Domain Connect গাইড — saffronedge

এই গাইডে দেখানো হয়েছে কিভাবে **saffronedge** (Next.js 16) প্রজেক্টটি হোস্ট করবেন এবং আপনার ডোমেইন এর সাথে কানেক্ট করবেন।

হোস্টিং কন্ট্রোল প্যানেল লিংক:
`https://meghna.hostseba.com:2003/sess2qbD4s36375sXAmN/index.php?act=domainmanage`

---

## ধাপ ১: কন্ট্রোল প্যানেল-এ লগইন করুন

১. উপরের লিংকটি ব্রাউজারে ওপেন করুন।
২. আপনার **username** ও **password** দিয়ে লগইন করুন।
   - লিংকে `sess...` অংশটি হলো সেশন/অ্যাক্সেস কী — এটি সরাসরি আপনাকে `domain manage` পেজে নিয়ে যাবে।
৩. লগইন করার পর **Domain Management** (ডোমেইন ম্যানেজ) সেকশনটি দেখতে পাবেন।

> নোট: `:2003` পোর্টটি হোস্টসেবার কাস্টম কন্ট্রোল প্যানেল পোর্ট। সাধারণ ৮০/৪৪৩ নয়, তাই লিংকটি হুবহু এভাবেই ব্যবহার করতে হবে।

---

## ধাপ ২: হোস্টিং অ্যাকাউন্টে অ্যাপ তৈরি করুন (Node.js App Setup)

প্রজেক্টটি Next.js হওয়ায় হোস্টিংয়ে একটি Node.js অ্যাপ্লিকেশন সেটআপ করতে হবে।

১. কন্ট্রোল প্যানেলে **Node.js App** / **Application Manager** অপশন খুঁজুন।
২. **Create New Application** / নতুন অ্যাপ তৈরি করুন:

   | ফিল্ড | ভ্যালু |
   |-------|--------|
   | Node.js Version | `20.x` (অথবা 18.18+) |
   | Application Mode | `Production` |
   | Application Root | আপনার প্রজেক্ট ফোল্ডার (যেখানে ফাইল আপলোড করবেন) |
   | Application URL | আপনার ডোমেইন (নিচে ধাপ ৪ অনুযায়ী) |
   | Startup File | `npm` (script: `start`) অথবা `node_modules/next/dist/bin/next` |
   | Port | `3000` |

৩. **Environment Variables** সেকশনে নিচের ভেরিয়েবলগুলো যোগ করুন (`.env` ফাইল থেকে):

   | Variable | মান |
   |----------|-----|
   | `MONGODB_URI` | `mongodb+srv://saffron:vGfwrTUrEbbytQE6@saffron.ce7fwce.mongodb.net/?appName=saffron` |
   | `MONGODB_DB_NAME` | `saffron` |
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyAlHhnt6ewMnxPb6n1deuvsmAgKscdt8hM` |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `saffron-edge-6c242.firebaseapp.com` |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `saffron-edge-6c242` |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `saffron-edge-6c242.firebasestorage.app` |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `887404607509` |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:887404607509:web:03237aa83e4cbdde0d761c` |
   | `NODE_ENV` | `production` |

---

## ধাপ ৩: প্রজেক্ট ফাইল আপলোড করুন

১. লোকাল থেকে `.next`, `node_modules`, `.git` ফোল্ডার **বাদ দিয়ে** বাকি সব ফাইল জিপ করুন।
   (ফাইলগুলো: `app/`, `lib/`, `public/`, `package.json`, `package-lock.json`, `next.config.mjs`, `tailwind.config.js`, `postcss.config.mjs`, `jsconfig.json`, `eslint.config.mjs`, `.env` ছাড়া বাকি)
২. কন্ট্রোল প্যানেলের **File Manager** দিয়ে জিপ আপলোড করুন এবং এক্সট্রাক্ট করুন।
৩. **Terminal / SSH** অ্যাক্সেস থাকলে সেখানে গিয়ে বিল্ড করুন:

   ```bash
   cd <আপনার_অ্যাপ_ফোল্ডার>
   npm install
   npm run build
   npm run start
   ```

---

## ধাপ ৪: ডোমেইন কানেক্ট করুন (Domain Connect)

কন্ট্রোল প্যানেলের **Domain Management** পেজেই ডোমেইন অ্যাড ও পয়েন্ট করবেন:

### ক) যদি ডোমেইনটি hostseba-এর মাধ্যমে কেনা হয়ে থাকে
১. **Add Domain** / ডোমেইন যোগ করুন অপশনে ক্লিক করুন।
২. ডোমেইন নাম লিখুন (যেমন: `yourdomain.com`)।
৩. ডোমেইনের **Document Root** আপনার অ্যাপ ফোল্ডারে (ধাপ ২-এর Application Root) সেট করুন।
৪. Save করুন — DNS স্বয়ংক্রিয়ভাবে hostseba ম্যানেজ করবে, আলাদা সেটআপ লাগবে না।

### খ) যদি ডোমেইন অন্য জায়গা থেকে কেনা হয় (Namecheap / GoDaddy ইত্যাদি)
১. hostseba প্যানেল থেকে আপনার **Hosting IP** বা **Nameserver** কপি করুন।
২. ডোমেইন প্রদানকারীর (registrar) প্যানেলে গিয়ে:
   - **Nameserver** পদ্ধতি: hostseba-এর nameserver দিয়ে রিপ্লেস করুন, অথবা
   - **A Record** পদ্ধতি: `@` এবং `www` রেকর্ডের IP হিসেবে hostseba-এর সার্ভার IP দিন।
৩. hostseba প্যানেলে ডোমেইনটি **Add Domain** করে অ্যাপ ফোল্ডারে পয়েন্ট করুন।
৪. DNS প্রচার হতে ২৪–৪৮ ঘণ্টা সময় লাগতে পারে।

### গ) সাবডোমেইন হিসেবে (যেমন meghna.hostseba.com)
১. **Subdomain** অপশনে গিয়ে সাবডোমেইন তৈরি করুন।
২. এর Document Root আপনার অ্যাপ ফোল্ডারে পয়েন্ট করুন।
৩. Save করুন।

---

## ধাপ ৫: অ্যাপ রি-স্টার্ট ও যাচাই (Verification)

১. কন্ট্রোল প্যানেলের **Node.js App** সেকশন থেকে অ্যাপটি **Restart** দিন।
২. ব্রাউজারে ডোমেইন ওপেন করুন (`https://yourdomain.com`)।
৩. চেক করুন:
   - [ ] হোম পেজ লোড হচ্ছে কিনা
   - [ ] লগইন / সাইনআপ কাজ করছে কিনা (Firebase)
   - [ ] ডাটাবেজ ডাটা লোড হচ্ছে কিনা (MongoDB)
   - [ ] কনসোলে কোনো এনভায়রনমেন্ট এরর নেই কিনা

---

## সমস্যা সমাধান (Troubleshooting)

| সমস্যা | সমাধান |
|--------|--------|
| 500 Error | `.env` ভেরিয়েবলগুলো ঠিকমতো সেট কিনা দেখুন |
| 404 on routes | `npm run build` ঠিকমতো হয়েছে কিনা চেক করুন |
| White screen | Browser console ও build logs চেক করুন |
| ডোমেইন লোড হচ্ছে না | DNS propagation-এর জন্য অপেক্ষা করুন (২৪–৪৮ ঘণ্টা) |
| Port issue | অ্যাপ্লিকেশন পোর্ট ৩০০০ সেট আছে কিনা নিশ্চিত করুন |

---

## দ্রুত রেফারেন্স কমান্ড

```bash
# লোকাল ডেভেলপমেন্ট
npm run dev

# প্রোডাকশন বিল্ড ও রান
npm run build
npm run start
```

> **নোট:** প্রকৃত UI স্টেপ hostseba-এর কন্ট্রোল প্যানেল অনুযায়ী সামান্য ভিন্ন হতে পারে। উপরের ধাপগুলো সাধারণ Node.js হোস্টিংয়ের জন্য প্রযোজ্য।
