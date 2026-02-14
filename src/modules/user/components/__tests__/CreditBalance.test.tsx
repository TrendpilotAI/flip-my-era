/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreditBalance } from '../CreditBalance';
import { __testSupabaseMocks__ } from '@/test/setup';

const mocks = vi.hoisted(() => ({
  isSignedIn: true,
  getToken: vi.fn().mockResolvedValue('mock-clerk-jwt'),
}));

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    isSignedIn: mocks.isSignedIn,
    getToken: mocks.getToken,
  }),
}));

vi.mock('../CreditPurchaseModal', () => ({
  CreditPurchaseModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="purchase-modal">Purchase Modal</div> : null,
}));

describe('CreditBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSignedIn = true;
    mocks.getToken.mockResolvedValue('mock-clerk-jwt');
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: {
        success: true,
        data: {
          balance: { balance: 10, subscription_type: null, last_updated: '2026-01-01' },
          recent_transactions: [],
        },
      },
      error: null,
    });
  });

  it('should return null when not signed in', () => {
    mocks.isSignedIn = false;
    const { container } = render(<CreditBalance />);
    expect(container.innerHTML).toBe('');
  });

  it('should show loading state initially', () => {
    // Don't resolve the function invoke yet
    __testSupabaseMocks__.supabase.functions.invoke.mockReturnValue(new Promise(() => {}));
    render(<CreditBalance />);
    expect(screen.getByText('Loading credits...')).toBeInTheDocument();
  });

  it('should display credit balance after loading', async () => {
    render(<CreditBalance />);
    await waitFor(() => expect(screen.getByText('10')).toBeInTheDocument());
    expect(screen.getByText('Credits Available')).toBeInTheDocument();
  });

  it('should show singular text for 1 credit', async () => {
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: {
        success: true,
        data: {
          balance: { balance: 1, subscription_type: null, last_updated: '2026-01-01' },
        },
      },
      error: null,
    });

    render(<CreditBalance />);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
    expect(screen.getByText('Credit Available')).toBeInTheDocument();
  });

  it('should show unlimited for monthly unlimited subscription', async () => {
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: {
        success: true,
        data: {
          balance: { balance: 0, subscription_type: 'monthly_unlimited', last_updated: '2026-01-01' },
        },
      },
      error: null,
    });

    render(<CreditBalance />);
    await waitFor(() => expect(screen.getByText('∞')).toBeInTheDocument());
    expect(screen.getByText('Unlimited Generations')).toBeInTheDocument();
  });

  it('should show error state on fetch failure', async () => {
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    render(<CreditBalance />);
    await waitFor(() => expect(screen.getByText('Failed to load credit balance')).toBeInTheDocument());
  });

  it('should show Buy Credits button for pay-per-use users', async () => {
    render(<CreditBalance />);
    await waitFor(() => expect(screen.getByText('Buy Credits')).toBeInTheDocument());
  });

  it('should not show Buy Credits button for unlimited subscribers', async () => {
    __testSupabaseMocks__.supabase.functions.invoke.mockResolvedValue({
      data: {
        success: true,
        data: {
          balance: { balance: 0, subscription_type: 'annual_unlimited', last_updated: '2026-01-01' },
        },
      },
      error: null,
    });

    render(<CreditBalance />);
    await waitFor(() => expect(screen.getByText('∞')).toBeInTheDocument());
    expect(screen.queryByText('Buy Credits')).not.toBeInTheDocument();
  });

  it('should call onBalanceChange callback', async () => {
    const onBalanceChange = vi.fn();
    render(<CreditBalance onBalanceChange={onBalanceChange} />);
    await waitFor(() => expect(onBalanceChange).toHaveBeenCalledWith(10));
  });

  it('should open purchase modal when Buy Credits clicked', async () => {
    const user = userEvent.setup();
    render(<CreditBalance />);
    await waitFor(() => expect(screen.getByText('Buy Credits')).toBeInTheDocument());

    await user.click(screen.getByText('Buy Credits'));
    expect(screen.getByTestId('purchase-modal')).toBeInTheDocument();
  });
});
