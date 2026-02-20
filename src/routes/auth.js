const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getUserByEmail, getUserByPhone, getUserById, saveUser } = require('../utils/fileStore');
const { authMiddleware, signToken } = require('../middleware/auth');

const router = express.Router();

// ─── POST /auth/register ──────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check duplicates
    if (getUserByEmail(email)) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    if (getUserByPhone(phone)) {
      return res.status(409).json({ success: false, message: 'Phone already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      fullName,
      email,
      phone,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    saveUser(user);
    const token = signToken(user.id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, message: 'Email/phone and password required' });
    }

    const user = getUserByEmail(emailOrPhone) || getUserByPhone(emailOrPhone);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user.id);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  const user = getUserById(req.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  return res.json({
    success: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
    },
  });
});

// ─── PUT /auth/password ───────────────────────────────────────────────────────
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = getUserById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    saveUser(user);

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────
// In prod this sends an email. For MVP it just acknowledges.
router.post('/forgot-password', (req, res) => {
  const { emailOrPhone } = req.body;
  if (!emailOrPhone) {
    return res.status(400).json({ success: false, message: 'Email or phone required' });
  }
  // Always return success to avoid user enumeration
  return res.json({ success: true, message: 'If the account exists, a reset link has been sent.' });
});

module.exports = router;
