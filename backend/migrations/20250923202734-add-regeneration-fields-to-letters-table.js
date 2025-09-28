'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('letters', 'letter_history', {
      type: Sequelize.JSON,
      allowNull: true, 
    });

    await queryInterface.addColumn('letters', 'current_version', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
    });

    await queryInterface.addColumn('letters', 'generation_settings', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('letters', 'letter_history');
    await queryInterface.removeColumn('letters', 'current_version');
    await queryInterface.removeColumn('letters', 'generation_settings');
  }
};
