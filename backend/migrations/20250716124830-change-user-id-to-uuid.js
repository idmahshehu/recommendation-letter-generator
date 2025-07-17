'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // Temporarily drop foreign key constraints (if any) — skip if none yet
    // You could also use `CASCADE` in table drops if needed

    // Rename the existing column to keep data (optional)
    // await queryInterface.renameColumn('Users', 'id', 'old_id');

    // Drop the old `id` column
    await queryInterface.removeColumn('Users', 'id');

    // Recreate the `id` column as UUID
    await queryInterface.addColumn('Users', 'id', {
      type: Sequelize.UUID,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
      allowNull: false,
      primaryKey: true
    });

    // ✅ Re-add PRIMARY KEY constraint explicitly
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
