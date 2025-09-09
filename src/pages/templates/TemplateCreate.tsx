// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { api } from '../../services/api';
// import { useAuth } from "../../context/AuthContext";

// const TemplateCreate: React.FC = () => {
//   const { user, token } = useAuth();
//   const navigate = useNavigate();

//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");
//   const [category, setCategory] = useState("general");
//   const [promptTemplate, setPromptTemplate] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const res = await api.post(
//         "/templates",
//         {
//           name,
//           description,
//           category,
//           promptTemplate,
//         }
//       );

//       console.log("Template created:", res.data);
//       navigate("/templates"); 
//     } catch (err: any) {
//       console.error(err);
//       setError(err.response?.data?.error || "Failed to create template");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-gray-50 min-h-screen">
//       <div className="max-w-3xl mx-auto p-6">
//         <h1 className="text-2xl font-semibold mb-6">Create New Template</h1>

//         {error && (
//           <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700">Name</label>
//             <input
//               type="text"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               required
//               className="mt-1 w-full rounded-lg border px-3 py-2"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">Description</label>
//             <textarea
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//               className="mt-1 w-full rounded-lg border px-3 py-2"
//               rows={2}
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">Category</label>
//             <select
//               value={category}
//               onChange={(e) => setCategory(e.target.value)}
//               className="mt-1 w-full rounded-lg border px-3 py-2"
//             >
//               <option value="academic">Academic</option>
//               <option value="job">Job</option>
//               <option value="scholarship">Scholarship</option>
//               <option value="general">General</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700">Prompt Template</label>
//             <textarea
//               value={promptTemplate}
//               onChange={(e) => setPromptTemplate(e.target.value)}
//               required
//               className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm"
//               rows={6}
//               placeholder="Write your prompt here, e.g. 'Generate a letter of recommendation for {{studentName}} ...'"
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 transition"
//           >
//             {loading ? "Creating..." : "Create Template"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default TemplateCreate;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from '../../services/api';
import { useAuth } from "../../context/AuthContext";
import { Navigation } from "../../components/layout/Navigation";

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  score: number;
}

interface PromptSection {
  id: string;
  label: string;
  description: string;
  required: boolean;
  example: string;
}

const TemplateCreate: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("academic");
  const [promptTemplate, setPromptTemplate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGuidance, setShowGuidance] = useState(true);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  // Available variables for templates
  const availableVariables = [
    { var: "{{applicantName}}", description: "Full name of the applicant" },
    { var: "{{firstName}}", description: "Applicant's first name" },
    { var: "{{lastName}}", description: "Applicant's last name" },
    { var: "{{program}}", description: "Program/position they're applying for" },
    { var: "{{goal}}", description: "Applicant's stated goal or objective" },
    { var: "{{achievements}}", description: "List of applicant's achievements" },
    { var: "{{relationship}}", description: "Your relationship to the applicant" },
    { var: "{{duration}}", description: "How long you've known the applicant" },
    { var: "{{strengths}}", description: "Key strengths you've identified" },
    { var: "{{specificExamples}}", description: "Specific examples or anecdotes" },
    { var: "{{additionalContext}}", description: "Any additional context provided" },
    { var: "{{refereeTitle}}", description: "Your professional title" },
    { var: "{{refereeInstitution}}", description: "Your institution/organization" }
  ];

  // Prompt engineering sections that should be included
  const promptSections: PromptSection[] = [
    {
      id: "role",
      label: "Role Definition",
      description: "Define your role as a letter writer and establish expertise",
      required: true,
      example: "You are an experienced academic writing professional letters of recommendation..."
    },
    {
      id: "context",
      label: "Context Setting",
      description: "Provide context about the letter's purpose and target audience",
      required: true,
      example: "This letter is for {{program}} application. The recipient expects..."
    },
    {
      id: "structure",
      label: "Structure Guidelines",
      description: "Define the expected structure and flow of the letter",
      required: true,
      example: "Structure the letter with: 1) Introduction and relationship, 2) Key strengths with examples..."
    },
    {
      id: "tone",
      label: "Tone & Style",
      description: "Specify the desired tone, formality level, and writing style",
      required: false,
      example: "Write in a formal, professional tone that conveys confidence and authority..."
    },
    {
      id: "constraints",
      label: "Constraints & Requirements",
      description: "Specify length, format, and specific requirements",
      required: false,
      example: "Keep the letter to 400-600 words. Include specific examples rather than generic praise..."
    }
  ];

  // Validate prompt template for effectiveness
  const validatePrompt = (prompt: string): ValidationResult => {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Check for role definition
    if (!prompt.toLowerCase().includes('you are')) {
      issues.push("Missing role definition - start with 'You are...'");
    } else {
      score += 20;
    }

    // Check for variable usage
    const usedVars = availableVariables.filter(v => prompt.includes(v.var));
    if (usedVars.length === 0) {
      issues.push("No template variables used - letter won't be personalized");
    } else if (usedVars.length < 3) {
      suggestions.push("Consider using more variables for better personalization");
      score += 10;
    } else {
      score += 20;
    }

    // Check for structure instructions
    if (!prompt.toLowerCase().includes('structure') && !prompt.includes('1)') && !prompt.includes('•')) {
      issues.push("Missing structure guidance - specify how to organize the letter");
    } else {
      score += 15;
    }

    // Check for tone specification
    if (!prompt.toLowerCase().includes('tone') && !prompt.toLowerCase().includes('formal') && !prompt.toLowerCase().includes('professional')) {
      suggestions.push("Consider specifying the desired tone and style");
    } else {
      score += 10;
    }

    // Check for specific instructions about examples
    if (!prompt.toLowerCase().includes('example') && !prompt.toLowerCase().includes('specific')) {
      issues.push("Missing instruction to include specific examples");
    } else {
      score += 15;
    }

    // Check for length constraints
    if (!prompt.includes('word') && !prompt.includes('paragraph') && !prompt.includes('page')) {
      suggestions.push("Consider specifying desired length or format");
    } else {
      score += 10;
    }

    // Check for clear instructions
    if (!prompt.toLowerCase().includes('write') && !prompt.toLowerCase().includes('compose') && !prompt.toLowerCase().includes('create')) {
      issues.push("Missing clear action instruction (write, compose, create)");
    } else {
      score += 10;
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
      score: Math.min(score, 100)
    };
  };

  // Handle prompt template changes and validate
  const handlePromptChange = (value: string) => {
    setPromptTemplate(value);
    if (value.trim()) {
      setValidation(validatePrompt(value));
    } else {
      setValidation(null);
    }
  };

  // Insert variable into prompt at cursor position
  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('promptTemplate') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = promptTemplate.substring(0, start) + variable + promptTemplate.substring(end);
      setPromptTemplate(newValue);

      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.setSelectionRange(start + variable.length, start + variable.length);
        textarea.focus();
      }, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate before submitting
    const currentValidation = validatePrompt(promptTemplate);
    if (!currentValidation.isValid) {
      setError(`Template validation failed: ${currentValidation.issues.join(', ')}`);
      return;
    }

    if (currentValidation.score < 60) {
      if (!window.confirm(`Template quality score is ${currentValidation.score}/100. This may not produce optimal results. Continue anyway?`)) {
        return;
      }
    }

    setLoading(true);

    try {
      const res = await api.post("/templates", {
        name,
        description,
        category,
        promptTemplate,
      });

      console.log("Template created:", res.data);
      navigate("/templates");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  // Example templates for different categories
  const getExampleTemplate = (category: string): string => {
    const examples = {
      academic: `You are an experienced academic professional writing a formal letter of recommendation for {{applicantName}} who is applying for {{program}}.

Context: This letter will be reviewed by admissions committees who value specific examples, academic achievements, and potential for success in graduate-level work.

Structure the letter as follows:
1) Introduction: State your relationship as {{relationship}} and duration ({{duration}})
2) Academic Performance: Highlight key strengths - {{strengths}}
3) Specific Examples: Include detailed examples - {{specificExamples}}
4) Character Assessment: Comment on work ethic, integrity, and potential
5) Strong Conclusion: Provide clear recommendation with confidence level

Write in a formal, authoritative tone that demonstrates your expertise. Use specific examples rather than generic praise. Keep the letter between 400-600 words. Emphasize academic potential and readiness for {{program}}.

Additional context to weave in naturally: {{additionalContext}}`,

      job: `You are a professional reference writing a strong recommendation letter for {{applicantName}} who is pursuing {{program}}.

Context: This letter targets hiring managers who need to assess professional competence, work ethic, and cultural fit. They value concrete achievements and measurable results.

Structure the letter with:
1) Professional introduction establishing your credibility and relationship ({{relationship}} for {{duration}})
2) Key professional strengths and skills: {{strengths}}
3) Specific work examples and achievements: {{specificExamples}}
4) Leadership, teamwork, and problem-solving abilities
5) Clear recommendation for the role

Write in a confident, professional tone. Focus on measurable outcomes and specific contributions. Include relevant achievements: {{achievements}}. Keep between 350-500 words.

Additional context: {{additionalContext}}`,

      scholarship: `You are writing a compelling scholarship recommendation letter for {{applicantName}}, emphasizing their merit for {{program}}.

Context: Scholarship committees seek candidates with exceptional potential, financial need awareness, and commitment to their field. They review hundreds of applications.

Create a structured letter:
1) Establish your authority and relationship: {{relationship}} over {{duration}}
2) Academic excellence and key strengths: {{strengths}}
3) Specific examples demonstrating potential: {{specificExamples}}
4) Character, leadership, and community involvement
5) Strong endorsement emphasizing why they deserve funding

Write with conviction and specificity. Highlight both academic merit and personal qualities. Reference achievements: {{achievements}}. Aim for 400-550 words.

Context to include: {{additionalContext}}`
    };

    return examples[category as keyof typeof examples] || examples.academic;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation */}
      <Navigation user={user}/>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline">
              Dashboard
            </button>
            <span>›</span>
            <button onClick={() => navigate('/templates')} className="text-blue-600 hover:underline">
              Templates
            </button>
            <span>›</span>
            <span>Create Template</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Template</h1>
          <p className="text-gray-600">Design an effective prompt template for generating high-quality recommendation letters</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Template Details</h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Academic Graduate School Recommendation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="academic">Academic</option>
                      <option value="job">Job/Employment</option>
                      <option value="scholarship">Scholarship</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Describe when and how to use this template..."
                  />
                </div>

                {/* Prompt Template Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Prompt Template <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setPromptTemplate(getExampleTemplate(category))}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        Load Example
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowGuidance(!showGuidance)}
                        className="text-sm text-gray-600 hover:text-gray-700"
                      >
                        {showGuidance ? 'Hide' : 'Show'} Guidance
                      </button>
                    </div>
                  </div>

                  <textarea
                    id="promptTemplate"
                    value={promptTemplate}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    rows={12}
                    placeholder="Write your prompt template here. Use {{variables}} for dynamic content..."
                  />

                  {/* Validation Results */}
                  {validation && (
                    <div className="mt-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Quality Score:</span>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${validation.score >= 80 ? 'bg-green-100 text-green-800' :
                            validation.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {validation.score}/100
                        </div>
                      </div>

                      {validation.issues.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-2">
                          <h4 className="text-sm font-medium text-red-800 mb-1">Issues to Fix:</h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {validation.issues.map((issue, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-red-500 mr-1">•</span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validation.suggestions.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                          <h4 className="text-sm font-medium text-yellow-800 mb-1">Suggestions:</h4>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            {validation.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-yellow-500 mr-1">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/templates')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (validation ? !validation.isValid : false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Template'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar - Guidance */}
          <div className="lg:col-span-1">
            {showGuidance && (
              <div className="space-y-6">
                {/* Available Variables */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Available Variables</h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-3">Click to insert into your template:</p>
                    <div className="space-y-2">
                      {availableVariables.map((item) => (
                        <button
                          key={item.var}
                          type="button"
                          onClick={() => insertVariable(item.var)}
                          className="w-full text-left p-2 text-xs bg-gray-50 hover:bg-blue-50 rounded border hover:border-blue-200 group"
                        >
                          <code className="font-mono text-blue-600 group-hover:text-blue-700">{item.var}</code>
                          <div className="text-gray-500 mt-1">{item.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Prompt Engineering Guide */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Effective Prompt Elements</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {promptSections.map((section) => (
                      <div key={section.id} className="border-l-2 border-blue-200 pl-3">
                        <h4 className="text-sm font-medium text-gray-900 flex items-center">
                          {section.label}
                          {section.required && <span className="text-red-500 ml-1">*</span>}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">{section.description}</p>
                        <div className="bg-gray-50 rounded p-2">
                          <code className="text-xs text-gray-700">{section.example}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Best Practices */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Best Practices</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Start with clear role definition</li>
                    <li>• Specify structure and organization</li>
                    <li>• Include length constraints</li>
                    <li>• Request specific examples</li>
                    <li>• Define tone and style</li>
                    <li>• Use multiple variables for personalization</li>
                    <li>• Test with sample data before saving</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCreate;