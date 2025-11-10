import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, handleCors, formatErrorResponse, formatSuccessResponse } from "../_shared/utils.ts";

interface CheckoutRequest {
  productId: string;
  customerEmail?: string;
  customerName?: string;
  couponCode?: string;
  affiliateId?: string;
  redirectUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string | number | boolean>;
}

const DEFAULT_BASE_URL = "https://checkout.samcart.com/products";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return new Response(null, { status: 405, headers: corsHeaders });
  }

  let payload: CheckoutRequest;
  try {
    payload = await req.json();
  } catch (_error) {
    return formatErrorResponse(new Error("Invalid JSON payload"), 400);
  }

  try {
    const baseUrl = sanitizeBaseUrl(Deno.env.get("SAMCART_BASE_URL") || DEFAULT_BASE_URL);
    const url = buildCheckoutUrl(baseUrl, payload);
    return formatSuccessResponse({ url });
  } catch (error) {
    return formatErrorResponse(error instanceof Error ? error : new Error(String(error)), 400);
  }
});

function buildCheckoutUrl(baseUrl: string, payload: CheckoutRequest): string {
  if (!payload?.productId) {
    throw new Error('productId is required');
  }

  const productId = sanitizeIdentifier(payload.productId);
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(productId)}/checkout`);

  if (payload.customerEmail) {
    url.searchParams.set('email', validateEmail(payload.customerEmail));
  }

  if (payload.customerName) {
    url.searchParams.set('name', sanitizeString(payload.customerName, 100));
  }

  if (payload.couponCode) {
    url.searchParams.set('coupon', sanitizeString(payload.couponCode, 50));
  }

  if (payload.affiliateId) {
    url.searchParams.set('affiliate_id', sanitizeString(payload.affiliateId, 50));
  }

  if (payload.redirectUrl) {
    url.searchParams.set('redirect_url', validateUrl(payload.redirectUrl));
  }

  if (payload.cancelUrl) {
    url.searchParams.set('cancel_url', validateUrl(payload.cancelUrl));
  }

  if (payload.metadata && Object.keys(payload.metadata).length > 0) {
    const sanitizedMetadata = sanitizeMetadata(payload.metadata);
    if (Object.keys(sanitizedMetadata).length > 0) {
      url.searchParams.set('metadata', JSON.stringify(sanitizedMetadata));
    }
  }

  return url.toString();
}

function sanitizeBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error();
    }
    return parsed.toString().replace(/\/$/, '');
  } catch (_error) {
    throw new Error('Invalid SAMCART_BASE_URL configuration');
  }
}

function validateEmail(email: string): string {
  const sanitized = email?.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!sanitized || !emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  return sanitized.replace(/[<>"'&]/g, '');
}

function sanitizeString(value: string, maxLength = 255): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>"'&]/g, '')
    .slice(0, maxLength)
    .trim();
}

function sanitizeIdentifier(value: string): string {
  const sanitized = sanitizeString(value, 100).replace(/[^a-zA-Z0-9\-_]/g, '');
  if (!sanitized) {
    throw new Error('Invalid productId');
  }
  return sanitized;
}

function validateUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error();
    }

    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.startsWith('127.') || hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('172.')) {
      throw new Error();
    }

    return parsed.toString();
  } catch (_error) {
    throw new Error('Invalid redirect or cancel URL');
  }
}

function sanitizeMetadata(metadata: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const sanitizedKey = sanitizeString(key, 50);
    if (!sanitizedKey) continue;

    if (typeof value === 'string') {
      const sanitizedValue = sanitizeString(value, 500);
      if (sanitizedValue) {
        result[sanitizedKey] = sanitizedValue;
      }
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      result[sanitizedKey] = value;
    } else if (typeof value === 'boolean') {
      result[sanitizedKey] = value;
    }
  }

  return result;
}
