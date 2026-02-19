import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service — FlipMyEra</title>
        <meta name="description" content="FlipMyEra Terms of Service" />
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-8">Last updated: February 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using FlipMyEra ("the Service"), operated by FlipMyEra ("we," "us," or "our"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. Description of Service</h2>
            <p>FlipMyEra is an AI-powered platform that generates personalized alternate-timeline stories and ebooks based on user-provided information. Content is generated using artificial intelligence and is fictional in nature.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. AI-Generated Content</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All stories and images produced by FlipMyEra are AI-generated and fictional.</li>
              <li>We do not guarantee the accuracy, completeness, or suitability of any generated content.</li>
              <li>You acknowledge that AI outputs may occasionally produce unexpected, inaccurate, or inappropriate results.</li>
              <li>Generated content should not be relied upon as factual or biographical.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 13 years of age to use the Service.</li>
              <li>One person or entity may not maintain more than one account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. User Responsibilities</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any unlawful purpose or to generate harmful content.</li>
              <li>Attempt to reverse-engineer, decompile, or hack the Service.</li>
              <li>Share your account credentials with others.</li>
              <li>Use automated tools to access the Service without authorization.</li>
              <li>Infringe on the intellectual property rights of others through your use of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. Payment Terms</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payments are processed securely through Stripe.</li>
              <li>Credits and subscription plans are billed as described at the time of purchase.</li>
              <li>All prices are listed in USD unless otherwise stated.</li>
              <li>Subscription renewals are automatic unless cancelled before the renewal date.</li>
              <li>You are responsible for any applicable taxes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. Refund Policy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Unused credits may be refunded within 14 days of purchase.</li>
              <li>Once credits have been used to generate content, they are non-refundable.</li>
              <li>Subscription fees for the current billing period are non-refundable upon cancellation, but you will retain access until the end of the period.</li>
              <li>To request a refund, contact us at <a href="mailto:support@flipmyera.com" className="text-purple-600 hover:underline">support@flipmyera.com</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">8. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You retain ownership of the personal information you provide to generate stories.</li>
              <li>You are granted a personal, non-exclusive license to use AI-generated content for personal purposes.</li>
              <li>The FlipMyEra platform, brand, and underlying technology remain our intellectual property.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, FlipMyEra shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">10. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at any time for violation of these Terms. You may delete your account at any time through your account settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">11. Changes to Terms</h2>
            <p>We may update these Terms from time to time. We will notify users of material changes via email or in-app notification. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">12. Contact</h2>
            <p>Questions about these Terms? Contact us at <a href="mailto:support@flipmyera.com" className="text-purple-600 hover:underline">support@flipmyera.com</a>.</p>
          </section>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;
