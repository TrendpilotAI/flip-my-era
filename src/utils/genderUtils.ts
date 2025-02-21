
import axios from 'axios';

export type GenderInfo = {
  gender: 'male' | 'female' | 'unknown';
  probability: number;
};

export const detectGender = async (name: string): Promise<GenderInfo> => {
  try {
    const response = await axios.get(`https://api.genderize.io/?name=${encodeURIComponent(name)}`);
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
