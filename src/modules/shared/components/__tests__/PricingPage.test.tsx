import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { FREE_SIGNUP_CREDITS } from '@/config/stripe-products';
import { PricingPage } from '../PricingPage';

vi.mock('@/modules/shared/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/modules/auth/contexts', () => ({
  useClerkAuth: () => ({ user: null }),
}));

describe('PricingPage', () => {
  it('shows the canonical signup grant and switches to annual credit fulfillment', async () => {
    const { user } = render(<PricingPage />);

    expect(screen.getByText(`${FREE_SIGNUP_CREDITS} credits on signup`)).toBeInTheDocument();
    expect(screen.getByText('30 credits/mo')).toBeInTheDocument();
    expect(screen.getByText('75 credits/mo')).toBeInTheDocument();
    expect(screen.getByText('150 credits/mo')).toBeInTheDocument();
    expect(screen.queryByText('API access')).not.toBeInTheDocument();

    await user.click(screen.getByRole('switch', { name: 'Use annual billing' }));

    expect(screen.getByText('360 credits/yr')).toBeInTheDocument();
    expect(screen.getByText('900 credits/yr')).toBeInTheDocument();
    expect(screen.getByText('1,800 credits/yr')).toBeInTheDocument();
    expect(screen.getByText('360 credits granted annually')).toBeInTheDocument();
    expect(screen.getByText('900 credits granted annually')).toBeInTheDocument();
    expect(screen.getByText('1,800 credits granted annually')).toBeInTheDocument();
    expect(screen.getByText('Save 20%')).toBeInTheDocument();
  });
});
