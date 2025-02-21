
import axios from 'axios';

export type GenderInfo = {
  gender: 'male' | 'female' | 'unknown';
  probability: number;
};

export const detectGender = async (name: string): Promise<GenderInfo> => {
  try {
    const firstName = name.split(' ')[0];
    const response = await axios.get(`https://api.genderize.io/?name=${encodeURIComponent(firstName)}`);
    return {
      gender: response.data.gender || 'unknown',
      probability: response.data.probability || 0
    };
  } catch (error) {
    console.error('Error detecting gender:', error);
    return { gender: 'unknown', probability: 0 };
  }
};

export const getFlippedGender = (gender: string): string => {
  switch (gender.toLowerCase()) {
    case 'male':
      return 'female';
    case 'female':
      return 'male';
    default:
      return 'neutral';
  }
};

export const transformName = (originalName: string, detectedGender: GenderInfo, genderType: "same" | "flip" | "neutral"): string => {
  const [firstName, ...restOfName] = originalName.split(' ');
  const lastName = restOfName.join(' ');

  if (genderType === "same") {
    return originalName;
  }

  if (genderType === "flip") {
    const flippedFirstNames = {
      male: {
        'John': 'Jane',
        'Michael': 'Michelle',
        'David': 'Diana',
        'Robert': 'Roberta',
        'William': 'Willow',
        'James': 'Jamie',
        'Joseph': 'Josephine',
        'Daniel': 'Danielle',
        'Thomas': 'Thomasina',
        'Christopher': 'Christina'
      },
      female: {
        'Mary': 'Mark',
        'Patricia': 'Patrick',
        'Jennifer': 'Jeffrey',
        'Elizabeth': 'Elias',
        'Linda': 'Linden',
        'Barbara': 'Barrett',
        'Susan': 'Samuel',
        'Margaret': 'Marcus',
        'Jessica': 'Jesse',
        'Sarah': 'Samuel'
      }
    };

    const gender = detectedGender.gender;
    if (gender === 'male' || gender === 'female') {
      const nameMap = flippedFirstNames[gender];
      const keys = Object.keys(nameMap);
      const randomIndex = Math.floor(Math.random() * keys.length);
      const newFirstName = nameMap[keys[randomIndex]];
      return `${newFirstName} ${lastName}`;
    }
  }

  if (genderType === "neutral") {
    const neutralNames = [
      'Sky',
      'River',
      'Storm',
      'Sage',
      'Rain',
      'Phoenix',
      'Winter',
      'Echo',
      'Ocean',
      'Journey'
    ];

    const neutralLastNames = [
      'Moonbeam',
      'Stardust',
      'Rainbow',
      'Sunlight',
      'Wildflower',
      'Cloudwalker',
      'Dreamweaver',
      'Starlight',
      'Skydancer',
      'Earthsong'
    ];

    const randomFirstName = neutralNames[Math.floor(Math.random() * neutralNames.length)];
    const randomLastName = neutralLastNames[Math.floor(Math.random() * neutralLastNames.length)];

    return `${randomFirstName} ${randomLastName}`;
  }

  return originalName;
};

export const getGenderPronouns = (gender: string) => {
  switch (gender.toLowerCase()) {
    case 'male':
      return { subject: 'he', object: 'him', possessive: 'his', reflexive: 'himself' };
    case 'female':
      return { subject: 'she', object: 'her', possessive: 'her', reflexive: 'herself' };
    default:
      return { subject: 'they', object: 'them', possessive: 'their', reflexive: 'themself' };
  }
};
