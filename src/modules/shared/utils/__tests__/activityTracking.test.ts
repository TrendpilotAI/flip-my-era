import { beforeEach, describe, expect, it, vi } from 'vitest';

const recordUserActivity = vi.hoisted(() => vi.fn());

vi.mock('@/core/integrations/supabase/userData', () => ({ recordUserActivity }));

import { trackDownload } from '../downloadUtils';
import { trackShare } from '../socialShareUtils';

describe('signed-in activity tracking', () => {
  beforeEach(() => {
    recordUserActivity.mockReset();
    recordUserActivity.mockResolvedValue({ recorded: true });
  });

  it('routes downloads through user-data without forwarding caller identity', async () => {
    await trackDownload({
      userId: 'untrusted-browser-user',
      contentType: 'ebook',
      contentId: '11111111-1111-4111-8111-111111111111',
      format: 'pdf',
      downloadedAt: '2026-08-24T12:00:00.000Z',
    });

    expect(recordUserActivity).toHaveBeenCalledWith({
      activityType: 'download',
      contentType: 'ebook',
      contentId: '11111111-1111-4111-8111-111111111111',
      metadata: {
        format: 'pdf',
        downloaded_at: '2026-08-24T12:00:00.000Z',
      },
    });
    expect(JSON.stringify(recordUserActivity.mock.calls[0][0])).not.toContain('user');
  });

  it('routes shares through user-data without direct analytics writes', async () => {
    await trackShare({
      userId: 'untrusted-browser-user',
      contentType: 'story',
      contentId: '22222222-2222-4222-8222-222222222222',
      platform: 'twitter',
      sharedAt: '2026-08-24T12:30:00.000Z',
      shareMethod: 'native',
    });

    expect(recordUserActivity).toHaveBeenCalledWith({
      activityType: 'share',
      contentType: 'story',
      contentId: '22222222-2222-4222-8222-222222222222',
      metadata: {
        platform: 'twitter',
        shared_at: '2026-08-24T12:30:00.000Z',
        share_method: 'native',
      },
    });
    expect(JSON.stringify(recordUserActivity.mock.calls[0][0])).not.toContain('user');
  });
});
