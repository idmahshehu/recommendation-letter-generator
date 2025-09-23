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

Header:
${introduction_pattern}

Introduction:
Establish your relationship: ${relationship_description}
State how long you have known {applicantName} and in what capacity: {relationship}

Main Content:
- Include key {strengths}
- Use {examples} (research, projects, or academic activities) where available
- Add {additionalContext} if provided`;

// ${structure.length > 0 ? structure.map(s => `- ${s}: highlight {strengths}, include {examples}`).join("\n") 
// : "- Highlight {strengths}, with {examples}."}`;

  // Add structure-based sections if available
// if (structure && structure.length > 0) {
//   structure.forEach((section, index) => {
//     promptTemplate += `

// Section ${index + 1} - ${section}:
// - Highlight {strengths}
// - Provide specific examples: {examples}
// - Relate this to their suitability for {position}`;
//   });
// }
//   else {
//     // Default structure if none provided
//     promptTemplate += `
// - Describe {applicantName}'s key strengths and performance: {strengths}
// - Provide specific examples of their work/achievements: {examples}
// - Explain their suitability for {position}`;
//   }

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