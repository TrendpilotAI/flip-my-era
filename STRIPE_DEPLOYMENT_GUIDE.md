# Stripe Integration Deployment Guide

## ✅ Completed Implementation

The following components have been successfully implemented:

### 1. **Environment Configuration**
- Created `env.example` with all required Stripe environment variables
- Documented all necessary environment variables

### 2. **Database Schema**
- Created migration file: `supabase/migrations/20251007_add_stripe_fields.sql`
- Added Stripe-specific fields to `credit_transactions` and `profiles` tables
- Added indexes for efficient lookups

### 3. **Backend Implementation**
- ✅ **Stripe Webhook Handler** (`supabase/functions/stripe-webhook/index.ts`)
  - Handles `checkout.session.completed` events
  - Handles subscription events
  - Allocates credits automatically after payment
  - Updates user profiles with Stripe customer IDs

- ✅ **Create Checkout Function** (`supabase/functions/create-checkout/index.ts`)
  - Enhanced metadata for credit allocation
  - Maps price IDs to credit amounts
  - Supports both credit purchases and subscriptions

### 4. **Frontend Implementation**
- ✅ **Centralized Configuration** (`src/config/stripe-products.ts`)
  - Single source of truth for all Stripe products
  - Environment variable overrides supported
  - Helper functions for credit mapping

- ✅ **Enhanced Stripe Client** (`src/core/integrations/stripe/client.ts`)
  - Improved error handling
  - Better validation of publishable key
  - Connection error detection

- ✅ **Updated Components**
  - `CreditPurchaseModal.tsx` - Uses centralized config
  - `StripeCreditPurchaseModal.tsx` - Uses centralized config
  - `Checkout.tsx` - Uses centralized config for subscriptions
  - `CheckoutSuccess.tsx` - Handles both Stripe and legacy flows

## 📋 Deployment Steps

### Step 1: Configure Environment Variables

1. **Local Development** (`.env.local` or `.env`):
```bash
# Required Stripe Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

2. **Supabase Edge Functions** (via Supabase Dashboard):
   - Go to your Supabase project settings
   - Navigate to Edge Functions > Secrets
   - Add the following secrets:
```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 2: Run Database Migration

1. Connect to your Supabase project:
```bash
supabase db push
```

Or manually run the migration:
```bash
supabase migration up
```

### Step 3: Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy stripe-webhook
supabase functions deploy create-checkout

# Or deploy all at once
supabase functions deploy
```

### Step 4: Configure Stripe Webhook

1. **Go to Stripe Dashboard** → Webhooks
2. **Add endpoint**:
   - URL: `https://[YOUR_PROJECT_ID].supabase.co/functions/v1/stripe-webhook`
   - Description: "FlipMyEra Payment Processing"
   
3. **Select events to listen to**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded` (optional)
   - ✅ `invoice.payment_failed` (optional)

4. **Copy the signing secret** and add it to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

### Step 5: Create/Verify Stripe Products

Ensure your Stripe account has the following products and prices:

#### Credit Packs:
- **$25 Pack**: 25 credits → `price_1S9zK25U03MNTw3qMH90DnC1`
- **$50 Pack**: 55 credits → `price_1S9zK25U03MNTw3qFkq00yiu`
- **$100 Pack**: 120 credits → `price_1S9zK35U03MNTw3qpmqEDL80`

#### Subscriptions:
- **Starter**: $12.99/mo → `price_1S9zK15U03MNTw3qAO5JnplW`
- **Deluxe**: $25.00/mo → `price_1S9zK25U03MNTw3qdDnUn7hk`
- **VIP**: $49.99/mo → `price_1S9zK25U03MNTw3qoCHo9KzE`

Or run the setup script:
```bash
node scripts/setup-stripe-products.js
```

### Step 6: Test the Integration

#### Test Mode Setup:
1. Use Stripe test keys (starting with `pk_test_` and `sk_test_`)
2. Use test cards for payment:
   - ✅ Success: `4242 4242 4242 4242`
   - ❌ Decline: `4000 0000 0000 0002`
   - 🔐 3D Secure: `4000 0027 6000 3184`

#### Test Scenarios:
1. **Credit Purchase Flow**:
   - Open credit purchase modal
   - Select a credit pack
   - Complete checkout with test card
   - Verify credits are added (check webhook logs)

2. **Subscription Flow**:
   - Navigate to /checkout
   - Select a subscription plan
   - Complete checkout
   - Verify subscription is active

3. **Webhook Processing**:
   - Check Supabase function logs
   - Verify credit_transactions table
   - Confirm user_credits updated

### Step 7: Production Deployment

1. **Update Environment Variables**:
   - Replace test keys with live keys
   - `pk_live_` for publishable key
   - `sk_live_` for secret key

2. **Update Webhook Endpoint**:
   - Add production webhook in Stripe Dashboard
   - Update webhook secret in Supabase

3. **Verify Products**:
   - Ensure all products exist in live mode
   - Update price IDs if different from test mode

## 🧪 Testing Checklist

- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Edge functions deployed
- [ ] Webhook endpoint configured in Stripe
- [ ] Test credit purchase successful
- [ ] Credits allocated correctly
- [ ] Test subscription purchase successful
- [ ] Subscription status updated
- [ ] Webhook signature validation working
- [ ] Error handling for failed payments
- [ ] Success page displays correct information
- [ ] Credit balance refreshes after purchase

## 🔍 Troubleshooting

### "Stripe failed to initialize"
- Check `VITE_STRIPE_PUBLISHABLE_KEY` is set
- Verify key starts with `pk_test_` or `pk_live_`
- Check browser console for errors

### "Failed to create checkout session"
- Verify `STRIPE_SECRET_KEY` in Supabase secrets
- Check Edge Function logs in Supabase dashboard
- Ensure user is authenticated with Clerk

### "Credits not allocated after payment"
- Check webhook configuration in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check Supabase function logs for errors
- Ensure database migration was applied

### "Invalid webhook signature"
- Verify webhook secret matches Stripe Dashboard
- Check you're using the correct endpoint URL
- Ensure no proxy is modifying the request body

## 📊 Monitoring

### Supabase Function Logs:
```bash
supabase functions logs stripe-webhook --tail
supabase functions logs create-checkout --tail
```

### Database Queries:
```sql
-- Check recent credit transactions
SELECT * FROM credit_transactions 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check user credit balance
SELECT * FROM user_credits 
WHERE user_id = 'user_id_here';

-- Check Stripe customer mappings
SELECT id, email, stripe_customer_id 
FROM profiles 
WHERE stripe_customer_id IS NOT NULL;
```

## 🚀 Next Steps

1. **Test thoroughly** in development
2. **Deploy to staging** if available
3. **Run end-to-end tests**
4. **Deploy to production**
5. **Monitor first transactions**
6. **Set up alerts** for failed webhooks

## 📝 Notes

- The system maintains backward compatibility with SamCart
- Stripe webhooks handle credit allocation automatically
- Credits are added immediately after webhook processing
- Subscription credits are allocated on activation
- All transactions are logged in `credit_transactions` table

For support or questions, check the Stripe Dashboard logs and Supabase function logs for detailed error messages.
