# Stripe Per-Story Pricing Deployment Guide

**Date:** October 27, 2025  
**Pricing Model:** $4.99 Short Story | $14.99 Novella  
**Status:** Ready for Deployment  

---

## What Changed

### ✅ Implemented
1. **Database:** `story_purchases` table to track purchased story slots
2. **Database:** Added token tracking columns to `ebook_generations`
3. **Webhook:** Modified to grant story slots instead of credits
4. **Frontend:** Updated modal to show Short Story ($4.99) and Novella ($14.99)
5. **Migration:** SQL to create tables and helper functions

### Pricing Structure
```
Short Story: $4.99
- 3 chapters (~5,000 words)
- Professional illustrations
- Taylor Swift-inspired themes

Novella: $14.99
- 8 chapters (~15,000 words)  
- Premium illustrations
- Deeper character development
```

---

## Deployment Steps

### Step 1: Create Stripe Products (Test Mode)

1. **Go to Stripe Dashboard** → Enable Test Mode (top right toggle)

2. **Create Short Story Product:**
   - Products → Create product
   - Name: **Short Story**
   - Description: "3-chapter illustrated ebook with Taylor Swift-inspired themes"
   - Pricing: **One-time $4.99 USD**
   - Click **Save product**
   - **Copy the Price ID** (starts with `price_...`)

3. **Create Novella Product:**
   - Products → Create product
   - Name: **Novella**
   - Description: "8-chapter illustrated ebook with deep character development"
   - Pricing: **One-time $14.99 USD**
   - Click **Save product**
   - **Copy the Price ID**

---

### Step 2: Set Environment Variables

**Frontend (.env.development):**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
VITE_STRIPE_PRICE_SHORT_STORY=price_SHORT_STORY_ID_HERE
VITE_STRIPE_PRICE_NOVELLA=price_NOVELLA_ID_HERE
```

**Backend (Supabase Secrets):**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
supabase secrets set STRIPE_PRICE_SHORT_STORY=price_SHORT_STORY_ID_HERE
supabase secrets set STRIPE_PRICE_NOVELLA=price_NOVELLA_ID_HERE
```

---

### Step 3: Run Database Migrations

```bash
# Apply new migrations
supabase db push

# Or if using migrations directly:
supabase db reset  # WARNING: Resets local DB
```

**Migrations applied:**
- `20251027_001_create_stripe_webhook_events.sql` - Idempotency table
- `20251027_002_create_story_purchases.sql` - Story slots + token tracking

**Verify tables exist:**
```bash
supabase db diff
```

Should show:
- `stripe_webhook_events` table
- `story_purchases` table
- `ebook_generations.total_tokens_used` column
- `ebook_generations.estimated_cost_usd` column
- `ebook_generations.story_purchase_id` column

---

### Step 4: Deploy Webhook Function

```bash
# Deploy the stripe-webhook edge function
supabase functions deploy stripe-webhook

# Verify deployment
supabase functions list
```

**Expected output:**
```
NAME              STATUS   LAST DEPLOYED
stripe-webhook    active   2025-10-27 22:XX:XX
```

**Get your webhook URL:**
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

---

### Step 5: Configure Stripe Webhook

1. **Stripe Dashboard** → Developers → Webhooks → Add endpoint

2. **Endpoint URL:**
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
   ```

3. **Events to send:**
   - Select: `checkout.session.completed`
   - Click **Add events**

4. **Copy Webhook Signing Secret:**
   - Click on your newly created webhook
   - Reveal **Signing secret** (starts with `whsec_`)
   - Copy it

5. **Add to Supabase:**
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

---

### Step 6: Test End-to-End

#### Test 1: Purchase Flow

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to purchase modal** (wherever StripeCreditPurchaseModal is used)

3. **Click "Purchase Short Story" ($4.99)**

4. **Use Stripe test card:**
   ```
   Card: 4242 4242 4242 4242
   Expiry: Any future date (e.g., 12/34)
   CVC: Any 3 digits (e.g., 123)
   ZIP: Any 5 digits (e.g., 12345)
   ```

5. **Complete checkout** → Should redirect to success page

6. **Check webhook logs:**
   ```bash
   supabase functions logs stripe-webhook --follow
   ```

   **Look for:**
   ```
   ✅ Processed checkout.session.completed: user=XXX +1 story slots (session=cs_XXX)
   ```

7. **Verify database:**
   ```sql
   SELECT * FROM story_purchases WHERE user_id = 'YOUR_USER_ID';
   ```

   **Should show:**
   - 1 row with `product_type = 'short-story'`
   - `status = 'unused'`
   - `amount_paid_cents = 499`

#### Test 2: Declined Card

Use test card: `4000 0000 0000 0002`

**Expected:** Payment fails, NO story slot created

#### Test 3: Webhook Idempotency

Manually trigger same webhook twice (via Stripe CLI or dashboard):

```bash
stripe listen --forward-to https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

**Expected:** Second call returns `{received: true, duplicate: true}`

---

## Verification Checklist

### Frontend
- [ ] Modal shows "Short Story ($4.99)" and "Novella ($14.99)"
- [ ] Clicking purchase redirects to Stripe Checkout
- [ ] Success page displays after payment
- [ ] No console errors

### Backend
- [ ] Webhook receives `checkout.session.completed` event
- [ ] `story_purchases` row inserted with correct product_type
- [ ] `stripe_webhook_events` row inserted (idempotency)
- [ ] No errors in Supabase function logs

### Database
- [ ] `story_purchases` table exists
- [ ] `stripe_webhook_events` table exists
- [ ] `ebook_generations` has new columns
- [ ] RLS policies work (user can view own purchases)

---

## Troubleshooting

### Issue: "No webhook secret configured"
**Solution:** 
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### Issue: "Unknown price ID in webhook"
**Check:**
1. Price IDs match between frontend and backend
2. Supabase secrets are set correctly:
   ```bash
   supabase secrets list
   ```

### Issue: "User not found for email"
**Cause:** User purchased before creating account OR email mismatch

**Solution:** Ensure Clerk user profile exists in `profiles` table

### Issue: Webhook not firing
**Check:**
1. Webhook URL is correct in Stripe Dashboard
2. Function is deployed: `supabase functions list`
3. Stripe test mode is enabled (if using test keys)

### Issue: "Failed to record story purchase"
**Check:**
1. Migration ran successfully
2. `story_purchases` table exists
3. User ID type matches (`TEXT` not `UUID`)

---

## Next Steps (Post-Deployment)

### Immediate (Before Launch)
1. ⚠️ **Add pre-generation check** - Verify user has story slot before generating
2. ⚠️ **Mark slot as "used"** - Update story_purchases.status after generation
3. ⚠️ **Track token usage** - Log actual tokens used for cost monitoring

### Short Term (Week 1)
4. Add "My Purchases" page to show bought/used story slots
5. Add token usage analytics dashboard (admin)
6. Set up Stripe webhook monitoring/alerts
7. Test with real $0.01 payment (live mode)

### Medium Term (Month 1)
8. Add subscription tiers (Starter $12.99/mo, Creator $29.99/mo)
9. Implement monthly token allowances for subscribers
10. Add usage-based overage charges
11. Create admin panel for manual credit adjustments

---

## Production Checklist

### Before Going Live

- [ ] Switch to Stripe **Live Mode** (not test mode)
- [ ] Use production API keys (`pk_live_...`, `sk_live_...`)
- [ ] Update webhook endpoint to production Supabase URL
- [ ] Test real payment with small amount ($0.50 test)
- [ ] Set up Stripe webhook monitoring
- [ ] Enable Stripe radar for fraud detection
- [ ] Add terms of service link to checkout
- [ ] Add refund policy to checkout
- [ ] Set up email receipts (Stripe handles this)
- [ ] Configure Stripe tax settings (if applicable)

### Monitoring

**Set up alerts for:**
- Webhook failures (>5% error rate)
- Database insert failures
- Unknown price IDs
- User not found errors

**Track metrics:**
- Purchase conversion rate
- Average order value
- Token usage per story type
- Actual cost vs price (margin analysis)

---

## Cost Analysis (for monitoring)

### Expected Token Usage (Groq API)

**Short Story (~5K words):**
- Input tokens: ~1,000
- Output tokens: ~6,000
- **Total: ~7,000 tokens**
- **Cost at OpenAI pricing:** ~$0.06
- **Your margin:** $4.93 (99%)

**Novella (~15K words):**
- Input tokens: ~2,000
- Output tokens: ~18,000
- **Total: ~20,000 tokens**
- **Cost at OpenAI pricing:** ~$0.18
- **Your margin:** $14.81 (99%)

*Note: Groq is likely much cheaper than these estimates, increasing your margins*

### Break-even Analysis
- **Fixed costs:** $0 (serverless)
- **Variable costs:** ~$0.06-$0.20 per story
- **Break-even:** 1st purchase
- **Target margin:** 90%+

---

## Support

### Logs
```bash
# Webhook logs
supabase functions logs stripe-webhook --follow

# Database queries
supabase db diff

# Secrets
supabase secrets list
```

### Common Commands
```bash
# Deploy updates
supabase functions deploy stripe-webhook

# Test locally
supabase start
npm run dev

# Check webhook status
curl https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook
```

---

## Summary

✅ **Implemented:**
- Per-story pricing model ($4.99 / $14.99)
- Story purchase tracking system
- Webhook integration for automatic fulfillment
- Token usage monitoring infrastructure

⚠️ **Still Needed:**
- Pre-generation quota check
- Mark slots as "used" after generation
- Admin dashboard for usage analytics

🎯 **Ready for:** Test mode deployment and end-to-end testing

---

**Questions?** Check the implementation plan or webhook logs for details.
