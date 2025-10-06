'use strict';
/**
 * @swagger
 * components:
 *   schemas:
 *     Letter:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         referee_id:
 *           type: string
 *           format: uuid
 *         applicant_data:
 *           type: object
 *         letter_content:
 *           type: string
 *         current_version_id:
 *           type: string
 *           format: uuid
 *         template_id:
 *           type: string
 *           format: uuid
 *         generation_parameters:
 *           type: object
 *         model_used:
 *           type: string
 *         selected_model:
 *           type: string
 *         generation_attempts:
 *           type: integer
 *         status:
 *           type: string
 *         letter_history:
 *           type: array
 *         current_version:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */
module.exports = (sequelize, DataTypes) => {
    const Letter = sequelize.define('Letter', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        referee_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        applicant_data: {
            type: DataTypes.JSONB,
            allowNull: false
        },
        letter_content: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        rejection_reason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        rejected_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        current_version_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        template_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'Templates',
                key: 'id'
            }
        },
        generation_parameters: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        model_used: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        selected_model: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        letter_history: {
            type: DataTypes.JSON,
            allowNull: true
        },
        current_version: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            allowNull: true
        },
        generation_attempts: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'draft'
        },
        include_signature: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        signature_url: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'letters',
        timestamps: true,
        underscored: true
    });

    // Define associations
    Letter.associate = (models) => {
        Letter.belongsTo(models.User, { foreignKey: 'referee_id', as: 'referee' });
        Letter.belongsTo(models.Template, { foreignKey: 'template_id', as: 'template' });
    };

    return Letter;
};