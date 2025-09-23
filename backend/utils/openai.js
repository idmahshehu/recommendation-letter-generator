const { OpenAI } = require('openai');
// console.log('OpenAI imported successfully');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

const generateWithOpenAI = async (prompt, options = {}) => {
  try {
    console.log('Generating with OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: options.model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert academic writing assistant specializing in recommendation letters. Write professional, personalized letters that highlight the applicant\'s strengths with specific examples.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 800,
      temperature: options.temperature || 0.7, 
      presence_penalty: 0.1, 
      frequency_penalty: 0.1
    });

    const generatedContent = completion.choices[0].message.content;
    
    console.log('\nGenerated Letter:\n', generatedContent);
    
    console.log('Token usage:', completion.usage);
    
    return {
      content: generatedContent,
    //   usage: completion.usage,
      model: completion.model
    };

  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    
    if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI quota exceeded. Please check your billing.');
    }
    if (error.code === 'rate_limit_exceeded') {
      throw new Error('Too many requests. Please try again in a moment.');
    }
    
    throw new Error(`AI generation failed: ${error.message}`);
  }
};

module.exports = { generateWithOpenAI };