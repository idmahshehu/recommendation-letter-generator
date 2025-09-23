const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const analyzeLetterStructure = async (letterText) => {
  try {
    const analysisPrompt = `
    Analyze this recommendation letter for creating a reusable template:

    "${letterText}"

    Return only this JSON:
    {
      "introduction_pattern": "How the letter starts (without specific names)",
      "conclusion_style": "How the letter ends",
      "tone": "formal/warm/professional",
      "key_phrases": ["3-5 distinctive phrases the writer uses"],
      "structure": ["main paragraph purposes in order"],
      "letter_length": "short/medium/long",
      "relationship_description": "How they establish connection to applicant"
    }`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.1
    });

    return JSON.parse(completion.choices[0].message.content);

  } catch (error) {
    console.error('Analysis failed:', error);
    // Simple fallback
    return {
      introduction_pattern: "Direct formal introduction",
      conclusion_style: "Strong endorsement with offer of support", 
      tone: "professional",
      key_phrases: ["excellent performance", "highly recommend"]
    };
  }
};

const extractTextFromPDF = async (pdfBuffer) => {
  const pdf = require('pdf-parse');
  const data = await pdf(pdfBuffer);
  return data.text.trim();
};

module.exports = { analyzeLetterStructure, extractTextFromPDF };