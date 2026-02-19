import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — FlipMyEra</title>
        <meta name="description" content="FlipMyEra Privacy Policy — how we collect, use, and protect your data." />
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-8">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8">Last updated: February 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">1. Introduction</h2>
            <p>FlipMyEra ("we," "us," or "our") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service. This policy is designed to comply with the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium mt-4 mb-2">Information you provide:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account information:</strong> Name, email address, profile picture (via Clerk authentication).</li>
              <li><strong>Story inputs:</strong> Personal details, life events, and preferences you provide to generate stories.</li>
              <li><strong>Payment information:</strong> Processed by Stripe — we do not store credit card numbers.</li>
            </ul>
            <h3 className="text-lg font-medium mt-4 mb-2">Information collected automatically:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Usage data:</strong> Pages visited, features used, session duration (via PostHog analytics).</li>
              <li><strong>Device information:</strong> Browser type, operating system, screen resolution.</li>
              <li><strong>Error data:</strong> Crash reports and performance metrics (via Sentry).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To generate personalized AI stories and ebooks.</li>
              <li>To process payments and manage subscriptions.</li>
              <li>To improve our service through analytics and error tracking.</li>
              <li>To communicate with you about your account and service updates.</li>
              <li>To prevent fraud and ensure security.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. Third-Party Services</h2>
            <p>We use the following third-party services that may process your data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase</strong> — Database and backend infrastructure. <a href="https://supabase.com/privacy" className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
              <li><strong>Stripe</strong> — Payment processing. <a href="https://stripe.com/privacy" className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
              <li><strong>Clerk</strong> — Authentication and user management. <a href="https://clerk.com/privacy" className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
              <li><strong>PostHog</strong> — Product analytics. <a href="https://posthog.com/privacy" className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
              <li><strong>Sentry</strong> — Error tracking and performance monitoring. <a href="https://sentry.io/privacy/" className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
              <li><strong>Cloudflare</strong> — Security (Turnstile CAPTCHA). <a href="https://www.cloudflare.com/privacypolicy/" className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential cookies:</strong> Authentication session management (Clerk).</li>
              <li><strong>Analytics cookies:</strong> Understanding usage patterns (PostHog).</li>
              <li><strong>Performance cookies:</strong> Error tracking and performance monitoring (Sentry).</li>
            </ul>
            <p className="mt-2">You can control cookies through your browser settings. Disabling essential cookies may prevent you from using the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account data is retained while your account is active.</li>
              <li>Generated stories and ebooks are retained until you delete them or your account.</li>
              <li>Payment records are retained as required by law (typically 7 years).</li>
              <li>Analytics data is retained for up to 24 months.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. Your Rights (GDPR & CCPA)</h2>
            <p>Depending on your jurisdiction, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data.</li>
              <li><strong>Rectification:</strong> Correct inaccurate personal data.</li>
              <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten").</li>
              <li><strong>Portability:</strong> Receive your data in a portable format.</li>
              <li><strong>Opt-out:</strong> Opt out of the sale of personal information (CCPA). We do not sell your personal information.</li>
              <li><strong>Non-discrimination:</strong> Exercise your rights without discriminatory treatment.</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, contact us at <a href="mailto:support@flipmyera.com" className="text-purple-600 hover:underline">support@flipmyera.com</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">8. Data Security</h2>
            <p>We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption in transit (TLS/SSL) and at rest.</li>
              <li>Row-Level Security (RLS) policies on all database tables.</li>
              <li>Secure authentication via Clerk.</li>
              <li>Regular security audits.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">9. Children's Privacy</h2>
            <p>The Service is not directed to children under 13. We do not knowingly collect information from children under 13. If you believe we have collected such information, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">11. Contact Us</h2>
            <p>For privacy-related questions or to exercise your rights:</p>
            <p>Email: <a href="mailto:support@flipmyera.com" className="text-purple-600 hover:underline">support@flipmyera.com</a></p>
          </section>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
