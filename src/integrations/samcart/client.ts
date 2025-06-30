// SamCart integration client

/**
 * Input validation utilities for SamCart integration
 */
class InputValidator {
  /**
   * Sanitize and validate email addresses
   */
  static validateEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email format');
    }
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // Sanitize by removing potentially dangerous characters
    return email.replace(/[<>'"&]/g, '').trim();
  }

  /**
   * Sanitize string inputs to prevent injection attacks
   */
  static sanitizeString(input: string, maxLength: number = 255): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // Remove HTML tags, script tags, and other potentially dangerous content
    const sanitized = input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[<>'"&]/g, '') // Remove dangerous characters
      .trim();
    
    // Limit length to prevent buffer overflow attacks
    return sanitized.substring(0, maxLength);
  }

  /**
   * Validate and sanitize URLs
   */
  static validateUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL format');
    }
    
    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid URL protocol. Only HTTP and HTTPS are allowed.');
      }
      
      // Prevent localhost/internal network access in production
      if (import.meta.env.PROD) {
        const hostname = urlObj.hostname.toLowerCase();
        if (hostname === 'localhost' ||
            hostname.startsWith('127.') ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.')) {
          throw new Error('Internal network URLs are not allowed');
        }
      }
      
      return urlObj.toString();
    } catch (error) {
      throw new Error(`Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate product ID format
   */
  static validateProductId(productId: string): string {
    if (!productId || typeof productId !== 'string') {
      throw new Error('Product ID is required');
    }
    
    // Allow only alphanumeric characters, hyphens, and underscores
    const sanitized = productId.replace(/[^a-zA-Z0-9\-_]/g, '');
    
    if (sanitized.length === 0 || sanitized.length > 100) {
      throw new Error('Invalid product ID format');
    }
    
    return sanitized;
  }

  /**
   * Validate and sanitize metadata object
   */
  static validateMetadata(metadata: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
    if (!metadata || typeof metadata !== 'object') {
      return {};
    }
    
    const sanitized: Record<string, string | number | boolean> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      // Sanitize key
      const sanitizedKey = this.sanitizeString(key, 50);
      if (sanitizedKey.length === 0) continue;
      
      // Validate and sanitize value based on type
      if (typeof value === 'string') {
        const sanitizedValue = this.sanitizeString(value, 500);
        if (sanitizedValue.length > 0) {
          sanitized[sanitizedKey] = sanitizedValue;
        }
      } else if (typeof value === 'number' && isFinite(value)) {
        sanitized[sanitizedKey] = value;
      } else if (typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      }
    }
    
    return sanitized;
  }
}

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
      // Log warning without exposing sensitive information
      console.warn('SamCart configuration incomplete. Checkout functionality will be limited.');
    }
  }

  /**
   * Safely log errors without exposing sensitive information
   */
  private logError(message: string, error?: unknown): void {
    // In production, avoid logging sensitive details
    if (import.meta.env.PROD) {
      console.error(`SamCart Error: ${message}`);
    } else {
      console.error(`SamCart Error: ${message}`, error);
    }
  }

  /**
   * Generate a SamCart checkout URL with input validation
   */
  generateCheckoutUrl(options: SamCartCheckoutOptions): string {
    try {
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

      // Validate and sanitize required productId
      const validatedProductId = InputValidator.validateProductId(productId);

      // Base checkout URL with validated product ID
      let checkoutUrl = `${this.baseUrl}/${encodeURIComponent(validatedProductId)}/checkout`;
      
      // Add query parameters with validation
      const params = new URLSearchParams();
      
      if (customerEmail) {
        const validatedEmail = InputValidator.validateEmail(customerEmail);
        params.append('email', validatedEmail);
      }
      
      if (customerName) {
        const sanitizedName = InputValidator.sanitizeString(customerName, 100);
        if (sanitizedName) params.append('name', sanitizedName);
      }
      
      if (couponCode) {
        const sanitizedCoupon = InputValidator.sanitizeString(couponCode, 50);
        if (sanitizedCoupon) params.append('coupon', sanitizedCoupon);
      }
      
      if (affiliateId) {
        const sanitizedAffiliateId = InputValidator.sanitizeString(affiliateId, 50);
        if (sanitizedAffiliateId) params.append('affiliate_id', sanitizedAffiliateId);
      }
      
      if (redirectUrl) {
        const validatedRedirectUrl = InputValidator.validateUrl(redirectUrl);
        params.append('redirect_url', validatedRedirectUrl);
      }
      
      if (cancelUrl) {
        const validatedCancelUrl = InputValidator.validateUrl(cancelUrl);
        params.append('cancel_url', validatedCancelUrl);
      }
      
      // Add metadata with validation
      if (metadata && Object.keys(metadata).length > 0) {
        const validatedMetadata = InputValidator.validateMetadata(metadata);
        if (Object.keys(validatedMetadata).length > 0) {
          params.append('metadata', JSON.stringify(validatedMetadata));
        }
      }
      
      // Append query parameters if any exist
      const queryString = params.toString();
      if (queryString) {
        checkoutUrl += `?${queryString}`;
      }
      
      return checkoutUrl;
    } catch (error) {
      this.logError('Failed to generate checkout URL', error);
      throw new Error('Invalid checkout parameters provided');
    }
  }

  /**
   * Generate customer portal URL with input validation
   */
  generateCustomerPortalUrl(options: SamCartCustomerPortalOptions = {}): string {
    try {
      const { customerEmail, customerId, returnUrl } = options;
      
      let portalUrl = this.customerPortalUrl;
      const params = new URLSearchParams();
      
      if (customerEmail) {
        const validatedEmail = InputValidator.validateEmail(customerEmail);
        params.append('email', validatedEmail);
      }
      
      if (customerId) {
        const sanitizedCustomerId = InputValidator.sanitizeString(customerId, 50);
        if (sanitizedCustomerId) params.append('customer_id', sanitizedCustomerId);
      }
      
      if (returnUrl) {
        const validatedReturnUrl = InputValidator.validateUrl(returnUrl);
        params.append('return_url', validatedReturnUrl);
      }
      
      const queryString = params.toString();
      if (queryString) {
        portalUrl += `?${queryString}`;
      }
      
      return portalUrl;
    } catch (error) {
      this.logError('Failed to generate customer portal URL', error);
      throw new Error('Invalid customer portal parameters provided');
    }
  }

  /**
   * Redirect to SamCart checkout with error handling
   */
  redirectToCheckout(options: SamCartCheckoutOptions): void {
    try {
      const checkoutUrl = this.generateCheckoutUrl(options);
      window.location.href = checkoutUrl;
    } catch (error) {
      this.logError('Failed to redirect to checkout', error);
      throw new Error('Unable to redirect to checkout. Please check your input and try again.');
    }
  }

  /**
   * Open SamCart checkout in a new tab with error handling
   */
  openCheckoutInNewTab(options: SamCartCheckoutOptions): void {
    try {
      const checkoutUrl = this.generateCheckoutUrl(options);
      const newWindow = window.open(checkoutUrl, '_blank');
      if (!newWindow) {
        throw new Error('Popup blocked or failed to open');
      }
    } catch (error) {
      this.logError('Failed to open checkout in new tab', error);
      throw new Error('Unable to open checkout. Please check your popup settings and try again.');
    }
  }

  /**
   * Open customer portal in a new tab with error handling
   */
  openCustomerPortal(options: SamCartCustomerPortalOptions = {}): void {
    try {
      const portalUrl = this.generateCustomerPortalUrl(options);
      const newWindow = window.open(portalUrl, '_blank');
      if (!newWindow) {
        throw new Error('Popup blocked or failed to open');
      }
    } catch (error) {
      this.logError('Failed to open customer portal', error);
      throw new Error('Unable to open customer portal. Please check your popup settings and try again.');
    }
  }

  /**
   * Redirect to customer portal with error handling
   */
  redirectToCustomerPortal(options: SamCartCustomerPortalOptions = {}): void {
    try {
      const portalUrl = this.generateCustomerPortalUrl(options);
      window.location.href = portalUrl;
    } catch (error) {
      this.logError('Failed to redirect to customer portal', error);
      throw new Error('Unable to redirect to customer portal. Please check your input and try again.');
    }
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