/**
 * Centralized Stripe Product Configuration
 * 
 * Tiered pricing: Debut (Free) / Speak Now ($9.99) / Midnights ($19.99) /
 * The Eras Tour ($49.99)
 * À la carte credit packs: Single / Album / Tour
 *
 * This browser-side catalog is presentation-only. Stripe price IDs are resolved
 * by the create-checkout Edge Function and must never be accepted from clients.
 */

export interface StripeProduct {
  credits: number;
  price: number;
  name?: string;
  description?: string;
  bestValue?: boolean;
}

export interface StripeSubscription extends StripeProduct {
  interval: 'monthly' | 'annual';
  features?: string[];
}

export type TierKey = 'debut' | 'speakNow' | 'midnights' | 'erasTour';
export type CreditPackKey = 'single' | 'album' | 'tour';

export const FREE_SIGNUP_CREDITS = 3;

export const STRIPE_PRODUCTS = {
  // ─── À La Carte Credit Packs ───────────────────────────────
  credits: {
    single: {
      credits: 5,
      price: 2.99,
      name: "Single",
      description: "5 credits — quick creative burst",
    },
    album: {
      credits: 20,
      price: 9.99,
      name: "Album",
      description: "20 credits — a full creative session",
    },
    tour: {
      credits: 50,
      price: 19.99,
      name: "Tour",
      description: "50 credits — best value pack",
      bestValue: true,
    },

    // ── Legacy aliases (keep imports working) ──
    /** @deprecated Use `single` */
    get starter() { return this.single; },
    /** @deprecated Use `album` */
    get creator() { return this.album; },
    /** @deprecated Use `tour` */
    get studio() { return this.tour; },
  },

  // ─── Subscription Tiers ────────────────────────────────────
  subscriptions: {
    // Monthly
    debut: {
      credits: FREE_SIGNUP_CREDITS,
      price: 0,
      interval: 'monthly' as const,
      name: "Debut",
      description: "Start your era — free forever",
      features: [
        `${FREE_SIGNUP_CREDITS} free credits on signup`,
        "Story and ebook creation",
        "Personal ebook library",
        "Community gallery access",
        "Publish controls for your ebooks",
      ],
    },
    speakNow: {
      credits: 30,
      price: 9.99,
      interval: 'monthly' as const,
      name: "Speak Now",
      description: "Find your voice",
      features: [
        "30 credits per month",
        "Story and ebook creation",
        "Personal ebook library",
        "Community gallery publishing",
        "Extra credit packs available anytime",
      ],
    },
    midnights: {
      credits: 75,
      price: 19.99,
      interval: 'monthly' as const,
      name: "Midnights",
      description: "You're the main character",
      features: [
        "75 credits per month",
        "Story and ebook creation",
        "Personal ebook library",
        "Community gallery publishing",
        "Extra credit packs available anytime",
      ],
    },
    erasTour: {
      credits: 150,
      price: 49.99,
      interval: 'monthly' as const,
      name: "The Eras Tour",
      description: "Our highest monthly credit allowance",
      features: [
        "150 credits per month",
        "Story and ebook creation",
        "Personal ebook library",
        "Community gallery publishing",
        "Extra credit packs available anytime",
      ],
    },

    // Annual (2 months free)
    speakNowAnnual: {
      credits: 360,
      price: 7.99, // per month, billed $95.88/yr
      interval: 'annual' as const,
      name: "Speak Now (Annual)",
      description: "Find your voice — save with annual billing",
      features: [
        "360 credits granted annually",
        "Story and ebook creation",
        "Personal ebook library",
        "Community gallery publishing",
        "Extra credit packs available anytime",
      ],
    },
    midnightsAnnual: {
      credits: 900,
      price: 15.99, // per month, billed $191.88/yr
      interval: 'annual' as const,
      name: "Midnights (Annual)",
      description: "You're the main character — save with annual billing",
      features: [
        "900 credits granted annually",
        "Story and ebook creation",
        "Personal ebook library",
        "Community gallery publishing",
        "Extra credit packs available anytime",
      ],
    },
    erasTourAnnual: {
      credits: 1800,
      price: 39.99, // per month, billed $479.88/yr
      interval: 'annual' as const,
      name: "The Eras Tour (Annual)",
      description: "Our highest annual credit allowance",
      features: [
        "1,800 credits granted annually",
        "Story and ebook creation",
        "Personal ebook library",
        "Community gallery publishing",
        "Extra credit packs available anytime",
      ],
    },

    // ── Legacy aliases ──
    /** @deprecated Use `speakNow` */
    get starter() { return this.speakNow; },
    /** @deprecated Use `midnights` */
    get deluxe() { return this.midnights; },
    /** @deprecated Use `erasTour` */
    get vip() { return this.erasTour; },
  },
};

/**
 * Helper function to get credits for a server-recognized plan name.
 */
export function getCreditsForPlan(plan: string): number {
  // Check credit packs
  for (const [key, product] of Object.entries(STRIPE_PRODUCTS.credits)) {
    if (typeof product === 'object' && 'credits' in product) {
      if (key === plan) {
        return product.credits;
      }
    }
  }
  
  // Check subscriptions
  for (const [key, product] of Object.entries(STRIPE_PRODUCTS.subscriptions)) {
    if (typeof product === 'object' && 'credits' in product) {
      if (key === plan) {
        return product.credits;
      }
    }
  }
  
  return 0;
}
