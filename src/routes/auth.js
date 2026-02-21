const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db/pool');
const { authMiddleware, signToken } = require('../middleware/auth');

const router = express.Router();

// ─── POST /auth/register ──────────────────────────────────────
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
    const existing = await query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2 LIMIT 1',
      [email.toLowerCase().trim(), phone.trim()]
    );
    if (existing.rowCount > 0) {
      return res.status(409).json({ success: false, message: 'Email or phone already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (full_name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, phone`,
      [fullName.trim(), email.toLowerCase().trim(), phone.trim(), passwordHash]
    );

    const user = result.rows[0];
    const token = signToken(user.id);

    return res.status(201).json({
      success: true,
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── POST /auth/login ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, message: 'Email/phone and password required' });
    }

    const val = emailOrPhone.toLowerCase().trim();
    const result = await query(
      'SELECT * FROM users WHERE email = $1 OR phone = $1 LIMIT 1',
      [val]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken(user.id);
    return res.json({
      success: true,
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, full_name, email, phone FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const u = result.rows[0];
    return res.json({
      success: true,
      user: { id: u.id, fullName: u.full_name, email: u.email, phone: u.phone },
    });
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── PUT /auth/password ───────────────────────────────────────
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.userId]);

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ─── POST /auth/forgot-password ───────────────────────────────
router.post('/forgot-password', (req, res) => {
  const { emailOrPhone } = req.body;
  if (!emailOrPhone) {
    return res.status(400).json({ success: false, message: 'Email or phone required' });
  }
  // MVP: always success to prevent user enumeration
  // TODO: integrate email provider (SendGrid / Resend)
  return res.json({ success: true, message: 'If the account exists, a reset link has been sent.' });
});

module.exports = router;
