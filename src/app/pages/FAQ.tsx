import { SEO } from '@/modules/shared/components/SEO';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/modules/shared/components/ui/accordion";

const FAQ = () => {
  return (
    <div className="container py-12 max-w-4xl mx-auto">
      <SEO
        title="FAQ"
        description="Frequently asked questions about FlipMyEra pricing, credits, subscriptions and features."
        url="/faq"
      />
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-gray-600 text-lg">
          Everything you need to know about FlipMyEra pricing and features
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {/* General Questions */}
        <AccordionItem value="general-1">
          <AccordionTrigger>What is the difference between credits and subscriptions?</AccordionTrigger>
          <AccordionContent>
            Credits are the currency you use to create content on FlipMyEra. Subscriptions give you a monthly allowance of credits, while one-time credit purchases let you top up as needed.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="general-2">
          <AccordionTrigger>Can I change plans anytime?</AccordionTrigger>
          <AccordionContent>
            Yes! You can upgrade or downgrade your subscription at any time. Changes take effect immediately, and we'll prorate any billing adjustments.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="general-3">
          <AccordionTrigger>What happens if I cancel my subscription?</AccordionTrigger>
          <AccordionContent>
            Your subscription will remain active until the end of your billing period. After that, you'll revert to the free plan with 10 credits per month.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="general-4">
          <AccordionTrigger>Are there any hidden fees?</AccordionTrigger>
          <AccordionContent>
            No hidden fees! All pricing is transparent. Credits never expire, and subscriptions auto-renew unless cancelled.
          </AccordionContent>
        </AccordionItem>

        {/* Free Plan Questions */}
        <AccordionItem value="free-1">
          <AccordionTrigger>What's included in the free plan?</AccordionTrigger>
          <AccordionContent>
            Free users get 10 credits per month (refreshed automatically), basic story generation, simple illustrations, PDF exports, and community access.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="free-2">
          <AccordionTrigger>How many stories can I create with the free plan?</AccordionTrigger>
          <AccordionContent>
            With 10 credits, you can typically create 3-5 complete stories with illustrations, depending on the complexity of your creations.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="free-3">
          <AccordionTrigger>Do free credits roll over?</AccordionTrigger>
          <AccordionContent>
            No, unused credits expire at the end of each month. Your credits refresh to 10 every month automatically.
          </AccordionContent>
        </AccordionItem>

        {/* Credit Usage Questions */}
        <AccordionItem value="credits-1">
          <AccordionTrigger>How do credits work?</AccordionTrigger>
          <AccordionContent>
            Credits are consumed based on what you create:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Single story: 1-2 credits</li>
              <li>Story with illustrations: 2-4 credits</li>
              <li>Children's book: 4-6 credits</li>
              <li>Social media content: 3-5 credits</li>
              <li>Audiobook chapter: 2-3 credits</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="credits-2">
          <AccordionTrigger>Can I buy extra credits without a subscription?</AccordionTrigger>
          <AccordionContent>
            Yes! You can purchase credit packs anytime:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>$25 for 25 credits ($1.00 per credit)</li>
              <li>$50 for 55 credits ($0.91 per credit - 10% bonus!)</li>
              <li>$100 for 120 credits ($0.83 per credit - 20% bonus!)</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="credits-3">
          <AccordionTrigger>Do credits expire?</AccordionTrigger>
          <AccordionContent>
            Subscription credits refresh monthly. One-time purchased credits never expire and can be used anytime.
          </AccordionContent>
        </AccordionItem>

        {/* Plan-Specific Questions */}
        <AccordionItem value="plans-1">
          <AccordionTrigger>What's special about Swiftie Starter ($12.99)?</AccordionTrigger>
          <AccordionContent>
            Perfect for Taylor Swift fans! Includes 30 credits/month, era-specific templates, high-quality illustrations, and character portraits.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="plans-2">
          <AccordionTrigger>Who should get Swiftie Deluxe ($25)?</AccordionTrigger>
          <AccordionContent>
            Content creators and social media influencers. Includes 75 credits/month, cinematic spreads, TikTok-ready animations, and commercial licensing rights.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="plans-3">
          <AccordionTrigger>What's Opus VIP ($49.99) for?</AccordionTrigger>
          <AccordionContent>
            Professional creators. Includes 150 credits/month, AI audio narration, analytics dashboard, and tools for selling your creations commercially.
          </AccordionContent>
        </AccordionItem>

        {/* Technical Questions */}
        <AccordionItem value="tech-1">
          <AccordionTrigger>How fast is content generation?</AccordionTrigger>
          <AccordionContent>
            Standard generation takes 30-60 seconds. Swiftie Deluxe and Opus VIP users get priority processing (3x faster) during peak hours.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tech-2">
          <AccordionTrigger>Can I use FlipMyEra commercially?</AccordionTrigger>
          <AccordionContent>
            Swiftie Deluxe and Opus VIP plans include commercial licensing rights to sell or monetize your creations.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tech-3">
          <AccordionTrigger>Is there an API for developers?</AccordionTrigger>
          <AccordionContent>
            Opus VIP includes API access (10 credits/month). Contact us for enterprise API solutions.
          </AccordionContent>
        </AccordionItem>

        {/* Billing & Payment Questions */}
        <AccordionItem value="billing-1">
          <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
          <AccordionContent>
            We accept all major credit cards through our secure Stripe integration.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="billing-2">
          <AccordionTrigger>Is my payment information secure?</AccordionTrigger>
          <AccordionContent>
            Yes, we use Stripe's PCI-compliant payment processing. We never store your card details.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="billing-3">
          <AccordionTrigger>Can I get a refund?</AccordionTrigger>
          <AccordionContent>
            We offer a 30-day money-back guarantee for all subscription plans. Credit purchases are non-refundable.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="billing-4">
          <AccordionTrigger>Do you offer annual plans?</AccordionTrigger>
          <AccordionContent>
            Currently, we offer monthly subscriptions only, but annual options are in development.
          </AccordionContent>
        </AccordionItem>

        {/* Support Questions */}
        <AccordionItem value="support-1">
          <AccordionTrigger>How do I contact support?</AccordionTrigger>
          <AccordionContent>
            Free users get community support. Paid plans include email support. Opus VIP gets priority support and 24/7 availability.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="support-2">
          <AccordionTrigger>Can I transfer credits between accounts?</AccordionTrigger>
          <AccordionContent>
            Credits are non-transferable for security reasons.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="support-3">
          <AccordionTrigger>What if I need more credits than my plan allows?</AccordionTrigger>
          <AccordionContent>
            You can purchase additional credit packs anytime, or upgrade your subscription for higher monthly allowances.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default FAQ;
