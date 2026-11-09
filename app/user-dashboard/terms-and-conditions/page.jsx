"use client";

import { useEffect, useState } from "react";
import { FileText, ChevronRight, ArrowUp } from "lucide-react";
import { useLanguage } from "@/app/user-dashboard/components/LanguageContext";

const sections = [
  {
    id: "introduction",
    title: "Terms and Conditions",
    blocks: [
      "All users are required to read, understand, and comply with the following Terms and Conditions before using the Saffron Edge platform.",
    ],
  },
  {
    id: "withdrawals",
    title: "II. Withdrawals",
    blocks: [
      "2.1. Withdrawal Limits",
      "The maximum withdrawal limits for each membership level are as follows:",
      "VIP-1: Maximum withdrawal of 3,000 USDC.",
      "VIP-2: Maximum withdrawal of 20,000 USDC.",
      "Expert: Maximum withdrawal of 45,000 USDC.",
      "Master: Unlimited withdrawal limit, subject to applicable verification and compliance requirements.",
      "2.2. Users may request a full withdrawal of their available account balance after completing all designated Properties orders and meeting the applicable withdrawal requirements.",
      "2.3. Any temporary withdrawal restrictions during a Properties promotional campaign must be clearly communicated to users in advance, including the reason, duration, and applicable conditions.",
      "2.4. Users must submit a formal withdrawal request through the designated withdrawal interface. All requests are subject to the platform's verification and processing procedures.",
    ],
  },
  {
    id: "funds",
    title: "III. Funds and Account Balances",
    blocks: [
      "3.1. User account balances and transaction records must be maintained accurately and transparently. Users may request withdrawal of their available funds, subject to clearly disclosed and legitimate platform requirements.",
      "3.2. Transactions should be processed through secure, automated systems wherever possible. Every transaction must generate a verifiable record, including its status, amount, timestamp, and transaction reference.",
    ],
  },
  {
    id: "security",
    title: "IV. Account Security and Confidentiality",
    blocks: [
      "4.1. Each user is permitted to maintain only one personal account unless otherwise authorized by the platform.",
      "4.2. Users must never disclose their login credentials or withdrawal passwords to third parties. Users should take appropriate precautions to protect their account information.",
      "4.3. Users are strongly advised not to use personal information, such as their date of birth, identification number, or mobile phone number, as their login or withdrawal password.",
      "4.4. If users forget their login or withdrawal passwords, they may contact official customer support to request assistance with account recovery and identity verification.",
      "4.5. Confidentiality of Platform Information",
      "Dear Saffron Edge Users, Users are expected to protect confidential business information, proprietary materials, and non-public data accessed through the Workbench. Users must not disclose protected information to unauthorized third parties. Any confidentiality obligations must be consistent with the applicable agreement and relevant laws.",
      "14.6. All users must comply with applicable confidentiality agreements and take reasonable measures to protect confidential information belonging to the platform, its partners, and authorized developers.",
      "4.6.1. Certain platform operations may involve real-time data. Users must handle such information responsibly and must not manipulate, misuse, or disclose protected data without authorization.",
    ],
  },
  {
    id: "standard-orders",
    title: "V. Standard Properties Orders",
    blocks: [
      "5.1. Beginner Level: Maximum of 3 groups of Properties orders per day. 20 tasks per group. Stated profit rate: 0.5% per transaction. Multiple withdrawal requests may be submitted daily, subject to applicable withdrawal requirements.",
      "5.2. Advanced Level: Maximum of 4 groups of Properties orders per day. 25 tasks per group. Stated profit rate: 0.6% per transaction. Multiple withdrawal requests may be submitted daily, subject to applicable withdrawal requirements.",
      "5.3. Expert Level: Maximum of 5 groups of Properties orders per day. 35 tasks per group. Stated profit rate: 0.8% per transaction. Multiple withdrawal requests may be submitted daily, subject to applicable withdrawal requirements.",
      "5.4. Master Level: Maximum of 6 groups of Properties orders per day. 60 tasks per group. Stated profit rate: 1% per transaction. Multiple withdrawal requests may be submitted daily, subject to applicable withdrawal requirements.",
      "5.5. When a user meets the published eligibility requirements for the next membership level, the system may automatically update their account status. Users must be notified of any change in membership level and its associated conditions.",
      "5.6. Upon successful completion of each Properties order, the corresponding funds and rewards must be reflected in the user's account transaction history.",
      "5.7. Properties orders may be assigned according to predefined system criteria, including the user's available account balance and applicable task eligibility requirements.",
      "5.8. Before accepting an order, users must be informed of its requirements, financial implications, and completion conditions. Users must have access to the applicable order terms.",
      "5.9. Any adjustment to the amount required for a Properties order must be transparently displayed before the user accepts the order. Associated earnings must be calculated according to the disclosed commission structure.",
    ],
  },
  {
    id: "premium-orders",
    title: "VI. Premium Properties Orders",
    blocks: [
      "6.1. Premium Properties orders may be assigned according to predefined system criteria. Users must be informed of the possibility of receiving one or more Premium Properties orders within a single batch.",
      "26.2. Premium Properties orders may involve temporarily allocated funds. The amount, duration, and release conditions must be clearly disclosed before the user accepts the order.",
      "6.3. The system may match eligible accounts with Premium Properties orders based on predefined balance and eligibility criteria.",
      "6.4. Once a Premium Properties order is accepted, its completion requirements and applicable cancellation or dispute procedures will be governed by the disclosed order agreement.",
    ],
  },
  {
    id: "topups",
    title: "VII. Account Top-Ups",
    blocks: [
      "7.1. When a user's account meets the published financial and eligibility requirements for promotion to the next membership level, the system may automatically update the account.",
      "7.2. Top-up amounts are entirely at the user's discretion. Users should make financial decisions based on their individual circumstances and risk tolerance.",
      "7.3. Before accepting a Premium Properties order that requires additional funds, users must be provided with a clear breakdown of the required amount, associated risks, and applicable terms. No additional deposit should be treated as a mandatory withdrawal-unlocking fee.",
      "7.4. Users should verify all official wallet addresses through independently authenticated platform channels before initiating cryptocurrency transfers.",
      "7.5. Users must carefully verify the destination wallet address and supported blockchain network before making a transfer. Cryptocurrency transactions may be irreversible.",
      "7.6. If a user's platform balance exceeds 20,000 USDC, any additional verification or high-value withdrawal procedures must be disclosed in advance, including applicable fees and processing requirements.",
    ],
  },
  {
    id: "promotion",
    title: "VIII. Properties Promotion System",
    blocks: [
      "8.1. The platform may update property listings based on market conditions, promotional requirements, and partner instructions. Where an order has a completion deadline, users must be informed of the deadline and relevant requirements before accepting the order. An eight-hour completion period may apply where expressly specified.",
      "8.2. If a user cannot complete an accepted Properties order within the designated period, they may contact customer support to request an extension. Any account restrictions, order holds, or merchant-related claims must be supported by documented reasons and communicated to the affected user.",
    ],
  },
  {
    id: "referral",
    title: "IX. Invitation and Referral Program",
    blocks: [
      "9.1. Users who achieve Expert membership status may become eligible to participate in the platform's invitation program.",
      "9.2. Eligible users may invite others after completing their outstanding Properties orders.",
      "9.3. The inviter may receive a referral commission of 20%, calculated according to the published referral commission policy. The calculation basis, eligibility conditions, and payment schedule must be clearly disclosed.",
    ],
  },
  {
    id: "hours",
    title: "X. Platform Operating Hours",
    blocks: [
      "10.1. Platform Operating Hours: 11:00 AM – 11:00 PM Eastern Time (ET).",
      "10.2. Customer Support Hours: 11:00 AM – 11:00 PM Eastern Time (ET). Users may submit support requests outside these hours, which will be addressed during the next available support period.",
    ],
  },
  {
    id: "credit",
    title: "XI. Credit Score System",
    blocks: [
      "11.1. The platform may maintain a performance or compliance scoring system to monitor users' completion of assigned Properties orders and adherence to platform requirements. Any deductions must be based on clearly disclosed criteria, with supporting records and an explanation available to the affected user.",
      "11.2. If a credit score is used as a withdrawal eligibility criterion, the applicable requirements must be disclosed before users deposit funds or accept orders.",
      "11.3. Users must be able to review their current credit score, understand any deductions, and submit a dispute or correction request through official customer support.",
    ],
  },
];

export default function TermsAndConditionsPage() {
  const { t } = useLanguage();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#E05305]/10 flex items-center justify-center">
            <FileText size={20} className="text-[#E05305]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            {t("nav.terms") || "Terms & Conditions"}
          </h1>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Please read these terms carefully before using the Saffron Edge platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <div className="sticky top-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Contents</p>
            <nav className="space-y-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-[#E05305] py-1.5 transition-colors"
                >
                  <ChevronRight size={14} className="shrink-0" />
                  <span className="truncate">{s.title}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <main className="lg:col-span-3 space-y-6">
          {sections.map((s) => (
            <section
              key={s.id}
              id={s.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 md:p-6 shadow-sm scroll-mt-24"
            >
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white mb-4">
                {s.title}
              </h2>
              <div className="space-y-3">
                {s.blocks.map((b, i) => (
                  <p key={i} className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {b}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>

      {showTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#E05305] text-white flex items-center justify-center shadow-lg hover:bg-[#c84a04] transition-colors"
          aria-label="Back to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
