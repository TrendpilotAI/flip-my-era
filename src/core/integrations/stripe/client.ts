import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '@/core/integrations/supabase/client';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export interface StripeCheckoutOptions {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

export interface StripeBillingPortalOptions {
  returnUrl: string;
}

export class StripeClient {
  private static instance: StripeClient;
  private stripe: Stripe | null = null;

  private constructor() {}

  static getInstance(): StripeClient {
    if (!StripeClient.instance) {
      StripeClient.instance = new StripeClient();
    }
    return StripeClient.instance;
  }

  async initialize(): Promise<Stripe | null> {
    if (!this.stripe) {
      this.stripe = await stripePromise;
    }
    return this.stripe;
  }

  async redirectToCheckout(options: StripeCheckoutOptions): Promise<void> {
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
      mode: 'payment',
      successUrl: options.successUrl,
      cancelUrl: options.cancelUrl,
      customerEmail: options.customerEmail,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async redirectToBillingPortal(options: StripeBillingPortalOptions): Promise<void> {
    // Call the Supabase edge function to create a billing portal session
    const { data, error } = await supabase.functions.invoke('stripe-portal', {
      method: 'POST',
      body: JSON.stringify({
        returnUrl: options.returnUrl,
      }),
    });

    if (error) {
      console.error('Error creating billing portal session:', error);
      throw new Error('Failed to create billing portal session');
    }

    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No URL returned from billing portal');
    }
  }

  async createSubscription(options: {
    priceId: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<void> {
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
