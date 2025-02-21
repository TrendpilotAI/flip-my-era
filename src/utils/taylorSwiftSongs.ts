
interface TaylorSwiftSong {
  title: string;
  url: string;
  keywords: string[];
}

const taylorSwiftSongs: TaylorSwiftSong[] = [
  {
    title: "22",
    url: "https://www.taylorswift.com/chapters/red-taylors-version/22",
    keywords: ["young", "fun", "party", "night out", "friends"]
  },
  {
    title: "Love Story",
    url: "https://www.taylorswift.com/chapters/fearless-taylors-version/love-story",
    keywords: ["romance", "love", "destiny", "magical", "fairy tale"]
  },
  {
    title: "Shake It Off",
    url: "https://www.taylorswift.com/chapters/1989-taylors-version/shake-it-off",
    keywords: ["haters", "criticism", "confidence", "resilience", "media"]
  },
  {
    title: "Anti-Hero",
    url: "https://www.taylorswift.com/chapters/midnights/anti-hero",
    keywords: ["self-reflection", "struggle", "identity", "mystery", "viral"]
  },
  {
    title: "Blank Space",
    url: "https://www.taylorswift.com/chapters/1989-taylors-version/blank-space",
    keywords: ["fame", "reputation", "celebrity", "scandal", "media attention"]
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
