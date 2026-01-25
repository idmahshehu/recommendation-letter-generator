const generateTemplateFromAnalysis = (analysis, templateName) => {
  const { 
    tone, 
    introduction_pattern, 
    conclusion_style, 
    key_phrases, 
    structure, 
    letter_length,
    relationship_description 
  } = analysis;

  // Build the template based on the structure
  let promptTemplate = `Write a ${tone} recommendation letter for {applicantName} applying for {position}.

Follow this structure and style:

Introduction:
${introduction_pattern}
Establish your relationship: ${relationship_description}
State how long you have known {applicantName} and in what capacity: {relationship}

Main Content:
- Include key {strengths}
- Use {examples} (research, projects, or academic activities) where available
- Add {additionalContext} if provided`;
  promptTemplate += `

Conclusion:
${conclusion_style}
- Summarize recommendation
- Express confidence in {applicantName}

Style:`;
  // Add key phrases for style consistency
  if (key_phrases && key_phrases.length > 0) {
    promptTemplate += `
Use language similar to these expressions: ${key_phrases.map(phrase => `"${phrase}"`).join(', ')}`;
  }

  promptTemplate += `

Letter Requirements:
- Tone: ${tone}
- Length: ${letter_length || 'medium'}
- Maintain professional credibility
- All information must be accurate to {applicantName}`;

  return {
    name: templateName,
    category: 'general',
    promptTemplate: promptTemplate,
    tone: tone,
    length: letter_length || 'medium'
  };
};

module.exports = { generateTemplateFromAnalysis };