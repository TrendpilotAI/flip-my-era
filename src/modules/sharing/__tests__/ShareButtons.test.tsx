import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShareButtons } from '../ShareButtons';

// Mock useToast
vi.mock('@/modules/shared/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('ShareButtons', () => {
  const defaultProps = {
    url: 'https://flipmyera.com/ebook/123/preview',
    title: 'My 90s Ebook',
    era: '90s',
  };

  it('renders all share buttons', () => {
    render(<ShareButtons {...defaultProps} />);
    expect(screen.getByText('Twitter/X')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });

  it('copies link to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(<ShareButtons {...defaultProps} />);
    fireEvent.click(screen.getByText('Copy Link'));

    expect(writeText).toHaveBeenCalledWith(defaultProps.url);
  });

  it('opens Twitter share in new window', async () => {
    // Mock navigator.share to not exist so fallback is used
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true });
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ShareButtons {...defaultProps} />);
    fireEvent.click(screen.getByText('Twitter/X'));
    // handleNativeShare is async, wait for it
    await vi.waitFor(() => expect(windowOpen).toHaveBeenCalled());
    windowOpen.mockRestore();
  });
});
