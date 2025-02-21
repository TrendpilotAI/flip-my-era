
export const generateWithGrok = async (prompt: string) => {
  const apiKey = localStorage.getItem('GROK_API_KEY');
  if (!apiKey) {
    throw new Error('Please configure your Grok API key in settings first');
  }

  try {
    const response = await fetch('https://api.grok.x/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-70b-chat",
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
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating with Grok:', error);
    throw new Error('Failed to generate content. Please check your API key and try again.');
  }
};
