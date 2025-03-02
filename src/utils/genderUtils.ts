import axios from 'axios';
import { generateName } from '@/services/ai';

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

const getMaleToFemaleMapping = (name: string): string => {
  const mappings: { [key: string]: string } = {
    'alexander': 'alexandra',
    'andrew': 'andrea',
    'anthony': 'antonia',
    'benjamin': 'beatrice',
    'charles': 'charlotte',
    'christopher': 'christine',
    'daniel': 'danielle',
    'david': 'diana',
    'edward': 'emma',
    'eric': 'erica',
    'francis': 'frances',
    'frederick': 'frederica',
    'george': 'georgia',
    'henry': 'henrietta',
    'james': 'jamie',
    'john': 'joan',
    'joseph': 'josephine',
    'kevin': 'katherine',
    'louis': 'louise',
    'matthew': 'matilda',
    'michael': 'michelle',
    'nicholas': 'nicole',
    'patrick': 'patricia',
    'paul': 'paula',
    'peter': 'petra',
    'philip': 'philippa',
    'richard': 'rachel',
    'robert': 'roberta',
    'samuel': 'samantha',
    'stephen': 'stephanie',
    'thomas': 'thomasina',
    'timothy': 'tina',
    'victor': 'victoria',
    'william': 'willow'
  };
  
  const lowercaseName = name.toLowerCase();
  return mappings[lowercaseName] || name + 'a';
};

const getFemaleToMaleMapping = (name: string): string => {
  const mappings: { [key: string]: string } = {
    'alexandra': 'alexander',
    'andrea': 'andrew',
    'antonia': 'anthony',
    'beatrice': 'benjamin',
    'charlotte': 'charles',
    'christine': 'christopher',
    'danielle': 'daniel',
    'diana': 'david',
    'emma': 'edward',
    'erica': 'eric',
    'frances': 'francis',
    'frederica': 'frederick',
    'georgia': 'george',
    'henrietta': 'henry',
    'jamie': 'james',
    'joan': 'john',
    'josephine': 'joseph',
    'katherine': 'kevin',
    'louise': 'louis',
    'matilda': 'matthew',
    'michelle': 'michael',
    'nicole': 'nicholas',
    'patricia': 'patrick',
    'paula': 'paul',
    'petra': 'peter',
    'philippa': 'philip',
    'rachel': 'richard',
    'roberta': 'robert',
    'samantha': 'samuel',
    'stephanie': 'stephen',
    'thomasina': 'thomas',
    'tina': 'timothy',
    'victoria': 'victor',
    'willow': 'william'
  };
  
  const lowercaseName = name.toLowerCase();
  // Remove common feminine endings to find male equivalent
  const withoutEnding = lowercaseName.replace(/(a|ie|ette|ina|ey)$/, '');
  return mappings[lowercaseName] || withoutEnding;
};

export const transformName = async (originalName: string, detectedGender: GenderInfo, genderType: "same" | "flip" | "neutral"): Promise<string> => {
  const [firstName, ...restOfName] = originalName.split(' ');
  const lastName = restOfName.join(' ');

  if (genderType === "same") {
    return originalName;
  }

  try {
    if (genderType === "flip") {
      const gender = detectedGender.gender;
      const targetGender = gender === 'male' ? 'female' : 'male';
      
      // Use Groq to generate a name of the opposite gender
      const newFirstName = await generateName({
        originalName: firstName,
        targetGender,
        shouldBeSimilar: true
      });
      
      return `${newFirstName} ${lastName}`;
    }

    if (genderType === "neutral") {
      // Use Groq to generate a gender-neutral name
      const newFirstName = await generateName({
        originalName: firstName,
        targetGender: 'neutral',
        shouldBeSimilar: true
      });
      
      return `${newFirstName} ${lastName}`;
    }
  } catch (error) {
    console.error('Error generating name with Groq:', error);
    
    // Fallback to the legacy mapping if Groq fails
    if (genderType === "flip") {
      const gender = detectedGender.gender;
      let newFirstName = firstName;
      
      if (gender === 'male') {
        newFirstName = getMaleToFemaleMapping(firstName);
      } else if (gender === 'female') {
        newFirstName = getFemaleToMaleMapping(firstName);
      }
      
      // Preserve the case of the original name
      if (firstName[0] === firstName[0].toUpperCase()) {
        newFirstName = newFirstName.charAt(0).toUpperCase() + newFirstName.slice(1).toLowerCase();
      }
      
      return `${newFirstName} ${lastName}`;
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

      const randomFirstName = neutralNames[Math.floor(Math.random() * neutralNames.length)];
      return `${randomFirstName} ${lastName}`;
    }
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
