/**
 * Gift Cards — Generate, redeem, and manage gift card codes
 * Format: FME-GIFT-XXXXXX
 */

// ─── Types ───────────────────────────────────────────────────

export type GiftCardStatus = 'active' | 'redeemed' | 'expired';

export interface GiftCard {
  code: string;
  amount: number;
  senderName: string;
  recipientEmail: string;
  message: string;
  status: GiftCardStatus;
  createdAt: string;
  redeemedAt?: string;
  expiresAt: string;
}

// ─── In-memory store (swap for Supabase in production) ──────

const giftCardStore = new Map<string, GiftCard>();

// ─── Helpers ─────────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for readability
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FME-GIFT-${code}`;
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Generate a new gift card
 * @returns The gift card code
 */
export function generateGiftCard(
  amount: number,
  senderName: string,
  recipientEmail: string,
  message: string = '',
): string {
  if (amount <= 0) throw new Error('Gift card amount must be positive');
  if (!senderName.trim()) throw new Error('Sender name is required');
  if (!recipientEmail.includes('@')) throw new Error('Valid recipient email is required');

  let code = generateCode();
  // Ensure uniqueness
  while (giftCardStore.has(code)) {
    code = generateCode();
  }

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const card: GiftCard = {
    code,
    amount,
    senderName: senderName.trim(),
    recipientEmail: recipientEmail.trim().toLowerCase(),
    message: message.trim(),
    status: 'active',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  giftCardStore.set(code, card);
  return code;
}

/**
 * Redeem a gift card
 * @returns Credits added to account
 */
export function redeemGiftCard(code: string): number {
  const card = giftCardStore.get(code);
  if (!card) throw new Error('Gift card not found');
  if (card.status === 'redeemed') throw new Error('Gift card has already been redeemed');

  // Check expiry
  if (new Date(card.expiresAt) < new Date()) {
    card.status = 'expired';
    throw new Error('Gift card has expired');
  }

  card.status = 'redeemed';
  card.redeemedAt = new Date().toISOString();
  return card.amount;
}

/**
 * Get gift card status
 */
export function getGiftCardStatus(code: string): GiftCardStatus {
  const card = giftCardStore.get(code);
  if (!card) throw new Error('Gift card not found');

  // Check expiry dynamically
  if (card.status === 'active' && new Date(card.expiresAt) < new Date()) {
    card.status = 'expired';
  }

  return card.status;
}

/**
 * Get full gift card details (admin use)
 */
export function getGiftCardDetails(code: string): GiftCard | null {
  return giftCardStore.get(code) ?? null;
}
