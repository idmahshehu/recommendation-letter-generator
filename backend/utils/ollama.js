// backend/utils/ollama.js
const { Ollama } = require('ollama');

const ollama = new Ollama();

const generateWithOllama = async (prompt) => {
  try {
    console.log("Generating with Ollama...");
    const res = await ollama.chat({
      model: 'llama2:7b', // or try 'mistral', 'llama2:13b', etc.
      messages: [{ role: 'user', content: prompt }]
    });

    console.log('\n Generated Letter:\n');
    console.log(res.message.content);
    return res.message.content;
  } catch (error) {
    console.error('Ollama Error:', error.message);
  }
};

// Run if this file is called directly
// if (require.main === module) {
//   generateWithOllama("Hi.");
// }

module.exports = { generateWithOllama };
