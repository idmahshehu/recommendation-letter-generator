const express = require('express');
const { Template, User } = require('../models');
const { auth, authorize: roleAuth } = require('../middleware/auth');
const router = express.Router();

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

// GET /api/templates - Get all active templates
router.get('/', auth, async (req, res) => {
    try {
        const { category, includeUserTemplates } = req.query;

        let conditions = { is_active: true };

        // Filter by category if provided
        if (category) {
            conditions.category = category;
        }

        let templates;

        if (includeUserTemplates === 'true') {
            // Get system templates and user's own templates separately, then combine
            const systemTemplates = await Template.findAll({
                where: { ...conditions, is_system_template: true },
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'firstName', 'lastName', 'email'] 
                    }
                ]
            });

            const userTemplates = await Template.findAll({
                where: { ...conditions, created_by: req.user.id },
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'firstName', 'lastName', 'email'] 
                    }
                ]
            });

            // Combine and remove duplicates (if any)
            templates = [...systemTemplates, ...userTemplates];
        } else {
            // Show only system templates (default)
            templates = await Template.findAll({
                where: { ...conditions, is_system_template: true },
                include: [
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'firstName', 'lastName', 'email'] 
                    }
                ]
            });
        }

        // Sort by usage count and creation date
        // templates.sort((a, b) => {
        //     if (b.usage_count !== a.usage_count) {
        //         return b.usage_count - a.usage_count;
        //     }
        //     return new Date(a.createdAt) - new Date(b.createdAt);
        // });

        res.json(templates);
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
// GET /api/templates/:id - Get specific template
router.get('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findOne({
            where: {
                id: req.params.id,
                is_active: true
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

        // Check if user can access this template
        if (!template.is_system_template && template.created_by !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(template);
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
// POST /api/templates - Create new template (referee only)
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
            created_by: req.user.id,
            is_system_template: false,
            is_active: true
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
// PUT /api/templates/:id - Update template (creator only)
router.put('/:id', auth, roleAuth('referee'), async (req, res) => {
    try {
        const template = await Template.findByPk(req.params.id);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Check if user owns this template
        if (template.created_by !== req.user.id) {
            return res.status(403).json({ error: 'You can only edit your own templates' });
        }

        // System templates cannot be edited
        if (template.is_system_template) {
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
// DELETE /api/templates/:id - Soft delete template (creator only)
router.delete('/:id', auth, roleAuth('referee'), async (req, res) => {
    try {
        const template = await Template.findByPk(req.params.id);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Check if user owns this template
        if (template.created_by !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own templates' });
        }

        // System templates cannot be deleted
        if (template.is_system_template) {
            return res.status(403).json({ error: 'System templates cannot be deleted' });
        }

        // Soft delete
        await template.update({ is_active: false });

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});


// POST /api/templates/:id/use - Increment usage count (when template is used)
// router.post('/:id/use', auth, async (req, res) => {
//   try {
//     const template = await Template.findOne({
//       where: { 
//         id: req.params.id,
//         is_active: true
//       }
//     });

//     if (!template) {
//       return res.status(404).json({ error: 'Template not found' });
//     }

//     // Increment usage count
//     await template.increment('usage_count');

//     res.json({ message: 'Usage count updated' });
//   } catch (error) {
//     console.error('Error updating usage count:', error);
//     res.status(500).json({ error: 'Failed to update usage count' });
//   }
// });

module.exports = router;