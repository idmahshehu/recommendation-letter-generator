const express = require('express');
const { User } = require('../models');
const { auth, authorize: roleAuth } = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const path = require('path');
// const User = db.User;

// file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/logos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `logo-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);

  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// POST /api/users/upload-signature
router.post('/upload-signature', auth, roleAuth('referee'), async (req, res) => {
  try {
    const { signature } = req.body;

    if (signature === '') {
      await User.update({ signature_url: null }, { where: { id: req.user.id } });
      return res.json({ message: 'Signature removed successfully', signature_url: null });
    }

    if (!signature) {
      return res.status(400).json({ error: 'Signature data is required' });
    }

    await User.update({ signature_url: signature }, { where: { id: req.user.id } });

    res.json({ message: 'Signature saved successfully', signature_url: signature });
  } catch (error) {
    console.error('Error saving signature:', error);
    res.status(500).json({ error: 'Failed to save signature' });
  }
});

// Upload signature as image file
router.post('/upload-signature-file',
  auth,
  roleAuth('referee'),
  upload.single('signature'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/logos/${req.file.filename}`;

      await User.update({ signature_url: fileUrl }, { where: { id: req.user.id } });

      res.json({
        message: 'Signature file uploaded successfully',
        signature_url: fileUrl
      });
    } catch (error) {
      console.error('Error uploading signature file:', error);
      res.status(500).json({ error: 'Failed to upload signature file' });
    }
  });

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
// Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'applicant'
    });

    const token = user.generateAuthToken();

    res.status(201).json({
      message: 'User created successfully',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(e => e.message)
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(400).json({ error: 'Account is deactivated' });
    }

    const token = user.generateAuthToken();

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user info
 */
// Get current user
router.get('/me', auth, async (req, res) => {
  res.json(req.user.toJSON());
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
// Logout
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Get available roles
router.get('/roles', (req, res) => {
  const availableRoles = User.rawAttributes.role.values;
  res.json(availableRoles);
});

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *               institution:
 *                 type: string
 *               department:
 *                 type: string
 *               title:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */

// Get profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'role',
        'fullname', 'institution', 'department', 'title',
        'city', 'state', 'university_logo_url', 'signature_url'
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const {
      fullname,
      institution,
      department,
      title,
      city,
      state,
    } = req.body;

    await User.update({
      fullname,
      institution,
      department,
      title,
      city,
      state,
    }, {
      where: { id: req.user.id }
    });

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'role',
        'fullname', 'institution', 'department', 'title',
        'city', 'state', 'university_logo_url', 'signature_url'
      ]
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * @swagger
 * /api/users/upload-logo:
 *   post:
 *     summary: Upload university logo
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
 */

// Upload logo
router.post('/upload-logo', auth, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate public URL
    const logoUrl = `${req.protocol}://${req.get('host')}/uploads/logos/${req.file.filename}`;

    // Save to DB
    await User.update(
      { university_logo_url: logoUrl },
      { where: { id: req.user.id } }
    );

    res.json({
      message: 'Logo uploaded successfully',
      logo_url: logoUrl
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

module.exports = router;