# Stripe Frontend Integration Guide

This document describes the Stripe frontend integration that was added to the Flip My Era application.

## Overview

The Stripe frontend integration enables users to:
- Purchase credits through Stripe Checkout
- Manage subscriptions through Stripe Billing Portal
- View and update payment methods
- Access billing history and invoices

## Components Added

### 1. Stripe Client (`src/core/integrations/stripe/client.ts`)

A singleton client that handles Stripe.js initialization and provides methods for:
- `redirectToCheckout()` - Redirect to Stripe Checkout for one-time payments
- `createSubscription()` - Redirect to Stripe Checkout for subscription purchases
- `redirectToBillingPortal()` - Open Stripe Billing Portal for subscription management

**Usage:**
```typescript
import { stripeClient } from '@/core/integrations/stripe/client';

// Purchase credits
await stripeClient.redirectToCheckout({
  priceId: 'price_xxx',
  successUrl: `${window.location.origin}/checkout-success`,
  cancelUrl: window.location.href,
  customerEmail: user.email,
});

// Open billing portal
await stripeClient.redirectToBillingPortal({
  returnUrl: window.location.href,
});
```

### 2. Stripe Billing Portal Component (`src/modules/user/components/StripeBillingPortal.tsx`)

A React component that displays a card with a button to open the Stripe Billing Portal.

**Props:**
- `customerId?: string` - Optional Stripe customer ID (currently not used as the backend handles lookup)
- `className?: string` - Optional CSS class name

**Usage:**
```tsx
import { StripeBillingPortal } from '@/modules/user/components/StripeBillingPortal';

<StripeBillingPortal className="mt-6" />
```

### 3. Stripe Credit Purchase Modal (`src/modules/user/components/StripeCreditPurchaseModal.tsx`)

A modal dialog that displays pricing tiers for credit purchases and subscriptions.

**Props:**
- `isOpen: boolean` - Whether the modal is open
- `onClose: () => void` - Callback when modal is closed
- `onSuccess: () => void` - Callback after successful purchase
- `currentBalance: number` - Current credit balance to display

**Usage:**
```tsx
import { StripeCreditPurchaseModal } from '@/modules/user/components/StripeCreditPurchaseModal';

const [isModalOpen, setIsModalOpen] = useState(false);

<StripeCreditPurchaseModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={() => {
    setIsModalOpen(false);
    // Refresh credit balance
  }}
  currentBalance={userCredits}
/>
```

## Environment Variables Required

Add these to your `.env` file (or `env.development` for local dev):

```bash
# Stripe Publishable Key (starts with pk_test_ or pk_live_)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Optional: Stripe Price IDs for credit bundles
VITE_STRIPE_PRICE_1_CREDIT=price_xxx
VITE_STRIPE_PRICE_3_CREDITS=price_xxx
VITE_STRIPE_PRICE_5_CREDITS=price_xxx
```

## Backend Integration

The frontend components work with these Supabase Edge Functions:

### 1. `stripe-portal` Function
- Creates a Stripe Billing Portal session
- Endpoint: `supabase.functions.invoke('stripe-portal')`
- Returns: `{ url: string }` - URL to redirect user to

### 2. `create-checkout` Function (if exists)
- Creates a Stripe Checkout session
- Used as an alternative to client-side redirect

## Setup Steps

1. **Install Dependencies** ✅
   ```bash
   npm install @stripe/stripe-js
   ```

2. **Configure Environment Variables**
   - Get your Stripe Publishable Key from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Add to `env.development` or `.env`

3. **Create Stripe Products & Prices**
   - Log into your Stripe Dashboard
   - Create products for credit bundles
   - Copy the Price IDs and update `StripeCreditPurchaseModal.tsx` or use environment variables

4. **Update Price IDs**
   - In `StripeCreditPurchaseModal.tsx`, update the `stripePriceId` values in the `pricingTiers` array
   - Or set the environment variables for the price IDs

5. **Test Integration**
   - Use Stripe test mode with test cards
   - Test card: `4242 4242 4242 4242`
   - Any future expiry date and CVC

## Integration with Existing Code

### UserDashboard Integration Example

```tsx
import { useState } from 'react';
import { StripeBillingPortal } from './StripeBillingPortal';
import { StripeCreditPurchaseModal } from './StripeCreditPurchaseModal';
import { Button } from '@/modules/shared/components/ui/button';

export const UserDashboard = () => {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const { user } = useClerkAuth();
  const creditBalance = user?.credits || 0;

  return (
    <div className="space-y-6">
      {/* Credit Balance Display */}
      <div className="flex items-center justify-between">
        <span>Credits: {creditBalance}</span>
        <Button onClick={() => setShowPurchaseModal(true)}>
          Purchase Credits
        </Button>
      </div>

      {/* Billing Portal */}
      <StripeBillingPortal />

      {/* Purchase Modal */}
      <StripeCreditPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={() => {
          setShowPurchaseModal(false);
          // Refresh credit balance
        }}
        currentBalance={creditBalance}
      />
    </div>
  );
};
```

## Styling

The components use Shadcn/ui components and follow the project's existing design patterns:
- Uses Tailwind CSS for styling
- Supports light/dark mode through theme system
- Uses `text-muted-foreground`, `ring-primary`, etc. for theme-aware colors

## Security Considerations

- ✅ All payment processing happens on Stripe's servers
- ✅ No credit card data is stored in your application
- ✅ Uses Stripe's secure checkout and billing portal
- ✅ Backend validates all transactions through webhooks
- ✅ Clerk authentication required for all operations

## Testing

### Test Mode
1. Use Stripe test keys (`pk_test_...` and `sk_test_...`)
2. Test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires Auth: `4000 0027 6000 3184`

### Manual Testing Checklist
- [ ] Credit purchase flow works
- [ ] Billing portal opens correctly
- [ ] Success/cancel redirects work
- [ ] Credit balance updates after purchase
- [ ] Error messages display properly

## Troubleshooting

### "Stripe failed to initialize"
- Check that `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
- Ensure the key starts with `pk_test_` or `pk_live_`

### "Failed to create billing portal session"
- Verify the `stripe-portal` Supabase function is deployed
- Check that user is authenticated with Clerk
- Verify Stripe secret key is set in Supabase secrets

### Checkout doesn't redirect
- Check that Price IDs are valid in your Stripe account
- Verify success/cancel URLs are correct
- Check browser console for errors

## Future Enhancements

- [ ] Add support for discount codes/coupons
- [ ] Implement subscription upgrade/downgrade flows
- [ ] Add payment method management UI
- [ ] Show invoice history in the app
- [ ] Add usage-based billing support

## Resources

- [Stripe.js Documentation](https://stripe.com/docs/js)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Billing Portal Documentation](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe Testing Documentation](https://stripe.com/docs/testing)
