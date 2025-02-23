
interface TaylorSwiftSong {
  title: string;
  spotifyUrl: string;
  appleMusicUrl: string;
  previewUrl: string;
  youtubeId: string;
  keywords: string[];
  mood: string;
  lyrics: string;
  explanation: string;
}

const taylorSwiftSongs: TaylorSwiftSong[] = [
  {
    title: "22",
    spotifyUrl: "spotify:track:6sGiAzpxVlbJkXYyIHnHhj",
    appleMusicUrl: "https://music.apple.com/us/album/22-taylors-version/1621836955?i=1621837276",
    previewUrl: "https://p.scdn.co/mp3-preview/4a2fa8c529c93e012a1e8617099e2460dac88411",
    youtubeId: "AgFeZr5ptV8",
    keywords: ["young", "fun", "party", "night out", "friends", "carefree", "happy"],
    mood: "Celebrating the joy of youth and friendship",
    lyrics: "We're happy, free, confused and lonely at the same time\nIt's miserable and magical, oh yeah\nTonight's the night when we forget about the deadlines",
    explanation: "Just like your story captures those magical moments of freedom and possibility, '22' celebrates the beautiful chaos of youth. The song perfectly mirrors those times when everything feels possible and every moment is an adventure waiting to happen."
  },
  {
    title: "Love Story",
    spotifyUrl: "spotify:track:3CeCwYWvdfXbZLXFhBrbnf",
    appleMusicUrl: "https://music.apple.com/us/album/love-story-taylors-version/1552791073?i=1552791076",
    previewUrl: "https://p.scdn.co/mp3-preview/5a7dd8e0c981069f84503c79c3e6fb3d8e1f2d9f",
    youtubeId: "8xg3vE8Ie_E",
    keywords: ["romance", "love", "destiny", "magical", "fairy tale", "dream"],
    mood: "Finding your own fairy tale ending",
    lyrics: "Romeo, take me somewhere we can be alone\nI'll be waiting, all there's left to do is run\nYou'll be the prince and I'll be the princess\nIt's a love story, baby, just say 'yes'",
    explanation: "This timeless tale of romance echoes through your story, where hope and love triumph over obstacles. Like Romeo and Juliet but with a happy ending, it captures that magical feeling when everything falls into place."
  },
  {
    title: "Shake It Off",
    spotifyUrl: "spotify:track:0cqRj7pUJDkTCEsJkx8snD",
    appleMusicUrl: "https://music.apple.com/us/album/shake-it-off/1600775006?i=1600775320",
    previewUrl: "https://p.scdn.co/mp3-preview/8d59c419d2fec71f68b46c78b923fc01c8e5ffb1",
    youtubeId: "nfWlot6h_JM",
    keywords: ["haters", "criticism", "confidence", "resilience", "media", "strong"],
    mood: "Rising above negativity with confidence",
    lyrics: "The players gonna play, play, play, play, play\nAnd the haters gonna hate, hate, hate, hate, hate\nBaby, I'm just gonna shake, shake, shake, shake, shake\nI shake it off, I shake it off",
    explanation: "Your story shows resilience in the face of challenges, much like how 'Shake It Off' encourages us to rise above negativity and dance to our own beat. It's about finding your confidence and not letting others' opinions hold you back."
  },
  {
    title: "Anti-Hero",
    spotifyUrl: "spotify:track:0V3wPSX9ygBnCm8psDIegu",
    appleMusicUrl: "https://music.apple.com/us/album/anti-hero/1645937257?i=1645937570",
    previewUrl: "https://p.scdn.co/mp3-preview/e4a8aa172e2324f9cacf31e02939c65517c5d23f",
    youtubeId: "b1kbLwvqugk",
    keywords: ["self-reflection", "struggle", "identity", "mystery", "viral", "growth"],
    mood: "Embracing your authentic self",
    lyrics: "It's me, hi, I'm the problem, it's me\nAt tea time, everybody agrees\nI'll stare directly at the sun but never in the mirror\nIt must be exhausting always rooting for the anti-hero",
    explanation: "Like your story's journey of self-discovery, 'Anti-Hero' delves into the complexities of self-reflection and personal growth. It reminds us that our flaws and struggles are part of what makes us uniquely human."
  },
  {
    title: "Long Live",
    spotifyUrl: "spotify:track:1CmUZGtH29Kx36C1Hleqlz",
    appleMusicUrl: "https://music.apple.com/us/album/long-live/1590368448?i=1590368736",
    previewUrl: "https://p.scdn.co/mp3-preview/d811b1df9db4703d11f833f3b35a39da209c45da",
    youtubeId: "9mTfezR1oPk",
    keywords: ["triumph", "victory", "achievement", "success", "accomplishment"],
    mood: "Celebrating your victories and achievements",
    lyrics: "Long live all the mountains we moved\nI had the time of my life fighting dragons with you\nLong live the look on your face\nAnd bring on all the pretenders, one day we will be remembered",
    explanation: "This anthem of triumph and celebration perfectly complements your story's moments of victory and achievement. It captures the feeling of overcoming obstacles and creating lasting memories with those who matter most."
  }
];

export const findRelevantSong = (text: string): TaylorSwiftSong | null => {
  const lowercaseText = text.toLowerCase();
  
  return taylorSwiftSongs.find(song => 
    song.keywords.some(keyword => 
      lowercaseText.includes(keyword.toLowerCase())
    )
  ) || null;
};

export const openSongInPreferredPlatform = (song: TaylorSwiftSong) => {
  // Try to open Spotify first
  window.location.href = song.spotifyUrl;
  
  // If Spotify doesn't open within 1 second, try Apple Music
  setTimeout(() => {
    if (document.hidden) {
      // User switched to Spotify
      return;
    }
    // Fallback to Apple Music
    window.location.href = song.appleMusicUrl;
  }, 1000);
};
