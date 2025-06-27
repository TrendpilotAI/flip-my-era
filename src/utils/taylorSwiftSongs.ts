interface TaylorSwiftSong {
  title: string;
  album: string;
  mood: string;
  keywords: string[];
  previewUrl: string;
  youtubeId: string;
  lyrics?: string;
  explanation?: string;
}

const taylorSwiftSongs: TaylorSwiftSong[] = [
  {
    title: "Love Story",
    album: "Fearless",
    mood: "Romantic & Hopeful",
    keywords: ["love", "romance", "hope", "dream", "fairy tale"],
    previewUrl: "https://p.scdn.co/mp3-preview/5b6481d1e8d1f79e569e6b57e34d576c89120b7b",
    youtubeId: "8xg3vE8Ie_E",
    lyrics: "Romeo, take me somewhere we can be alone\nI'll be waiting, all there's left to do is run\nYou'll be the prince and I'll be the princess\nIt's a love story, baby, just say, 'Yes'",
    explanation: "This song captures the essence of romantic hope and fairy tale dreams, much like the emotional journey in your story."
  },
  {
    title: "Blank Space",
    album: "1989",
    mood: "Playful & Ironic",
    keywords: ["fun", "playful", "ironic", "relationship", "reputation"],
    previewUrl: "https://p.scdn.co/mp3-preview/8b3bff974c22c56054e836f68b0b6d5115eef643",
    youtubeId: "e-ORhEE9VVg",
    lyrics: "Got a long list of ex-lovers\nThey'll tell you I'm insane\nBut I've got a blank space, baby\nAnd I'll write your name",
    explanation: "The playful irony in this song mirrors the light-hearted moments and self-awareness found in your story."
  },
  {
    title: "All Too Well",
    album: "Red",
    mood: "Nostalgic & Reflective",
    keywords: ["memory", "nostalgia", "reflection", "loss", "autumn"],
    previewUrl: "https://p.scdn.co/mp3-preview/5d2e2d4c26f98a70b15fca9a1f8c61c9a20d5735",
    youtubeId: "tollGa3S0o8",
    lyrics: "And I might be okay, but I'm not fine at all\nOh, oh, oh",
    explanation: "This deeply reflective song captures the nostalgic elements and emotional depth present in your story."
  },
  {
    title: "Shake It Off",
    album: "1989",
    mood: "Upbeat & Resilient",
    keywords: ["resilience", "confidence", "fun", "overcome", "positive"],
    previewUrl: "https://p.scdn.co/mp3-preview/e6f75a91c6d0f3e2391c0767d6c8fe0ea6fe1117",
    youtubeId: "nfWlot6h_JM",
    lyrics: "But I keep cruising\nCan't stop, won't stop moving\nIt's like I got this music in my mind\nSaying it's gonna be alright",
    explanation: "The upbeat resilience in this song reflects the positive energy and determination in your story."
  },
  {
    title: "Cardigan",
    album: "Folklore",
    mood: "Wistful & Intimate",
    keywords: ["memory", "intimate", "relationship", "youth", "nostalgia"],
    previewUrl: "https://p.scdn.co/mp3-preview/9a5be0b692d0c56f0e9a4e3e4c7a3efb0dee64cf",
    youtubeId: "K-a8s8OLBSE",
    lyrics: "And when I felt like I was an old cardigan under someone's bed\nYou put me on and said I was your favorite",
    explanation: "This song's intimate storytelling and emotional imagery complement the personal journey described in your story."
  }
];

export const findRelevantSong = (text: string): TaylorSwiftSong | null => {
  // Convert text to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  
  // Score each song based on keyword matches
  const scoredSongs = taylorSwiftSongs.map(song => {
    let score = 0;
    song.keywords.forEach(keyword => {
      // Count occurrences of each keyword
      const regex = new RegExp(keyword.toLowerCase(), 'g');
      const matches = lowerText.match(regex);
      if (matches) {
        score += matches.length;
      }
    });
    return { song, score };
  });
  
  // Sort by score (highest first)
  scoredSongs.sort((a, b) => b.score - a.score);
  
  // Return the highest scoring song, or null if no matches
  return scoredSongs[0]?.score > 0 ? scoredSongs[0].song : taylorSwiftSongs[Math.floor(Math.random() * taylorSwiftSongs.length)];
};

export const openSongInPreferredPlatform = (song: TaylorSwiftSong): void => {
  // Default to YouTube
  const youtubeUrl = `https://www.youtube.com/watch?v=${song.youtubeId}`;
  window.open(youtubeUrl, '_blank');
  
  // You could expand this to check user preferences and open Spotify, Apple Music, etc.
};
