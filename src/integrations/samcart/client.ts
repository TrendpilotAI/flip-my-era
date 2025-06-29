// SamCart integration client

interface SamCartProduct {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
}

interface SamCartCheckoutOptions {
  productId: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  couponCode?: string;
  affiliateId?: string;
  redirectUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string | number | boolean>;
}

interface SamCartCustomerPortalOptions {
  customerEmail?: string;
  customerId?: string;
  returnUrl?: string;
}

class SamCartClient {
  private apiKey: string;
  private merchantId: string;
  private baseUrl: string;
  private customerPortalUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_SAMCART_API_KEY || '';
    this.merchantId = import.meta.env.VITE_SAMCART_MERCHANT_ID || '';
    this.baseUrl = 'https://checkout.samcart.com/products';
    this.customerPortalUrl = 'https://flipmyera.samcart.com/customer_hub';
    
    if (!this.apiKey || !this.merchantId) {
      console.warn('SamCart API key or Merchant ID not provided. Checkout functionality will be limited.');
    }
  }

  /**
   * Generate a SamCart checkout URL
   */
  generateCheckoutUrl(options: SamCartCheckoutOptions): string {
    const { 
      productId, 
      customerEmail, 
      customerName, 
      couponCode, 
      affiliateId,
      redirectUrl,
      cancelUrl,
      metadata
    } = options;

    // Base checkout URL
    let checkoutUrl = `${this.baseUrl}/${productId}/checkout`;
    
    // Add query parameters
    const params = new URLSearchParams();
    
    if (customerEmail) params.append('email', customerEmail);
    if (customerName) params.append('name', customerName);
    if (couponCode) params.append('coupon', couponCode);
    if (affiliateId) params.append('affiliate_id', affiliateId);
    if (redirectUrl) params.append('redirect_url', redirectUrl);
    if (cancelUrl) params.append('cancel_url', cancelUrl);
    
    // Add metadata as encoded JSON if provided
    if (metadata && Object.keys(metadata).length > 0) {
      params.append('metadata', JSON.stringify(metadata));
    }
    
    // Append query parameters if any exist
    const queryString = params.toString();
    if (queryString) {
      checkoutUrl += `?${queryString}`;
    }
    
    return checkoutUrl;
  }

  /**
   * Generate customer portal URL
   */
  generateCustomerPortalUrl(options: SamCartCustomerPortalOptions = {}): string {
    const { customerEmail, customerId, returnUrl } = options;
    
    let portalUrl = this.customerPortalUrl;
    const params = new URLSearchParams();
    
    if (customerEmail) params.append('email', customerEmail);
    if (customerId) params.append('customer_id', customerId);
    if (returnUrl) params.append('return_url', returnUrl);
    
    const queryString = params.toString();
    if (queryString) {
      portalUrl += `?${queryString}`;
    }
    
    return portalUrl;
  }

  /**
   * Redirect to SamCart checkout
   */
  redirectToCheckout(options: SamCartCheckoutOptions): void {
    const checkoutUrl = this.generateCheckoutUrl(options);
    window.location.href = checkoutUrl;
  }

  /**
   * Open SamCart checkout in a new tab
   */
  openCheckoutInNewTab(options: SamCartCheckoutOptions): void {
    const checkoutUrl = this.generateCheckoutUrl(options);
    window.open(checkoutUrl, '_blank');
  }

  /**
   * Open customer portal in a new tab
   */
  openCustomerPortal(options: SamCartCustomerPortalOptions = {}): void {
    const portalUrl = this.generateCustomerPortalUrl(options);
    window.open(portalUrl, '_blank');
  }

  /**
   * Redirect to customer portal
   */
  redirectToCustomerPortal(options: SamCartCustomerPortalOptions = {}): void {
    const portalUrl = this.generateCustomerPortalUrl(options);
    window.location.href = portalUrl;
  }

  /**
   * Get customer portal iframe URL for embedding
   */
  getCustomerPortalIframeUrl(options: SamCartCustomerPortalOptions = {}): string {
    return this.generateCustomerPortalUrl(options);
  }

  /**
   * Get available products (mock implementation)
   * In a real implementation, this would call the SamCart API
   */
  getProducts(): SamCartProduct[] {
    // Mock products - in a real implementation, these would come from the SamCart API
    return [
      {
        id: 'basic-plan',
        name: 'Basic Plan',
        price: 9.99,
        description: 'Access to basic features with 10 stories per month',
        imageUrl: '/images/basic-plan.jpg'
      },
      {
        id: 'premium-plan',
        name: 'Premium Plan',
        price: 19.99,
        description: 'Unlimited stories, illustrations, and premium features',
        imageUrl: '/images/premium-plan.jpg'
      },
      {
        id: 'family-plan',
        name: 'Family Plan',
        price: 29.99,
        description: 'Premium features for up to 5 family members',
        imageUrl: '/images/family-plan.jpg'
      }
    ];
  }

  /**
   * Check if customer portal is available
   */
  isCustomerPortalAvailable(): boolean {
    return !!(this.merchantId && this.customerPortalUrl);
  }
}

export const samcartClient = new SamCartClient(); 