/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { act, render, screen } from '@/test/test-utils';
import { ActionButtons } from '../ActionButtons';

const toastMock = vi.fn();
const downloadShareModalSpy = vi.fn();

vi.mock('@/modules/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock('@/modules/shared/components/DownloadShareModal', () => ({
  DownloadShareModal: (props: any) => {
    downloadShareModalSpy(props);
    if (!props.isOpen) {
      return null;
    }
    return <div data-testid="download-share-modal">Download Modal</div>;
  },
}));

vi.mock('@/modules/shared/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

describe('ActionButtons', () => {
  const baseContent = {
    id: 'story-1',
    title: 'My Story',
    content: 'Story content',
    type: 'story' as const,
  };

  it('opens the download and share modal when unlocked', async () => {
    const user = userEvent.setup();

    render(
      <ActionButtons
        content={baseContent}
        showDownloadShare
      />
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /download & share/i }));
    });

    expect(screen.getByTestId('download-share-modal')).toBeInTheDocument();
    const lastCall = downloadShareModalSpy.mock.calls.at(-1)?.[0];
    expect(lastCall?.isOpen).toBe(true);
  });

  it('invokes locked action instead of opening the modal when locked', async () => {
    const user = userEvent.setup();
    const onLockedAction = vi.fn();

    render(
      <ActionButtons
        content={baseContent}
        showDownloadShare
        isLocked
        onLockedAction={onLockedAction}
      />
    );

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /download & share/i }));
    });

    expect(onLockedAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('download-share-modal')).not.toBeInTheDocument();
  });

  it('disables publish button and shows publishing state', () => {
    render(
      <ActionButtons
        content={baseContent}
        showDownloadShare={false}
        isPublishing
      />
    );

    const publishButton = screen.getByRole('button', { name: /publishing/i });
    expect(publishButton).toBeDisabled();
  });
});
