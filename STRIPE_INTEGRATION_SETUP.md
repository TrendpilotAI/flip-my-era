# 🎯 Stripe Integration Setup Guide

## Overview

This guide will help you set up Stripe Checkout and Billing for your FlipMyEra application. The integration includes:

- ✅ **Stripe Checkout**: For one-time credit purchases and subscriptions
- ✅ **Stripe Billing Portal**: For subscription management
- ✅ **Webhook Processing**: Real-time payment processing via Supabase Edge Functions
- ✅ **Credit System Integration**: Automatic credit allocation and subscription management

## 🚀 Quick Start

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Stripe Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase (already configured)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Install Dependencies

```bash
npm install @stripe/stripe-js
```

### 3. Run Database Migration

```bash
supabase db push
```

### 4. Deploy Edge Functions

```bash
supabase functions deploy stripe-webhook
supabase functions deploy stripe-billing-portal
```

## 🛠️ Detailed Setup

### Step 1: Stripe Dashboard Configuration

#### 1.1 Create Products and Prices

In your Stripe Dashboard, create these products:

**Credit Products:**
- **Single Credit** ($2.99)
  - Price ID: `price_single_credit`
  - Type: One-time
  - Amount: $2.99

- **3-Credit Bundle** ($7.99)
  - Price ID: `prod_SfP7IqlevBnqkD`
  - Type: One-time
  - Amount: $7.99

- **5-Credit Bundle** ($11.99)
  - Price ID: `prod_SfP7H6tTBGbSRF`
  - Type: One-time
  - Amount: $11.99

#### 1.2 Configure Webhooks

1. Go to **Developers > Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set endpoint URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copy the webhook signing secret to your environment variables

### Step 2: Frontend Integration

#### 2.1 Update Credit Purchase Modal

Replace the existing `CreditPurchaseModal` with `StripeCreditPurchaseModal`:

```tsx
// In your EbookGenerator.tsx or wherever you use the credit modal
import { StripeCreditPurchaseModal } from '@/modules/user/components/StripeCreditPurchaseModal';

// Replace CreditPurchaseModal with:
<StripeCreditPurchaseModal
  isOpen={showCreditModal}
  onClose={() => setShowCreditModal(false)}
  onSuccess={handleCreditPurchaseSuccess}
  currentBalance={creditBalance}
/>
```

#### 2.2 Update Billing Portal

Replace the SamCart iframe with Stripe billing portal:

```tsx
// In your UserDashboard.tsx or SettingsDashboard.tsx
import { StripeBillingPortal } from '@/modules/user/components/StripeBillingPortal';

// Replace the iframe with:
<StripeBillingPortal
  customerId={user?.stripe_customer_id}
  className="w-full h-[600px]"
/>
```

### Step 3: Backend Configuration

#### 3.1 Deploy Edge Functions

```bash
# Deploy webhook handler
supabase functions deploy stripe-webhook

# Deploy billing portal handler
supabase functions deploy stripe-billing-portal
```

#### 3.2 Set Edge Function Secrets

```bash
# Set Stripe secrets for edge functions
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key_here
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 4: Database Migration

The migration will add Stripe-specific fields to your existing tables:

```sql
-- This is handled by the migration file
-- Adds stripe_customer_id, stripe_session_id, etc. to relevant tables
```

Run the migration:

```bash
supabase db push
```

## 🔧 Configuration Options

### Customizing Product Mapping

Edit the `STRIPE_PRODUCTS` object in `supabase/functions/stripe-webhook/index.ts`:

```typescript
const STRIPE_PRODUCTS = {
  // Add your actual Stripe price IDs here
  'prod_SfP7IhRHXieFTJ': { type: 'credits', amount: 1, name: 'Single Credit' },
  'prod_SfP7IqlevBnqkD': { type: 'credits', amount: 3, name: '3-Credit Bundle' },
  // ... add more products
};
```

### Customizing Pricing Tiers

Edit the `pricingTiers` array in `StripeCreditPurchaseModal.tsx`:

```typescript
const pricingTiers: PricingTier[] = [
  {
    id: 'single',
    name: 'Single Credit',
    credits: 1,
    price: 2.99,
    stripePriceId: 'prod_SfP7IhRHXieFTJ', // Your actual Stripe price ID
    // ... other properties
  },
  // ... add more tiers
];
```

## 🧪 Testing

### 1. Test Credit Purchase

1. Go to your app and try to generate an ebook
2. When prompted for credits, click "Purchase Credits"
3. Select a credit package
4. Complete the Stripe checkout with test card: `4242 4242 4242 4242`
5. Verify credits are added to your account

### 2. Test Subscription

1. Purchase a subscription plan
2. Verify subscription status is updated
3. Test unlimited generation
4. Check billing portal access

### 3. Test Webhooks

1. Use Stripe CLI to test webhooks locally:
```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

2. Or use Stripe Dashboard webhook logs to verify delivery

## 🔒 Security Considerations

### 1. Webhook Signature Verification

The webhook handler verifies Stripe signatures to prevent replay attacks:

```typescript
// This is already implemented in the webhook handler
event = stripe.webhooks.constructEvent(
  body,
  signature,
  Deno.env.get('STRIPE_WEBHOOK_SECRET')!
);
```

### 2. Environment Variables

Never commit your Stripe secret keys to version control:

```bash
# ✅ Good - Use environment variables
STRIPE_SECRET_KEY=sk_test_...

# ❌ Bad - Don't hardcode in files
const stripe = new Stripe('sk_test_...');
```

### 3. Database Security

The edge functions use Supabase service role key for database access, which is secure and recommended.

## 🚨 Troubleshooting

### Common Issues

#### 1. Webhook Not Receiving Events

- Check webhook endpoint URL is correct
- Verify webhook secret is set correctly
- Check Supabase function logs for errors

#### 2. Credits Not Allocating

- Verify price IDs match between Stripe and code
- Check database migration ran successfully
- Review webhook function logs

#### 3. Billing Portal Not Working

- Ensure customer ID is stored in database
- Check billing portal function is deployed
- Verify Stripe customer exists

### Debug Steps

1. **Check Edge Function Logs:**
```bash
supabase functions logs stripe-webhook
supabase functions logs stripe-billing-portal
```

2. **Verify Database Records:**
```sql
-- Check if credits are being allocated
SELECT * FROM user_credits WHERE user_id = 'your_user_id';

-- Check transaction history
SELECT * FROM credit_transactions WHERE user_id = 'your_user_id' ORDER BY created_at DESC;
```

3. **Test Webhook Locally:**
```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

## 📈 Monitoring

### Key Metrics to Track

1. **Payment Success Rate**: Monitor webhook delivery success
2. **Credit Allocation**: Track successful credit purchases
3. **Subscription Management**: Monitor subscription lifecycle events
4. **Error Rates**: Watch for webhook processing failures

### Stripe Dashboard Monitoring

- **Payments**: Monitor successful/failed payments
- **Webhooks**: Check delivery success rates
- **Customers**: Track customer creation and management
- **Subscriptions**: Monitor subscription lifecycle

## 🔄 Migration from SamCart

If you're migrating from SamCart to Stripe:

1. **Keep SamCart webhook** running temporarily
2. **Deploy Stripe integration** alongside existing system
3. **Test thoroughly** with new Stripe flow
4. **Gradually migrate** users to Stripe
5. **Remove SamCart** once migration is complete

## 📞 Support

For issues with this integration:

1. Check the troubleshooting section above
2. Review Stripe documentation: https://stripe.com/docs
3. Check Supabase function logs
4. Verify environment variables are set correctly

---

**🎉 Congratulations!** Your Stripe integration is now complete and ready for production use. 