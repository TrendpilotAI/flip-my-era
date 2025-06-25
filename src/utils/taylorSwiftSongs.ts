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
    keywords: ["romeo", "juliet", "prince", "princess", "fairy tale", "castle", "balcony"],
    previewUrl: "https://p.scdn.co/mp3-preview/5b6481d1e8d1f79e569e6b57e34d576c89120b7b",
    youtubeId: "8xg3vE8Ie_E",
    lyrics: "Romeo, take me somewhere we can be alone\nI'll be waiting, all there's left to do is run\nYou'll be the prince and I'll be the princess\nIt's a love story, baby, just say, 'Yes'",
    explanation: "This song captures the essence of romantic hope and fairy tale dreams, much like the emotional journey in your story."
  },
  {
    title: "Blank Space",
    album: "1989",
    mood: "Playful & Ironic",
    keywords: ["blank space", "ex-lovers", "insane", "reputation", "playful", "ironic", "write your name"],
    previewUrl: "https://p.scdn.co/mp3-preview/8b3bff974c22c56054e836f68b0b6d5115eef643",
    youtubeId: "e-ORhEE9VVg",
    lyrics: "Got a long list of ex-lovers\nThey'll tell you I'm insane\nBut I've got a blank space, baby\nAnd I'll write your name",
    explanation: "The playful irony in this song mirrors the light-hearted moments and self-awareness found in your story."
  },
  {
    title: "All Too Well",
    album: "Red",
    mood: "Nostalgic & Reflective",
    keywords: ["autumn", "scarf", "reflection", "memory", "nostalgia", "red", "falling"],
    previewUrl: "https://p.scdn.co/mp3-preview/5d2e2d4c26f98a70b15fca9a1f8c61c9a20d5735",
    youtubeId: "tollGa3S0o8",
    lyrics: "And I might be okay, but I'm not fine at all\nOh, oh, oh",
    explanation: "This deeply reflective song captures the nostalgic elements and emotional depth present in your story."
  },
  {
    title: "Shake It Off",
    album: "1989",
    mood: "Upbeat & Resilient",
    keywords: ["shake it off", "cruising", "music in my mind", "alright", "resilience", "confidence", "overcome"],
    previewUrl: "https://p.scdn.co/mp3-preview/e6f75a91c6d0f3e2391c0767d6c8fe0ea6fe1117",
    youtubeId: "nfWlot6h_JM",
    lyrics: "But I keep cruising\nCan't stop, won't stop moving\nIt's like I got this music in my mind\nSaying it's gonna be alright",
    explanation: "The upbeat resilience in this song reflects the positive energy and determination in your story."
  },
  {
    title: "Cardigan",
    album: "Folklore",
    mood: "Wistful & Intimate",
    keywords: ["cardigan", "favorite", "under someone's bed", "intimate", "youth", "folklore", "storytelling"],
    previewUrl: "https://p.scdn.co/mp3-preview/9a5be0b692d0c56f0e9a4e3e4c7a3efb0dee64cf",
    youtubeId: "K-a8s8OLBSE",
    lyrics: "And when I felt like I was an old cardigan under someone's bed\nYou put me on and said I was your favorite",
    explanation: "This song's intimate storytelling and emotional imagery complement the personal journey described in your story."
  },
  {
    title: "Wildest Dreams",
    album: "1989",
    mood: "Dreamy & Romantic",
    keywords: ["wildest dreams", "dreamy", "romantic", "fantasy", "imagination", "wish", "desire"],
    previewUrl: "https://p.scdn.co/mp3-preview/example",
    youtubeId: "IdneKLhsWOQ",
    lyrics: "Say you'll remember me\nStanding in a nice dress\nStaring at the sunset, babe",
    explanation: "This dreamy and romantic song captures the imaginative and wishful elements in your story."
  },
  {
    title: "Lover",
    album: "Lover",
    mood: "Sweet & Intimate",
    keywords: ["lover", "sweet", "intimate", "home", "comfort", "warmth", "together"],
    previewUrl: "https://p.scdn.co/mp3-preview/example",
    youtubeId: "-BjZmE2gtdo",
    lyrics: "We could leave the Christmas lights up 'til January\nThis is our place, we make the rules",
    explanation: "This sweet and intimate song reflects the cozy, personal moments and relationships in your story."
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
        // Give more weight to more specific keywords
        const keywordWeight = keyword.length > 3 ? 2 : 1;
        score += matches.length * keywordWeight;
      }
    });
    
    // Add some randomness to prevent the same song always winning
    const randomFactor = Math.random() * 0.5;
    score += randomFactor;
    
    return { song, score };
  });
  
  // Sort by score (highest first)
  scoredSongs.sort((a, b) => b.score - a.score);
  
  // If the top song has a significant lead, use it
  // Otherwise, randomly select from top 3 to add variety
  if (scoredSongs[0]?.score > 0) {
    if (scoredSongs[0].score > scoredSongs[1]?.score + 2) {
      return scoredSongs[0].song;
    } else {
      // Randomly select from top 3 songs for variety
      const topSongs = scoredSongs.slice(0, Math.min(3, scoredSongs.length));
      return topSongs[Math.floor(Math.random() * topSongs.length)].song;
    }
  }
  
  // Fallback to random selection
  return taylorSwiftSongs[Math.floor(Math.random() * taylorSwiftSongs.length)];
};

export const openSongInPreferredPlatform = (song: TaylorSwiftSong): void => {
  // Default to YouTube
  const youtubeUrl = `https://www.youtube.com/watch?v=${song.youtubeId}`;
  window.open(youtubeUrl, '_blank');
  
  // You could expand this to check user preferences and open Spotify, Apple Music, etc.
};
