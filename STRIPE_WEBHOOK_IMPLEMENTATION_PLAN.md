# Stripe Webhook Implementation Plan

**Date:** October 27, 2025  
**Priority:** P0 - CRITICAL  
**Status:** Ready for Review  

---

## Executive Summary

The Stripe payment integration is **80% complete** but has a **critical gap**: no webhook to process payment confirmations. This means credits are not automatically added to user accounts after successful payments. This plan addresses the missing webhook and related infrastructure.

---

## Current State Analysis

### ✅ What Works

**Frontend (100% Complete)**
- `src/core/integrations/stripe/client.ts` - Stripe.js client with checkout & portal methods
- `src/modules/user/components/StripeCreditPurchaseModal.tsx` - Credit purchase modal with 3 pricing tiers
- `src/modules/user/components/StripeBillingPortal.tsx` - Billing portal integration
- `src/modules/ebook/components/CreditWallModal.tsx` - Freemium gate

**Backend Edge Functions**
- ✅ `supabase/functions/create-checkout/index.ts` - Creates Stripe checkout sessions
- ✅ `supabase/functions/stripe-portal/index.ts` - Creates billing portal sessions
- ✅ `supabase/functions/credits/index.ts` - Fetches user credit balance

**Database Schema**
- ✅ `profiles` table - User data with `credits` field (INTEGER)
- ✅ `user_credits` table - Detailed credit tracking with subscription info
- ✅ `credit_transactions` table - Transaction audit log

### ❌ Critical Gaps

1. **No Stripe Webhook Function** - No edge function to receive `checkout.session.completed` events
2. **No Webhook Endpoint Configured** - Stripe Dashboard not configured to send events
3. **Manual Credit Sync** - `CheckoutSuccess.tsx` tries to sync credits client-side (unreliable)
4. **No Idempotency Check** - Could process same payment multiple times
5. **Hardcoded Price IDs** - Scattered across multiple files

---

## Implementation Plan

### Phase 1: Create Stripe Webhook Function (P0)

**File:** `supabase/functions/stripe-webhook/index.ts`

**Based on:** `samcart-webhook/index.ts` pattern + WEBHOOK_COMPARISON.md recommendations

**Key Features:**
```typescript
1. Webhook signature verification (using STRIPE_WEBHOOK_SECRET)
2. Extract checkout.session.completed event
3. Find user by customer email
4. Retrieve line items from Stripe API
5. Map price IDs to credit amounts
6. Update user credits atomically
7. Log transaction for audit trail
8. Idempotency check (prevent duplicate processing)
```

**Dependencies:**
- `https://esm.sh/stripe@14.25.0` (or latest)
- `../_shared/utils.ts` for CORS, Supabase client, error handling

**Product Configuration Map:**
```typescript
const STRIPE_CREDIT_PRODUCTS = {
  // One-time credit purchases
  'price_1S9zK25U03MNTw3qMH90DnC1': { name: 'Starter Pack', credits: 1 },
  'price_1S9zK25U03MNTw3qFkq00yiu': { name: 'Creator Pack', credits: 3 },
  'price_1S9zK35U03MNTw3qpmqEDL80': { name: 'Studio Pack', credits: 5 },
  
  // Subscriptions (if implementing later)
  'price_1S9zK15U03MNTw3qAO5JnplW': { name: 'Swiftie Starter', subscription: true, monthly_credits: 30 },
  'price_1S9zK25U03MNTw3qdDnUn7hk': { name: 'Swiftie Deluxe', subscription: true, monthly_credits: 75 },
  'price_1S9zK25U03MNTw3qoCHo9KzE': { name: 'Opus VIP', subscription: true, monthly_credits: 150 },
};
```

**Current Credit System:**
- Credits stored in TWO tables:
  1. `profiles.credits` (INTEGER) - Direct field for quick access
  2. `user_credits.balance` (INTEGER) - Detailed tracking with triggers
- Transaction logging in `credit_transactions` table
- Triggers automatically maintain balance consistency

**User Lookup Strategy:**
```typescript
// Stripe provides customer_details.email in checkout session
// Lookup user by email in profiles table
const { data: profile } = await supabase
  .from('profiles')
  .select('id, email, credits')
  .eq('email', customerEmail)
  .single();
```

**Credit Update Strategy:**
```typescript
// Option 1: Direct UPDATE (simpler, used by samcart-webhook)
await supabase
  .from('profiles')
  .update({ credits: currentCredits + purchasedCredits })
  .eq('id', userId);

// Option 2: INSERT transaction (triggers handle balance update)
await supabase
  .from('credit_transactions')
  .insert({
    user_id: userId,
    transaction_type: 'purchase',
    credits: purchasedCredits,
    amount_cents: session.amount_total,
    description: `Stripe purchase: ${productName}`,
    metadata: {
      stripe_session_id: session.id,
      stripe_customer_id: session.customer,
      price_id: priceId,
    }
  });
// Trigger 'maintain_credit_balance' automatically updates user_credits.balance
```

**Recommended Approach:** Use **both**:
1. Direct UPDATE on `profiles.credits` for immediate UI reflection
2. INSERT into `credit_transactions` for audit trail and trigger-based consistency

---

### Phase 2: Database Enhancements (P0)

#### 2.1 Create Idempotency Table

**File:** `supabase/migrations/20251027_001_create_stripe_idempotency.sql`

```sql
-- Prevent duplicate webhook processing
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_session_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT REFERENCES public.profiles(id),
  credits_added INTEGER,
  metadata JSONB
);

CREATE INDEX idx_stripe_webhook_events_event_id ON public.stripe_webhook_events(stripe_event_id);
CREATE INDEX idx_stripe_webhook_events_session_id ON public.stripe_webhook_events(stripe_session_id);
CREATE INDEX idx_stripe_webhook_events_processed_at ON public.stripe_webhook_events(processed_at DESC);
```

**Usage in webhook:**
```typescript
// Check if already processed
const { data: existingEvent } = await supabase
  .from('stripe_webhook_events')
  .select('id')
  .eq('stripe_event_id', event.id)
  .single();

if (existingEvent) {
  console.log('⏭️ Event already processed, returning 200');
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

// After processing, record the event
await supabase.from('stripe_webhook_events').insert({
  stripe_event_id: event.id,
  stripe_session_id: session.id,
  event_type: event.type,
  user_id: userId,
  credits_added: totalCredits,
  metadata: { /* ... */ }
});
```

#### 2.2 Verify Existing Schema

**Confirm these exist (they do):**
- ✅ `profiles.credits` field exists (from 20240314000000_create_profiles_table.sql)
- ✅ `user_credits` table exists (from 20250629_001_create_credit_system.sql)
- ✅ `credit_transactions` table exists (from 20250914_002_create_credit_transactions.sql)
- ✅ Trigger `maintain_credit_balance` exists (maintains user_credits.balance)

**No additional RPC function needed** - Direct UPDATE + INSERT pattern works.

---

### Phase 3: Environment Configuration (P0)

#### 3.1 Supabase Secrets

**Set via Supabase CLI:**
```bash
# Stripe secret key (already set for create-checkout)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...

# NEW: Stripe webhook signing secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

**Where to get `STRIPE_WEBHOOK_SECRET`:**
1. Deploy webhook function first (Phase 4)
2. Go to Stripe Dashboard → Developers → Webhooks
3. Add endpoint: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
4. Select event: `checkout.session.completed`
5. Copy the webhook signing secret (starts with `whsec_`)
6. Add to Supabase secrets

#### 3.2 Frontend Environment Variables

**File:** `.env.development` / `.env.local`

**Already exists:**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Optional (for centralized config):**
```bash
VITE_STRIPE_PRICE_1_CREDIT=price_1S9zK25U03MNTw3qMH90DnC1
VITE_STRIPE_PRICE_3_CREDITS=price_1S9zK25U03MNTw3qFkq00yiu
VITE_STRIPE_PRICE_5_CREDITS=price_1S9zK35U03MNTw3qpmqEDL80
```

---

### Phase 4: Deploy Webhook Function (P0)

**Steps:**

1. **Create function directory:**
```bash
mkdir -p supabase/functions/stripe-webhook
```

2. **Create function files:**
   - `index.ts` - Main webhook handler
   - `deno.json` - Deno configuration (optional, can inherit from root)

3. **Deploy to Supabase:**
```bash
supabase functions deploy stripe-webhook
```

4. **Verify deployment:**
```bash
supabase functions list
```

5. **Configure Stripe Dashboard:**
   - Go to Developers → Webhooks → Add endpoint
   - URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`
   - Copy webhook signing secret
   - Add to Supabase secrets

6. **Test webhook:**
```bash
# Using Stripe CLI
stripe listen --forward-to https://<project-ref>.supabase.co/functions/v1/stripe-webhook

# In another terminal
stripe trigger checkout.session.completed
```

7. **Check logs:**
```bash
supabase functions logs stripe-webhook --follow
```

---

### Phase 5: Update CheckoutSuccess Page (P1)

**File:** `src/app/pages/CheckoutSuccess.tsx`

**Current Issue:** Manually tries to update subscription status without verifying payment.

**New Approach:**
```typescript
// Instead of immediately updating credits:
// 1. Show loading state: "Processing payment..."
// 2. Poll credit balance until webhook processes (max 10 seconds)
// 3. Show success message when credits appear
// 4. Fallback to "Credits will appear shortly" if timeout

const [creditsProcessed, setCreditsProcessed] = useState(false);

useEffect(() => {
  const pollCredits = async () => {
    const initialBalance = user?.credits || 0;
    const maxAttempts = 10;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      await refreshUser();
      const newBalance = user?.credits || 0;

      if (newBalance > initialBalance) {
        setCreditsProcessed(true);
        clearInterval(interval);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        // Webhook might still be processing, that's OK
      }
    }, 1000);
  };

  pollCredits();
}, []);
```

**Alternative:** Remove manual sync entirely, rely on webhook + balance refresh.

---

### Phase 6: Centralize Price Configuration (P2)

**File:** `src/core/config/stripe.ts` (new)

```typescript
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  
  creditProducts: {
    single: {
      priceId: import.meta.env.VITE_STRIPE_PRICE_1_CREDIT || 'price_1S9zK25U03MNTw3qMH90DnC1',
      credits: 1,
      price: 2.99,
      name: 'Single Credit'
    },
    bundle3: {
      priceId: import.meta.env.VITE_STRIPE_PRICE_3_CREDITS || 'price_1S9zK25U03MNTw3qFkq00yiu',
      credits: 3,
      price: 7.99,
      name: '3-Credit Bundle'
    },
    bundle5: {
      priceId: import.meta.env.VITE_STRIPE_PRICE_5_CREDITS || 'price_1S9zK35U03MNTw3qpmqEDL80',
      credits: 5,
      price: 12.99,
      name: '5-Credit Bundle'
    }
  }
};
```

**Update components:**
- `StripeCreditPurchaseModal.tsx` - Import from config
- `create-checkout/index.ts` - Import from shared config

---

## Testing Plan

### Unit Tests (Future)

```typescript
// src/modules/stripe/__tests__/webhook.test.ts
describe('Stripe Webhook', () => {
  it('should verify webhook signature');
  it('should reject invalid signatures');
  it('should process checkout.session.completed');
  it('should handle duplicate events (idempotency)');
  it('should update user credits correctly');
  it('should log transactions');
});
```

### Manual Testing Checklist

**Prerequisites:**
- [ ] Stripe test account with test keys
- [ ] Webhook deployed and configured
- [ ] Webhook signing secret set in Supabase

**Test Scenarios:**

1. **Successful Purchase**
   - [ ] Open credit purchase modal
   - [ ] Select "5-Credit Bundle"
   - [ ] Complete checkout with test card `4242 4242 4242 4242`
   - [ ] Verify redirect to /checkout-success
   - [ ] Check Supabase logs for webhook event
   - [ ] Verify credits added to `profiles.credits`
   - [ ] Verify transaction in `credit_transactions`
   - [ ] Verify idempotency record in `stripe_webhook_events`
   - [ ] Verify UI shows updated balance

2. **Declined Card**
   - [ ] Use test card `4000 0000 0000 0002`
   - [ ] Verify error message
   - [ ] Verify NO credits added
   - [ ] Verify NO transaction logged

3. **Duplicate Webhook**
   - [ ] Manually trigger webhook twice with same event ID
   - [ ] Verify only ONE credit transaction created
   - [ ] Verify idempotency check works

4. **User Not Found**
   - [ ] Send webhook with non-existent email
   - [ ] Verify graceful error handling
   - [ ] Verify webhook returns 200 (so Stripe stops retrying)

5. **Billing Portal**
   - [ ] Click "Manage Billing"
   - [ ] Verify Stripe Customer Portal opens
   - [ ] Check invoices appear correctly

### Stripe CLI Testing

```bash
# Listen to webhooks locally
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

---

## Rollout Strategy

### Phase 1: Development (Week 1)
- [ ] Create webhook function
- [ ] Create idempotency migration
- [ ] Deploy to development Supabase project
- [ ] Configure Stripe test mode webhook
- [ ] Run manual tests
- [ ] Fix any bugs

### Phase 2: Staging (Week 2)
- [ ] Deploy to staging environment
- [ ] Test with real payment flow (test mode)
- [ ] Monitor logs for errors
- [ ] Load test with Stripe CLI
- [ ] Update documentation

### Phase 3: Production (Week 3)
- [ ] Switch to production Stripe keys
- [ ] Deploy webhook to production
- [ ] Configure production webhook in Stripe
- [ ] Monitor first 10 real transactions closely
- [ ] Set up error alerting (Sentry, etc.)
- [ ] Update WARP.md with webhook info

---

## Monitoring & Alerting

### Logs to Monitor

**Webhook Success:**
```
✅ Webhook received: evt_xxx
✅ Signature verified
✅ Found user: user_xxx for email: user@example.com
✅ Added 5 credits to user
✅ Transaction logged: tx_xxx
```

**Webhook Errors:**
```
❌ Signature verification failed
❌ User not found for email: user@example.com
❌ Failed to update credits: [error details]
❌ Unknown price ID: price_xxx
```

### Metrics to Track

- Webhook success rate (target: >99%)
- Average processing time (target: <2s)
- Duplicate event rate (should be 0% after idempotency)
- Credit mismatch rate (should be 0%)

### Error Alerting

**Set up alerts for:**
- Webhook signature verification failures (potential attack)
- Database update failures (payment succeeded but credits not added)
- High error rate (>5% in 1 hour)

---

## Rollback Plan

**If webhook causes issues:**

1. **Disable in Stripe Dashboard**
   - Go to Webhooks → Disable endpoint
   - Payments still work, just no auto-credit

2. **Roll back to manual sync**
   - Keep CheckoutSuccess.tsx manual update as fallback
   - Investigate issue
   - Fix and redeploy

3. **Manual credit reconciliation**
   - Query Stripe for successful checkouts
   - Cross-reference with `stripe_webhook_events`
   - Manually add missing credits via admin panel

---

## Success Criteria

**Webhook is successful when:**

✅ User purchases credits via Stripe  
✅ Webhook receives `checkout.session.completed` event  
✅ User credits updated in <2 seconds  
✅ Transaction logged for audit  
✅ Duplicate events handled gracefully  
✅ No credit loss or duplication  
✅ Error rate <1%  
✅ All test scenarios pass  

---

## File Checklist

### New Files to Create

- [ ] `supabase/functions/stripe-webhook/index.ts` - Webhook handler
- [ ] `supabase/migrations/20251027_001_create_stripe_idempotency.sql` - Idempotency table
- [ ] `src/core/config/stripe.ts` - Centralized Stripe config (optional, P2)

### Files to Modify

- [ ] `src/app/pages/CheckoutSuccess.tsx` - Remove manual sync, add polling
- [ ] `src/modules/user/components/StripeCreditPurchaseModal.tsx` - Use centralized config (P2)
- [ ] `.env.example` - Add STRIPE_WEBHOOK_SECRET documentation
- [ ] `WARP.md` - Document webhook setup

### No Changes Needed

- ✅ `src/core/integrations/stripe/client.ts` - Works as-is
- ✅ `src/modules/user/components/StripeBillingPortal.tsx` - Works as-is
- ✅ `supabase/functions/create-checkout/index.ts` - Works as-is
- ✅ Database schema - Sufficient for credit management

---

## Timeline Estimate

| Task | Priority | Time | Status |
|------|----------|------|--------|
| Create webhook function | P0 | 4 hours | Not started |
| Create idempotency migration | P0 | 1 hour | Not started |
| Deploy and configure webhook | P0 | 1 hour | Not started |
| Manual testing | P0 | 2 hours | Not started |
| Update CheckoutSuccess page | P1 | 1 hour | Not started |
| Centralize price config | P2 | 2 hours | Not started |
| Documentation | P1 | 1 hour | Not started |
| **TOTAL** | - | **12 hours** | - |

---

## Token-Based Usage Pricing (NEW APPROACH)

### Current Implementation
- Groq API returns `usage.total_tokens` per generation (chapters + storylines)
- Variable token usage depending on ebook length
- Need to map tokens → credits → USD pricing

### Proposed Model

**Pricing Tiers:**
```
$0.001 USD per 100 tokens (or tune based on your margins)

Example:
- 1,000 tokens = ~10 credits = ~$0.01
- 100,000 tokens = ~1,000 credits = ~$1.00
```

**Implementation Steps:**

1. **Track tokens in ebook_generations table:**
   - Add column: `total_tokens_used` (INTEGER)
   - Add column: `credits_cost` (INTEGER calculated from tokens)
   - Query before generating to check available credits

2. **Deduct credits at generation time (not webhook):**
   ```typescript
   // After story generation completes
   const tokensUsed = response.usage.total_tokens;
   const creditsCost = Math.ceil(tokensUsed / 100); // 100 tokens = 1 credit
   
   // Deduct from user
   await supabase.from('profiles')
     .update({ credits: profile.credits - creditsCost })
     .eq('id', userId);
   
   // Log transaction
   await supabase.from('credit_transactions').insert({
     user_id: userId,
     transaction_type: 'usage',
     credits: -creditsCost,
     metadata: { tokens: tokensUsed, ebook_generation_id: generationId }
   });
   ```

3. **Pre-check credits before generation:**
   - Estimate tokens needed (e.g., "Short story ≈ 3,000 tokens")
   - Reject if insufficient credits
   - Show estimated cost to user

4. **Stripe pricing becomes simpler:**
   - Remove per-product pricing
   - Implement **Stripe Billing Meter** for usage-based charges
   - Or simple credits-as-products (e.g., $10 = 10,000 credits)

**Benefits:**
- Fair pricing (longer stories cost more)
- No guessing product quantities
- Users buy credit pools, then use as needed

### Questions

1. **Token-to-Credit Ratio**: What conversion rate? (e.g., 100 tokens = 1 credit?)
2. **Credit-to-USD**: What's your target margin? (e.g., 10,000 credits = $10?)
3. **Upfront Check**: Show estimated cost before generation? (e.g., "This may use ~5,000 tokens")
4. **Refund Policy**: If generation fails, refund tokens/credits?
5. **Free Tier**: Do free users get a monthly token allowance?

---

## Next Steps

1. ✅ **Review this plan** - Make sure approach is sound
2. **Answer questions** - Clarify any unknowns
3. **Approve plan** - Give go-ahead to implement
4. **Start implementation** - Begin with webhook function creation
5. **Iterative testing** - Test each component as built
6. **Deploy to staging** - Validate in non-production environment
7. **Production deployment** - Launch with monitoring

---

**Ready for Review** - Please approve before implementation begins.
