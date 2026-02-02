const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all videos
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM videos ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// POST new video
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
