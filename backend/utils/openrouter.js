const axios = require('axios');

// Available models with their details
const AVAILABLE_MODELS = {
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    identifier: 'openai/gpt-3.5-turbo',
    description: 'Fast and cost-effective',
    pricing: 'Low cost'
  },
    'mistral-7b': {
    name: 'Mistral 7B',
    identifier: 'mistralai/mistral-7b-instruct',
    description: 'Fast and free alternative',
    pricing: 'FREE'
  },
    'claude-3-haiku': {
    name: 'Claude 3 Haiku',
    identifier: 'anthropic/claude-3-haiku',
    description: 'Fast Claude model',
    pricing: '$0.00025/1K tokens (Ultra-cheap)'
  },
//   'gpt-4': {
//     name: 'GPT-4',
//     identifier: 'openai/gpt-4',
//     description: 'High quality and detailed',
//     pricing: 'Higher cost'
//   },
//   'claude-3-sonnet': {
//     name: 'Claude 3 Sonnet',
//     identifier: 'anthropic/claude-3-sonnet',
//     description: 'Excellent for academic writing',
//     pricing: 'Medium cost'
//   }
};

const generateWithOpenRouter = async (prompt, options = {}) => {
  try {
    console.log('Generating with OpenRouter...');
    
    // Get the model identifier from our available models
    const selectedModel = options.model || 'gpt-3.5-turbo';
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