export interface EdgeFunctionErrorPayload {
  error?: string;
  message?: string;
}

export interface CheckoutFunctionResponse extends EdgeFunctionErrorPayload {
  url?: string;
}

export interface PortalFunctionResponse extends EdgeFunctionErrorPayload {
  url?: string;
}

export interface CreditBalanceData {
  balance: number;
  subscription_type: string | null;
  last_updated: string;
}

export interface CreditsFunctionResponse extends EdgeFunctionErrorPayload {
  success: boolean;
  data?: {
    balance: CreditBalanceData;
    recent_transactions?: Array<{
      id: string;
      type: 'purchase' | 'usage' | 'refund';
      amount: number;
      description: string;
      transaction_date: string;
      stripe_payment_id?: string;
    }>;
  };
}

export interface GroqFunctionResponse extends EdgeFunctionErrorPayload {
  content?: string;
}
