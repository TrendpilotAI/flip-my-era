/**
 * Fix text formatting to follow Standard English conventions
 * - Ensures proper spacing after periods
 * - Fixes other common spacing issues
 */
const fixTextFormatting = (text: string): string => {
  return text
    // Fix period spacing: ensure single space after periods followed by letters
    .replace(/\.([A-Z])/g, '. $1')
    // Fix multiple spaces after periods
    .replace(/\.\s{2,}/g, '. ')
    // Fix missing space after periods at end of sentences
    .replace(/\.([a-zA-Z])/g, '. $1')
    // Fix other punctuation spacing issues
    .replace(/\?([A-Z])/g, '? $1')
    .replace(/!([A-Z])/g, '! $1')
    .replace(/;([A-Z])/g, '; $1')
    .replace(/:([A-Z])/g, ': $1')
    // Clean up any double spaces that might have been created
    .replace(/\s{2,}/g, ' ')
    .trim();
};

export const generateWithGroq = async (prompt: string) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY_MISSING');
  }

  // Basic validation for API key format
  if (!apiKey.startsWith('gsk_')) {
    throw new Error('INVALID_API_KEY_FORMAT');
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "You are a creative writer specializing in humorous alternate reality stories and chapter generation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        stop: null
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('INVALID_API_KEY');
      } else if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      } else {
        throw new Error(`API_ERROR: ${errorData.error?.message || 'Unknown error'}`);
      }
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    // Apply text formatting fixes
    return fixTextFormatting(generatedText);
  } catch (error) {
    console.error('Error generating with Groq:', error);
    throw error;
  }
};
