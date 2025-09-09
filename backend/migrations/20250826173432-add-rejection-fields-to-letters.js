'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('letters', 'rejection_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('letters', 'rejected_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('letters', 'rejection_reason');
    await queryInterface.removeColumn('letters', 'rejected_at');
  }
};
