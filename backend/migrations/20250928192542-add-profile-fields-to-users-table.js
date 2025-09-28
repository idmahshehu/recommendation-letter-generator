'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'city', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('Users', 'state', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('Users', 'university_logo_url', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'city');
    await queryInterface.removeColumn('Users', 'state');
    await queryInterface.removeColumn('Users', 'university_logo_url');
  }
};
