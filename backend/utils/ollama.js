const axios = require('axios');

const generateWithOllama = async (prompt) => {
  try {
    console.log('Generating with Ollama...');

    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama2:7b',
      prompt: prompt,
      stream: false
    });

    console.log('\nGenerated Text:\n', response.data.response);
    return response.data.response;

  } catch (err) {
    console.error('Ollama Error:', err.message);
    throw err;
  }
};

module.exports = { generateWithOllama };
