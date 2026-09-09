const STRIPE_SECRET_KEY_PATTERN = /^sk_(?:test|live)_/;

export function resolveStripeSecretKey(
  stripeSecretKey: string | undefined,
  stripeApiKey: string | undefined,
): string {
  const serverKey = [stripeSecretKey, stripeApiKey]
    .find((candidate) =>
      candidate && STRIPE_SECRET_KEY_PATTERN.test(candidate)
    );

  if (!serverKey) {
    throw new Error("Stripe server secret is not configured");
  }

  return serverKey;
}
