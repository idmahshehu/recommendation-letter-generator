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
 *         generation_attempts:
 *           type: integer
 *         status:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
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
            allowNull: true
        },
        applicant_data: {
            type: DataTypes.JSONB,
            allowNull: false
        },
        letter_content: {
            type: DataTypes.TEXT
        },
        current_version_id: {
            type: DataTypes.UUID
        },
        template_id: {
            type: DataTypes.UUID
        },
        generation_parameters: {
            type: DataTypes.JSONB
        },
        model_used: {
            type: DataTypes.STRING(50)
        },
        generation_attempts: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'draft'
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('NOW()')
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('NOW()')
        }
    }, {
        tableName: 'letters',
        timestamps: false
    });

    return Letter;
};
