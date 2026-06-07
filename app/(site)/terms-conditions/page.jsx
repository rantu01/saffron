export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
          Terms & Conditions
        </h1>
        <p className="text-gray-600 mb-12">
          Last updated: June 2, 2026
        </p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 mt-8">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing and using Saffron Edge (the "Platform"), you agree to be bound by these Terms & Conditions. If you do not agree to any part of these terms, you may not use the Platform.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 mt-8">
              2. Platform Rules & Policies
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Platform is a task-based earning system. Users agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Complete tasks in sequential order as assigned</li>
              <li>Maintain honest and accurate account information</li>
              <li>Not engage in fraudulent or deceptive activities</li>
              <li>Respect intellectual property rights</li>
              <li>Not attempt to circumvent security measures</li>
              <li>Follow all applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 mt-8">
              3. User Accounts
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Users are responsible for maintaining the confidentiality of their account credentials. Any activity under your account is your responsibility. You agree to notify Saffron Edge immediately of any unauthorized access.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 mt-8">
              4. Task Completion & Rewards
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Each task set contains 30 tasks that must be completed sequentially. Rewards are credited upon successful task completion. Tasks may have balance requirements that vary based on task type. Combination tasks offer higher commission (up to 25%) and may appear around task 20-21 in a set.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 mt-8">
              5. Balance & Financial Terms
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Users must maintain sufficient balance to complete assigned tasks. If balance is insufficient, task completion may fail and your account may be temporarily frozen until balance is restored. Balance requirements may vary randomly depending on task type.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 mt-8">
              6. Deposit System
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Deposits are processed through crypto payments with QR code options. Users must submit payment proof (screenshot) after deposit initiation. Admin team manually verifies each payment before crediting balance. Deposits are final and non-refundable once verified.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 mt-8">
              7. Withdrawal System
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Withdrawals require submission of your crypto wallet address and desired withdrawal amount. All withdrawal requests are manually reviewed and approved by our admin team. Processing times may vary. Users must ensure wallet addresses are accurate—Saffron Edge is not responsible for withdrawals sent to incorrect addresses.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 mt-8">
              8. Demo/Training Accounts
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              New users may create demo accounts using a referral code. 20% of demo account profits are credited to the referrer's main account. Demo accounts must be converted to main accounts before withdrawals are permitted.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 mt-8">
              9. Account Suspension & Termination
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Saffron Edge reserves the right to suspend or terminate accounts that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Violate these Terms & Conditions</li>
              <li>Engage in fraudulent activity</li>
              <li>Violate deposit/withdrawal policies</li>
              <li>Breach security protocols</li>
              <li>Remain inactive for extended periods</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 mt-8">
              10. Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Saffron Edge is provided on an "as-is" basis. We are not liable for any indirect, incidental, special, or consequential damages resulting from your use of the Platform. Our total liability shall not exceed the amount you have deposited.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 mt-8">
              11. Modifications to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Saffron Edge may modify these Terms & Conditions at any time. Continued use of the Platform constitutes acceptance of updated terms. Users will be notified of significant changes via email.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 mt-8">
              12. Contact Information
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For questions regarding these Terms & Conditions, please contact our support team through the Platform's customer support portal.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
