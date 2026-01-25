const axios = require('axios');

// Available models with their details
const AVAILABLE_MODELS = {
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    identifier: 'openai/gpt-4o-mini',
    description: 'High-quality, professional letters with excellent structure',
    strengths: 'Superior coherence, follows complex instructions, maintains formal tone',
    cost: 'Moderate'
  },
  'claude-4.5-opus': {
    name: 'Claude 4.5 Opus',
    identifier: 'anthropic/claude-opus-4.5',
    description: 'Most natural and personalized letters with excellent narrative flow',
    strengths: 'Superior personalization, avoids generic phrasing, warm professional tone',
    cost: 'Medium-High'
  },
  'gpt-4o': {
    name: 'GPT-4o',
    identifier: 'openai/gpt-4o',
    description: 'Highest quality for critical letters (grad school, prestigious positions)',
    strengths: 'Best reasoning, perfect structure, handles complex requirements',
    cost: 'Medium'
  },
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    identifier: 'google/gemini-2.5-flash',
    description: 'Fast and affordable with good quality for standard letters',
    strengths: 'Very fast, good factual accuracy, cost-effective',
    cost: 'Very Low'
  },
  'llama-3.3-70b': {
    name: 'Llama 3.3 70B',
    identifier: 'meta-llama/llama-3.3-70b-instruct',
    description: 'Free/low-cost option for testing or high-volume use',
    strengths: 'Open-source, competitive quality, great for development',
    cost: 'Free/Very Low'
  }
};

const generateWithOpenRouter = async (prompt, options = {}) => {
  try {
    console.log('Generating with OpenRouter...');
    
  const selectedModel = options.model || 'gpt-4o-mini';
  const modelConfig = AVAILABLE_MODELS[selectedModel];

  if (!modelConfig) {
    throw new Error(`Model ${selectedModel} is not available`);
  }
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: modelConfig.identifier,
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
    top_p: 1,
    frequency_penalty: 0.1,
    presence_penalty: 0.1
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'Recommendation Letter Generator', 
    }
  });
  const generatedContent = response.data.choices[0].message.content;

  console.log('\nGenerated Letter:\n', generatedContent);
  console.log('Token usage:', response.data.usage);

  return {
    content: generatedContent,
    usage: response.data.usage,
    model: response.data.model,
    selectedModel: selectedModel // user's selection
  };

  } catch (error) {
    console.error('OpenRouter API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    if (error.response?.status === 402) {
      throw new Error('Insufficient credits. Please check your OpenRouter balance.');
    }
    if (error.response?.status === 400) {
      throw new Error('Invalid request. Please check your model selection.');
    }
    
    throw new Error(`AI generation failed: ${error.response?.data?.error?.message || error.message}`);
  }
};

// Function to get available models for frontend
const getAvailableModels = () => {
  return Object.entries(AVAILABLE_MODELS).map(([key, config]) => ({
    id: key,
    name: config.name,
    description: config.description,
    pricing: config.pricing
  }));
};

module.exports = { 
  generateWithOpenRouter, 
  getAvailableModels,
  AVAILABLE_MODELS 
};

