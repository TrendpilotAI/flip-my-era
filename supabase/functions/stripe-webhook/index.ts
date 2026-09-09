import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";
import {
  isCheckoutSessionPaid,
  isPaidSubscriptionInvoice,
} from "../_shared/checkoutSettlement.ts";
import { resolveStripeSecretKey } from "../_shared/stripe.ts";

const responseHeaders = {
  "Content-Type": "application/json",
};

interface StripeCheckoutSession {
  id: string;
  customer: string | null;
  customer_email: string | null;
  metadata: Record<string, string> | null;
  payment_intent: string | null;
  payment_status: string | null;
  amount_total: number | null;
  currency: string | null;
}

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  metadata: Record<string, string> | null;
  current_period_start?: number | null;
  current_period_end?: number | null;
  latest_invoice?: string | { id: string } | null;
  items?: {
    data?: Array<{
      price?: {
        metadata?: Record<string, string> | null;
      };
    }>;
  };
}

interface StripeInvoice {
  id: string;
  customer: string;
  subscription?: string | { id: string } | null;
  payment_intent?: string | { id: string } | null;
  billing_reason?: string | null;
  paid?: boolean | null;
  amount_due: number;
  currency?: string | null;
}

interface StripeRefund {
  id: string;
  amount: number;
  created?: number;
  status?: string | null;
}

interface StripeCharge {
  id: string;
  customer: string;
  amount: number;
  amount_refunded: number;
  payment_intent: string | null;
  metadata?: Record<string, string> | null;
  refunds?: {
    data?: StripeRefund[];
  };
}

interface Profile {
  id: string;
  stripe_customer_id: string | null;
}

interface WebhookClaim {
  claimed: boolean;
  event_status: "processing" | "completed" | "failed";
  attempt_count: number;
}

interface CreditTransactionResult {
  success: boolean;
  new_balance: number | string;
  transaction_id: string | null;
  is_replay: boolean;
}

interface CreditTransactionInput {
  userId: string;
  amount: number;
  transactionType: string;
  description: string;
  metadata: Record<string, unknown>;
  idempotencyKey: string;
  referenceId?: string | null;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeSubscriptionId?: string | null;
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function firstRpcRow<T>(data: T | T[] | null): T | null {
  return Array.isArray(data) ? (data[0] ?? null) : data;
}

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required`);
  }
  return value;
}

function expandableId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (
    typeof value === "object" &&
    value !== null &&
    typeof value.id === "string" &&
    value.id.trim() !== ""
  ) {
    return value.id;
  }
  return null;
}

function parsePositiveCredits(value: unknown, field: string): number {
  const normalized = typeof value === "string" ? value.trim() : "";
  const credits = Number(normalized);
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized) || credits <= 0) {
    throw new Error(
      `${field} must be a positive number with at most two decimal places`,
    );
  }
  return credits;
}

function mapSubscriptionStatus(status: string): string {
  if (status === "active" || status === "trialing") return "active";
  if (status === "canceled") return "cancelled";
  if (status === "past_due" || status === "unpaid") return "past_due";
  return "none";
}

function profileStatusForPlan(
  plan: string,
  stripeStatus: string,
): "free" | "basic" | "premium" {
  if (stripeStatus !== "active" && stripeStatus !== "trialing") return "free";

  const normalized = plan.toLowerCase();
  if (
    normalized === "speaknow" || normalized === "speaknowannual" ||
    normalized === "starter"
  ) {
    return "basic";
  }
  if (
    normalized === "midnights" ||
    normalized === "midnightsannual" ||
    normalized === "erastour" ||
    normalized === "erastourannual" ||
    normalized === "deluxe" ||
    normalized === "vip"
  ) {
    return "premium";
  }

  throw new Error(
    `Unsupported subscription plan metadata: ${plan || "missing"}`,
  );
}

function subscriptionTypeForPlan(plan: string): "monthly" | "annual" {
  return plan.toLowerCase().endsWith("annual") ? "annual" : "monthly";
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function findProfileById(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(`Profile lookup failed: ${error.message}`);
  if (!data) throw new Error(`Profile not found for user ${userId}`);
  return data as Profile;
}

async function findProfileByCustomer(
  supabase: SupabaseClient,
  customerId: string,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, stripe_customer_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) throw new Error(`Profile lookup failed: ${error.message}`);
  if (!data) {
    throw new Error(`Profile not found for Stripe customer ${customerId}`);
  }
  return data as Profile;
}

async function ensureStripeCustomer(
  supabase: SupabaseClient,
  profile: Profile,
  customerId: string,
): Promise<void> {
  if (profile.stripe_customer_id && profile.stripe_customer_id !== customerId) {
    throw new Error(`Stripe customer mismatch for profile ${profile.id}`);
  }
  if (profile.stripe_customer_id === customerId) return;

  const { error } = await supabase
    .from("profiles")
    .update({ stripe_customer_id: customerId })
    .eq("id", profile.id);
  if (error) throw new Error(`Stripe customer update failed: ${error.message}`);
}

async function resolveSubscriptionProfile(
  supabase: SupabaseClient,
  customerId: string,
  metadata: Record<string, string>,
): Promise<Profile> {
  const profile = metadata.userId
    ? await findProfileById(supabase, metadata.userId)
    : await findProfileByCustomer(supabase, customerId);
  await ensureStripeCustomer(supabase, profile, customerId);
  return profile;
}

async function applyCreditTransaction(
  supabase: SupabaseClient,
  input: CreditTransactionInput,
): Promise<CreditTransactionResult> {
  const { data, error } = await supabase.rpc("apply_credit_transaction", {
    p_user_id: input.userId,
    p_amount: input.amount,
    p_transaction_type: input.transactionType,
    p_description: input.description,
    p_metadata: input.metadata,
    p_idempotency_key: input.idempotencyKey,
    p_reference_id: input.referenceId ?? null,
    p_stripe_session_id: input.stripeSessionId ?? null,
    p_stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
    p_stripe_subscription_id: input.stripeSubscriptionId ?? null,
  });

  if (error) throw new Error(`Credit transaction failed: ${error.message}`);
  const result = firstRpcRow(
    data as CreditTransactionResult | CreditTransactionResult[] | null,
  );
  if (!result?.success) {
    throw new Error(
      `Credit transaction was rejected for ${input.transactionType}`,
    );
  }
  return result;
}

async function handleCheckoutCompleted(
  supabase: SupabaseClient,
  session: StripeCheckoutSession,
  eventId: string,
): Promise<void> {
  const sessionId = requireNonEmptyString(session.id, "Checkout session ID");
  const customerId = session.customer === null
    ? null
    : requireNonEmptyString(session.customer, "Checkout customer ID");
  const metadata = session.metadata;
  if (!metadata) {
    throw new Error(`Checkout session ${sessionId} is missing metadata`);
  }

  const metadataType = requireNonEmptyString(
    metadata.type,
    "Checkout metadata.type",
  );
  if (metadataType !== "credits" && metadataType !== "subscription") {
    throw new Error(`Unsupported checkout metadata.type: ${metadataType}`);
  }

  const userId = requireNonEmptyString(
    metadata.userId,
    "Checkout metadata.userId",
  );
  const profile = await findProfileById(supabase, userId);
  if (customerId) await ensureStripeCustomer(supabase, profile, customerId);

  if (metadataType === "subscription") return;

  if (!isCheckoutSessionPaid(session)) {
    console.log(
      `Deferring credit grant for unsettled checkout session ${sessionId}`,
    );
    return;
  }

  const credits = parsePositiveCredits(
    metadata.credits,
    "Checkout metadata.credits",
  );
  const paymentIntentId = requireNonEmptyString(
    session.payment_intent,
    "Checkout payment intent ID",
  );
  if (
    session.amount_total === null || !Number.isFinite(session.amount_total) ||
    session.amount_total < 0
  ) {
    throw new Error(
      `Checkout session ${sessionId} has an invalid amount_total`,
    );
  }

  await applyCreditTransaction(supabase, {
    userId: profile.id,
    amount: credits,
    transactionType: "purchase",
    description: `Credit purchase via Stripe - ${credits} credits`,
    metadata: {
      stripe_event_id: eventId,
      session_id: sessionId,
      payment_intent: paymentIntentId,
      amount_total: session.amount_total,
      currency: session.currency,
    },
    idempotencyKey: `stripe:event:${eventId}:purchase`,
    referenceId: eventId,
    stripeSessionId: sessionId,
    stripePaymentIntentId: paymentIntentId,
  });
}

async function handleSubscriptionChange(
  supabase: SupabaseClient,
  subscription: StripeSubscription,
): Promise<void> {
  const subscriptionId = requireNonEmptyString(
    subscription.id,
    "Subscription ID",
  );
  const customerId = requireNonEmptyString(
    subscription.customer,
    "Subscription customer ID",
  );
  const metadata = subscription.metadata ?? {};
  const priceMetadata = subscription.items?.data?.[0]?.price?.metadata ?? {};
  const plan = metadata.plan || priceMetadata.plan || priceMetadata.tier || "";
  const profile = await resolveSubscriptionProfile(
    supabase,
    customerId,
    metadata,
  );
  const subscriptionStatus = mapSubscriptionStatus(subscription.status);
  const profileStatus = profileStatusForPlan(plan, subscription.status);

  const { error: creditUpdateError } = await supabase
    .from("user_credits")
    .upsert({
      user_id: profile.id,
      subscription_status: subscriptionStatus,
      stripe_subscription_id: subscriptionId,
      subscription_type: subscriptionTypeForPlan(plan),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  if (creditUpdateError) {
    throw new Error(
      `Subscription credit status update failed: ${creditUpdateError.message}`,
    );
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({ subscription_status: profileStatus })
    .eq("id", profile.id);
  if (profileUpdateError) {
    throw new Error(
      `Profile subscription status update failed: ${profileUpdateError.message}`,
    );
  }
}

async function handleInvoicePaid(
  supabase: SupabaseClient,
  stripe: Stripe,
  invoice: StripeInvoice,
  eventId: string,
): Promise<void> {
  const invoiceId = requireNonEmptyString(invoice.id, "Invoice ID");
  if (!isPaidSubscriptionInvoice(invoice)) {
    console.log(
      `Ignoring invoice ${invoiceId} until its subscription payment settles`,
    );
    return;
  }

  const subscriptionId = expandableId(invoice.subscription);
  if (!subscriptionId) return;
  const customerId = requireNonEmptyString(
    invoice.customer,
    "Invoice customer ID",
  );
  const subscription = await stripe.subscriptions.retrieve(
    subscriptionId,
  ) as unknown as StripeSubscription;
  if (subscription.id !== subscriptionId) {
    throw new Error(`Invoice ${invoiceId} resolved the wrong subscription`);
  }
  if (subscription.customer !== customerId) {
    throw new Error(
      `Invoice ${invoiceId} customer does not match subscription`,
    );
  }

  const metadata = subscription.metadata ?? {};
  const priceMetadata = subscription.items?.data?.[0]?.price?.metadata ?? {};
  const plan = metadata.plan || priceMetadata.plan || priceMetadata.tier || "";
  const credits = parsePositiveCredits(
    metadata.credits || priceMetadata.credits,
    "Subscription metadata.credits",
  );
  const profile = await resolveSubscriptionProfile(
    supabase,
    customerId,
    metadata,
  );

  await applyCreditTransaction(supabase, {
    userId: profile.id,
    amount: credits,
    transactionType: "monthly_allocation",
    description: `Subscription credit allocation - ${plan} plan`,
    metadata: {
      stripe_event_id: eventId,
      subscription_id: subscriptionId,
      invoice_id: invoiceId,
      billing_reason: invoice.billing_reason,
      plan,
      period_start: subscription.current_period_start ?? null,
      period_end: subscription.current_period_end ?? null,
    },
    idempotencyKey:
      `stripe:subscription:${subscriptionId}:invoice:${invoiceId}:monthly-allocation`,
    referenceId: invoiceId,
    stripeSubscriptionId: subscriptionId,
  });
}

async function handleSubscriptionDeleted(
  supabase: SupabaseClient,
  subscription: StripeSubscription,
): Promise<void> {
  const customerId = requireNonEmptyString(
    subscription.customer,
    "Subscription customer ID",
  );
  const profile = await resolveSubscriptionProfile(
    supabase,
    customerId,
    subscription.metadata ?? {},
  );

  const { error: creditUpdateError } = await supabase
    .from("user_credits")
    .upsert({
      user_id: profile.id,
      subscription_status: "cancelled",
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  if (creditUpdateError) {
    throw new Error(
      `Subscription deletion credit update failed: ${creditUpdateError.message}`,
    );
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({ subscription_status: "free" })
    .eq("id", profile.id);
  if (profileUpdateError) {
    throw new Error(
      `Subscription deletion profile update failed: ${profileUpdateError.message}`,
    );
  }
}

async function handlePaymentFailed(
  supabase: SupabaseClient,
  invoice: StripeInvoice,
  eventId: string,
): Promise<void> {
  const invoiceId = requireNonEmptyString(invoice.id, "Invoice ID");
  const customerId = requireNonEmptyString(
    invoice.customer,
    "Invoice customer ID",
  );
  if (!Number.isFinite(invoice.amount_due) || invoice.amount_due < 0) {
    throw new Error(`Invoice ${invoiceId} has an invalid amount_due`);
  }

  const profile = await findProfileByCustomer(supabase, customerId);
  const subscriptionId = expandableId(invoice.subscription);
  const paymentIntentId = expandableId(invoice.payment_intent);

  if (subscriptionId) {
    const { error } = await supabase
      .from("user_credits")
      .upsert({
        user_id: profile.id,
        subscription_status: "past_due",
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    if (error) {
      throw new Error(
        `Failed-payment subscription update failed: ${error.message}`,
      );
    }
  }

  await applyCreditTransaction(supabase, {
    userId: profile.id,
    amount: 0,
    transactionType: "payment_failed",
    description: `Payment failed - Invoice ${invoiceId}`,
    metadata: {
      stripe_event_id: eventId,
      invoice_id: invoiceId,
      subscription_id: subscriptionId,
      payment_intent: paymentIntentId,
      amount_due: invoice.amount_due,
      currency: invoice.currency ?? null,
    },
    idempotencyKey: `stripe:event:${eventId}:payment-failed`,
    referenceId: invoiceId,
    stripePaymentIntentId: paymentIntentId,
    stripeSubscriptionId: subscriptionId,
  });
}

function newestRefund(charge: StripeCharge): StripeRefund | null {
  const refunds = charge.refunds?.data ?? [];
  if (refunds.length === 0) return null;
  return refunds.reduce((latest, refund) =>
    (refund.created ?? 0) > (latest.created ?? 0) ? refund : latest
  );
}

function refundCredits(
  originalCredits: number,
  chargeAmount: number,
  refundAmount: number,
): number {
  if (!Number.isFinite(originalCredits) || originalCredits <= 0) {
    throw new Error("Original purchase has an invalid credit amount");
  }
  if (!Number.isInteger(chargeAmount) || chargeAmount <= 0) {
    throw new Error("Refunded charge has an invalid original amount");
  }
  if (
    !Number.isInteger(refundAmount) || refundAmount <= 0 ||
    refundAmount > chargeAmount
  ) {
    throw new Error("Refunded charge has an invalid refund amount");
  }

  return Math.min(
    originalCredits,
    Math.round((originalCredits * refundAmount / chargeAmount) * 100) / 100,
  );
}

async function handleChargeRefunded(
  supabase: SupabaseClient,
  charge: StripeCharge,
  eventId: string,
): Promise<void> {
  const customerId = requireNonEmptyString(
    charge.customer,
    "Refund customer ID",
  );
  const paymentIntentId = requireNonEmptyString(
    charge.payment_intent,
    "Refund payment intent ID",
  );
  const profile = await findProfileByCustomer(supabase, customerId);

  const { data: originalTransaction, error } = await supabase
    .from("credit_transactions")
    .select("id, user_id, amount")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("transaction_type", "purchase")
    .maybeSingle();
  if (error) {
    throw new Error(`Original purchase lookup failed: ${error.message}`);
  }
  if (!originalTransaction) {
    throw new Error(`Original purchase not found for ${paymentIntentId}`);
  }
  if (originalTransaction.user_id !== profile.id) {
    throw new Error(
      `Refund customer does not match original purchase ${originalTransaction.id}`,
    );
  }

  const refund = newestRefund(charge);
  if (!refund && charge.amount_refunded !== charge.amount) {
    throw new Error(
      `Charge ${charge.id} is missing the individual partial refund record`,
    );
  }
  const refundAmount = refund?.amount ?? charge.amount_refunded;
  const creditsToRevoke = refundCredits(
    Number(originalTransaction.amount),
    charge.amount,
    refundAmount,
  );

  await applyCreditTransaction(supabase, {
    userId: profile.id,
    amount: -creditsToRevoke,
    transactionType: "refund",
    description: `Stripe refund - ${creditsToRevoke} credits revoked`,
    metadata: {
      stripe_event_id: eventId,
      charge_id: charge.id,
      refund_id: refund?.id ?? null,
      payment_intent: paymentIntentId,
      refund_amount: refundAmount,
      charge_amount: charge.amount,
      amount_refunded: charge.amount_refunded,
      original_transaction_id: originalTransaction.id,
    },
    idempotencyKey: `stripe:event:${eventId}:refund`,
    referenceId: String(originalTransaction.id),
    stripePaymentIntentId: paymentIntentId,
  });
}

async function markWebhookFailed(
  supabase: SupabaseClient,
  eventId: string,
  message: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("fail_webhook_event", {
    p_stripe_event_id: eventId,
    p_last_error: message,
  });
  if (error) {
    console.error(`Unable to mark Stripe event ${eventId} failed:`, error);
  } else if (data !== true) {
    console.error(
      `Stripe event ${eventId} was not in processing state while marking failed`,
    );
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 204 });
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  let claimedEventId: string | null = null;

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const stripeKey = resolveStripeSecretKey(
      Deno.env.get("STRIPE_SECRET_KEY"),
      Deno.env.get("STRIPE_API_KEY"),
    );
    if (!webhookSecret) throw new Error("Missing Stripe configuration");

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return jsonResponse({ error: "Missing Stripe-Signature header" }, 400);
    }

    const body = await req.text();
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
      );
    } catch (_error) {
      return jsonResponse({ error: "Invalid webhook signature" }, 400);
    }

    const payloadSha256 = await sha256Hex(body);
    const { data: claimData, error: claimError } = await supabase.rpc(
      "claim_webhook_event",
      {
        p_stripe_event_id: event.id,
        p_event_type: event.type,
        p_payload_sha256: payloadSha256,
        p_event_metadata: {
          created: event.created,
          livemode: event.livemode,
          api_version: event.api_version,
        },
      },
    );
    if (claimError) {
      throw new Error(`Webhook claim failed: ${claimError.message}`);
    }

    const claim = firstRpcRow(
      claimData as WebhookClaim | WebhookClaim[] | null,
    );
    if (!claim) {
      throw new Error(`Webhook claim returned no state for ${event.id}`);
    }
    if (!claim.claimed) {
      return jsonResponse({
        received: true,
        duplicate: claim.event_status === "completed",
        in_flight: claim.event_status === "processing",
      }, 200);
    }
    claimedEventId = event.id;

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(
          supabase,
          event.data.object as unknown as StripeCheckoutSession,
          event.id,
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(
          supabase,
          event.data.object as unknown as StripeSubscription,
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          supabase,
          event.data.object as unknown as StripeSubscription,
        );
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(
          supabase,
          event.data.object as unknown as StripeInvoice,
          event.id,
        );
        break;
      case "invoice.paid":
        await handleInvoicePaid(
          supabase,
          stripe,
          event.data.object as unknown as StripeInvoice,
          event.id,
        );
        break;
      case "charge.refunded":
        await handleChargeRefunded(
          supabase,
          event.data.object as unknown as StripeCharge,
          event.id,
        );
        break;
      default:
        console.log(`Ignoring unsupported Stripe event type ${event.type}`);
    }

    const { data: completed, error: completeError } = await supabase.rpc(
      "complete_webhook_event",
      {
        p_stripe_event_id: event.id,
      },
    );
    if (completeError) {
      throw new Error(`Webhook completion failed: ${completeError.message}`);
    }
    if (completed !== true) {
      throw new Error(`Webhook completion rejected for ${event.id}`);
    }

    return jsonResponse({ received: true }, 200);
  } catch (error) {
    const message = errorMessage(error);
    console.error("Stripe webhook error:", error);
    if (claimedEventId) {
      await markWebhookFailed(supabase, claimedEventId, message);
    }
    return jsonResponse({ error: "Webhook processing failed" }, 500);
  }
});
