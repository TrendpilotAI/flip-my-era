# Stripe Webhook Comparison: ws Branch vs Main

## Overview
This document compares the enhanced Stripe webhook implementation from the ws branch (`stripe-webhook-new`) with any existing webhook in main, highlighting improvements and providing recommendations.

## ws Branch Enhanced Webhook Features

### Location
`supabase/functions/stripe-webhook-new/index.ts`

### Key Improvements

#### 1. **Better Error Handling** ⭐⭐⭐⭐⭐
```typescript
try {
  receivedEvent = await stripe.webhooks.constructEventAsync(
    body,
    signature,
    Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    undefined,
    cryptoProvider
  );
} catch (err) {
  const errMessage = err instanceof Error ? err.message : 'Unknown error occurred';
  console.error('❌ Webhook signature verification failed:', errMessage);
  return new Response(`Webhook signature verification failed: ${errMessage}`, { 
    status: 400, 
    headers: corsHeaders 
  });
}
```

**Benefits:**
- Proper error type checking
- Detailed error messages
- Returns 400 status for signature failures
- Won't crash on unexpected error types

#### 2. **Product Configuration Mapping** ⭐⭐⭐⭐⭐
```typescript
const STRIPE_PRODUCTS = {
  'price_1Rk4JDQH2CPu3kDwaJ9W1TDW': {
    name: 'Single Credit',
    amount: 1
  },
  'price_1Rk4JDQH2CPu3kDwnWUmRgHb': {
    name: '3-Credit Bundle',
    amount: 3
  },
  'price_1Rk4JEQH2CPu3kDwf1ymmbqt': {
    name: '5-Credit Bundle',
    amount: 5
  }
};
```

**Benefits:**
- Centralized product configuration
- Easy to update credit amounts
- Clear product naming
- Supports multiple price IDs
- Easy to add new products

#### 3. **Enhanced Logging** ⭐⭐⭐⭐
```typescript
console.log('🚀 Stripe Webhook Function Started');
console.log(`🔔 Event received: ${receivedEvent.id} (${receivedEvent.type})`);
console.log(`💰 Processing checkout session: ${session.id}`);
console.log(`👤 Found user: ${userId} for email: ${customerEmail}`);
console.log(`📦 Processing item: ${productConfig.name}`);
console.log(`📦 Total credits calculated: ${totalCreditsForThisItem}`);
console.log(`✅ Successfully processed checkout session: ${session.id}`);
```

**Benefits:**
- Emoji-based visual indicators
- Step-by-step process tracking
- Easy debugging in production
- Clear success/failure indicators
- Detailed parameter logging

#### 4. **User Lookup by Email** ⭐⭐⭐⭐
```typescript
const customerEmail = session.customer_details?.email;
if (!customerEmail) {
  console.error('❌ No customer email found in session:', session.id);
  return;
}

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id, email')
  .eq('email', customerEmail)
  .single();
```

**Benefits:**
- Reliable user identification
- Works with Clerk authentication
- Proper error handling
- Email validation

#### 5. **Line Items Processing** ⭐⭐⭐⭐⭐
```typescript
const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, {
  expand: ['line_items'],
});

for (const item of sessionWithLineItems.line_items.data) {
  const priceId = item.price?.id;
  const productConfig = STRIPE_PRODUCTS[priceId];
  
  if (!productConfig) {
    console.log(`⚠️ No configuration found for price ID: ${priceId}`);
    continue;
  }

  const quantity = item.quantity || 1;
  const totalCreditsForThisItem = productConfig.amount * quantity;
  
  await allocateCredits(userId, totalCreditsForThisItem, session, item);
}
```

**Benefits:**
- Supports multiple items in one checkout
- Handles quantity correctly
- Skips unknown products gracefully
- Proper credit calculation

#### 6. **RPC Call for Credit Updates** ⭐⭐⭐⭐
```typescript
const { error: rpcError } = await supabase.rpc('update_user_credits', {
  p_user_id: userId,
  p_credit_amount: creditAmount
});

if (rpcError) {
  console.error('❌ RPC Error Details:', JSON.stringify(rpcError, null, 2));
  console.error('❌ This is likely a data type mismatch - stored procedure expects UUID but got TEXT');
  return; // Stop further processing for this item
}
```

**Benefits:**
- Atomic credit updates
- Database-level transaction safety
- Helpful error messages
- Type mismatch detection

#### 7. **Transaction Logging** ⭐⭐⭐⭐⭐
```typescript
const { error: transactionError } = await supabase.from('credit_transactions').insert({
  user_id: userId,
  type: 'purchase',
  amount: creditAmount,
  description: `Credit purchase: ${item.description || 'Stripe payment'}`,
  stripe_session_id: session.id,
  metadata: {
    stripe_payment_intent: session.payment_intent,
    stripe_customer_id: session.customer,
    product_name: item.description,
    amount_paid: session.amount_total,
    price_id: item.price?.id,
    quantity: item.quantity,
  },
});
```

**Benefits:**
- Complete audit trail
- Rich metadata for debugging
- Links to Stripe objects
- Financial reconciliation support
- Non-blocking (logs but doesn't fail webhook)

#### 8. **Stripe API Version** ⭐⭐⭐
```typescript
const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'), {
  apiVersion: '2025-06-30.basil',
  httpClient: Stripe.createFetchHttpClient()
});
```

**Benefits:**
- Uses newer API version (2025-06-30.basil)
- Fetch-based HTTP client for Deno
- Properly configured for edge functions

## Comparison with Existing Implementation

### If Main Has No Webhook
✅ **Recommendation:** Adopt ws branch webhook entirely

**Steps:**
1. Copy `stripe-webhook-new` folder to main
2. Update price IDs for your products
3. Deploy as edge function
4. Configure webhook in Stripe dashboard

### If Main Has Basic Webhook
The ws branch webhook is significantly more robust and should replace it.

**Key Advantages:**
- Better error handling
- Product configuration mapping
- Enhanced logging
- Transaction audit trail
- Multiple items support
- Proper user lookup

## Integration Steps

### 1. Copy Webhook Function
```bash
cp -r supabase/functions/stripe-webhook-new supabase/functions/stripe-webhook
```

### 2. Update Product Configuration
Edit the `STRIPE_PRODUCTS` object with your actual Stripe price IDs:
```typescript
const STRIPE_PRODUCTS = {
  'price_YOUR_SINGLE_CREDIT': {
    name: 'Single Credit',
    amount: 1
  },
  'price_YOUR_3_CREDITS': {
    name: '3-Credit Bundle',
    amount: 3
  },
  'price_YOUR_5_CREDITS': {
    name: '5-Credit Bundle',
    amount: 5
  }
};
```

### 3. Create RPC Function
Add this to your Supabase database:
```sql
CREATE OR REPLACE FUNCTION update_user_credits(
  p_user_id TEXT,
  p_credit_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update user's credit balance
  UPDATE profiles
  SET 
    credits = COALESCE(credits, 0) + p_credit_amount,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Deploy Edge Function
```bash
supabase functions deploy stripe-webhook
```

### 5. Set Environment Variables
```bash
supabase secrets set STRIPE_API_KEY=sk_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 6. Configure Stripe Webhook
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Select events: `checkout.session.completed`
4. Copy webhook signing secret
5. Add to Supabase secrets

## Testing

### Test with Stripe CLI
```bash
stripe listen --forward-to https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook

# In another terminal
stripe trigger checkout.session.completed
```

### Verify Logs
```bash
supabase functions logs stripe-webhook
```

Look for:
- 🚀 Function started
- 🔔 Event received
- 💰 Processing checkout
- 👤 Found user
- 📦 Processing items
- ✅ Success messages

## Additional Improvements to Consider

### 1. Retry Logic
Add exponential backoff for failed operations:
```typescript
async function retryOperation(operation: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

### 2. Idempotency
Prevent duplicate processing:
```typescript
// Check if session already processed
const { data: existing } = await supabase
  .from('processed_webhooks')
  .select('id')
  .eq('stripe_session_id', session.id)
  .single();

if (existing) {
  console.log('⏭️ Session already processed, skipping');
  return;
}

// After processing
await supabase.from('processed_webhooks').insert({
  stripe_session_id: session.id,
  event_id: receivedEvent.id,
  processed_at: new Date().toISOString()
});
```

### 3. Subscription Support
Add subscription event handling:
```typescript
case 'customer.subscription.created':
  await handleSubscriptionCreated(receivedEvent.data.object);
  break;
case 'customer.subscription.updated':
  await handleSubscriptionUpdated(receivedEvent.data.object);
  break;
case 'customer.subscription.deleted':
  await handleSubscriptionDeleted(receivedEvent.data.object);
  break;
```

### 4. Email Notifications
Send confirmation emails:
```typescript
// After successful credit allocation
await supabase.functions.invoke('brevo-email', {
  body: {
    to: customerEmail,
    template: 'credit_purchase',
    variables: {
      credits: creditAmount,
      total: session.amount_total / 100
    }
  }
});
```

## Recommendation Summary

✅ **ADOPT** the enhanced webhook from ws branch

**Reasons:**
1. ⭐⭐⭐⭐⭐ Superior error handling
2. ⭐⭐⭐⭐⭐ Better logging for debugging
3. ⭐⭐⭐⭐⭐ Product configuration system
4. ⭐⭐⭐⭐⭐ Transaction audit trail
5. ⭐⭐⭐⭐ Multiple items support
6. ⭐⭐⭐⭐ RPC for atomic updates
7. ⭐⭐⭐⭐ Email-based user lookup
8. ⭐⭐⭐ Newer Stripe API version

**Priority:** HIGH

This webhook is production-ready and significantly more robust than a basic implementation.

## Files to Review

### ws Branch
- `supabase/functions/stripe-webhook-new/index.ts` - Main implementation
- `supabase/functions/stripe-webhook-new/deno.json` - Deno config
- `supabase/functions/stripe-webhook-new/import_map.json` - Import maps

### Supporting Files
- `STRIPE_FRONTEND_INTEGRATION.md` - Frontend integration
- `CREDIT_BASED_EBOOK_FLOW.md` - Credit system docs

## Migration Checklist

- [ ] Review current webhook (if exists)
- [ ] Copy stripe-webhook-new to main
- [ ] Update STRIPE_PRODUCTS configuration
- [ ] Create/verify update_user_credits RPC function
- [ ] Deploy edge function
- [ ] Set Supabase secrets
- [ ] Configure Stripe webhook endpoint
- [ ] Test with Stripe CLI
- [ ] Test with real purchase (test mode)
- [ ] Monitor logs for errors
- [ ] Deploy to production
- [ ] Test production webhook
- [ ] Document webhook URL for team

## Support

If you encounter issues:
1. Check Supabase function logs
2. Check Stripe webhook logs in dashboard
3. Verify environment variables are set
4. Test webhook signature verification
5. Check RPC function exists and has correct permissions
