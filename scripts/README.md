# Stripe Setup Scripts

This directory contains scripts for setting up and managing Stripe integration for FlipMyEra.

## Setup Stripe Products & Prices

The `setup-stripe-products.js` script creates all necessary Stripe products and prices for the current pricing structure.

### Prerequisites

1. **Stripe Account**: You need a Stripe account with API access
2. **Environment Variables**: Set your Stripe secret key
   ```bash
   export STRIPE_SECRET_KEY=sk_test_...
   # or add to .env file
   STRIPE_SECRET_KEY=sk_test_...
   ```

### Products Created

#### Subscription Plans
- **Free Forever**: $0/month (10 credits)
- **Swiftie Starter**: $12.99/month (30 credits)
- **Swiftie Deluxe**: $25/month (75 credits)
- **Opus VIP**: $49.99/month (150 credits)

#### Credit Packs (One-time)
- **$25 Credit Pack**: 25 credits
- **$50 Credit Pack**: 55 credits (10% bonus)
- **$100 Credit Pack**: 120 credits (20% bonus)

### Running the Setup

```bash
# Make sure you're in the project root
cd /path/to/flip-my-era

# Set your Stripe secret key
export STRIPE_SECRET_KEY=sk_test_your_key_here

# Run the setup script
node scripts/setup-stripe-products.js
```

### Output

The script will output:
- ✅ Created product IDs (e.g., `prod_abc123`)
- ✅ Created price IDs (e.g., `price_xyz789`)
- 📝 Instructions for updating your code

### Updating Your Code

After running the script, update these files with the actual Stripe IDs:

#### 1. Checkout Page (`src/app/pages/Checkout.tsx`)
```typescript
const planOptions: PlanOption[] = [
  {
    id: "starter",
    stripeProductId: "prod_actual_id_here",
    stripePriceId: "price_actual_id_here"
  },
  // ... other plans
];
```

#### 2. Credit Purchase Modal (`src/modules/user/components/CreditPurchaseModal.tsx`)
```typescript
const pricingTiers: PricingTier[] = [
  {
    id: 'starter-pack',
    stripeProductId: 'actual_stripe_product_id',
  },
  // ... other credit packs
];
```

#### 3. Create Checkout Function (`supabase/functions/create-checkout/index.ts`)
```typescript
const priceIds: Record<string, string> = {
  starter: "price_actual_stripe_price_id",
  deluxe: "price_actual_stripe_price_id",
  vip: "price_actual_stripe_price_id"
};
```

### Environment Variables

Make sure these are set in your environment:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase (for webhook processing)
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Testing

After setup, test the integration:

1. **Visit the plan selector**: `/plans`
2. **Test checkout flow**: Select a plan and proceed to Stripe
3. **Test credit purchases**: Use the credit purchase modal
4. **Verify webhooks**: Check that subscription updates work

### Troubleshooting

**Common Issues:**

1. **"Invalid API Key"**: Check your `STRIPE_SECRET_KEY`
2. **"Product not found"**: Make sure the product IDs are correctly updated in your code
3. **"Price not found"**: Ensure price IDs match the created prices

**Debugging:**
- Check Stripe Dashboard → Products & Prices
- Verify webhook endpoints are configured
- Test with Stripe's test card numbers

### Security Notes

- Never commit real Stripe keys to version control
- Use test keys for development
- Regularly rotate API keys
- Monitor Stripe dashboard for suspicious activity

---

## Other Scripts

*More scripts will be added here as needed for Stripe integration management.*
