require('dotenv').config();
const express = require('express');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const { auth, authorize } = require('./middleware/auth');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'API is running!' });
});

// Protected routes examples
app.get('/api/referee-only', auth, authorize('referee'), (req, res) => {
  res.json({ message: 'This is a referee-only endpoint' });
});

app.get('/api/applicant-only', auth, authorize('applicant'), (req, res) => {
  res.json({ message: 'This is an applicant-only endpoint' });
});

app.get('/api/protected', auth, (req, res) => {
  res.json({ 
    message: 'This is a protected endpoint', 
    user: req.user.toJSON() 
  });
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// routes 
const letterRoutes = require('./routes/letters');
app.use('/api/letters', letterRoutes);


const templateRoutes = require('./routes/template');
app.use('/api/templates', templateRoutes); 

module.exports = app;