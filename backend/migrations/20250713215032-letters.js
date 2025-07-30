'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('letters', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      referee_id: {
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      applicant_data: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      letter_content: {
        type: Sequelize.TEXT
      },
      current_version_id: {
        type: Sequelize.UUID
      },
      template_id: {
        type: Sequelize.UUID,
        references: {
          model: 'templates',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      generation_parameters: {
        type: Sequelize.JSONB
      },
      model_used: {
        type: Sequelize.STRING(50)
      },
      generation_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'draft'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('letters');
  }
};
