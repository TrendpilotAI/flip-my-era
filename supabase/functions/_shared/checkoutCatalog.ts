export type CheckoutProductType = "credits" | "subscription";

export interface CheckoutProductDefinition {
  priceEnv: string;
  credits: number;
  productType: CheckoutProductType;
  mode: "payment" | "subscription";
}

export interface ResolvedCheckoutProduct extends CheckoutProductDefinition {
  priceId: string;
}

// Price IDs live only in Supabase secrets. Clients send a stable plan name and
// cannot select an arbitrary Stripe Price object.
export const CHECKOUT_CATALOG: Readonly<
  Record<string, CheckoutProductDefinition>
> = {
  single: {
    priceEnv: "STRIPE_PRICE_SINGLE",
    credits: 5,
    productType: "credits",
    mode: "payment",
  },
  album: {
    priceEnv: "STRIPE_PRICE_ALBUM",
    credits: 20,
    productType: "credits",
    mode: "payment",
  },
  tour: {
    priceEnv: "STRIPE_PRICE_TOUR",
    credits: 50,
    productType: "credits",
    mode: "payment",
  },
  speakNow: {
    priceEnv: "STRIPE_PRICE_SPEAK_NOW_MONTHLY",
    credits: 30,
    productType: "subscription",
    mode: "subscription",
  },
  midnights: {
    priceEnv: "STRIPE_PRICE_MIDNIGHTS_MONTHLY",
    credits: 75,
    productType: "subscription",
    mode: "subscription",
  },
  erasTour: {
    priceEnv: "STRIPE_PRICE_ERAS_TOUR_MONTHLY",
    credits: 150,
    productType: "subscription",
    mode: "subscription",
  },
  speakNowAnnual: {
    priceEnv: "STRIPE_PRICE_SPEAK_NOW_ANNUAL",
    credits: 360,
    productType: "subscription",
    mode: "subscription",
  },
  midnightsAnnual: {
    priceEnv: "STRIPE_PRICE_MIDNIGHTS_ANNUAL",
    credits: 900,
    productType: "subscription",
    mode: "subscription",
  },
  erasTourAnnual: {
    priceEnv: "STRIPE_PRICE_ERAS_TOUR_ANNUAL",
    credits: 1800,
    productType: "subscription",
    mode: "subscription",
  },
  // Legacy aliases retained for old links and bookmarks.
  starter: {
    priceEnv: "STRIPE_PRICE_SPEAK_NOW_MONTHLY",
    credits: 30,
    productType: "subscription",
    mode: "subscription",
  },
  deluxe: {
    priceEnv: "STRIPE_PRICE_MIDNIGHTS_MONTHLY",
    credits: 75,
    productType: "subscription",
    mode: "subscription",
  },
  vip: {
    priceEnv: "STRIPE_PRICE_ERAS_TOUR_MONTHLY",
    credits: 150,
    productType: "subscription",
    mode: "subscription",
  },
  "starter-pack": {
    priceEnv: "STRIPE_PRICE_SINGLE",
    credits: 5,
    productType: "credits",
    mode: "payment",
  },
  "creator-pack": {
    priceEnv: "STRIPE_PRICE_ALBUM",
    credits: 20,
    productType: "credits",
    mode: "payment",
  },
  "studio-pack": {
    priceEnv: "STRIPE_PRICE_TOUR",
    credits: 50,
    productType: "credits",
    mode: "payment",
  },
};

export function resolveCheckoutProduct(
  plan: unknown,
  requestedType: unknown,
  getEnv: (name: string) => string | undefined,
): ResolvedCheckoutProduct | null {
  if (typeof plan !== "string") return null;

  const definition = CHECKOUT_CATALOG[plan];
  if (!definition) return null;
  if (requestedType !== undefined && requestedType !== definition.productType) {
    return null;
  }

  const priceId = getEnv(definition.priceEnv)?.trim();
  if (!priceId || !priceId.startsWith("price_")) {
    throw new Error(`Stripe price is not configured for plan: ${plan}`);
  }

  return { ...definition, priceId };
}
