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
import { BookOpen, Sparkles, User, Star, Shield, Clock, Zap, Heart, CheckCircle, ArrowRight } from "lucide-react";
import { FeaturedCreators } from "@/modules/creator/FeaturedCreators";
import { FeatureGate } from "@/modules/shared/components/FeatureGate";
import { OnboardingFlow } from "@/modules/onboarding";

const Index = () => {
  useApiCheck();
  const { isAuthenticated } = useClerkAuth();
  const wizardRef = useRef<HTMLDivElement>(null);

  const scrollToWizard = () => {
    wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-blue-50/80 dark:from-gray-900/90 dark:via-purple-950/90 dark:to-gray-900/90">
      <SEO
        url="/"
        description="Create stunning AI-generated personalized storybooks inspired by Taylor Swift's eras. Upload your photo, pick an era, and get a beautifully illustrated story in minutes. Free to start!"
      />
      {/* First-time user onboarding flow */}
      <OnboardingFlow />

      {/* Animated Shader Background */}
      <AnimatedShaderBackground className="z-0" />
      
      <div className="relative z-10">
        {/* Hero Section */}
        <HeroGallery animationDelay={0.3} onGetStarted={scrollToWizard} />

        {/* Social Proof Bar */}
        <section className="py-8 border-y border-purple-100 dark:border-purple-900/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          <div className="container max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">10K+</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Stories Created</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">4.9★</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Average Rating</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-purple-600 bg-clip-text text-transparent">50+</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Era Templates</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">&lt;60s</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Generation Time</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-20">
          <div className="container max-w-5xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-purple-900 via-pink-800 to-blue-900 bg-clip-text text-transparent dark:from-purple-100 dark:via-pink-200 dark:to-blue-100">
              Create Your Story in 3 Simple Steps
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              No writing experience needed. Our AI does the heavy lifting.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: User, title: "1. Upload Your Photo", desc: "Add a selfie or portrait — our AI places you right into the story as the main character." },
                { icon: Sparkles, title: "2. Pick Your Era", desc: "Choose from Folklore, Midnights, 1989, Red, and dozens more era-inspired themes." },
                { icon: BookOpen, title: "3. Get Your Storybook", desc: "In under 60 seconds, receive a beautifully illustrated personalized storybook you can share or print." },
              ].map((step) => (
                <Card key={step.title} className="border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
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
                className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white hover:from-purple-700 hover:to-pink-600 px-10 py-6 text-lg shadow-lg"
              >
                Start Creating — It's Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">No credit card required • 10 free credits</p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-gradient-to-b from-purple-50/50 to-pink-50/50 dark:from-purple-950/30 dark:to-gray-900/30">
          <div className="container max-w-5xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-900 via-pink-800 to-blue-900 bg-clip-text text-transparent dark:from-purple-100 dark:via-pink-200 dark:to-blue-100">
              Loved by Swifties Everywhere
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Emily R.", quote: "I made a Folklore-era storybook for my best friend's birthday. She literally cried. Best gift ever!", rating: 5 },
                { name: "Jess K.", quote: "The illustrations are INSANE. I've made storybooks for every era and they all look like actual published books.", rating: 5 },
                { name: "Sarah M.", quote: "My daughter and I create bedtime stories together using this. She picks the era, I pick the plot. Pure magic.", rating: 5 },
              ].map((t, i) => (
                <Card key={i} className="border-0 shadow-md bg-white/90 dark:bg-gray-800/90">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm italic mb-4">"{t.quote}"</p>
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-400">{t.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Creators (feature-flagged) */}
        <FeatureGate flag="creator_profiles">
          <FeaturedCreators />
        </FeatureGate>

        {/* Trust Signals */}
        <section className="py-10 border-y border-purple-100 dark:border-purple-900/50">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span>Secure Stripe Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>30-Day Money Back</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <span>AI-Powered in &lt;60s</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                <span>Made for Swifties</span>
              </div>
            </div>
          </div>
        </section>

        {/* Inline FAQ */}
        <section className="py-16 md:py-20">
          <div className="container max-w-3xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-purple-900 via-pink-800 to-blue-900 bg-clip-text text-transparent dark:from-purple-100 dark:via-pink-200 dark:to-blue-100">
              Frequently Asked Questions
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-10">
              Everything you need to know before creating your first story
            </p>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="faq-1">
                <AccordionTrigger>Is FlipMyEra really free to start?</AccordionTrigger>
                <AccordionContent>
                  Yes! Every new account gets 10 free credits per month — enough to create 3-5 complete storybooks with illustrations. No credit card required.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2">
                <AccordionTrigger>How long does it take to create a storybook?</AccordionTrigger>
                <AccordionContent>
                  Most storybooks are generated in under 60 seconds. Premium plan users get priority processing that's 3x faster during peak hours.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-3">
                <AccordionTrigger>What eras and themes are available?</AccordionTrigger>
                <AccordionContent>
                  We have 50+ era-inspired templates including Folklore, Midnights, 1989, Red, Reputation, Lover, and many more. New eras are added regularly!
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-4">
                <AccordionTrigger>Can I print or share my storybooks?</AccordionTrigger>
                <AccordionContent>
                  Absolutely! All plans include PDF exports perfect for printing. Share digitally or create beautiful physical copies of your stories.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-5">
                <AccordionTrigger>Is my payment information secure?</AccordionTrigger>
                <AccordionContent>
                  100%. We use Stripe's PCI-compliant payment processing and never store your card details. Plus, all plans come with a 30-day money-back guarantee.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-6">
                <AccordionTrigger>Can I use my storybooks commercially?</AccordionTrigger>
                <AccordionContent>
                  Swiftie Deluxe ($25/mo) and Opus VIP ($49.99/mo) plans include commercial licensing rights to sell or monetize your creations.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <p className="text-center mt-6">
              <Link to="/faq" className="text-purple-600 dark:text-purple-400 hover:underline text-sm font-medium">
                View all FAQs →
              </Link>
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white">
          <div className="container max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Flip Your Era?</h2>
            <p className="text-lg md:text-xl opacity-90 mb-8 max-w-xl mx-auto">
              Join thousands of Swifties creating personalized storybooks. Start free — no credit card needed.
            </p>
            <Button
              size="lg"
              onClick={scrollToWizard}
              className="bg-white text-purple-700 hover:bg-gray-100 px-12 py-7 text-lg font-bold shadow-2xl"
            >
              Create Your First Story Free
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm opacity-80">
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> 10 free credits</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> No credit card</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Ready in 60 seconds</span>
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
