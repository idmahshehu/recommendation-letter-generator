const express = require('express');
const { Template, User } = require('../models');
const { auth, authorize: roleAuth } = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const { analyzeLetterStructure, extractTextFromPDF } =
    require('../utils/letterAnalyzer');
const { generateTemplateFromAnalysis } = require('../utils/templateGenerator');


const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Accept only text files and PDFs
        if (file.mimetype === 'text/plain' || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only .txt and .pdf files are allowed'));
        }
    }
});

router.post('/analyze-letter', auth, upload.single('letter'), async (req, res) => {
    console.log('CT:', req.headers['content-type']);
    console.log('has file?', !!req.file, req.file?.mimetype, req.file?.originalname); try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        let letterText;

        if (req.file.mimetype === 'text/plain') {
            letterText = req.file.buffer.toString('utf8');
        } else if (req.file.mimetype === 'application/pdf') {
            // Extract text from PDF
            letterText = await extractTextFromPDF(req.file.buffer);
        }

        // Analyze the letter structure
        const analysis = await analyzeLetterStructure(letterText);

        res.json({
            analysis,
            originalText: letterText.substring(0, 500) + '...'
        });

    } catch (error) {
        console.error('Letter analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze letter' });
    }
});


router.post('/create-from-analysis', auth, roleAuth('referee'), async (req, res) => {
    try {
        const { analysis, templateName, templateDescription } = req.body;

        if (!analysis || !templateName) {
            return res.status(400).json({ error: 'Analysis data and template name required' });
        }

        console.log('Analysis received:', analysis);
        console.log('Template name:', templateName);

        // Generate template from analysis
        const templateData = generateTemplateFromAnalysis(analysis, templateName);

        console.log('Generated template data:', templateData);

        if (!templateData.promptTemplate) {
            console.error('Generated template has no promptTemplate');
            return res.status(500).json({ error: 'Failed to generate template content' });
        }

        const template = await Template.create({
            ...templateData,
            description: templateDescription || 'Template created from letter analysis',
            createdBy: req.user.id,
            isSystemTemplate: false,
            isActive: true,
            usage_count: 0
        });

        res.json({
            message: 'Template created successfully from letter analysis',
            template: {
                id: template.id,
                name: template.name,
                category: template.category,
                description: template.description
            }
        });

        console.log(template.json());

    } catch (error) {
        console.error('Template creation error:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Get all active templates
 *     tags: [Templates]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by template category
 *       - in: query
 *         name: includeUserTemplates
 *         schema:
 *           type: boolean
 *         description: Include user-created templates
 *     responses:
 *       200:
 *         description: List of templates
 */

router.get('/', auth, async (req, res) => {
    try {
        const { category, includeUserTemplates } = req.query;

        let conditions = { isActive: true };

        if (category) {
            conditions.category = category;
        }

        let templates;

        if (includeUserTemplates === 'true') {
            // system templates and user's own templates
            const systemTemplates = await Template.findAll({
                where: { ...conditions, isSystemTemplate: true },
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'firstName', 'lastName', 'email']
                    }
                ]
            });

            const userTemplates = await Template.findAll({
                where: { ...conditions, createdBy: req.user.id },
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'firstName', 'lastName', 'email']
                    }
                ]
            });

            // Combine and remove duplicates
            templates = [...systemTemplates, ...userTemplates];
        } else {
            // system templates (default)
            templates = await Template.findAll({
                where: { ...conditions, isSystemTemplate: true },
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'firstName', 'lastName', 'email']
                    }
                ]
            });
        }
        res.json({ templates });
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});
/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     summary: Get a specific template by ID
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template details
 *       404:
 *         description: Template not found
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findOne({
            where: {
                id: req.params.id,
                isActive: true
            },
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ]
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json({ template });
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});
/**
 * @swagger
 * /api/templates:
 *   post:
 *     summary: Create a new template (referee only)
 *     tags: [Templates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Template'
 *     responses:
 *       201:
 *         description: Template created
 *       400:
 *         description: Validation error
 */
router.post('/', auth, roleAuth('referee'), async (req, res) => {
    console.log('REQ.USER:', req.user);
    try {
        const {
            name,
            description,
            category,
            promptTemplate,
            defaultParameters
        } = req.body;

        // Validation
        if (!name || !promptTemplate) {
            return res.status(400).json({
                error: 'Name and prompt template are required'
            });
        }

        const template = await Template.create({
            name,
            description,
            category: category || 'general',
            promptTemplate,
            defaultParameters: defaultParameters || {
                tone: 'formal',
                length: 'standard',
                detailLevel: 'standard'
            },
            createdBy: req.user.id,
            isSystemTemplate: false,
            isActive: true
        });

        // Return template with creator info
        const createdTemplate = await Template.findByPk(template.id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ]
        });

        res.status(201).json(createdTemplate);
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});



/**
 * @swagger
 * /api/templates/{id}:
 *   put:
 *     summary: Update a template (creator only)
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Template'
 *     responses:
 *       200:
 *         description: Template updated
 *       404:
 *         description: Template not found
 *       403:
 *         description: Forbidden
 */
router.put('/:id', auth, roleAuth('referee'), async (req, res) => {
    try {
        const template = await Template.findByPk(req.params.id);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        if (template.createdBy !== req.user.id) {
            return res.status(403).json({ error: 'You can only edit your own templates' });
        }

        if (template.isSystemTemplate) {
            return res.status(403).json({ error: 'System templates cannot be edited' });
        }

        const {
            name,
            description,
            category,
            promptTemplate,
            defaultParameters
        } = req.body;

        await template.update({
            name: name || template.name,
            description: description !== undefined ? description : template.description,
            category: category || template.category,
            promptTemplate: promptTemplate || template.promptTemplate,
            defaultParameters: defaultParameters || template.defaultParameters
        });

        // Return updated template with creator info
        const updatedTemplate = await Template.findByPk(template.id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ]
        });

        res.json(updatedTemplate);
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     summary: Soft delete a template (creator only)
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted
 *       404:
 *         description: Template not found
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', auth, roleAuth('referee'), async (req, res) => {
    try {
        const template = await Template.findByPk(req.params.id);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        if (template.createdBy !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own templates' });
        }

        if (template.isSystemTemplate) {
            return res.status(403).json({ error: 'System templates cannot be deleted' });
        }

        // Soft delete
        await template.update({ isActive: false });

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

module.exports = router;