
export const generateWithGroq = async (prompt: string) => {
  const apiKey = localStorage.getItem('GROQ_API_KEY');
  if (!apiKey) {
    throw new Error('Please configure your Groq API key in settings first');
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-r1-70b-distil-llama",
        messages: [
          {
            role: "system",
            content: "You are a creative writer specializing in beautiful, novel-like stories with rich descriptions and flowing narratives."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.75,
        max_tokens: 2500,
        top_p: 1,
        stop: null
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      throw new Error(`Failed to generate content: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating with Groq:', error);
    throw error;
  }
};
