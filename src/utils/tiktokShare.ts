
interface TikTokShareOptions {
  videoUrl?: string;
  text: string;
  hashtags?: string[];
}

export const shareToTikTok = async ({ text, hashtags = [], videoUrl }: TikTokShareOptions) => {
  // TikTok share URL structure
  const shareUrl = new URL('https://www.tiktok.com/upload');
  
  // Add text and hashtags
  const formattedText = `${text}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`;
  shareUrl.searchParams.append('text', formattedText);
  
  // If we have a video URL, include it
  if (videoUrl) {
    shareUrl.searchParams.append('video', videoUrl);
  }
  
  // Open TikTok in a new window
  window.open(shareUrl.toString(), '_blank');
};
