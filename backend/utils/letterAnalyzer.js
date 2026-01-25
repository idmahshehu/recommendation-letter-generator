const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analyzeLetterStructure = async (letterText) => {
  try {
    const analysisPrompt = `
    Analyze this recommendation letter for creating a reusable template:
    
    <recommendation_letter> 
    "${letterText}"
    </recommendation_letter>
    
    CRITICAL: Do NOT include any personally identifiable information in your response. This includes:
    - Names of any individuals (applicant, writer, colleagues, etc.)
    - Names of institutions, companies, or organizations
    - Specific job titles or roles
    - Dates, durations, or time periods
    - Locations or addresses
    - Course names, project names, or program names
    - Any other identifying details
    
    Replace all specific references with generic placeholders like "the applicant", "the writer", "the institution", etc.
    
    Return only this JSON:
    {
      "introduction_pattern": "Describe the narrative approach used to open the letter body 
      (NOT the salutation like 'Dear' or 'To Whom It May Concern'). Focus on: How does the writer establish their credibility? How do they introduce the applicant? What context do they provide about their relationship? DO NOT include any names, titles, or institutions.",
      
      "conclusion_style": "Describe how the writer wraps up their recommendation. Include: the type of final endorsement given, whether they offer to provide additional information, and the emotional tone of the closing. DO NOT include any names or specific details.",
      
      "tone": "formal/warm/professional/enthusiastic (can combine, e.g., 'warm-professional')",
      
      "key_phrases": ["Extract 3-5 distinctive phrases or sentence structures the writer uses that could be adapted for other letters. REMOVE and generalize any specific names, dates, institutions, or identifying details. Return only the reusable language patterns."],
      
      "structure": ["List each paragraph's purpose in order using generic descriptions. DO NOT reference specific achievements, projects, or roles."],
      
      "letter_length": "short (under 250 words) / medium (250-400 words) / long (400+ words)",
      
      "relationship_description": "Describe the general TYPE of professional relationship only. DO NOT include any specific names, institution names, job titles, departments, or time periods."
    }
    
    FINAL CHECK: Before returning, verify that your response contains ZERO personally identifiable information. All outputs must be fully anonymized, generalized patterns that could apply to any recommendation letter.`;

    const completion = await openai.chat.completions.create({
      // model: 'gpt-3.5-turbo',
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: analysisPrompt }],
      temperature: 0.1,
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error("Analysis failed:", error);
    // Simple fallback
    return {
      introduction_pattern: "Direct formal introduction",
      conclusion_style: "Positive ending that offers support",
      tone: "professional",
      key_phrases: ["excellent performance", "highly recommend"],
    };
  }
};

const extractTextFromPDF = async (pdfBuffer) => {
  const pdf = require("pdf-parse");
  const data = await pdf(pdfBuffer);
  return data.text.trim();
};

module.exports = { analyzeLetterStructure, extractTextFromPDF };
