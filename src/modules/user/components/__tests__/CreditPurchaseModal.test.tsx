import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@/test/test-utils';
import { __testSupabaseMocks__ } from '@/test/setup';
import { CreditPurchaseModal } from '../CreditPurchaseModal';

const toastMock = vi.fn();
const openMock = vi.fn();

vi.mock('@/modules/auth/contexts', () => ({
  useClerkAuth: () => ({
    user: { email: 'test@example.com' },
    getToken: vi.fn(async () => 'test-token'),
  }),
}));

vi.mock('@/modules/shared/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

describe('CreditPurchaseModal', () => {
  beforeEach(() => {
    toastMock.mockClear();
    openMock.mockClear();
    __testSupabaseMocks__.supabase.functions.invoke.mockReset();
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: { url: 'https://checkout.stripe.com/pay/cs_test_single' },
      error: null,
    });
    vi.spyOn(window, 'open').mockImplementation(openMock);
  });

  it('starts credit checkout with canonical plan and product type only', async () => {
    const user = userEvent.setup();

    render(
      <CreditPurchaseModal
        isOpen
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        currentBalance={0}
      />
    );

    await user.click(await screen.findByRole('button', { name: 'Buy Single' }));

    await waitFor(() => {
      expect(__testSupabaseMocks__.supabase.functions.invoke).toHaveBeenCalledWith(
        'create-checkout',
        expect.objectContaining({
          body: {
            plan: 'single',
            productType: 'credits',
          },
        }),
      );
    });

    const checkoutCall = __testSupabaseMocks__.supabase.functions.invoke.mock.calls.find(
      ([functionName]) => functionName === 'create-checkout',
    );
    expect(checkoutCall?.[1]?.body).not.toHaveProperty('priceId');
    expect(checkoutCall?.[1]?.body).not.toHaveProperty('stripePriceId');
    expect(openMock).toHaveBeenCalledWith('https://checkout.stripe.com/pay/cs_test_single', '_blank');
  });
});
