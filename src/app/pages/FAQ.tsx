import { SEO } from '@/modules/shared/components/SEO';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/modules/shared/components/ui/accordion";
import { FREE_SIGNUP_CREDITS, STRIPE_PRODUCTS } from '@/config/stripe-products';

const plans = STRIPE_PRODUCTS.subscriptions;
const packs = STRIPE_PRODUCTS.credits;

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
            Credits are the currency you use to create content on FlipMyEra. Subscriptions add credits at each monthly or annual renewal, while one-time credit purchases let you top up as needed.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="general-2">
          <AccordionTrigger>Can I change plans anytime?</AccordionTrigger>
          <AccordionContent>
            You can manage your subscription from the billing portal. Stripe shows the effective date and any billing adjustment before a change is confirmed.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="general-3">
          <AccordionTrigger>What happens if I cancel my subscription?</AccordionTrigger>
          <AccordionContent>
            The billing portal shows when your paid access ends. The free tier includes a one-time signup credit grant rather than a recurring monthly allowance.
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
            New accounts receive {FREE_SIGNUP_CREDITS} credits at signup, plus story and ebook creation, a personal ebook library, and the community gallery.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="free-2">
          <AccordionTrigger>How many stories can I create with the free plan?</AccordionTrigger>
          <AccordionContent>
            Credit cost depends on the story and media options you select. FlipMyEra shows the cost before generation so you can decide how to use your {FREE_SIGNUP_CREDITS} signup credits.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="free-3">
          <AccordionTrigger>Do free credits roll over?</AccordionTrigger>
          <AccordionContent>
            The free credits are granted once when your account is provisioned; they are not a monthly allowance.
          </AccordionContent>
        </AccordionItem>

        {/* Credit Usage Questions */}
        <AccordionItem value="credits-1">
          <AccordionTrigger>How do credits work?</AccordionTrigger>
          <AccordionContent>
            Credits pay for generation work. The cost varies with your selected format, length, illustrations, and other options, and is shown before generation begins.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="credits-2">
          <AccordionTrigger>Can I buy extra credits without a subscription?</AccordionTrigger>
          <AccordionContent>
            Yes. You can purchase any current credit pack without a subscription:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>{packs.single.credits} credits for ${packs.single.price.toFixed(2)}</li>
              <li>{packs.album.credits} credits for ${packs.album.price.toFixed(2)}</li>
              <li>{packs.tour.credits} credits for ${packs.tour.price.toFixed(2)}</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="credits-3">
          <AccordionTrigger>Do credits expire?</AccordionTrigger>
          <AccordionContent>
            Credits remain in your balance until they are used. Monthly subscriptions add credits at each monthly renewal; annual subscriptions grant the displayed annual amount at each annual renewal.
          </AccordionContent>
        </AccordionItem>

        {/* Plan-Specific Questions */}
        <AccordionItem value="plans-1">
          <AccordionTrigger>What's included with {plans.speakNow.name} (${plans.speakNow.price.toFixed(2)})?</AccordionTrigger>
          <AccordionContent>
            {plans.speakNow.credits} credits per month, story and ebook creation, your personal library, and community gallery publishing.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="plans-2">
          <AccordionTrigger>What's included with {plans.midnights.name} (${plans.midnights.price.toFixed(2)})?</AccordionTrigger>
          <AccordionContent>
            {plans.midnights.credits} credits per month with the same creation, personal library, and community publishing workflows.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="plans-3">
          <AccordionTrigger>What's included with {plans.erasTour.name} (${plans.erasTour.price.toFixed(2)})?</AccordionTrigger>
          <AccordionContent>
            {plans.erasTour.credits} credits per month with the highest monthly generation allowance and the same creation, personal library, and community publishing workflows.
          </AccordionContent>
        </AccordionItem>

        {/* Technical Questions */}
        <AccordionItem value="tech-1">
          <AccordionTrigger>How fast is content generation?</AccordionTrigger>
          <AccordionContent>
            Generation time varies with story length, illustration choices, and service demand. Progress is shown while the work runs.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tech-2">
          <AccordionTrigger>Can I use FlipMyEra commercially?</AccordionTrigger>
          <AccordionContent>
            A subscription does not grant rights to third-party names, likenesses, lyrics, trademarks, or source material. Review the applicable terms and your source-material rights before commercial use.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tech-3">
          <AccordionTrigger>Is there an API for developers?</AccordionTrigger>
          <AccordionContent>
            Not currently. Current plans cover FlipMyEra's web story and ebook workflows; no public developer API is included.
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
            Refund eligibility depends on the purchase and the terms shown at checkout. Contact support with the Stripe receipt for review.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="billing-4">
          <AccordionTrigger>Do you offer annual plans?</AccordionTrigger>
          <AccordionContent>
            Yes. Speak Now, Midnights, and The Eras Tour are available monthly or annually. Annual plans grant the displayed annual credit amount when purchased.
          </AccordionContent>
        </AccordionItem>

        {/* Support Questions */}
        <AccordionItem value="support-1">
          <AccordionTrigger>How do I contact support?</AccordionTrigger>
          <AccordionContent>
            Use the support contact shown in your account. Current plans do not promise tier-specific response times.
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
