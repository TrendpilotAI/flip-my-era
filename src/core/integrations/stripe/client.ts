import { invokeAuthenticatedFunction } from '@/core/integrations/supabase/client';
import type {
  CheckoutFunctionResponse,
  PortalFunctionResponse,
} from '@/core/integrations/supabase/functionResponses';

export interface StripeCheckoutOptions {
  plan: string;
  successUrl: string;
  cancelUrl: string;
  productType?: 'credits' | 'subscription';
}

export interface StripeBillingPortalOptions {
  returnUrl: string;
}

export class StripeClient {
  private static instance: StripeClient;

  private constructor() {}

  static getInstance(): StripeClient {
    if (!StripeClient.instance) {
      StripeClient.instance = new StripeClient();
    }
    return StripeClient.instance;
  }

  async redirectToCheckout(options: StripeCheckoutOptions): Promise<void> {
    const { data, error } = await invokeAuthenticatedFunction<CheckoutFunctionResponse>('create-checkout', {
      body: {
        plan: options.plan,
        productType: options.productType,
        successUrl: options.successUrl,
        cancelUrl: options.cancelUrl,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to create checkout session');
    }

    if (data?.url) {
      window.location.href = data.url as string;
    } else {
      throw new Error('No checkout URL returned');
    }
  }

  async redirectToBillingPortal(options: StripeBillingPortalOptions): Promise<void> {
    // Call the Supabase edge function to create a billing portal session
    const { data, error } = await invokeAuthenticatedFunction<PortalFunctionResponse>('stripe-portal', {
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
    plan: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<void> {
    await this.redirectToCheckout({
      plan: options.plan,
      successUrl: options.successUrl,
      cancelUrl: options.cancelUrl,
    });
  }
}

export const stripeClient = StripeClient.getInstance();
