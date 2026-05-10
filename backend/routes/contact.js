const express = require('express');

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim();
  const message = String(req.body?.message || '').trim();

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }

  if (name.length > 100 || email.length > 255 || message.length > 2000) {
    return res.status(400).json({ error: 'Contact form values are too long.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  console.log('Contact form submission:', {
    name,
    email,
    message,
    submittedAt: new Date().toISOString(),
  });

  return res.status(201).json({
    message: 'Thanks for reaching out! We\'ll get back to you soon.',
  });
});

module.exports = router;