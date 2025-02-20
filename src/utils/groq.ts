
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
            content: "You are a creative alternate reality generator. Given a name and birthdate, you determine the person's opposite gender and create a whimsical story about their alternate life in a parallel universe. Make it fun, absurd, and engaging. Use markdown formatting to structure your response with paragraphs, emphasis, and proper spacing."
          },
          {
            role: "user",
            content: `Generate a story about an alternate reality version of someone named ${name}${date ? ` born on ${date.toLocaleDateString()}` : ''}. First determine if the name is typically masculine or feminine, then create a story about their life as the opposite gender. Include interesting details about their profession, location, hobbies, and quirks. Format the response with proper markdown, including paragraphs and emphasis where appropriate.`
          }
        ],
        temperature: 0.9,
        max_tokens: 4000
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
