'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('templates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      category: {
        type: Sequelize.ENUM('academic', 'job', 'scholarship', 'general'),
        allowNull: false,
        defaultValue: 'general'
      },
      
      prompt_template: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      
      default_parameters: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {
          tone: 'formal',
          length: 'standard',
          detailLevel: 'standard'
        }
      },
      
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users', 
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      
      is_system_template: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('templates', ['category']);
    await queryInterface.addIndex('templates', ['created_by']);
    await queryInterface.addIndex('templates', ['is_system_template']);
    await queryInterface.addIndex('templates', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('templates');
  }
};