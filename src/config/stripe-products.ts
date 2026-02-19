/**
 * Centralized Stripe Product Configuration
 * 
 * Tiered pricing: Debut (Free) / Speak Now ($4.99) / Midnights ($9.99)
 * À la carte credit packs: Single / Album / Tour
 * 
 * Note: Stripe price/product IDs are placeholders — update after creating
 * products in the Stripe Dashboard.
 */

export interface StripeProduct {
  productId: string;
  priceId: string;
  credits: number;
  price: number;
  name?: string;
  description?: string;
}

export interface StripeSubscription extends StripeProduct {
  interval: 'monthly' | 'annual';
  features?: string[];
}

export type TierKey = 'debut' | 'speakNow' | 'midnights';
export type CreditPackKey = 'single' | 'album' | 'tour';

export const STRIPE_PRODUCTS = {
  // ─── À La Carte Credit Packs ───────────────────────────────
  credits: {
    single: {
      productId: "prod_credit_single",
      priceId: import.meta.env.VITE_STRIPE_PRICE_SINGLE || "price_single_placeholder",
      credits: 5,
      price: 2.99,
      name: "Single",
      description: "5 credits — quick creative burst",
    },
    album: {
      productId: "prod_credit_album",
      priceId: import.meta.env.VITE_STRIPE_PRICE_ALBUM || "price_album_placeholder",
      credits: 20,
      price: 9.99,
      name: "Album",
      description: "20 credits — a full creative session",
    },
    tour: {
      productId: "prod_credit_tour",
      priceId: import.meta.env.VITE_STRIPE_PRICE_TOUR || "price_tour_placeholder",
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
      productId: "prod_debut",
      priceId: "price_free",
      credits: 3,
      price: 0,
      interval: 'monthly' as const,
      name: "Debut",
      description: "Start your era — free forever",
      features: [
        "3 free credits on signup",
        "1 era theme unlocked",
        "Watermarked exports",
        "Basic story generation",
        "Community access",
      ],
    },
    speakNow: {
      productId: "prod_speak_now",
      priceId: import.meta.env.VITE_STRIPE_PRICE_SPEAK_NOW || "price_speak_now_monthly_placeholder",
      credits: 15,
      price: 4.99,
      interval: 'monthly' as const,
      name: "Speak Now",
      description: "Find your voice",
      features: [
        "15 credits per month",
        "All era themes unlocked",
        "No watermark on exports",
        "Basic templates",
        "High-quality illustrations",
        "Priority support",
      ],
    },
    midnights: {
      productId: "prod_midnights",
      priceId: import.meta.env.VITE_STRIPE_PRICE_MIDNIGHTS || "price_midnights_monthly_placeholder",
      credits: 40,
      price: 9.99,
      interval: 'monthly' as const,
      name: "Midnights",
      description: "You're the main character",
      features: [
        "40 credits per month",
        "All era themes unlocked",
        "No watermark on exports",
        "Premium templates (100+)",
        "Priority generation queue",
        "Early access to new features",
        "AI layout suggestions",
        "Print-ready exports",
        "Vault content drops",
      ],
    },

    // Annual (2 months free)
    speakNowAnnual: {
      productId: "prod_speak_now",
      priceId: import.meta.env.VITE_STRIPE_PRICE_SPEAK_NOW_ANNUAL || "price_speak_now_annual_placeholder",
      credits: 15,
      price: 3.99, // per month, billed $47.88/yr
      interval: 'annual' as const,
      name: "Speak Now (Annual)",
      description: "Find your voice — save with annual billing",
      features: [
        "15 credits per month",
        "All era themes unlocked",
        "No watermark on exports",
        "Basic templates",
        "High-quality illustrations",
        "Priority support",
      ],
    },
    midnightsAnnual: {
      productId: "prod_midnights",
      priceId: import.meta.env.VITE_STRIPE_PRICE_MIDNIGHTS_ANNUAL || "price_midnights_annual_placeholder",
      credits: 40,
      price: 7.99, // per month, billed $95.88/yr
      interval: 'annual' as const,
      name: "Midnights (Annual)",
      description: "You're the main character — save with annual billing",
      features: [
        "40 credits per month",
        "All era themes unlocked",
        "No watermark on exports",
        "Premium templates (100+)",
        "Priority generation queue",
        "Early access to new features",
        "AI layout suggestions",
        "Print-ready exports",
        "Vault content drops",
      ],
    },

    // ── Legacy aliases ──
    /** @deprecated Use `debut` */
    get starter() { return this.speakNow; },
    /** @deprecated Use `speakNow` */
    get deluxe() { return this.midnights; },
    /** @deprecated Use `midnights` */
    get vip() { return this.midnights; },
  },
};

/**
 * Helper function to get credits for a given plan or price ID
 */
export function getCreditsForPlan(planOrPriceId: string): number {
  // Check credit packs
  for (const [key, product] of Object.entries(STRIPE_PRODUCTS.credits)) {
    if (typeof product === 'object' && 'credits' in product) {
      if (key === planOrPriceId || product.priceId === planOrPriceId) {
        return product.credits;
      }
    }
  }
  
  // Check subscriptions
  for (const [key, product] of Object.entries(STRIPE_PRODUCTS.subscriptions)) {
    if (typeof product === 'object' && 'credits' in product) {
      if (key === planOrPriceId || product.priceId === planOrPriceId) {
        return product.credits;
      }
    }
  }
  
  return 0;
}

/**
 * Helper function to get product details by price ID
 */
export function getProductByPriceId(priceId: string): StripeProduct | StripeSubscription | null {
  for (const product of Object.values(STRIPE_PRODUCTS.credits)) {
    if (typeof product === 'object' && 'priceId' in product && product.priceId === priceId) {
      return product as StripeProduct;
    }
  }

  for (const product of Object.values(STRIPE_PRODUCTS.subscriptions)) {
    if (typeof product === 'object' && 'priceId' in product && product.priceId === priceId) {
      return product as StripeSubscription;
    }
  }

  return null;
}
