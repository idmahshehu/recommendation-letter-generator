const express = require('express');
const { Letter } = require('../models');
const { auth, authorize: roleAuth } = require('../middleware/auth');
const router = express.Router();


/**
 * @swagger
 * /api/letters:
 *   post:
 *     summary: Create a new letter (referee only)
 *     tags: [Letters]
 *     responses:
 *       201:
 *         description: Letter created
 */

// CREATE
router.post('/', auth, async (req, res) => {
  try {
    const letter = await Letter.create({
      referee_id: req.user.id,
      applicant_data: req.body.applicant_data,
      template_id: req.body.template_id,
      generation_parameters: req.body.generation_parameters
    });
    res.status(201).json(letter);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/letters/request:
 *   post:
 *     summary: Request a recommendation letter (applicant only)
 *     tags: [Letters]
 *     responses:
 *       201:
 *         description: Letter request created
 */
router.post('/request', auth, roleAuth('applicant'), async (req, res) => {
  try {
    const letter = await Letter.create({
      applicant_data: req.body.applicant_data,
      referee_id: req.body.referee_id, // Optional: You can assign or leave null
      status: 'requested'
    });
    res.status(201).json(letter);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
 *     responses:
 *       200:
 *         description: Letter details
 */
// READ ONE /api/letters
router.get('/:id', auth, async (req, res) => {
  const letter = await Letter.findByPk(req.params.id);
  if (!letter) return res.status(404).json({ error: 'Letter not found' });
  res.json(letter);
});
/**
 * @swagger
 * /api/letters:
 *   get:
 *     summary: Get all letters for the authenticated referee
 *     tags: [Letters]
 *     responses:
 *       200:
 *         description: List of letters
 */
// READ ALL /api/letters
router.get('/', auth, async (req, res) => {
  const letters = await Letter.findAll({
    where: { referee_id: req.user.id }
  });
  res.json(letters);
});

// UPDATE
// router.put('/:id', auth, async (req, res) => {
//   const letter = await Letter.findByPk(req.params.id);
//   if (!letter) return res.status(404).json({ error: 'Not found' });
//   await letter.update(req.body);
//   res.json(letter);
// });

/**
 * @swagger
 * /api/letters/{id}:
 *   put:
 *     summary: Update a letter (referee only)
 *     tags: [Letters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Letter updated
 */
router.put('/:id', auth, roleAuth('referee'), async (req, res) => {
  try {
    const letter = await Letter.findByPk(req.params.id);
    if (!letter) return res.status(404).json({ error: 'Not found' });

    await letter.update(req.body); // Only allow safe fields
    res.json(letter);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/letters/{id}:
 *   delete:
 *     summary: Delete a letter (referee only)
 *     tags: [Letters]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Letter deleted
 */
// DELETE
router.delete('/:id', auth, async (req, res) => {
  const letter = await Letter.findByPk(req.params.id);
  if (!letter) return res.status(404).json({ error: 'Not found' });
  await letter.destroy();
  res.json({ message: 'Deleted' });
});

// POST /api/letters/generate
// router.post('/generate', auth, roleAuth('referee'), async (req, res) => {
//   try {
//     const { letterId, prompt } = req.body;

//     // mock OpenAI generation (replace later)
//     const generatedText = `Generated letter using prompt: ${prompt}`;

//     const letter = await Letter.findByPk(letterId);
//     if (!letter) return res.status(404).json({ error: 'Letter not found' });

//     await letter.update({
//       letter_content: generatedText,
//       model_used: 'gpt-4',
//       status: 'generated',
//       generation_attempts: letter.generation_attempts + 1
//     });

//     res.json(letter);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

module.exports = router;




/*
const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const rateLimit = require('express-rate-limit');
const { Letter, User, Template, GenerationLog } = require('../models');
const aiService = require('../services/aiService');
const pdfService = require('../services/pdfService');
const { Op } = require('sequelize');

// Rate limiting for letter generation
const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 letters per hour per user
  message: {
    error: 'Too many letter generation requests. Please try again later.'
  }
});

// Rate limiting for letter requests
const requestLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 requests per day per user
  message: {
    error: 'Too many recommendation requests. Please try again tomorrow.'
  }
});

// Validation middleware
const validateLetterGeneration = [
  body('applicantData.firstName').notEmpty().withMessage('First name is required'),
  body('applicantData.lastName').notEmpty().withMessage('Last name is required'),
  body('applicantData.email').isEmail().withMessage('Valid email is required'),
  body('applicantData.institution').notEmpty().withMessage('Institution is required'),
  body('applicantData.program').notEmpty().withMessage('Program is required'),
  body('letterConfig.purpose').isIn(['academic', 'job', 'scholarship', 'graduate']).withMessage('Valid purpose is required'),
  body('letterConfig.tone').isIn(['formal', 'enthusiastic', 'balanced']).withMessage('Valid tone is required'),
  body('letterConfig.length').isIn(['short', 'medium', 'long']).withMessage('Valid length is required'),
  body('templateId').isUUID().withMessage('Valid template ID is required'),
  body('refereeNotes').optional().isLength({ max: 1000 }).withMessage('Referee notes too long')
];

const validateLetterRequest = [
  body('professorEmail').isEmail().withMessage('Valid professor email is required'),
  body('applicantData.firstName').notEmpty().withMessage('First name is required'),
  body('applicantData.lastName').notEmpty().withMessage('Last name is required'),
  body('applicantData.email').isEmail().withMessage('Valid email is required'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message too long'),
  body('deadline').optional().isISO8601().withMessage('Valid deadline date required')
];

// GET /api/letters - Get user's letters
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    
    if (req.user.role === 'referee') {
      whereClause.refereeId = req.user.id;
    } else {
      whereClause['$applicantData.email$'] = req.user.email;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { '$applicantData.firstName$': { [Op.iLike]: `%${search}%` } },
        { '$applicantData.lastName$': { [Op.iLike]: `%${search}%` } },
        { '$applicantData.program$': { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const letters = await Letter.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'referee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'institution']
        },
        {
          model: Template,
          attributes: ['id', 'name', 'description']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });
    
    res.json({
      letters: letters.rows,
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

// GET /api/letters/drafts - Get user's draft letters
router.get('/drafts', auth, roleAuth(['referee']), async (req, res) => {
  try {
    const drafts = await Letter.findAll({
      where: {
        refereeId: req.user.id,
        status: 'draft'
      },
      include: [
        {
          model: Template,
          attributes: ['id', 'name', 'description']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });
    
    res.json(drafts);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

// GET /api/letters/:id - Get specific letter
router.get('/:id', auth, [
  param('id').isUUID().withMessage('Valid letter ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const letter = await Letter.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'referee',
          attributes: ['id', 'firstName', 'lastName', 'email', 'institution', 'department']
        },
        {
          model: Template,
          attributes: ['id', 'name', 'description', 'templateHtml']
        }
      ]
    });
    
    if (!letter) {
      return res.status(404).json({ error: 'Letter not found' });
    }
    
    // Check access permissions
    const hasAccess = 
      req.user.role === 'referee' && letter.refereeId === req.user.id ||
      req.user.role === 'applicant' && letter.applicantData.email === req.user.email;
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(letter);
  } catch (error) {
    console.error('Error fetching letter:', error);
    res.status(500).json({ error: 'Failed to fetch letter' });
  }
});

// POST /api/letters/request - Request recommendation letter (applicant)
router.post('/request', auth, roleAuth(['applicant']), requestLimiter, validateLetterRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { professorEmail, applicantData, message, deadline } = req.body;
    
    // Find professor
    const professor = await User.findOne({
      where: { email: professorEmail, role: 'referee' }
    });
    
    if (!professor) {
      return res.status(404).json({ error: 'Professor not found or not verified' });
    }
    
    // Check if request already exists
    const existingRequest = await Letter.findOne({
      where: {
        refereeId: professor.id,
        'applicantData.email': applicantData.email,
        status: 'requested'
      }
    });
    
    if (existingRequest) {
      return res.status(400).json({ error: 'Request already exists' });
    }
    
    // Create letter request
    const letterRequest = await Letter.create({
      refereeId: professor.id,
      applicantData: {
        ...applicantData,
        requestMessage: message,
        requesterUserId: req.user.id
      },
      status: 'requested',
      deadline: deadline || null,
      letterConfig: {
        purpose: 'academic',
        tone: 'formal',
        length: 'medium'
      }
    });
    
    // TODO: Send email notification to professor
    // await emailService.sendRecommendationRequest(professor.email, letterRequest);
    
    res.status(201).json({
      message: 'Recommendation request sent successfully',
      letterRequest
    });
  } catch (error) {
    console.error('Error creating letter request:', error);
    res.status(500).json({ error: 'Failed to create letter request' });
  }
});

// POST /api/letters/generate - Generate recommendation letter (referee)
router.post('/generate', auth, roleAuth(['referee']), generateLimiter, validateLetterGeneration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { applicantData, letterConfig, templateId, refereeNotes, letterId } = req.body;
    
    // Get template
    const template = await Template.findByPk(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Get referee info
    const referee = await User.findByPk(req.user.id, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'institution', 'department', 'title']
    });
    
    // Generate letter using AI service
    const generationResult = await aiService.generateRecommendationLetter({
      applicantData,
      refereeData: referee,
      letterConfig,
      template,
      refereeNotes
    });
    
    let letter;
    
    if (letterId) {
      // Update existing letter
      letter = await Letter.findByPk(letterId);
      if (!letter || letter.refereeId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      letter.letterContent = generationResult.content;
      letter.status = 'draft';
      letter.updatedAt = new Date();
      await letter.save();
    } else {
      // Create new letter
      letter = await Letter.create({
        refereeId: req.user.id,
        applicantData,
        letterContent: generationResult.content,
        letterConfig,
        templateId,
        status: 'draft'
      });
    }
    
    // Log generation for analytics
    await GenerationLog.create({
      letterId: letter.id,
      promptUsed: generationResult.prompt,
      aiResponse: generationResult.rawResponse,
      tokensUsed: generationResult.tokensUsed,
      processingTime: generationResult.processingTime
    });
    
    res.json({
      message: 'Letter generated successfully',
      letter: {
        id: letter.id,
        content: letter.letterContent,
        status: letter.status,
        createdAt: letter.createdAt,
        updatedAt: letter.updatedAt
      }
    });
  } catch (error) {
    console.error('Error generating letter:', error);
    res.status(500).json({ error: 'Failed to generate letter' });
  }
});

// PUT /api/letters/:id - Update letter content
router.put('/:id', auth, roleAuth(['referee']), [
  param('id').isUUID().withMessage('Valid letter ID is required'),
  body('letterContent').notEmpty().withMessage('Letter content is required'),
  body('status').optional().isIn(['draft', 'completed']).withMessage('Valid status required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const letter = await Letter.findByPk(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ error: 'Letter not found' });
    }
    
    if (letter.refereeId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { letterContent, status } = req.body;
    
    letter.letterContent = letterContent;
    if (status) letter.status = status;
    letter.updatedAt = new Date();
    
    await letter.save();
    
    res.json({
      message: 'Letter updated successfully',
      letter
    });
  } catch (error) {
    console.error('Error updating letter:', error);
    res.status(500).json({ error: 'Failed to update letter' });
  }
});

// POST /api/letters/:id/export - Export letter to PDF
router.post('/:id/export', auth, [
  param('id').isUUID().withMessage('Valid letter ID is required'),
  body('format').optional().isIn(['pdf', 'docx']).withMessage('Valid format required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const letter = await Letter.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'referee',
          attributes: ['firstName', 'lastName', 'title', 'institution', 'department']
        },
        {
          model: Template,
          attributes: ['name', 'templateHtml']
        }
      ]
    });
    
    if (!letter) {
      return res.status(404).json({ error: 'Letter not found' });
    }
    
    // Check access permissions
    const hasAccess = 
      req.user.role === 'referee' && letter.refereeId === req.user.id ||
      req.user.role === 'applicant' && letter.applicantData.email === req.user.email;
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (letter.status !== 'completed') {
      return res.status(400).json({ error: 'Letter must be completed before export' });
    }
    
    const format = req.body.format || 'pdf';
    
    // Generate PDF
    const pdfBuffer = await pdfService.generatePDF({
      letterContent: letter.letterContent,
      applicantData: letter.applicantData,
      refereeData: letter.referee,
      template: letter.Template,
      format
    });
    
    const filename = `recommendation_letter_${letter.applicantData.firstName}_${letter.applicantData.lastName}.${format}`;
    
    res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error exporting letter:', error);
    res.status(500).json({ error: 'Failed to export letter' });
  }
});

// DELETE /api/letters/:id - Delete letter
router.delete('/:id', auth, roleAuth(['referee']), [
  param('id').isUUID().withMessage('Valid letter ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const letter = await Letter.findByPk(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ error: 'Letter not found' });
    }
    
    if (letter.refereeId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await letter.destroy();
    
    res.json({ message: 'Letter deleted successfully' });
  } catch (error) {
    console.error('Error deleting letter:', error);
    res.status(500).json({ error: 'Failed to delete letter' });
  }
});

// POST /api/letters/:id/approve - Approve letter request
router.post('/:id/approve', auth, roleAuth(['referee']), [
  param('id').isUUID().withMessage('Valid letter ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const letter = await Letter.findByPk(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ error: 'Letter not found' });
    }
    
    if (letter.refereeId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (letter.status !== 'requested') {
      return res.status(400).json({ error: 'Letter is not in requested status' });
    }
    
    letter.status = 'approved';
    letter.updatedAt = new Date();
    await letter.save();
    
    // TODO: Send email notification to applicant
    // await emailService.sendApprovalNotification(letter.applicantData.email, letter);
    
    res.json({
      message: 'Letter request approved successfully',
      letter
    });
  } catch (error) {
    console.error('Error approving letter:', error);
    res.status(500).json({ error: 'Failed to approve letter' });
  }
});

// POST /api/letters/:id/reject - Reject letter request
router.post('/:id/reject', auth, roleAuth(['referee']), [
  param('id').isUUID().withMessage('Valid letter ID is required'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const letter = await Letter.findByPk(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ error: 'Letter not found' });
    }
    
    if (letter.refereeId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (letter.status !== 'requested') {
      return res.status(400).json({ error: 'Letter is not in requested status' });
    }
    
    letter.status = 'rejected';
    letter.rejectionReason = req.body.reason || null;
    letter.updatedAt = new Date();
    await letter.save();
    
    // TODO: Send email notification to applicant
    // await emailService.sendRejectionNotification(letter.applicantData.email, letter);
    
    res.json({
      message: 'Letter request rejected',
      letter
    });
  } catch (error) {
    console.error('Error rejecting letter:', error);
    res.status(500).json({ error: 'Failed to reject letter' });
  }
});

// GET /api/letters/analytics/stats - Get letter statistics (referee)
router.get('/analytics/stats', auth, roleAuth(['referee']), async (req, res) => {
  try {
    const stats = await Letter.findAll({
      where: { refereeId: req.user.id },
      attributes: [
        'status',
        [Letter.sequelize.fn('COUNT', Letter.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
    
    const totalLetters = await Letter.count({
      where: { refereeId: req.user.id }
    });
    
    const completedLetters = await Letter.count({
      where: { 
        refereeId: req.user.id,
        status: 'completed'
      }
    });
    
    res.json({
      totalLetters,
      completedLetters,
      completionRate: totalLetters > 0 ? (completedLetters / totalLetters * 100).toFixed(1) : 0,
      statusBreakdown: stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.get('count'));
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching letter stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
*/