const express = require('express');
const db = require('../models');
const { auth, authorize: roleAuth } = require('../middleware/auth');
const router = express.Router();
const { generateLetterGemini } = require('../utils/gemini');
const { generateWithOllama } = require('../utils/ollama');
const { json } = require('sequelize');
const { Op, Sequelize } = require('sequelize');
const { generateWithOpenRouter } = require('../utils/openrouter');
const { getAvailableModels } = require('../utils/openrouter');

const Letter = db.Letter;
const User = db.User;
const Template = db.Template;

// ------------------------------------------------
// APPLICANT FLOW - Step 1: Request Letter
// ------------------------------------------------

/**
 * @swagger
 * /api/letters/request:
 *   post:
 *     summary: Request a recommendation letter (applicant only)
 *     tags: [Letters]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referee_id:
 *                 type: string
 *                 format: uuid
 *                 example: "266d8b9d-e939-440b-85b9-be40f0315b13"
 *               applicant_data:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     example: "Jane"
 *                   lastName:
 *                     type: string
 *                     example: "Doe"
 *                   email:
 *                     type: string
 *                     example: "jane.doe@example.com"
 *                   program:
 *                     type: string
 *                     example: "MSc in Computer Science"
 *                   goal:
 *                     type: string
 *                     example: "Apply to graduate school"
 *                   achievements:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["Top 10% of class", "Led research project on AI"]
 *               preferences:
 *                 type: object
 *                 properties:
 *                   tone:
 *                     type: string
 *                     enum: ["formal", "casual", "academic"]
 *                     example: "formal"
 *                   length:
 *                     type: string
 *                     enum: ["short", "standard", "detailed"]
 *                     example: "standard"
 *                   deadline:
 *                     type: string
 *                     format: date
 *                     example: "2024-03-15"
 *     responses:
 *       201:
 *         description: Letter request created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Referee not found
 */
router.post('/request', auth, roleAuth('applicant'), async (req, res) => {
  try {
    const { referee_email, applicant_data, preferences = {} } = req.body;

    // Validate required fields
    if (!referee_email || !applicant_data) {
      return res.status(400).json({
        error: 'Referee email and applicant data are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(referee_email)) {
      return res.status(400).json({
        error: 'Please enter a valid email address'
      });
    }

    // Validate referee exists
    const referee = await User.findOne({
      where: {
        email: referee_email.toLowerCase().trim(),
        role: 'referee',
      }
    });

    if (!referee) {
      return res.status(404).json({ error: 'Referee not found' });
    }

    // Check if there's already a pending request from this applicant to this referee
    const existingRequest = await Letter.findOne({
      where: {
        referee_id: referee.id,
        'applicant_data.requester_id': req.user.id,
        status: 'requested'
      }
    });

    if (existingRequest) {
      return res.status(409).json({
        error: 'You already have a pending letter request with this referee',
        existing_request_id: existingRequest.id
      });
    }


    // Create letter request
    const letter = await Letter.create({
      referee_id: referee.id,
      applicant_data: {
        ...applicant_data,
        requester_id: req.user.id // requesting user id
      },
      generation_parameters: preferences,
      status: 'requested' // Key: starts as 'requested'
    });

    res.status(201).json({
      message: 'Letter request sent successfully',
      letter: {
        id: letter.id,
        status: letter.status,
        referee: {
          name: `${referee.firstName} ${referee.lastName}`,
          email: referee.email
        },
        requested_at: letter.requested_at
      }
    });
  } catch (err) {
    console.error('Error creating letter request:', err);
    res.status(400).json({ error: err.message });
  }
});

// ------------------------------------------------
// REFEREE FLOW - Step 2: View Pending Requests
// ------------------------------------------------
function formatDate(date) {
  if (!date) return null;
  return new Date(date).toISOString();
}
/**
 * @swagger
 * /api/letters/pending:
 *   get:
 *     summary: Get pending letter requests for referee
 *     tags: [Letters]
 *     responses:
 *       200:
 *         description: List of pending requests
 */
router.get('/pending', auth, roleAuth('referee'), async (req, res) => {
  try {
    const pendingLetters = await Letter.findAll({
      where: {
        referee_id: req.user.id,
        status: 'requested'
      },
      include: [
        {
          model: Template,
          as: 'template',
          attributes: ['id', 'name', 'description'],
          required: false
        }
      ],
      order: [['created_at', 'ASC']] // Oldest requests first
    });
    console.log('Raw pending letters:', pendingLetters.map(l => ({
      id: l.id,
      created_at: l.createdAt,
      datatype: typeof l.createdAt
    })));

    res.json({
      pending_requests: pendingLetters.map(letter => ({
        id: letter.id,
        applicant: {
          name: `${letter.applicant_data.firstName} ${letter.applicant_data.lastName}`,
          email: letter.applicant_data.email,
          program: letter.applicant_data.program,
          goal: letter.applicant_data.goal,
          achievements: letter.applicant_data.achievements
        },
        preferences: letter.generation_parameters,
        created_at: formatDate(letter.createdAt),
        deadline: letter.generation_parameters?.deadline
      }))
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// ------------------------------------------------
// REFEREE FLOW - Accept Pending Requests
// ------------------------------------------------

/**
 * @swagger
 * /api/letters/{id}/accept:
 *   post:
 *     summary: Accept a pending letter request (referee only)
 *     tags: [Letters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the letter request to accept
 *     responses:
 *       200:
 *         description: Letter request accepted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Letter request accepted
 *                 letter:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: in_progress
 *       404:
 *         description: Letter request not found or already processed
 *       500:
 *         description: Failed to accept requests
 */

router.post('/:id/accept', auth, roleAuth('referee'), async (req, res) => {
  try {
    const letter = await Letter.findOne({
      where: {
        id: req.params.id,
        referee_id: req.user.id,
        status: 'requested'
      }
    });

    if (!letter) {
      return res.status(404).json({ error: 'Letter request not found or already processed' });
    }

    await letter.update({
      status: 'in_progress'
    })

    res.json({
      message: 'Letter request accepted',
      letter: {
        id: letter.id,
        status: letter.status
      }
    });
  } catch (error) {
    console.error('Error accepting letter request:', error);
    res.status(500).json({ error: 'Failed to accept requests' });
  }
});

// ------------------------------------------------
// REFEREE FLOW - Reject Pending Requests
// ------------------------------------------------

/**
 * @swagger
 * /api/letters/{id}/reject:
 *   post:
 *     summary: Reject a pending letter request (referee only)
 *     tags: [Letters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the letter request to reject
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Unfortunately, I don't have enough familiarity with your work to write a strong recommendation."
 *     responses:
 *       200:
 *         description: Letter request rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Letter request rejected
 *                 letter:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: rejected
 *       404:
 *         description: Letter request not found or already processed
 *       500:
 *         description: Failed to reject request
 */
router.post('/:id/reject', auth, roleAuth('referee'), async (req, res) => {
  try {
    const { reason } = req.body;

    const letter = await Letter.findOne({
      where: {
        id: req.params.id,
        referee_id: req.user.id,
        status: 'requested'
      }
    });

    if (!letter) {
      return res.status(404).json({ error: 'Letter request not found or already processed' });
    }

    await letter.update({
      status: 'rejected',
      rejection_reason: reason || null,
      rejected_at: new Date()
    });

    // notify the applicant
    // await notifyApplicant(letter, 'rejected');

    res.json({
      message: 'Letter request rejected',
      letter: {
        id: letter.id,
        status: letter.status
      }
    });
  } catch (error) {
    console.error('Error rejecting letter request:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// ------------------------------------------------
// UTILITY FUNCTIONS
// ------------------------------------------------

function fillTemplate(template, values) {
  return template.replace(/{(.*?)}/g, (_, key) => values[key] || `{${key}}`);
}


// ------------------------------------------------
// REFEREE FLOW - Step 3: Generate Draft
// ------------------------------------------------

// /**
//  * @swagger
//  * /api/letters/{id}/generate-draft:
//  *   post:
//  *     summary: Generate AI draft for a letter request (referee only)
//  *     tags: [Letters]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               template_id:
//  *                 type: string
//  *                 format: uuid
//  *               extra_context:
//  *                 type: object
//  *                 properties:
//  *                   relationship:
//  *                     type: string
//  *                     example: "student in my Advanced AI course"
//  *                   duration:
//  *                     type: string
//  *                     example: "2 years"
//  *                   strengths:
//  *                     type: string
//  *                     example: "exceptional analytical thinking and leadership"
//  *                   specific_examples:
//  *                     type: string
//  *                     example: "Led a team project that achieved 95% accuracy"
//  *     responses:
//  *       200:
//  *         description: Draft generated successfully
//  *       404:
//  *         description: Letter request not found
//  *       403:
//  *         description: Not authorized to generate draft for this letter
//  */

// router.post('/:id/generate-draft', auth, roleAuth('referee'), async (req, res) => {
//   try {
//     const { template_id, extra_context = {} } = req.body;

//     // Find the letter request
//     const letter = await Letter.findOne({
//       where: {
//         id: req.params.id,
//         referee_id: req.user.id,
//         status: 'in_progress'
//       }
//     });

//     if (!letter) {
//       return res.status(404).json({ error: 'Letter request not found or already processed' });
//     }

//     // Get template
//     const template = await Template.findByPk(template_id);
//     if (!template) {
//       return res.status(404).json({ error: 'Template not found' });
//     }

//     // Get referee info
//     const referee = await User.findByPk(req.user.id, {
//       attributes: ['firstName', 'lastName', 'email', 'institution', 'department', 'title']
//     });

//     // Build context for AI generation
//     const applicantName = `${letter.applicant_data.firstName} ${letter.applicant_data.lastName}`;

//     const values = {
//       applicantName,
//       position: letter.applicant_data.goal || letter.applicant_data.program,
//       relationship: extra_context.relationship || 'student',
//       duration: extra_context.duration || '1 year',
//       strengths: extra_context.strengths || letter.applicant_data.achievements?.join(', ') || 'dedication and curiosity',
//       examples: extra_context.specific_examples || '',
//       additionalContext: extra_context.additional_context || '',

//       // Generation parameters with defaults
//       tone: letter.generation_parameters?.tone || 'formal',
//       length: letter.generation_parameters?.length || 'standard',
//       detailLevel: letter.generation_parameters?.detailLevel || 'comprehensive',

//       // Referee info
//       refereeName: `${referee.firstName} ${referee.lastName}`,
//       refereeEmail: referee.email || '',
//       refereeInstitution: referee.institution || 'our institution',
//       refereeDepartment: referee.department || 'the department',
//       refereeTitle: referee.title || 'Professor'
//     };

//     // Fill template and create prompt
// //     const filledTemplate = fillTemplate(template.promptTemplate, values);
// //     const prompt = `You are writing a ${template.category} recommendation letter.
// // Referee Info: ${referee.firstName} ${referee.lastName}, ${referee.title} at ${referee.institution}
// // Applicant Info: ${JSON.stringify(letter.applicant_data, null, 2)}
// // Additional Context: ${JSON.stringify(extra_context, null, 2)}

// // ${filledTemplate}`;

// // Replace the confusing prompt with a clearer structure
// const buildPrompt = (template, values, applicantData, extraContext) => {
//   const filledTemplate = fillTemplate(template.promptTemplate, values);

//   return `${filledTemplate}

// STRICT REQUIREMENTS:
// - Applicant: ${applicantData.firstName} ${applicantData.lastName}
// - Purpose: ${applicantData.goal || applicantData.program}
// - Use ONLY these achievements: ${applicantData.achievements?.join(', ') || 'None provided'}
// - Referee context: ${JSON.stringify(extraContext, null, 2)}

// Do not invent examples or use information not provided above.`;
// };

// // Use it in your endpoint
// const prompt = buildPrompt(template, values, letter.applicant_data, extra_context);

//     // Log for debugging
//     console.log('Template ID:', template_id);
//     console.log('Extra context:', extra_context);
//     console.log('Letter:', letter);
//     console.log('Prompt preview:\n', prompt);

//     // Generate draft with AI
//     let generatedText;
//     // try {
//     //   console.log('Generating with Ollama...');
//     //   generatedText = await generateWithOllama(prompt);
//     //   console.log('Generated text:', generatedText);
//     // } catch (generationError) {
//     //   console.error('Ollama Generation Error:', generationError.message);
//     //   return res.status(500).json({ error: 'Failed to generate letter with Ollama.' });
//     // }
//     try {
//       console.log('Generating with OpenAI...');
//       generatedText = await generateWithOpenAI(prompt, {
//         model: 'gpt-3.5-turbo', // or 'gpt-4' for higher quality
//         maxTokens: 800,
//         temperature: 0.7
//       });
//       console.log('Generated successfully');
//     } catch (generationError) {
//       console.error('OpenAI Generation Error:', generationError.message);
//       return res.status(500).json({ error: 'Failed to generate letter with Ollama.' });
//     }

//     // Only update if generation was successful
//     if (!generatedText) {
//       return res.status(500).json({ error: 'No content generated from AI' });
//     }

//     // Update letter with draft content
//     // await letter.update({
//     //   template_id,
//     //   letter_content: generatedText,
//     //   model_used: 'ollama-llama2',
//     //   status: 'draft',
//     //   generation_attempts: (letter.generation_attempts || 0) + 1,
//     //   generation_parameters: {
//     //     ...letter.generation_parameters,
//     //     extra_context
//     //   }
//     // });
//     await letter.update({
//       template_id,
//       letter_content: generatedText.content,
//       model_used: generatedText.model,
//       status: 'draft',
//       generation_attempts: (letter.generation_attempts || 0) + 1,
//       generation_parameters: {
//         ...letter.generation_parameters,
//         extra_context,
//         tokens_used: generatedText.usage?.total_tokens
//       }
//     });

//     res.json({
//       message: 'Draft generated successfully',
//       // letter: {
//       //   id: letter.id,
//       //   content: generatedText,
//       //   status: 'draft',
//       //   applicant: {
//       //     name: applicantName,
//       //     program: letter.applicant_data.program
//       //   },
//       //   generated_at: letter.updated_at
//       // }
//       letter: {
//         id: letter.id,
//         content: generatedText.content,
//         status: 'draft',
//         applicant: {
//           name: applicantName,
//           program: letter.applicant_data.program
//         },
//         generated_at: letter,
//         // tokens_used: generatedText.usage?.total_tokens
//       }
//     });
//   } catch (err) {
//     console.error('Error generating draft:', err);
//     res.status(500).json({ error: 'Failed to generate draft' });
//   }
// });

// ------------------------------------------------
// REFEREE FLOW - Edit and Finalize
// ------------------------------------------------


// Updated router endpoint

/**
 * @swagger
 * /api/letters/{id}/generate-draft:
 *   post:
 *     summary: Generate AI draft for a letter request (referee only)
 *     tags: [Letters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the letter request
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - template_id
 *             properties:
 *               template_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the letter template to use
 *                 example: "550e8400-e29b-41d4-a716-446655440001"
 *               selected_model:
 *                 type: string
 *                 description: AI model to use for generation
 *                 enum: 
 *                   - gpt-3.5-turbo
 *                   - mistral-7b
 *                   - claude-3-haiku
 *                 default: gpt-3.5-turbo
 *                 example: "mistral-7b"
 *               extra_context:
 *                 type: object
 *                 description: Additional context from referee to personalize the letter
 *                 properties:
 *                   relationship:
 *                     type: string
 *                     description: Referee's relationship with the applicant
 *                     example: "student in my Advanced AI course"
 *                   duration:
 *                     type: string
 *                     description: How long the referee has known the applicant
 *                     example: "2 years"
 *                   strengths:
 *                     type: string
 *                     description: Key strengths observed by the referee
 *                     example: "exceptional analytical thinking and leadership"
 *                   specific_examples:
 *                     type: string
 *                     description: Specific examples or achievements to highlight
 *                     example: "Led a team project that achieved 95% accuracy"
 *                   additional_context:
 *                     type: string
 *                     description: Any other relevant information
 *                     example: "Showed remarkable improvement throughout the semester"
 *     responses:
 *       200:
 *         description: Draft generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Draft generated successfully"
 *                 letter:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "4eca47f1-e761-456a-8236-d0e1849f3576"
 *                     content:
 *                       type: string
 *                       description: Generated letter content
 *                       example: "Dear Admissions Committee,\n\nI am writing to recommend..."
 *                     status:
 *                       type: string
 *                       example: "draft"
 *                     model_used:
 *                       type: string
 *                       description: Actual model identifier used by the AI service
 *                       example: "mistralai/mistral-7b-instruct"
 *                     selected_model:
 *                       type: string
 *                       description: Model selected by the user
 *                       example: "mistral-7b"
 *                     applicant:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "Jane Doe"
 *                         program:
 *                           type: string
 *                           example: "MSc in Computer Science"
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-21T15:50:47.453Z"
 *                     tokens_used:
 *                       type: integer
 *                       description: Number of tokens consumed (if available)
 *                       example: 615
 *       400:
 *         description: Bad request - invalid model or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Model mistral-8b is not available"
 *       404:
 *         description: Letter request or template not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Letter request not found or already processed"
 *       403:
 *         description: Not authorized to generate draft for this letter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Not authorized to generate draft for this letter"
 *       500:
 *         description: AI generation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to generate letter: Rate limit exceeded"
 */

router.post('/:id/generate-draft', auth, roleAuth('referee'), async (req, res) => {
  try {
    const { template_id, extra_context = {}, selected_model = 'gpt-3.5-turbo' } = req.body;

    // Find the letter request
    const letter = await Letter.findOne({
      where: {
        id: req.params.id,
        referee_id: req.user.id,
        status: 'in_progress'
      }
    });

    if (!letter) {
      return res.status(404).json({ error: 'Letter request not found or already processed' });
    }

    // Get template
    const template = await Template.findByPk(template_id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Get referee info
    const referee = await User.findByPk(req.user.id, {
      attributes: ['firstName', 'lastName', 'email', 'institution', 'department', 'title']
    });

    // Build context for AI generation
    const applicantName = `${letter.applicant_data.firstName} ${letter.applicant_data.lastName}`;

    const values = {
      applicantName,
      position: letter.applicant_data.goal || letter.applicant_data.program,
      relationship: extra_context.relationship || 'student',
      duration: extra_context.duration || '1 year',
      strengths: extra_context.strengths || letter.applicant_data.achievements?.join(', ') || 'dedication and curiosity',
      examples: extra_context.specific_examples || '',
      additionalContext: extra_context.additional_context || '',

      // Generation parameters with defaults
      tone: letter.generation_parameters?.tone || 'formal',
      length: letter.generation_parameters?.length || 'standard',
      detailLevel: letter.generation_parameters?.detailLevel || 'comprehensive',

      // Referee info
      refereeName: `${referee.firstName} ${referee.lastName}`,
      refereeEmail: referee.email || '',
      refereeInstitution: referee.institution || 'our institution',
      refereeDepartment: referee.department || 'the department',
      refereeTitle: referee.title || 'Professor'
    };

    const buildPrompt = (template, values, applicantData, extraContext) => {
      const filledTemplate = fillTemplate(template.promptTemplate, values);

      return `${filledTemplate}

STRICT REQUIREMENTS:
- Applicant: ${applicantData.firstName} ${applicantData.lastName}
- Purpose: ${applicantData.goal || applicantData.program}
- Use ONLY these achievements: ${applicantData.achievements?.join(', ') || 'None provided'}
- Referee context: ${JSON.stringify(extraContext, null, 2)}

Do not invent examples or use information not provided above.`;
    };

    const prompt = buildPrompt(template, values, letter.applicant_data, extra_context);

    // Log for debugging
    console.log('Template ID:', template_id);
    console.log('Selected Model:', selected_model);
    console.log('Extra context:', extra_context);

    // Generate draft with OpenRouter
    let generatedText;
    try {
      console.log(`Generating with OpenRouter using model: ${selected_model}...`);
      generatedText = await generateWithOpenRouter(prompt, {
        model: selected_model,
        maxTokens: 800,
        temperature: 0.7
      });
      console.log('Generated successfully');
    } catch (generationError) {
      console.error('OpenRouter Generation Error:', generationError.message);
      return res.status(500).json({ error: `Failed to generate letter: ${generationError.message}` });
    }

    // Only update if generation was successful
    if (!generatedText || !generatedText.content) {
      return res.status(500).json({ error: 'No content generated from AI' });
    }

    // Update letter with draft content
    await letter.update({
      template_id,
      letter_content: generatedText.content,
      model_used: generatedText.model,
      selected_model: selected_model, // Store user's model choice
      status: 'draft',
      generation_attempts: (letter.generation_attempts || 0) + 1,
      generation_parameters: {
        ...letter.generation_parameters,
        extra_context,
        tokens_used: generatedText.usage?.total_tokens,
        model_selection: selected_model
      }
    });

    res.json({
      message: 'Draft generated successfully',
      letter: {
        id: letter.id,
        content: generatedText.content,
        status: 'draft',
        model_used: generatedText.model,
        selected_model: selected_model,
        applicant: {
          name: applicantName,
          program: letter.applicant_data.program
        },
        generated_at: new Date(),
        tokens_used: generatedText.usage?.total_tokens
      }
    });
  } catch (err) {
    console.error('Error generating draft:', err);
    res.status(500).json({ error: 'Failed to generate draft' });
  }
});

// Add endpoint to get available models

/**
 * @swagger
 * /api/letters/available-models:
 *   get:
 *     summary: Get available AI models for letter generation (referee only)
 *     description: Returns a list of whitelisted AI models that referees can use for generating recommendation letters.
 *     tags: [Letters]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved models
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 models:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["gpt-3.5", "claude-instant", "mistral"]
 *       401:
 *         description: Unauthorized – missing or invalid JWT
 *       403:
 *         description: Forbidden – only referees can access this
 *       500:
 *         description: Internal server error
 */

 router.get('/available-models', auth, roleAuth('referee'), async (req, res) => {
  try {
    const models = getAvailableModels();
    res.json({ models });
  } catch (error) {
    console.error('Error getting available models:', error);
    res.status(500).json({ error: 'Failed to get available models' });
  }
});

/**
 * @swagger
 * /api/letters/{id}/edit:
 *   put:
 *     summary: Edit letter content (referee only)
 *     tags: [Letters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the letter to edit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - letter_content
 *             properties:
 *               letter_content:
 *                 type: string
 *                 description: Full letter content (modify only what you want to change)
 *                 example: |
 *                   Dear Admissions Committee,
 *                   
 *                   I am writing to wholeheartedly recommend JUNA Doe for admission into your esteemed MSc in Computer Science program.
 *                   
 *                   ...
 *                   
 *                   Sincerely,
 *                   
 *                   [Your Name]
 *     responses:
 *       200:
 *         description: Letter updated successfully
 *       404:
 *         description: Letter not found or cannot be edited
 *       500:
 *         description: Server error
 */

router.put('/:id/edit', auth, roleAuth('referee'), async (req, res) => {
  try {
    const { letter_content } = req.body;

    const letter = await Letter.findOne({
      where: {
        id: req.params.id,
        referee_id: req.user.id,
        status: ['draft', 'in_review']
      }
    });

    if (!letter) {
      return res.status(404).json({ error: 'Letter not found or cannot be edited' });
    }

    await letter.update({
      letter_content,
      status: 'in_review'
    });

    res.json({
      message: 'Letter updated successfully',
      letter: {
        id: letter.id,
        content: letter.letter_content,
        status: letter.status,
        last_edited_at: letter.updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/letters/{id}/approve:
 *   post:
 *     summary: Approve and finalize letter (referee only)
 *     tags: [Letters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the letter to approve
 *     responses:
 *       200:
 *         description: Letter approved and completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Letter approved and completed
 *                 letter:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: completed
 *                     completed_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Letter not found or cannot be approved
 *       500:
 *         description: Server error
 */

router.post('/:id/approve', auth, roleAuth('referee'), async (req, res) => {
  try {
    const letter = await Letter.findOne({
      where: {
        id: req.params.id,
        referee_id: req.user.id,
        status: ['draft', 'in_review']
      }
    });

    if (!letter) {
      return res.status(404).json({ error: 'Letter not found or cannot be approved' });
    }

    await letter.update({
      status: 'completed'
    });

    // Here you might want to notify the applicant
    // await notifyApplicant(letter);

    res.json({
      message: 'Letter approved and completed',
      letter: {
        id: letter.id,
        status: letter.status,
        completed_at: letter.updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------
// SHARED ROUTES - View Letters
// ------------------------------------------------

/**
 * @swagger
 * /api/letters:
 *   get:
 *     summary: Get all letters (filtered by user role, paginated)
 *     tags: [Letters]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of letters per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [requested, draft, in_review, completed]
 *         description: Optional filter by letter status
 *     responses:
 *       200:
 *         description: List of letters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 letters:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       status:
 *                         type: string
 *                       applicant:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           program:
 *                             type: string
 *                       referee:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           name:
 *                             type: string
 *                           institution:
 *                             type: string
 *                       template:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                       content:
 *                         type: string
 *                         nullable: true
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       completed_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Server error
 */

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    // Filter based on user role
    if (req.user.role === 'referee') {
      whereClause.referee_id = req.user.id;
    } else if (req.user.role === 'applicant') {
      // Applicants see letters they requested
      whereClause[Op.and] = [
        Sequelize.where(
          Sequelize.json('applicant_data.requester_id'),
          req.user.id
        )
      ];
    }

    if (status) {
      const statusList = status.split(',');
      whereClause.status = {
        [Op.in]: statusList
      };
    }

    const letters = await Letter.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Template,
          as: 'template',
          attributes: ['id', 'name', 'description'],
          required: false
        },
        {
          model: User,
          as: 'referee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'institution']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      letters: letters.rows.map(letter => ({
        id: letter.id,
        status: letter.status,
        applicant: {
          name: `${letter.applicant_data.firstName} ${letter.applicant_data.lastName}`,
          program: letter.applicant_data.program
        },
        referee: letter.referee ? {
          name: `${letter.referee.firstName} ${letter.referee.lastName}`,
          institution: letter.referee.institution,
          email: letter.referee.email
        } : null,
        template: letter.template,
        created_at: letter.createdAt,
        completed_at: letter.status === 'completed' ? letter.updated_at : null,
        // Only show content to referee or if completed
        // content: (req.user.role === 'referee' || letter.status === 'completed') ?
        content: letter.status === 'completed' ?
          letter.letter_content : null,
        rejection_reason: letter.status === 'rejected' ? letter.rejection_reason : null
      })),
      pagination: {
        total: letters.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(letters.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching letters:', error);
    res.status(500).json({ error: 'Failed to fetch letters' });
  }
});

/**
 * @swagger
 * /api/letters/{id}:
 *   get:
 *     summary: Get a specific letter by ID
 *     tags: [Letters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the letter to retrieve
 *     responses:
 *       200:
 *         description: Letter retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                 applicant_data:
 *                   type: object
 *                   description: Information about the applicant
 *                 referee:
 *                   type: object
 *                   description: Referee user details
 *                 template:
 *                   type: object
 *                   description: Template used for the letter
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 completed_at:
 *                   type: string
 *                   format: date-time
 *                 letter_content:
 *                   type: string
 *                   description: Full content of the letter (only visible to referee or if completed)
 *                 generation_parameters:
 *                   type: object
 *                   description: Preferences and extra context used to generate the letter
 *       403:
 *         description: Not authorized to view this letter
 *       404:
 *         description: Letter not found
 *       500:
 *         description: Server error
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const letter = await Letter.findByPk(req.params.id, {
      include: [
        {
          model: Template,
          as: 'template',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'referee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'institution']
        }
      ]
    });

    if (!letter) {
      return res.status(404).json({ error: 'Letter not found' });
    }

    // Check authorization
    const isReferee = req.user.role === 'referee' && letter.referee_id === req.user.id;
    const isApplicant = req.user.role === 'applicant' &&
      letter.applicant_data.requester_id === req.user.id;

    if (!isReferee && !isApplicant) {
      return res.status(403).json({ error: 'Not authorized to view this letter' });
    }

    // Hide content from applicant unless completed
    const response = {
      id: letter.id,
      status: letter.status,
      applicant_data: letter.applicant_data,
      referee: letter.referee,
      template: letter.template,
      created_at: letter.created_at,
      completed_at: letter.status === 'completed' ? letter.updated_at : null
    };

    if (isReferee || letter.status === 'completed') {
      response.letter_content = letter.letter_content;
      response.generation_parameters = letter.generation_parameters;
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching letter:', error);
    res.status(500).json({ error: 'Failed to fetch letter' });
  }
});

// ------------------------------------------------
// LEGACY/ADMIN ROUTES 
// ------------------------------------------------

// DELETE - for admin or cleanup
router.delete('/:id', auth, async (req, res) => {
  try {
    const letter = await Letter.findByPk(req.params.id);
    if (!letter) return res.status(404).json({ error: 'Letter not found' });

    // Check authorization
    if (req.user.role !== 'admin' && letter.referee_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await letter.destroy();
    res.json({ message: 'Letter deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;