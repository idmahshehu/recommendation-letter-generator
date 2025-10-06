'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'signature_url', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
      after: 'university_logo_url' 
    });

    await queryInterface.addColumn('letters', 'include_signature', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      after: 'status'
    });

    await queryInterface.addColumn('letters', 'signature_url', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
      after: 'include_signature'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'signature_url');

    await queryInterface.removeColumn('letters', 'include_signature');
    await queryInterface.removeColumn('letters', 'signature_url');
  }
};
