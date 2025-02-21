
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

const TIKTOK_CLIENT_KEY = 'YOUR_CLIENT_KEY'; // You'll need to register your app with TikTok
const REDIRECT_URI = `${window.location.origin}/auth/tiktok/callback`;

export const initTikTokAuth = () => {
  const csrfState = Math.random().toString(36).substring(7);
  localStorage.setItem('tiktok_csrf_state', csrfState);
  
  const authUrl = new URL('https://www.tiktok.com/auth/authorize/');
  authUrl.searchParams.append('client_key', TIKTOK_CLIENT_KEY);
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
  
  const response = await fetch('/api/tiktok/token', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  
  const data: TikTokAuthResponse = await response.json();
  localStorage.setItem('tiktok_access_token', data.access_token);
  return data;
};

const generateVideo = async (text: string, template: 'story' | 'quote' | 'slideshow' = 'story') => {
  // This would connect to your video generation service
  // For now, we'll use a mock implementation
  const response = await fetch('/api/generate-video', {
    method: 'POST',
    body: JSON.stringify({ text, template }),
  });
  
  const { videoUrl } = await response.json();
  return videoUrl;
};

export const shareToTikTok = async ({ text, hashtags = [], videoUrl, musicUrl, template = 'story' }: TikTokShareOptions) => {
  const accessToken = localStorage.getItem('tiktok_access_token');
  
  if (!accessToken) {
    // If not authenticated, start auth flow
    initTikTokAuth();
    return;
  }
  
  try {
    // If no video URL provided, generate one
    if (!videoUrl) {
      videoUrl = await generateVideo(text, template);
    }
    
    // TikTok share URL structure
    const shareUrl = new URL('https://www.tiktok.com/upload');
    
    // Add text and hashtags
    const formattedText = `${text}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`;
    shareUrl.searchParams.append('text', formattedText);
    
    // Add video URL
    shareUrl.searchParams.append('video', videoUrl);
    
    // Add music if provided
    if (musicUrl) {
      shareUrl.searchParams.append('music_url', musicUrl);
    }
    
    // Open TikTok in a new window
    window.open(shareUrl.toString(), '_blank');
    
    // Optional: Track successful shares
    await fetch('/api/analytics/tiktok-share', {
      method: 'POST',
      body: JSON.stringify({ text, videoUrl, musicUrl }),
    });
  } catch (error) {
    console.error('Error sharing to TikTok:', error);
    throw error;
  }
};

// Video templates for different story types
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
