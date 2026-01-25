'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await queryInterface.removeColumn('Users', 'id');

    await queryInterface.addColumn('Users', 'id', {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
      allowNull: false,
      primaryKey: true
    });

    await queryInterface.sequelize.query(`
    ALTER TABLE "Users" ADD PRIMARY KEY ("id");
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'id');

    await queryInterface.addColumn('Users', 'id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    });
  }
};
