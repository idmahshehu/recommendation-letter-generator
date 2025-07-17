'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'temp_password' // Temporary default
    });

    await queryInterface.addColumn('Users', 'role', {
      type: Sequelize.ENUM('referee', 'applicant'),
      allowNull: false,
      defaultValue: 'applicant'
    });

    await queryInterface.addColumn('Users', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });

    await queryInterface.addColumn('Users', 'institution', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'department', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'title', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });


    await queryInterface.addColumn('Users', 'isEmailVerified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('Users', 'resetPasswordToken', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'resetPasswordExpires', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Make email unique
    await queryInterface.addConstraint('Users', {
      fields: ['email'],
      type: 'unique',
      name: 'unique_email_constraint'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'password');
    await queryInterface.removeColumn('Users', 'role');
    await queryInterface.removeColumn('Users', 'isActive');
    await queryInterface.removeColumn('Users', 'institution');
    await queryInterface.removeColumn('Users', 'department');
    await queryInterface.removeColumn('Users', 'title');
    await queryInterface.removeColumn('Users', 'isEmailVerified');
    await queryInterface.removeColumn('Users', 'resetPasswordToken');
    await queryInterface.removeColumn('Users', 'resetPasswordExpires');
    await queryInterface.removeConstraint('Users', 'unique_email_constraint');
  }
};
