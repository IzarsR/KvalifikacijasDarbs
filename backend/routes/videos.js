const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();
const db = require('../config/database');
const requireAuth = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const baseName = path.basename(file.originalname, path.extname(file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'video';
    const ext = (path.extname(file.originalname || '') || '.mp4').toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${baseName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('video/')) {
      cb(new Error('Only video files are allowed.'));
      return;
    }
    cb(null, true);
  },
});

function uploadVideoMiddleware(req, res, next) {
  upload.single('video')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    res.status(400).json({ error: error.message || 'Video upload failed.' });
  });
}

let schemaReady = false;

async function addColumnIfMissing(statement) {
  try {
    await db.query(statement);
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') throw error;
  }
}

async function addIndexIfMissing(statement) {
  try {
    await db.query(statement);
  } catch (error) {
    if (error.code !== 'ER_DUP_KEYNAME') throw error;
  }
}

async function ensureSchema() {
  if (schemaReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS videos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      session_id VARCHAR(255) NULL,
      title VARCHAR(255) NOT NULL,
      url TEXT NULL,
      source_type VARCHAR(30) NOT NULL DEFAULT 'url',
      original_filename VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing('ALTER TABLE videos ADD COLUMN user_id INT NULL');
  await addColumnIfMissing('ALTER TABLE videos ADD COLUMN session_id VARCHAR(255) NULL');
  await addColumnIfMissing('ALTER TABLE videos ADD COLUMN url TEXT NULL');
  await addColumnIfMissing("ALTER TABLE videos ADD COLUMN source_type VARCHAR(30) NOT NULL DEFAULT 'url'");
  await addColumnIfMissing('ALTER TABLE videos ADD COLUMN original_filename VARCHAR(255) NULL');
  await addColumnIfMissing('ALTER TABLE videos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  await addIndexIfMissing('CREATE INDEX idx_videos_session_user ON videos (session_id, user_id)');

  await db.query(`
    CREATE TABLE IF NOT EXISTS clips (
      id INT AUTO_INCREMENT PRIMARY KEY,
      video_id INT NULL,
      user_id INT NULL,
      session_id VARCHAR(255) NOT NULL,
      label VARCHAR(255) NOT NULL,
      start_time DECIMAL(10,3) NOT NULL,
      end_time DECIMAL(10,3) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addIndexIfMissing('CREATE INDEX idx_clips_session_user ON clips (session_id, user_id)');
  await addIndexIfMissing('CREATE INDEX idx_clips_video ON clips (video_id)');

  schemaReady = true;
}

function toUploadPath(url) {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url);
    const decoded = decodeURIComponent(parsed.pathname || '');
    if (!decoded.startsWith('/uploads/')) return null;
    return path.join(uploadsDir, path.basename(decoded));
  } catch {
    if (!url.startsWith('/uploads/')) return null;
    return path.join(uploadsDir, path.basename(url));
  }
}

function removeFileIfExists(filePath) {
  if (!filePath) return;
  fs.unlink(filePath, () => {});
}

function getPublicUploadUrl(req, fileName) {
  return `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(fileName)}`;
}

function formatVideoRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    session_id: row.session_id,
    source_type: row.source_type || 'url',
    original_filename: row.original_filename,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function removeSessionVideo(sessionId, userId) {
  const [[existing]] = await db.query(
    'SELECT id, url, source_type FROM videos WHERE session_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1',
    [sessionId, userId]
  );

  await db.query('DELETE FROM clips WHERE session_id = ? AND user_id = ?', [sessionId, userId]);
  await db.query('DELETE FROM videos WHERE session_id = ? AND user_id = ?', [sessionId, userId]);

  if (existing && existing.source_type === 'upload') {
    removeFileIfExists(toUploadPath(existing.url));
  }
}

router.get('/session/:sessionId', requireAuth, async (req, res) => {
  try {
    await ensureSchema();
    const [[video]] = await db.query(
      'SELECT * FROM videos WHERE session_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1',
      [req.params.sessionId, req.user.userId]
    );
    res.json({ video: formatVideoRow(video) });
  } catch (error) {
    console.error('Error loading session video:', error);
    res.status(500).json({ error: 'Failed to load session video.' });
  }
});

router.post('/session', requireAuth, async (req, res) => {
  try {
    await ensureSchema();

    const { title, url, session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required.' });
    }
    if (!url || !String(url).trim()) {
      return res.status(400).json({ error: 'url is required.' });
    }

    await removeSessionVideo(String(session_id), req.user.userId);

    const cleanUrl = String(url).trim();
    const cleanTitle = String(title || cleanUrl).trim().slice(0, 255) || 'Session Video';

    const [result] = await db.query(
      'INSERT INTO videos (user_id, session_id, title, url, source_type, original_filename) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.userId, String(session_id), cleanTitle, cleanUrl, 'url', null]
    );

    const [[created]] = await db.query('SELECT * FROM videos WHERE id = ?', [result.insertId]);
    res.status(201).json({ video: formatVideoRow(created), message: 'Video saved.' });
  } catch (error) {
    console.error('Error saving session video:', error);
    res.status(500).json({ error: 'Failed to save video.' });
  }
});

router.post('/session/upload', requireAuth, uploadVideoMiddleware, async (req, res) => {
  try {
    await ensureSchema();

    const { session_id, title } = req.body;
    if (!session_id) {
      if (req.file) removeFileIfExists(path.join(uploadsDir, req.file.filename));
      return res.status(400).json({ error: 'session_id is required.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required.' });
    }

    await removeSessionVideo(String(session_id), req.user.userId);

    const fileUrl = getPublicUploadUrl(req, req.file.filename);
    const cleanTitle = String(title || req.file.originalname || 'Uploaded Video').trim().slice(0, 255) || 'Uploaded Video';

    const [result] = await db.query(
      'INSERT INTO videos (user_id, session_id, title, url, source_type, original_filename) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.userId, String(session_id), cleanTitle, fileUrl, 'upload', req.file.originalname]
    );

    const [[created]] = await db.query('SELECT * FROM videos WHERE id = ?', [result.insertId]);
    res.status(201).json({ video: formatVideoRow(created), message: 'Video uploaded.' });
  } catch (error) {
    if (req.file) removeFileIfExists(path.join(uploadsDir, req.file.filename));
    console.error('Error uploading session video:', error);
    res.status(500).json({ error: 'Failed to upload video.' });
  }
});

router.delete('/session/:sessionId', requireAuth, async (req, res) => {
  try {
    await ensureSchema();
    await removeSessionVideo(req.params.sessionId, req.user.userId);
    res.json({ message: 'Video removed.' });
  } catch (error) {
    console.error('Error removing session video:', error);
    res.status(500).json({ error: 'Failed to remove video.' });
  }
});

router.get('/session/:sessionId/clips', requireAuth, async (req, res) => {
  try {
    await ensureSchema();
    const [clips] = await db.query(
      'SELECT id, label, start_time, end_time, created_at FROM clips WHERE session_id = ? AND user_id = ? ORDER BY start_time ASC, created_at ASC',
      [req.params.sessionId, req.user.userId]
    );
    res.json(clips);
  } catch (error) {
    console.error('Error loading clips:', error);
    res.status(500).json({ error: 'Failed to load clips.' });
  }
});

router.post('/session/:sessionId/clips', requireAuth, async (req, res) => {
  try {
    await ensureSchema();

    const { label, start_time, end_time } = req.body;
    const clipLabel = String(label || 'New clip').trim().slice(0, 255) || 'New clip';
    const start = Number(start_time);
    const end = Number(end_time);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return res.status(400).json({ error: 'start_time and end_time must be valid numbers.' });
    }
    if (start < 0 || end <= start) {
      return res.status(400).json({ error: 'Clip range is invalid.' });
    }

    const sessionId = String(req.params.sessionId);
    const [[video]] = await db.query(
      'SELECT id FROM videos WHERE session_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1',
      [sessionId, req.user.userId]
    );

    if (!video) {
      return res.status(400).json({ error: 'Add a video to this session before creating clips.' });
    }

    const [result] = await db.query(
      'INSERT INTO clips (video_id, user_id, session_id, label, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
      [video.id, req.user.userId, sessionId, clipLabel, start, end]
    );

    const [[created]] = await db.query(
      'SELECT id, label, start_time, end_time, created_at FROM clips WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating clip:', error);
    res.status(500).json({ error: 'Failed to create clip.' });
  }
});

router.delete('/clips/:clipId', requireAuth, async (req, res) => {
  try {
    await ensureSchema();
    const [result] = await db.query(
      'DELETE FROM clips WHERE id = ? AND user_id = ?',
      [req.params.clipId, req.user.userId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Clip not found.' });
    }

    res.json({ message: 'Clip removed.' });
  } catch (error) {
    console.error('Error removing clip:', error);
    res.status(500).json({ error: 'Failed to remove clip.' });
  }
});

router.get('/', async (_req, res) => {
  try {
    await ensureSchema();
    const [rows] = await db.query('SELECT * FROM videos ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos.' });
  }
});

router.post('/', async (req, res) => {
  try {
    await ensureSchema();

    const { title } = req.body;
    if (!title || String(title).trim() === '') {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const cleanTitle = String(title).trim().slice(0, 255);
    const [result] = await db.query('INSERT INTO videos (title) VALUES (?)', [cleanTitle]);

    res.status(201).json({
      id: result.insertId,
      title: cleanTitle,
      message: 'Video added successfully.',
    });
  } catch (error) {
    console.error('Error adding video:', error);
    res.status(500).json({ error: 'Failed to add video.' });
  }
});

module.exports = router;
