
interface TaylorSwiftSong {
  title: string;
  url: string;
  keywords: string[];
  mood: string;
}

const taylorSwiftSongs: TaylorSwiftSong[] = [
  {
    title: "22",
    url: "https://www.taylorswift.com/chapters/red-taylors-version/22",
    keywords: ["young", "fun", "party", "night out", "friends", "carefree", "happy"],
    mood: "Celebrating the joy of youth and friendship"
  },
  {
    title: "Love Story",
    url: "https://www.taylorswift.com/chapters/fearless-taylors-version/love-story",
    keywords: ["romance", "love", "destiny", "magical", "fairy tale", "dream"],
    mood: "Finding your own fairy tale ending"
  },
  {
    title: "Shake It Off",
    url: "https://www.taylorswift.com/chapters/1989-taylors-version/shake-it-off",
    keywords: ["haters", "criticism", "confidence", "resilience", "media", "strong"],
    mood: "Rising above negativity with confidence"
  },
  {
    title: "Anti-Hero",
    url: "https://www.taylorswift.com/chapters/midnights/anti-hero",
    keywords: ["self-reflection", "struggle", "identity", "mystery", "viral", "growth"],
    mood: "Embracing your authentic self"
  },
  {
    title: "Blank Space",
    url: "https://www.taylorswift.com/chapters/1989-taylors-version/blank-space",
    keywords: ["fame", "reputation", "celebrity", "scandal", "media attention"],
    mood: "Taking control of your narrative"
  },
  {
    title: "Long Live",
    url: "https://www.taylorswift.com/chapters/speak-now/long-live",
    keywords: ["triumph", "victory", "achievement", "success", "accomplishment"],
    mood: "Celebrating your victories and achievements"
  },
  {
    title: "Change",
    url: "https://www.taylorswift.com/chapters/fearless-taylors-version/change",
    keywords: ["transformation", "overcome", "breakthrough", "victory", "change"],
    mood: "Embracing personal transformation"
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
