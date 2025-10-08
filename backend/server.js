const app = require('./app');
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;
const FRONTENDURL = process.env.FRONTENDURL;

// CORS middleware
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    app.use(cors({
      origin: FRONTENDURL, // frontend URL
      credentials: true
    }));

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });


  } catch (error) {
    console.error('Unable to connect to database:', error);
    process.exit(1);
  }
}

startServer();