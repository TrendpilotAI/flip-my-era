import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  isCheckoutSessionPaid,
  isPaidSubscriptionInvoice,
} from "../_shared/checkoutSettlement.ts";

Deno.test("Stripe checkout settlement accepts only paid sessions", () => {
  assertEquals(isCheckoutSessionPaid({ payment_status: "paid" }), true);
  assertEquals(isCheckoutSessionPaid({ payment_status: "unpaid" }), false);
  assertEquals(
    isCheckoutSessionPaid({ payment_status: "no_payment_required" }),
    false,
  );
  assertEquals(isCheckoutSessionPaid({}), false);
});

Deno.test("Stripe subscription allocation accepts only paid subscription invoices", () => {
  assertEquals(
    isPaidSubscriptionInvoice({
      billing_reason: "subscription_create",
      paid: true,
      subscription: "sub_paid",
    }),
    true,
  );
  assertEquals(
    isPaidSubscriptionInvoice({
      billing_reason: "subscription_cycle",
      paid: true,
      subscription: { id: "sub_expanded" },
    }),
    true,
  );
  assertEquals(
    isPaidSubscriptionInvoice({ paid: false, subscription: "sub_unpaid" }),
    false,
  );
  assertEquals(
    isPaidSubscriptionInvoice({
      billing_reason: "subscription_cycle",
      paid: true,
      subscription: null,
    }),
    false,
  );
  assertEquals(
    isPaidSubscriptionInvoice({
      billing_reason: "subscription_update",
      paid: true,
      subscription: "sub_proration",
    }),
    false,
  );
  assertEquals(isPaidSubscriptionInvoice({}), false);
});
