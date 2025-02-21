
export const getStarSign = (date: Date) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
};

interface StarSignData {
  [key: string]: {
    traits: string[];
  };
}

export const starSignCharacteristics: StarSignData = {
  "Aries": {
    traits: ["Bold and ambitious", "Natural-born leader", "Energetic and dynamic"]
  },
  "Taurus": {
    traits: ["Patient and reliable", "Deeply devoted", "Appreciates luxury and comfort"]
  },
  "Gemini": {
    traits: ["Adaptable and versatile", "Quick-witted and expressive", "Always seeking new experiences"]
  },
  "Cancer": {
    traits: ["Deeply intuitive", "Nurturing and protective", "Strong emotional connections"]
  },
  "Leo": {
    traits: ["Natural performer", "Confident and dramatic", "Born to lead"]
  },
  "Virgo": {
    traits: ["Detail-oriented perfectionist", "Practical and hardworking", "Analytical mind"]
  },
  "Libra": {
    traits: ["Diplomatic and fair", "Social butterfly", "Values harmony and balance"]
  },
  "Scorpio": {
    traits: ["Intensely passionate", "Mysterious and magnetic", "Fiercely loyal"]
  },
  "Sagittarius": {
    traits: ["Freedom-loving adventurer", "Philosophical and optimistic", "Always seeking knowledge"]
  },
  "Capricorn": {
    traits: ["Ambitious and determined", "Practical and disciplined", "Masters of self-control"]
  },
  "Aquarius": {
    traits: ["Original and progressive", "Humanitarian spirit", "Independent thinker"]
  },
  "Pisces": {
    traits: ["Imaginative and sensitive", "Compassionate and artistic", "Highly intuitive"]
  }
};
