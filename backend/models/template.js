'use strict';

/**
 * @swagger
 * components:
 *   schemas:
 *     Template:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [academic, job, scholarship, general]
 *         promptTemplate:
 *           type: string
 *         defaultParameters:
 *           type: object
 *         createdBy:
 *           type: string
 *           format: uuid
 *         isSystemTemplate:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         usageCount:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
module.exports = (sequelize, DataTypes) => {

    const Template = sequelize.define('Template', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [1, 100]
            }
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        // categorization
        category: {
            type: DataTypes.ENUM('academic', 'job', 'scholarship', 'general'),
            allowNull: false,
            defaultValue: 'general'
        },

        // The actual prompt template
        promptTemplate: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: 'prompt_template'
        },

        defaultParameters: {
            type: DataTypes.JSONB,
            allowNull: true,
            defaultValue: {
                tone: 'formal',
                length: 'standard',
                detailLevel: 'standard'
            },
            field: 'default_parameters'
        },

        // Ownership and access
        createdBy: {
            type: DataTypes.UUID,
            allowNull: true, // null = system template
            references: {
                model: 'Users',
                key: 'id'
            },
            field: 'created_by'
        },

        isSystemTemplate: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_system_template'
        },

        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            field: 'is_active'
        },

        usageCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            field: 'usage_count'
        }
    }, {
        tableName: 'templates',
        timestamps: true,
        underscored: true,

        indexes: [
            {
                fields: ['category']
            },
            {
                fields: ['created_by']
            },
            {
                fields: ['is_system_template']
            },
            {
                fields: ['is_active']
            }
        ]
    });

    Template.associate = (models) => {
        // Template belongs to User (creator)
        Template.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });

        // Template has many Letters (optional)
        Template.hasMany(models.Letter, { foreignKey: 'template_id', as: 'templateLetters' });
    };

    return Template;
};