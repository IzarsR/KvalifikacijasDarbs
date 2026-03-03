const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'playlytic_secret_change_in_production';
const SALT_ROUNDS = 12;

function checkPasswordStrength(password) {
  const errors = [];
  if (password.length < 8)              errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password))          errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password))          errors.push('At least one lowercase letter');
  if (!/[0-9]/.test(password))          errors.push('At least one number');
  if (!/[^A-Za-z0-9]/.test(password))   errors.push('At least one special character (!@#$%...)');
  return errors;
}

router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required.' });
  }

  const weaknesses = checkPasswordStrength(password);
  if (weaknesses.length > 0) {
    return res.status(400).json({ error: 'Password is too weak.', rules: weaknesses });
  }

  try {
    const [[existing]] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [email, username]
    );
    if (existing) {
      return res.status(409).json({ error: 'Username or email is already taken.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, password_hash]
    );

    const token = jwt.sign(
      { userId: result.insertId, username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ message: 'Account created successfully.', token, username });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const [[user]] = await db.query(
      'SELECT id, username, password_hash FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

module.exports = router;