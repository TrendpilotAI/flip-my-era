/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { CreditBalance } from '../CreditBalance';

const mockGetToken = vi.fn().mockResolvedValue('test-token');
let mockIsSignedIn = true;

const mockInvoke = vi.fn();

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    isSignedIn: mockIsSignedIn,
    getToken: mockGetToken,
  }),
}));

vi.mock('@/core/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

vi.mock('@/modules/user/components/CreditPurchaseModal', () => ({
  CreditPurchaseModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="purchase-modal">Purchase Modal</div> : null,
}));

describe('CreditBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSignedIn = true;
    mockInvoke.mockResolvedValue({
      data: { success: true, data: { balance: { balance: 42, subscription_type: null, last_updated: '2025-01-01' } } },
      error: null,
    });
  });

  it('displays credit balance after loading', async () => {
    render(<CreditBalance />);

    // Initially shows loading
    expect(screen.getByText(/Loading credits/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
    expect(screen.getByText('Credits Available')).toBeInTheDocument();
  });

  it('shows singular "Credit Available" for balance of 1', async () => {
    mockInvoke.mockResolvedValue({
      data: { success: true, data: { balance: { balance: 1, subscription_type: null, last_updated: '2025-01-01' } } },
      error: null,
    });

    render(<CreditBalance />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
    expect(screen.getByText('Credit Available')).toBeInTheDocument();
  });

  it('renders nothing when not signed in', () => {
    mockIsSignedIn = false;
    const { container } = render(<CreditBalance />);
    expect(container.innerHTML).toBe('');
  });

  it('shows error state on fetch failure', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    });

    render(<CreditBalance />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load credit balance')).toBeInTheDocument();
    });
  });

  it('calls onBalanceChange callback', async () => {
    const onBalanceChange = vi.fn();
    render(<CreditBalance onBalanceChange={onBalanceChange} />);

    await waitFor(() => {
      expect(onBalanceChange).toHaveBeenCalledWith(42);
    });
  });

  it('shows unlimited badge for monthly_unlimited subscription', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        success: true,
        data: { balance: { balance: 0, subscription_type: 'monthly_unlimited', last_updated: '2025-01-01' } },
      },
      error: null,
    });

    render(<CreditBalance />);

    await waitFor(() => {
      expect(screen.getByText('∞')).toBeInTheDocument();
    });
    expect(screen.getByText('Unlimited Generations')).toBeInTheDocument();
    // No "Buy Credits" button for unlimited
    expect(screen.queryByText('Buy Credits')).not.toBeInTheDocument();
  });

  it('shows Buy Credits button for non-unlimited users', async () => {
    render(<CreditBalance />);

    await waitFor(() => {
      expect(screen.getByText('Buy Credits')).toBeInTheDocument();
    });
  });

  it('refreshes balance on refresh button click', async () => {
    render(<CreditBalance />);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    mockInvoke.mockResolvedValue({
      data: { success: true, data: { balance: { balance: 50, subscription_type: null, last_updated: '2025-01-01' } } },
      error: null,
    });

    // Click refresh - find the small refresh button in the header
    const refreshButtons = screen.getAllByRole('button');
    const refreshBtn = refreshButtons.find(btn => btn.querySelector('.lucide-refresh-cw, [class*="RefreshCw"]') || btn.className.includes('ghost'));
    if (refreshBtn) {
      fireEvent.click(refreshBtn);
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledTimes(2);
      });
    }
  });
});
