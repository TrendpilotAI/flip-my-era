/**
 * Centralized Stripe Product Configuration
 * 
 * This file contains all Stripe product and price IDs in one location.
 * Price IDs can be overridden via environment variables.
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

export const STRIPE_PRODUCTS = {
  // Credit Packs (One-time purchases)
  credits: {
    starter: {
      productId: "prod_T6Bh9entCOJCNA",
      priceId: import.meta.env.VITE_STRIPE_PRICE_25_CREDITS || "price_1S9zK25U03MNTw3qMH90DnC1",
      credits: 25,
      price: 25.00,
      name: "$25 Credit Pack",
      description: "Perfect for a story project"
    },
    creator: {
      productId: "prod_T6BhQaa0OH644p",
      priceId: import.meta.env.VITE_STRIPE_PRICE_55_CREDITS || "price_1S9zK25U03MNTw3qFkq00yiu",
      credits: 55,
      price: 50.00,
      name: "$50 Credit Pack",
      description: "Best value for creators (10% bonus)"
    },
    studio: {
      productId: "prod_T6BhrpyA6MJQzK",
      priceId: import.meta.env.VITE_STRIPE_PRICE_120_CREDITS || "price_1S9zK35U03MNTw3qpmqEDL80",
      credits: 120,
      price: 100.00,
      name: "$100 Credit Pack",
      description: "Maximum value pack (20% bonus)"
    }
  },
  
  // Subscriptions (Recurring)
  subscriptions: {
    starter: {
      productId: "prod_T6BhtW05ZjAkHC",
      priceId: import.meta.env.VITE_STRIPE_PRICE_STARTER || "price_1S9zK15U03MNTw3qAO5JnplW",
      credits: 30,
      price: 12.99,
      interval: 'monthly' as const,
      name: "Swiftie Starter",
      description: "Perfect for Taylor Swift fans",
      features: [
        "30 credits per month",
        "Taylor Swift era templates",
        "High-quality illustrations",
        "Character portraits",
        "Priority support"
      ]
    },
    deluxe: {
      productId: "prod_T6BhX2nQGqxdmm",
      priceId: import.meta.env.VITE_STRIPE_PRICE_DELUXE || "price_1S9zK25U03MNTw3qdDnUn7hk",
      credits: 75,
      price: 25.00,
      interval: 'monthly' as const,
      name: "Swiftie Deluxe",
      description: "For content creators",
      features: [
        "75 credits per month",
        "Everything in Starter",
        "Cinematic spreads",
        "TikTok-ready animations",
        "Priority GPU processing",
        "Commercial licensing",
        "30% off extra credits"
      ]
    },
    vip: {
      productId: "prod_T6Bhc1NIFJgcuW",
      priceId: import.meta.env.VITE_STRIPE_PRICE_VIP || "price_1S9zK25U03MNTw3qoCHo9KzE",
      credits: 150,
      price: 49.99,
      interval: 'monthly' as const,
      name: "Opus VIP",
      description: "For professional creators",
      features: [
        "150 credits per month",
        "Everything in Deluxe",
        "AI audio narration",
        "Analytics dashboard",
        "Commercial distribution tools",
        "Sell on Kindle, Gumroad, etc.",
        "Custom creator features"
      ]
    }
  }
};

/**
 * Helper function to get credits for a given plan or price ID
 */
export function getCreditsForPlan(planOrPriceId: string): number {
  // Check credit packs
  for (const [key, product] of Object.entries(STRIPE_PRODUCTS.credits)) {
    if (key === planOrPriceId || product.priceId === planOrPriceId) {
      return product.credits;
    }
  }
  
  // Check subscriptions
  for (const [key, product] of Object.entries(STRIPE_PRODUCTS.subscriptions)) {
    if (key === planOrPriceId || product.priceId === planOrPriceId) {
      return product.credits;
    }
  }
  
  // Default to 0 if not found
  return 0;
}

/**
 * Helper function to get product details by price ID
 */
export function getProductByPriceId(priceId: string): StripeProduct | StripeSubscription | null {
  // Check credit packs
  for (const product of Object.values(STRIPE_PRODUCTS.credits)) {
    if (product.priceId === priceId) {
      return product;
    }
  }
  
  // Check subscriptions
  for (const product of Object.values(STRIPE_PRODUCTS.subscriptions)) {
    if (product.priceId === priceId) {
      return product;
    }
  }
  
  return null;
}
