
export type PersonalityTypeKey = "dreamer" | "adventurer" | "analyst" | "nurturer" | "achiever";

export const personalityTypes = {
  "dreamer": {
    title: "The Dreamer",
    traits: ["Imaginative", "Creative", "Idealistic"],
    description: "Always looking for new possibilities and meanings in life"
  },
  "adventurer": {
    title: "The Adventurer",
    traits: ["Spontaneous", "Energetic", "Risk-taking"],
    description: "Seeking thrills and new experiences"
  },
  "analyst": {
    title: "The Analyst",
    traits: ["Logical", "Strategic", "Detail-oriented"],
    description: "Finding patterns and solving complex problems"
  },
  "nurturer": {
    title: "The Nurturer",
    traits: ["Empathetic", "Supportive", "Compassionate"],
    description: "Taking care of others and building connections"
  },
  "achiever": {
    title: "The Achiever",
    traits: ["Ambitious", "Determined", "Goal-oriented"],
    description: "Striving for success and recognition"
  }
} as const;
