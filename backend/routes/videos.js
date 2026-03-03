const express     = require('express');
const router      = express.Router();
const db          = require('../config/database');
const requireAuth = require('../middleware/auth');

router.post('/session', requireAuth, async (req, res) => {
  try {
    const { title, url, session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: 'session_id is required' });
    await db.query('DELETE FROM videos WHERE session_id = ?', [session_id]);
    const [result] = await db.query(
      'INSERT INTO videos (title, url, session_id) VALUES (?, ?, ?)',
      [title || url, url, session_id]
    );
    res.status(201).json({ id: result.insertId, message: 'Video saved' });
  } catch (error) {
    console.error('Error saving session video:', error);
    res.status(500).json({ error: 'Failed to save video' });
  }
});

router.delete('/session/:sessionId', requireAuth, async (req, res) => {
  try {
    await db.query('DELETE FROM videos WHERE session_id = ?', [req.params.sessionId]);
    res.json({ message: 'Video removed' });
  } catch (error) {
    console.error('Error removing session video:', error);
    res.status(500).json({ error: 'Failed to remove video' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM videos ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const [result] = await db.query('INSERT INTO videos (title) VALUES (?)', [title]);
    
    res.status(201).json({
      id: result.insertId,
      title: title,
      message: 'Video added successfully'
    });
  } catch (error) {
    console.error('Error adding video:', error);
    res.status(500).json({ error: 'Failed to add video' });
  }
});

module.exports = router;
