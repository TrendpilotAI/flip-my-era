
import { supabase } from '@/core/integrations/supabase/client';

interface TikTokShareOptions {
  videoUrl?: string;
  text: string;
  hashtags?: string[];
  musicUrl?: string;
  template?: 'story' | 'quote' | 'slideshow';
}

interface TikTokAuthResponse {
  access_token: string;
  expires_in: number;
  open_id: string;
}

const REDIRECT_URI = `${window.location.origin}/auth/tiktok/callback`;

export const initTikTokAuth = async () => {
  // Fetch the client key from Supabase edge function
  const { data: { key }, error } = await supabase.functions.invoke('tiktok-auth', {
    body: { action: 'get_client_key' }
  });

  if (error || !key) {
    console.error('Error fetching TikTok client key:', error);
    throw new Error('Failed to initialize TikTok auth');
  }

  const csrfState = Math.random().toString(36).substring(7);
  localStorage.setItem('tiktok_csrf_state', csrfState);
  
  const authUrl = new URL('https://www.tiktok.com/auth/authorize/');
  authUrl.searchParams.append('client_key', key);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('state', csrfState);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'video.upload,video.list');
  
  window.location.href = authUrl.toString();
};

export const handleTikTokCallback = async (code: string, state: string) => {
  const savedState = localStorage.getItem('tiktok_csrf_state');
  if (state !== savedState) {
    throw new Error('Invalid state parameter');
  }
  
  const { data, error } = await supabase.functions.invoke('tiktok-auth', {
    body: { code, action: 'handle_callback' }
  });

  if (error) throw error;
  
  localStorage.setItem('tiktok_access_token', data.access_token);
  return data;
};

const generateVideo = async (text: string, template: 'story' | 'quote' | 'slideshow' = 'story') => {
  const { data, error } = await supabase.functions.invoke('generate-video', {
    body: { text, template }
  });

  if (error) throw error;
  return data.videoUrl;
};

export const shareToTikTok = async ({ text, hashtags = [], videoUrl, musicUrl, template = 'story' }: TikTokShareOptions) => {
  const accessToken = localStorage.getItem('tiktok_access_token');
  
  if (!accessToken) {
    await initTikTokAuth();
    return;
  }
  
  try {
    if (!videoUrl) {
      videoUrl = await generateVideo(text, template);
    }
    
    const shareUrl = new URL('https://www.tiktok.com/upload');
    const formattedText = `${text}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`;
    shareUrl.searchParams.append('text', formattedText);
    shareUrl.searchParams.append('video', videoUrl);
    
    if (musicUrl) {
      shareUrl.searchParams.append('music_url', musicUrl);
    }
    
    window.open(shareUrl.toString(), '_blank');
    
    // Track the share in analytics
    await supabase.functions.invoke('tiktok-share-analytics', {
      body: { text: formattedText, videoUrl, musicUrl }
    });

  } catch (error) {
    console.error('Error sharing to TikTok:', error);
    throw error;
  }
};

export const TIKTOK_TEMPLATES = {
  story: {
    name: 'Story Mode',
    description: 'Cinematic storytelling with dynamic text overlays',
    duration: 60,
  },
  quote: {
    name: 'Quote Mode',
    description: 'Emphasize key quotes with animated typography',
    duration: 30,
  },
  slideshow: {
    name: 'Slideshow',
    description: 'Transform your story into visual slides',
    duration: 45,
  },
};
