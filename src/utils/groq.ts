
export const generateStoryWithGroq = async (name: string, date: Date | undefined) => {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('GROQ_API_KEY')}`
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: "You are a viral story generator specializing in short, hilarious alternate reality tales. Your stories should be punchy, absurd, and incredibly shareable - think TikTok or Twitter viral content. Use humor, pop culture references, and unexpected twists. Keep it concise, engaging, and make people want to share it with friends. Use markdown for emphasis on the funniest parts."
          },
          {
            role: "user",
            content: `Create a SHORT, HILARIOUS story about ${name}${date ? ` (born ${date.toLocaleDateString()})` : ''} in an alternate universe where they're the opposite gender. Include:\n- An absurd career twist\n- A ridiculous hobby\n- An unexpected viral moment\n- A celebrity encounter gone wrong\nMake it silly and super shareable! Max 3 paragraphs, use markdown to highlight the funniest parts.`
          }
        ],
        temperature: 0.95,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate story');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating story:', error);
    return null;
  }
};
