import { getGroqApiKey } from '@/modules/shared/utils/env';

export const generateWithGroq = async (prompt: string) => {
  const apiKey = getGroqApiKey();
  
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
        model: "openai/gpt-oss-120b",
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
        max_tokens: 4096,
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
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating with Groq:', error);
    throw error;
  }
};
