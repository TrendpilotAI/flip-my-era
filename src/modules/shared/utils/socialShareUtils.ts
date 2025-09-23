import { supabase } from '@/core/integrations/supabase/client';

export interface ShareContent {
  title: string;
  content: string;
  url?: string;
  imageUrl?: string;
  hashtags?: string[];
  author?: string;
}

export interface ShareOptions {
  platform: 'instagram' | 'tiktok' | 'twitter' | 'facebook' | 'whatsapp' | 'linkedin' | 'pinterest';
  contentType: 'story' | 'ebook' | 'chapter';
  format?: 'text' | 'image' | 'video' | 'carousel';
  includeAttribution?: boolean;
  customMessage?: string;
}

export interface ShareAnalytics {
  userId?: string;
  contentType: 'story' | 'ebook';
  contentId: string;
  platform: string;
  sharedAt: string;
  shareMethod: 'direct' | 'copy' | 'native';
}

// Track share analytics
export const trackShare = async (analytics: ShareAnalytics) => {
  try {
    const { error } = await supabase
      .from('user_activities')
      .insert({
        user_id: analytics.userId,
        activity_type: 'share',
        activity_data: {
          content_type: analytics.contentType,
          content_id: analytics.contentId,
          platform: analytics.platform,
          shared_at: analytics.sharedAt,
          share_method: analytics.shareMethod
        },
        resource_type: analytics.contentType,
        resource_id: analytics.contentId,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error tracking share:', error);
    }

    // Update share count in the respective table
    if (analytics.contentType === 'ebook') {
      await supabase
        .from('ebook_generations')
        .update({ 
          share_count: supabase.raw('share_count + 1') 
        })
        .eq('id', analytics.contentId);
    }

    // Also track in TikTok shares table for backward compatibility
    if (analytics.platform === 'tiktok') {
      await supabase
        .from('tiktok_shares')
        .insert({
          user_id: analytics.userId,
          text_snippet: analytics.contentId,
          created_at: analytics.sharedAt
        });
    }
  } catch (error) {
    console.error('Error tracking share analytics:', error);
  }
};

// Generate platform-specific content
export const generatePlatformContent = (
  content: ShareContent,
  options: ShareOptions
): { text: string; url?: string; hashtags: string[] } => {
  const { platform, contentType, includeAttribution = true, customMessage } = options;
  const maxLengths = {
    twitter: 280,
    instagram: 2200,
    facebook: 63206,
    linkedin: 1300,
    tiktok: 300,
    whatsapp: 4096,
    pinterest: 500
  };

  let text = customMessage || '';
  let hashtags = [...(content.hashtags || [])];
  
  // Add platform-specific hashtags
  switch (platform) {
    case 'instagram':
      hashtags.push('FlipMyEra', 'AlternateTimeline', 'StoryTime', 'CreativeWriting');
      if (contentType === 'ebook') {
        hashtags.push('EBook', 'DigitalBook', 'PersonalizedStory');
      }
      }

      break;
    case 'tiktok':
      hashtags.push('FlipMyEra', 'AlternateTimeline', 'WhatIf', 'Storytelling');
      if (contentType === 'ebook') {
        hashtags.push('BookTok', 'DigitalBook', 'StoryTime');
      }
      }

      break;
    case 'twitter':
      hashtags.push('FlipMyEra', 'AlternateTimeline', 'StoryTime');
      }

      break;
    case 'facebook':
      hashtags.push('FlipMyEra', 'AlternateTimeline', 'StoryTime');
      }

      break;
    case 'linkedin':
      hashtags.push('FlipMyEra', 'CreativeWriting', 'StoryTelling');
      }

      break;
    case 'pinterest':
      hashtags.push('FlipMyEra', 'StoryTime', 'CreativeWriting', 'BookLovers');
      }

      break;
  }

  // Generate base text
  if (!text) {
    if (contentType === 'story') {
      text = `Just created an amazing alternate timeline story! 🌟\n\n"${content.title}"\n\n${content.content.slice(0, 200)}...`;
    } else {
      text = `Check out my personalized illustrated book! 📚✨\n\n"${content.title}"\n\nTurned my story into a beautiful ebook with multiple chapters.`;
    }
  }

  // Add attribution
  if (includeAttribution) {
    text += '\n\nCreated with FlipMyEra - Turn your life into alternate timeline stories!';
  }

  // Add URL if provided
  if (content.url) {
    text += `\n\nRead more: ${content.url}`;
  }

  // Truncate text based on platform limits
  const maxLength = maxLengths[platform];
  const hashtagText = hashtags.map(tag => `#${tag}`).join(' ');
  const availableLength = maxLength - hashtagText.length - 10; // Buffer for spacing

  if (text.length > availableLength) {
    text = text.slice(0, availableLength - 3) + '...';
  }

  return {
    text: `${text}\n\n${hashtagText}`,
    url: content.url,
    hashtags
  };
};

// Generate Instagram-specific content
export const generateInstagramContent = (content: ShareContent): {
  caption: string;
  storyText: string;
  hashtags: string[];
} => {
  const hashtags = [
    'FlipMyEra',
    'AlternateTimeline',
    'StoryTime',
    'CreativeWriting',
    'PersonalizedStory',
    'BookLovers',
    'DigitalBook',
    'StoryTelling',
    'WhatIf',
    'AlternateLife'
  ];

  const caption = `✨ Just created my alternate timeline story! ✨

"${content.title}"

${content.content.slice(0, 300)}...

What would YOUR alternate timeline look like? 🤔

Created with @FlipMyEra - Turn your life into amazing stories! 📚

${hashtags.map(tag => `#${tag}`).join(' ')}`;

  const storyText = `My alternate timeline story: "${content.title}" 🌟

Created with FlipMyEra!

What's your alternate timeline? 🤔`;

  return { caption, storyText, hashtags };
};

// Generate TikTok-specific content
export const generateTikTokContent = (content: ShareContent): {
  description: string;
  hashtags: string[];
  voiceover: string;
} => {
  const hashtags = [
    'FlipMyEra',
    'AlternateTimeline',
    'WhatIf',
    'Storytelling',
    'BookTok',
    'StoryTime',
    'CreativeWriting',
    'PersonalizedStory'
  ];

  const description = `My alternate timeline story: "${content.title}" 🌟

${content.content.slice(0, 150)}...

What would YOUR life look like in an alternate timeline? 🤔

#${hashtags.join(' #')}`;

  const voiceover = `What if your life took a different path? Here's my alternate timeline story: ${content.title}. ${content.content.slice(0, 200)}. What would your alternate timeline look like?`;

  return { description, hashtags, voiceover };
};

// Copy to clipboard functionality
export const copyToClipboard = async (
  content: ShareContent,
  options: ShareOptions
): Promise<void> => {
  const platformContent = generatePlatformContent(content, options);
  
  try {
    await navigator.clipboard.writeText(platformContent.text);
    return;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = platformContent.text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
};

// Native sharing (Web Share API)
export const nativeShare = async (
  content: ShareContent,
  options: ShareOptions
): Promise<void> => {
  if (!navigator.share) {
    throw new Error('Native sharing not supported');
  }

  const platformContent = generatePlatformContent(content, options);
  
  const shareData: ShareData = {
    title: content.title,
    text: platformContent.text,
    url: content.url
  };

  try {
    await navigator.share(shareData);
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      throw error;
    }
  }
};

// Direct platform sharing
export const shareToInstagram = (content: ShareContent): string => {
  const instagramContent = generateInstagramContent(content);
  
  // Prepare Instagram-ready content
  const instagramText = `${instagramContent.caption}\n\n${instagramContent.hashtags.map(tag => `#${tag}`).join(' ')}`;
  
  // Copy to clipboard with clear instructions
  navigator.clipboard.writeText(instagramText).then(() => {
    // Open Instagram with a slight delay to allow clipboard to be ready
    setTimeout(() => {
      window.open('https://www.instagram.com/', '_blank');
    }, 500);
  }).catch(() => {
    // Fallback: just open Instagram
    window.open('https://www.instagram.com/', '_blank');
  });
  
  return `✅ Instagram content copied to clipboard!\n\n📱 Your story is ready to paste in Instagram.\n\n💡 Tips:\n• Open Instagram Stories or create a new post\n• Paste the content from your clipboard\n• Add your story image/video\n• Share your alternate timeline!`;
};

export const shareToTikTok = (content: ShareContent): string => {
  const tiktokContent = generateTikTokContent(content);
  
  // Prepare TikTok-ready content
  const tiktokText = `${tiktokContent.description}\n\n${tiktokContent.hashtags.map(tag => `#${tag}`).join(' ')}`;
  
  // Copy to clipboard with clear instructions
  navigator.clipboard.writeText(tiktokText).then(() => {
    // Open TikTok upload page with a slight delay
    setTimeout(() => {
      window.open('https://www.tiktok.com/upload', '_blank');
    }, 500);
  }).catch(() => {
    // Fallback: just open TikTok
    window.open('https://www.tiktok.com/upload', '_blank');
  });
  
  return `✅ TikTok content copied to clipboard!\n\n📱 Your video description is ready to paste in TikTok.\n\n💡 Tips:\n• Open TikTok and start creating a new video\n• Paste the description from your clipboard\n• Record or upload your video\n• Share your alternate timeline story!`;
};

export const shareToTwitter = (content: ShareContent): void => {
  const platformContent = generatePlatformContent(content, { 
    platform: 'twitter', 
    contentType: 'story' 
  });
  
  const twitterUrl = new URL('https://twitter.com/intent/tweet');
  twitterUrl.searchParams.append('text', platformContent.text);
  
  if (content.url) {
    twitterUrl.searchParams.append('url', content.url);
  }
  
  window.open(twitterUrl.toString(), '_blank');
};

export const shareToFacebook = (content: ShareContent): void => {
  const platformContent = generatePlatformContent(content, { 
    platform: 'facebook', 
    contentType: 'story' 
  });
  
  const facebookUrl = new URL('https://www.facebook.com/sharer/sharer.php');
  
  if (content.url) {
    facebookUrl.searchParams.append('u', content.url);
  }
  
  facebookUrl.searchParams.append('quote', platformContent.text);
  
  window.open(facebookUrl.toString(), '_blank');
};

export const shareToWhatsApp = (content: ShareContent): void => {
  const platformContent = generatePlatformContent(content, { 
    platform: 'whatsapp', 
    contentType: 'story' 
  });
  
  const whatsappUrl = new URL('https://wa.me/');
  whatsappUrl.searchParams.append('text', platformContent.text);
  
  window.open(whatsappUrl.toString(), '_blank');
};

export const shareToLinkedIn = (content: ShareContent): string => {
  const platformContent = generatePlatformContent(content, { 
    platform: 'linkedin', 
    contentType: 'story' 
  });
  
  // Prepare LinkedIn-ready content with professional formatting
  const linkedinText = `🚀 Just created an alternate timeline story with FlipMyEra!\n\n"${content.title}"\n\n${content.content.slice(0, 200)}...\n\nWhat would your alternate timeline look like? 🤔\n\n#FlipMyEra #AlternateTimeline #CreativeWriting #StoryTelling #PersonalizedContent`;
  
  // Copy to clipboard with clear instructions
  navigator.clipboard.writeText(linkedinText).then(() => {
    // Open LinkedIn with a slight delay
    setTimeout(() => {
      window.open('https://www.linkedin.com/feed/', '_blank');
    }, 500);
  }).catch(() => {
    // Fallback: just open LinkedIn
    window.open('https://www.linkedin.com/feed/', '_blank');
  });
  
  return `✅ LinkedIn content copied to clipboard!\n\n💼 Your professional post is ready to paste in LinkedIn.\n\n💡 Tips:\n• Open LinkedIn and create a new post\n• Paste the content from your clipboard\n• Add relevant hashtags if needed\n• Share your creative story!`;
};

export const shareToPinterest = (content: ShareContent): void => {
  const platformContent = generatePlatformContent(content, { 
    platform: 'pinterest', 
    contentType: 'story' 
  });
  
  const pinterestUrl = new URL('https://pinterest.com/pin/create/button/');
  
  if (content.url) {
    pinterestUrl.searchParams.append('url', content.url);
  }
  
  pinterestUrl.searchParams.append('description', platformContent.text);
  
  if (content.imageUrl) {
    pinterestUrl.searchParams.append('media', content.imageUrl);
  }
  
  window.open(pinterestUrl.toString(), '_blank');
};

// Main sharing function
export const shareContent = async (
  content: ShareContent,
  options: ShareOptions,
  analytics?: ShareAnalytics
): Promise<{ success: boolean; message?: string }> => {
  try {
    let shareMethod: 'direct' | 'copy' | 'native' = 'direct';
    let userMessage: string | undefined;

    switch (options.platform) {
      case 'instagram':
        const instagramResult = shareToInstagram(content);
        shareMethod = 'copy';
        userMessage = instagramResult;
        }

        break;
      case 'tiktok':
        const tiktokResult = shareToTikTok(content);
        shareMethod = 'copy';
        userMessage = tiktokResult;
        }

        break;
      case 'twitter':
        shareToTwitter(content);
        }

        break;
      case 'facebook':
        shareToFacebook(content);
        }

        break;
      case 'whatsapp':
        shareToWhatsApp(content);
        }

        break;
      case 'linkedin':
        const linkedinResult = shareToLinkedIn(content);
        shareMethod = 'copy';
        userMessage = linkedinResult;
        }

        break;
      case 'pinterest':
        shareToPinterest(content);
        }

        break;
      default:
        // Try native sharing first
        if (navigator.share) {
          await nativeShare(content, options);
          shareMethod = 'native';
        } else {
          await copyToClipboard(content, options);
          shareMethod = 'copy';
        }
    }

    // Track analytics
    if (analytics) {
      await trackShare({
        ...analytics,
        platform: options.platform,
        sharedAt: new Date().toISOString(),
        shareMethod
      });
    }

    return { success: true, message: userMessage };
  } catch (error) {
    console.error('Error sharing content:', error);
    return { success: false, message: 'Failed to share content. Please try again.' };
  }
};

// Generate shareable image content (for future implementation)
export const generateShareableImage = async (
  content: ShareContent,
  options: ShareOptions
): Promise<string> => {
  // This would integrate with a service like Bannerbear, Canva API, or generate images locally
  // For now, return a placeholder
  return `https://via.placeholder.com/1080x1080/6366f1/ffffff?text=${encodeURIComponent(content.title)}`;
};

// Generate shareable video content (for future implementation)
export const generateShareableVideo = async (
  content: ShareContent,
  options: ShareOptions
): Promise<string> => {
  // This would integrate with a video generation service
  // For now, return a placeholder
  return `https://example.com/video/${content.title.replace(/\s+/g, '-').toLowerCase()}.mp4`;
}; 