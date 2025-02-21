
interface TaylorSwiftSong {
  title: string;
  spotifyUrl: string;
  appleMusicUrl: string;
  keywords: string[];
  mood: string;
}

const taylorSwiftSongs: TaylorSwiftSong[] = [
  {
    title: "22",
    spotifyUrl: "spotify:track:6sGiAzpxVlbJkXYyIHnHhj",
    appleMusicUrl: "https://music.apple.com/us/album/22-taylors-version/1621836955?i=1621837276",
    keywords: ["young", "fun", "party", "night out", "friends", "carefree", "happy"],
    mood: "Celebrating the joy of youth and friendship"
  },
  {
    title: "Love Story",
    spotifyUrl: "spotify:track:3CeCwYWvdfXbZLXFhBrbnf",
    appleMusicUrl: "https://music.apple.com/us/album/love-story-taylors-version/1552791073?i=1552791076",
    keywords: ["romance", "love", "destiny", "magical", "fairy tale", "dream"],
    mood: "Finding your own fairy tale ending"
  },
  {
    title: "Shake It Off",
    spotifyUrl: "spotify:track:0cqRj7pUJDkTCEsJkx8snD",
    appleMusicUrl: "https://music.apple.com/us/album/shake-it-off/1600775006?i=1600775320",
    keywords: ["haters", "criticism", "confidence", "resilience", "media", "strong"],
    mood: "Rising above negativity with confidence"
  },
  {
    title: "Anti-Hero",
    spotifyUrl: "spotify:track:0V3wPSX9ygBnCm8psDIegu",
    appleMusicUrl: "https://music.apple.com/us/album/anti-hero/1645937257?i=1645937570",
    keywords: ["self-reflection", "struggle", "identity", "mystery", "viral", "growth"],
    mood: "Embracing your authentic self"
  },
  {
    title: "Long Live",
    spotifyUrl: "spotify:track:1CmUZGtH29Kx36C1Hleqlz",
    appleMusicUrl: "https://music.apple.com/us/album/long-live/1590368448?i=1590368736",
    keywords: ["triumph", "victory", "achievement", "success", "accomplishment"],
    mood: "Celebrating your victories and achievements"
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
