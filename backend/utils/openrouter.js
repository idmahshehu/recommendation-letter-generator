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
  'claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    identifier: 'anthropic/claude-3.5-sonnet',
    description: 'Nuanced and empathetic letters with strong narrative flow',
    strengths: 'Excellent personalization, natural language, avoids generic phrasing',
    cost: 'Premium'
  },
  'mistral-large': {
    name: 'Mistral Large',
    identifier: 'mistralai/mistral-large',
    description: 'Balanced quality and speed with multilingual support',
    strengths: 'Strong reasoning, suitable for academic contexts, cost-effective',
    cost: 'Moderate'
  },
  'llama-3.1-70b': {
    name: 'Llama 3.1 70B',
    identifier: 'meta-llama/llama-3.1-70b-instruct',
    description: 'Free or low-cost option with decent letter quality',
    strengths: 'Open-source, solid general performance, accessible for testing',
    cost: 'Free to low cost'
  },
  'gemini-1.5-pro': {
    name: 'Gemini 1.5 Pro',
    identifier: 'google/gemini-pro-1.5',
    description: 'Advanced reasoning and factual accuracy for formal recommendations',
    strengths: 'Great at detailed structure, clarity, and long-form consistency',
    cost: 'High'
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

