import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/modules/shared/components/SEO';
import { useApiCheck } from '@/modules/shared/hooks/useApiCheck';
import { useClerkAuth } from '@/modules/auth/contexts';
import { Button } from "@/modules/shared/components/ui/button";
import { Card, CardContent } from "@/modules/shared/components/ui/card";
import { AuthDialog } from "@/modules/shared/components/AuthDialog";
import { HeroGallery } from "@/modules/shared/components/HeroGallery";
import { StoryWizard } from "@/modules/story/components/StoryWizard";
import { StoryWizardProvider } from "@/modules/story/contexts/StoryWizardContext";
import { AnimatedShaderBackground } from "@/modules/shared/components/AnimatedShaderBackground";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/modules/shared/components/ui/accordion";
import { BookOpen, Sparkles, User, Shield, Zap, Heart, CheckCircle, ArrowRight } from "lucide-react";
import { OnboardingFlow } from "@/modules/onboarding";
import { FREE_SIGNUP_CREDITS } from "@/config/stripe-products";

const PRODUCT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "FlipMyEra Personalized Era-Inspired Storybook Creator",
  "description": "Create a personalized era-inspired storybook starring you. Upload your photo, choose a theme, and generate an illustrated storybook.",
  "url": "https://flipmyera.com",
  "image": "https://flipmyera.com/og-image.png",
  "brand": { "@type": "Brand", "name": "FlipMyEra" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": "0",
    "priceValidUntil": "2027-01-01",
    "availability": "https://schema.org/InStock",
    "url": "https://flipmyera.com",
    "description": `Free to start with ${FREE_SIGNUP_CREDITS} credits at signup. No credit card required.`
  },
  "keywords": "Taylor Swift era storybook, Eras Tour keepsake, personalized Swiftie gift, folklore storybook, midnights photo book, friendship bracelet book"
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is FlipMyEra really free to start?",
      "acceptedAnswer": { "@type": "Answer", "text": `Yes. Every new account gets ${FREE_SIGNUP_CREDITS} credits at signup. No credit card is required.` }
    },
    {
      "@type": "Question",
      "name": "How long does it take to create a storybook?",
      "acceptedAnswer": { "@type": "Answer", "text": "Generation time varies with story length, illustration choices, and service demand. FlipMyEra shows progress while your storybook is created." }
    },
    {
      "@type": "Question",
      "name": "What Taylor Swift eras and themes are available?",
      "acceptedAnswer": { "@type": "Answer", "text": "The creator displays the era-inspired themes currently available, including Folklore/Evermore, Midnights, 1989, Red, Reputation, Lover, and Showgirl." }
    },
    {
      "@type": "Question",
      "name": "Can I print or share my Taylor Swift storybooks?",
      "acceptedAnswer": { "@type": "Answer", "text": "Absolutely! All plans include PDF exports perfect for printing. Share digitally or create beautiful physical copies of your Eras Tour stories." }
    },
    {
      "@type": "Question",
      "name": "Is my payment information secure?",
      "acceptedAnswer": { "@type": "Answer", "text": "Stripe-hosted Checkout handles card entry, so FlipMyEra does not receive or store your full card details." }
    }
  ]
};

const Index = () => {
  useApiCheck();
  const { isAuthenticated } = useClerkAuth();
  const wizardRef = useRef<HTMLDivElement>(null);

  const scrollToWizard = () => {
    wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-rose-50/70 via-background to-sky-50/70 dark:from-neutral-950 dark:via-neutral-900 dark:to-slate-950">
      <SEO
        title="Taylor Swift Eras Tour Personalized Storybook Creator"
        url="/"
        description="Create a personalized era-inspired storybook starring you. Upload your photo, choose a theme, and generate an illustrated ebook. Free to start."
        jsonLd={[PRODUCT_SCHEMA, FAQ_SCHEMA]}
      />
      {/* First-time user onboarding flow */}
      <OnboardingFlow />

      {/* Animated Shader Background */}
      <AnimatedShaderBackground className="z-0" />
      
      <div className="relative z-10">
        {/* Hero Section */}
        <HeroGallery animationDelay={0.3} onGetStarted={scrollToWizard} />

        {/* How It Works */}
        <section className="py-16 md:py-20">
          <div className="container max-w-5xl mx-auto px-4">
            <h2 className="mb-4 text-center text-3xl font-bold text-foreground md:text-4xl">
              Create Your Story in 3 Simple Steps
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              No writing experience needed. Our AI does the heavy lifting.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: User, title: "1. Upload Your Photo", desc: "Add a selfie or portrait so you can appear as the main character.", surface: "bg-rose-100 dark:bg-rose-950/50", color: "text-rose-700 dark:text-rose-300" },
                { icon: Sparkles, title: "2. Pick Your Era", desc: "Choose from the era-inspired themes available in the creator.", surface: "bg-sky-100 dark:bg-sky-950/50", color: "text-sky-700 dark:text-sky-300" },
                { icon: BookOpen, title: "3. Get Your Storybook", desc: "Follow generation progress, then read, save, share, or download your illustrated storybook.", surface: "bg-amber-100 dark:bg-amber-950/50", color: "text-amber-700 dark:text-amber-300" },
              ].map((step) => (
                <Card key={step.title} className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="p-8 text-center">
                    <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg ${step.surface}`}>
                      <step.icon className={`h-8 w-8 ${step.color}`} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-10">
              <Button
                size="lg"
                onClick={scrollToWizard}
                className="bg-primary px-10 py-6 text-lg text-primary-foreground shadow-lg hover:bg-primary/90"
              >
                Start Creating. It's Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                No credit card required · {FREE_SIGNUP_CREDITS} free credits at signup
              </p>
            </div>
          </div>
        </section>

        {/* Featured Creators (feature-flagged) */}

        {/* Trust Signals */}
        <section className="border-y border-border py-10">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                <span>Stripe-hosted checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <span>Cost shown before generation</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-sky-600" />
                <span>Live generation progress</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <span>Private and community libraries</span>
              </div>
            </div>
          </div>
        </section>

        {/* Inline FAQ */}
        <section className="py-16 md:py-20">
          <div className="container max-w-3xl mx-auto px-4">
            <h2 className="mb-4 text-center text-3xl font-bold text-foreground md:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-10">
              Everything you need to know before creating your first story
            </p>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="faq-1">
                <AccordionTrigger>Is FlipMyEra really free to start?</AccordionTrigger>
                <AccordionContent>
                  Yes. Every new account gets {FREE_SIGNUP_CREDITS} free credits at signup. No credit card is required.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2">
                <AccordionTrigger>How long does it take to create a storybook?</AccordionTrigger>
                <AccordionContent>
                  Generation time varies with story length, illustration choices, and service demand. FlipMyEra shows progress while your storybook is created.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-3">
                <AccordionTrigger>What eras and themes are available?</AccordionTrigger>
                <AccordionContent>
                  The creator shows every theme currently available, including Folklore/Evermore, Midnights, 1989, Red, Reputation, Lover, and Showgirl.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-4">
                <AccordionTrigger>Can I print or share my storybooks?</AccordionTrigger>
                <AccordionContent>
                  You can read saved ebooks in your library, publish them to the community gallery, and use the available download options.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-5">
                <AccordionTrigger>Is my payment information secure?</AccordionTrigger>
                <AccordionContent>
                  Stripe-hosted Checkout handles card entry, so FlipMyEra does not receive or store your full card details.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <p className="text-center mt-6">
              <Link to="/faq" className="text-sm font-medium text-primary hover:underline">
                View all FAQs →
              </Link>
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-foreground py-16 text-background md:py-24">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Flip Your Era?</h2>
            <p className="text-lg md:text-xl opacity-90 mb-8 max-w-xl mx-auto">
              Create a personalized era-inspired storybook and start with {FREE_SIGNUP_CREDITS} credits. No credit card needed.
            </p>
            <Button
              size="lg"
              onClick={scrollToWizard}
              className="bg-background px-12 py-7 text-lg font-bold text-foreground shadow-lg hover:bg-background/90"
            >
              Create Your First Story Free
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm opacity-80">
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {FREE_SIGNUP_CREDITS} credits at signup</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> No credit card</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Progress shown while generating</span>
            </div>
          </div>
        </section>

        {/* Story Wizard Section */}
        <div ref={wizardRef} className="scroll-mt-8">
          <StoryWizardProvider>
            <StoryWizard />
          </StoryWizardProvider>
        </div>
      </div>
    </div>
  );
};

export default Index;
