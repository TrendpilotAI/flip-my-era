import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const communityQuery = {
    select: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  communityQuery.select.mockReturnValue(communityQuery);
  communityQuery.order.mockReturnValue(communityQuery);
  communityQuery.eq.mockReturnValue(communityQuery);

  return {
    getSession: vi.fn(),
    invoke: vi.fn(),
    from: vi.fn(() => communityQuery),
    communityQuery,
  };
});

vi.mock('@/lib/auth-client', () => ({
  authClient: { getSession: mocks.getSession },
}));

vi.mock('./client', () => ({
  invokeAuthenticatedFunction: mocks.invoke,
  supabase: {
    from: mocks.from,
  },
}));

import { listCommunityBooks, recordUserActivity } from './userData';

describe('userData transport', () => {
  beforeEach(() => {
    mocks.getSession.mockResolvedValue({ data: { session: { token: 'opaque-session-token' } } });
    mocks.invoke.mockResolvedValue({
      data: { success: true, data: { recorded: true } },
      error: null,
    });
    mocks.communityQuery.limit.mockResolvedValue({ data: [], error: null });
    mocks.communityQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it('sends record-activity with a BetterAuth bearer token and no caller identity', async () => {
    await expect(recordUserActivity({
      activityType: 'share',
      contentType: 'ebook',
      contentId: '11111111-1111-4111-8111-111111111111',
      metadata: { platform: 'twitter' },
    })).resolves.toEqual({ recorded: true });

    expect(mocks.invoke).toHaveBeenCalledWith('user-data', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer opaque-session-token',
        'Content-Type': 'application/json',
      },
      body: {
        action: 'record-activity',
        payload: {
          activityType: 'share',
          contentType: 'ebook',
          contentId: '11111111-1111-4111-8111-111111111111',
          metadata: { platform: 'twitter' },
        },
      },
    });
    expect(JSON.stringify(mocks.invoke.mock.calls[0])).not.toContain('user_id');
  });

  it('fails closed when no BetterAuth token exists', async () => {
    mocks.getSession.mockResolvedValue({ data: null });

    await expect(recordUserActivity({
      activityType: 'download',
      contentType: 'story',
      contentId: '22222222-2222-4222-8222-222222222222',
    })).rejects.toThrow('Authentication required');
    expect(mocks.invoke).not.toHaveBeenCalled();
  });

  it('rejects an explicit non-recording outcome for story activity', async () => {
    mocks.invoke.mockResolvedValueOnce({
      data: { success: true, data: { recorded: false } },
      error: null,
    });

    await expect(recordUserActivity({
      activityType: 'download',
      contentType: 'story',
      contentId: '22222222-2222-4222-8222-222222222222',
    })).rejects.toThrow('Activity was not recorded');
  });

  it('reads Community only through the metadata projection', async () => {
    await listCommunityBooks(24);

    expect(mocks.from).toHaveBeenCalledWith('community_books');
    expect(mocks.communityQuery.select).toHaveBeenCalledWith(
      'id, title, subtitle, author_name, cover_image_url, chapter_count, word_count, published_at, created_at, status',
    );
    expect(mocks.communityQuery.select.mock.calls[0][0]).not.toContain('chapters');
    expect(mocks.communityQuery.select.mock.calls[0][0]).not.toContain('user_id');
  });
});
