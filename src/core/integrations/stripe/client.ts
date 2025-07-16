import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key and locale configuration
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!, {
  // Remove locale configuration to avoid CDN issues
  // locale: 'en',
  // Disable advanced fraud signals to avoid locale loading
  advancedFraudSignals: false,
});

export interface StripeCheckoutOptions {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  quantity?: number;
}

export interface StripeBillingPortalOptions {
  customerId: string;
  returnUrl: string;
}

export class StripeClient {
  private static instance: StripeClient;
  private stripe: any = null;

  private constructor() {}

  static getInstance(): StripeClient {
    if (!StripeClient.instance) {
      StripeClient.instance = new StripeClient();
    }
    return StripeClient.instance;
  }

  async initialize() {
    if (!this.stripe) {
      this.stripe = await stripePromise;
    }
    return this.stripe;
  }

  async redirectToCheckout(options: StripeCheckoutOptions) {
    const stripe = await this.initialize();
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    const { error } = await stripe.redirectToCheckout({
      lineItems: [
        {
          price: options.priceId,
          quantity: options.quantity || 1,
        },
      ],
      mode: 'payment',
      successUrl: options.successUrl,
      cancelUrl: options.cancelUrl,
      customerEmail: options.customerEmail,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async redirectToBillingPortal(options: StripeBillingPortalOptions) {
    // This requires a backend call to create a billing portal session
    const response = await fetch('/api/stripe/create-billing-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId: options.customerId,
        returnUrl: options.returnUrl,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create billing portal session');
    }

    const { url } = await response.json();
    window.location.href = url;
  }

  async createSubscription(options: {
    priceId: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    const stripe = await this.initialize();
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    const { error } = await stripe.redirectToCheckout({
      lineItems: [
        {
          price: options.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      successUrl: options.successUrl,
      cancelUrl: options.cancelUrl,
      customerEmail: options.customerEmail,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

export const stripeClient = StripeClient.getInstance(); 