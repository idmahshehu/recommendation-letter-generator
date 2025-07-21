const app = require('./app');
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

// Add CORS middleware BEFORE your routes
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    app.use(cors({
      origin: 'http://localhost:3000', // Your frontend URL
      credentials: true // If you're using cookies/sessions
    }));

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    // app.get('/api/hello', (req, res) => {
    //   res.json({ message: 'Hello from backend!' });
    // });

  } catch (error) {
    console.error('Unable to connect to database:', error);
    process.exit(1);
  }
}

startServer();