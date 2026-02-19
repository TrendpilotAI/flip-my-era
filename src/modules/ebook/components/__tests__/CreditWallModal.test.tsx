/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { CreditWallModal } from '../CreditWallModal';

const mockToast = vi.fn();
const mockGetToken = vi.fn().mockResolvedValue('test-token');

vi.mock('@/modules/shared/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/modules/auth/contexts', () => ({
  useClerkAuth: () => ({
    getToken: mockGetToken,
  }),
}));

vi.mock('@/modules/user/components/StripeCreditPurchaseModal', () => ({
  StripeCreditPurchaseModal: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="purchase-modal"><button onClick={onClose}>Close Purchase</button></div> : null,
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onUnlock: vi.fn(),
  currentBalance: 5,
  storyTitle: 'My Test Story',
  previewContent: 'Once upon a time in a land far away...',
  totalChapters: 8,
  totalWords: 5000,
  onBalanceRefresh: vi.fn(),
};

describe('CreditWallModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  it('renders story preview and unlock options', () => {
    render(<CreditWallModal {...defaultProps} />);

    expect(screen.getByText(/Unlock Your Complete Story/)).toBeInTheDocument();
    expect(screen.getByText(/My Test Story/)).toBeInTheDocument();
    expect(screen.getByText(/Once upon a time/)).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument(); // chapters
    expect(screen.getByText('5.0k')).toBeInTheDocument(); // words
    expect(screen.getByText('5 credits')).toBeInTheDocument();
  });

  it('shows insufficient credits toast when balance is 0', async () => {
    render(<CreditWallModal {...defaultProps} currentBalance={0} />);

    const unlockBtn = screen.getByRole('button', { name: /Unlock with 1 Credit/i });
    expect(unlockBtn).toBeDisabled();
  });

  it('calls onUnlock on successful credit validation', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { has_sufficient_credits: true } }),
    });

    render(<CreditWallModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Unlock with 1 Credit/i }));

    await waitFor(() => {
      expect(defaultProps.onUnlock).toHaveBeenCalled();
    });

    expect(defaultProps.onBalanceRefresh).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Story Unlocked!' }));
  });

  it('shows error toast when validation fails', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<CreditWallModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Unlock with 1 Credit/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error' }));
    });
    expect(defaultProps.onUnlock).not.toHaveBeenCalled();
  });

  it('shows insufficient credits when validation returns insufficient', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { has_sufficient_credits: false } }),
    });

    render(<CreditWallModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Unlock with 1 Credit/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Insufficient Credits' }));
    });
  });

  it('shows auth error when no token available', async () => {
    mockGetToken.mockResolvedValueOnce(null);

    render(<CreditWallModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Unlock with 1 Credit/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Authentication Error' }));
    });
  });

  it('opens purchase modal when clicking Purchase Credits', () => {
    render(<CreditWallModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Purchase Credits/i }));

    expect(screen.getByTestId('purchase-modal')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<CreditWallModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText(/Unlock Your Complete Story/)).not.toBeInTheDocument();
  });
});
