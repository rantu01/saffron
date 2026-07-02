"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/Component/Auth/AuthProvider';
import { Loader2, FileText, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    title: 'I. Car Optimization',
    rules: [
      'A deposit of at least 60 USDT is required for restarting.',
      'Once all orders have been completed, the user must request a full withdrawal and receive the withdrawal amount before requesting a restart.',
    ],
  },
  {
    title: 'II. Withdrawal',
    rules: [
      'The maximum withdrawal limit for VIP1 users is 2500 USDC, the maximum withdrawal limit for VIP2 users is 8000 USDC, and there is no maximum withdrawal limit for VIP3 and VIP4 users.',
      'After completing all orders, users can request a full withdrawal.',
      'No withdrawals or refunds are permitted while an order is being executed.',
      'Users must submit a withdrawal request to the Platform to receive payment.',
    ],
  },
  {
    title: 'III. Funds',
    rules: [
      'User funds will be securely stored in the user\'s account and can be withdrawn in full upon completion of the order.',
      'To prevent loss of funds, all funds are managed by the system and not manually.',
      'In the event of accidental loss of funds, the Platform will assume full responsibility.',
    ],
  },
  {
    title: 'IV. Account Security',
    rules: [
      'Each user is eligible for one workbench account only.',
      'Please do not disclose your password to third parties; if this results in a loss, the Platform will not be liable for such loss.',
      'Users are advised not to set their date of birth, ID card number, or mobile phone number as their withdrawal or login password.',
      'If you forget your login or withdrawal password, you can reset it by contacting online customer service.',
      'The orders to be completed on this platform are real-time data placed by real users. Therefore, users must ensure the confidentiality of both the orders and the platform.',
      'In order to prevent risk control, every user with funds exceeding 10,000 USDC/T needs to open a large-amount channel to apply for withdrawal.',
      'If you have forgotten your funds password, please contact online customer service for reset assistance. For security reasons, a small verification deposit is required. Additionally, if you need to change your linked address, it must first be unlocked by the security department. You will need to pay the required deposit to the security department before making any changes.',
    ],
  },
  {
    title: 'V. Orders',
    rules: [
      'VIP1 has the capacity to complete up to three task groups per day, each group consisting of 40 orders with a profit of 0.5% per order. Able to withdraw 10 times, 0% Charges.',
      'VIP2 has a maximum of four task groups per day, each group consisting of 50 orders. The profit per order is 0.6%. Able to withdraw 10 times, 0% Charges.',
      'VIP3 has a maximum of four activity groups per day, each group consisting of 55 orders. The profit per order is 0.8%. Able to withdraw 10 times, 0% Charges.',
      'VIP4 has the capacity to process up to five activity groups per day, each group consisting of 60 orders. The profit per order is 1%. Able to withdraw 10 times, 0% Charges.',
      'The system will automatically upgrade the user\'s level when the required VIP upgrade conditions are met, eliminating the need for manual applications.',
      'Funds and rewards will be immediately returned to the user\'s account for each completed order.',
      'The system will randomly allocate orders based on the total funds available in the user\'s account.',
      'Once an order has been allocated to a user\'s account, it cannot be canceled or ignored.',
      'To protect the user\'s interests, the order amount will be adjusted based on the total account balance, and the revenue will be increased accordingly.',
    ],
  },
  {
    title: 'VI. About Car Packs (Bulk Orders)',
    rules: [
      'Car packs are randomly allocated by the system. Each Car pack contains one to three Cars. The probability of obtaining one or two Car packs is higher in a single bulk order.',
      'Please note that funds will not be refunded to the user\'s account immediately after receiving the Car Pack. Refunds will only be issued once the pack is completed.',
      'Pack orders will be randomly assigned to the user\'s account based on the user\'s total account balance range.',
      'Once an order has been assigned to a user\'s account, it cannot be canceled or ignored.',
    ],
  },
  {
    title: 'VII. Top-up',
    rules: [
      'When the account recharge amount reaches the standard amount for VIP level upgrade, the system will automatically detect and upgrade the level without the need for the user to manually apply.',
      'The recharge amount is chosen by the user, we can not decide the recharge amount for the user, we recommend that the user recharge according to their own ability or familiarity with the platform.',
      'If the User needs to top up a package order, we recommend that the User tops up according to the negative amount shown in their account.',
      'Users must request and confirm their wallet address with the online customer service before recharging.',
      'The Platform is not responsible for any loss if the User tops up with an incorrect wallet address.',
    ],
  },
  {
    title: 'VIII. Car Ordering System',
    rules: [
      'The workbench updates with different car information every minute. Please note that car information that has not been promoted for a long time will not be uploaded to the system. To protect the rights of developers, users must complete their orders within eight hours. Failure to complete an order within the deadline may result in complaints from car dealers, leading to order freezing.',
      'If users are unable to complete their orders on time, they can contact customer service to apply for an order extension to ensure the safety of their account funds, avoid order freezing, and reduce the risk of complaints from dealers.',
    ],
  },
  {
    title: 'IX. Invitation',
    rules: [
      'After becoming a VIP3 member, you can use the invitation code to invite other users.',
      'Users cannot invite other users if they have not completed all Car orders.',
      'The referrer will receive 20% referral commission.',
    ],
  },
  {
    title: 'X. Operation Time',
    rules: [
      'Platform operating hours are from 11:00 to 22:59.',
      'Online customer service hours are from 11:00 to 22:59.',
      'The platform withdrawal time is from 11:00 to 22:59.',
    ],
  },
  {
    title: 'XI. Credit Value',
    rules: [
      'Credit Score guarantees that the user will complete the specified order within a specific timeframe. If the user fails to complete, the system will automatically deduct the credit score.',
      'Withdrawal of funds requires 100% of the credit score.',
      'The system will automatically check the credit score. If the credit score falls below 100%, you will need to contact online customer service for advice on how to restore the credit score.',
    ],
  },
];

export default function TermsConditionsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-orange-50">
        <Loader2 className="w-8 h-8 text-[#E05305] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-orange-50">
      <main className="px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <Link
            href="/user-dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#E05305] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#E05305] to-[#c84a04] px-8 py-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Terms & Conditions</h1>
                <p className="text-orange-100 text-sm mt-1">
                  Please read these terms carefully before using our platform
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-8 space-y-10">
            <div className="flex items-center gap-3 bg-[#FFF1E9] rounded-xl px-5 py-4">
              <Shield className="w-5 h-5 text-[#E05305] shrink-0" />
              <p className="text-sm text-gray-700">
                Each user is required to read and comply with the following terms and conditions before using the platform.
              </p>
            </div>

            {sections.map((section, idx) => (
              <div key={idx}>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h2>
                <ul className="space-y-3">
                  {section.rules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-600 leading-relaxed">
                      <span className="w-1.5 h-1.5 bg-[#E05305] rounded-full mt-2.5 shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
