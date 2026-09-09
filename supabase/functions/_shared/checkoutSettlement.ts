export interface CheckoutSettlementState {
  payment_status?: string | null;
}

export interface SubscriptionInvoiceSettlementState {
  billing_reason?: string | null;
  paid?: boolean | null;
  subscription?: string | { id?: string | null } | null;
}

export function isCheckoutSessionPaid(
  session: CheckoutSettlementState,
): boolean {
  return session.payment_status === "paid";
}

export function isPaidSubscriptionInvoice(
  invoice: SubscriptionInvoiceSettlementState,
): boolean {
  if (invoice.paid !== true) return false;
  if (
    invoice.billing_reason !== "subscription_create" &&
    invoice.billing_reason !== "subscription_cycle"
  ) {
    return false;
  }

  if (typeof invoice.subscription === "string") {
    return invoice.subscription.trim() !== "";
  }

  return typeof invoice.subscription?.id === "string" &&
    invoice.subscription.id.trim() !== "";
}
