
export type PersonalityTypeKey = "dreamer" | "adventurer" | "analyst" | "nurturer" | "achiever" | "creator" | "activist";

export const personalityTypes = {
  "dreamer": {
    title: "The Main Character",
    traits: ["Imaginative", "Creative", "Idealistic"],
    description: "Always looking for new possibilities and meanings in life"
  },
  "adventurer": {
    title: "The Vibe Chaser",
    traits: ["Spontaneous", "Energetic", "Risk-taking"],
    description: "Seeking thrills and new experiences"
  },
  "analyst": {
    title: "The Big Brain",
    traits: ["Logical", "Strategic", "Detail-oriented"],
    description: "Finding patterns and solving complex problems"
  },
  "nurturer": {
    title: "The Emotional Support Human",
    traits: ["Empathetic", "Supportive", "Compassionate"],
    description: "Taking care of others and building connections"
  },
  "achiever": {
    title: "The Grindset Guru",
    traits: ["Ambitious", "Determined", "Goal-oriented"],
    description: "Striving for success and recognition"
  },
  "creator": {
    title: "The Content Wizard",
    traits: ["Trendsetting", "Tech-savvy", "Authentic"],
    description: "Creating and sharing content that resonates with others"
  },
  "activist": {
    title: "The Based Revolutionary",
    traits: ["Passionate", "Outspoken", "Community-focused"],
    description: "Fighting for causes and speaking truth to power"
  }
} as const;
