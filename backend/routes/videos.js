const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const ffmpegPath = require('ffmpeg-static');
const router = express.Router();
const db = require('../config/database');
const requireAuth = require('../middleware/auth');

// Use temp directory for clips (avoids Cyrillic character issues)
const tempClipsDir = path.join(os.tmpdir(), 'playlytic_clips');
if (!fs.existsSync(tempClipsDir)) {
  fs.mkdirSync(tempClipsDir, { recursive: true });
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure clips directory exists
const clipsDir = path.join(__dirname, '../uploads/clips');
if (!fs.existsSync(clipsDir)) {
  fs.mkdirSync(clipsDir, { recursive: true });
}

// Multer configuration for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}_${random}${ext}`);
  },
});

// Multer configuration for local file storage
const upload = multer({
  storage: storage,
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
      filename VARCHAR(255) NULL,
      source_type VARCHAR(30) NOT NULL DEFAULT 'url',
      original_filename VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing('ALTER TABLE videos ADD COLUMN user_id INT NULL');
  await addColumnIfMissing('ALTER TABLE videos ADD COLUMN session_id VARCHAR(255) NULL');
  await addColumnIfMissing('ALTER TABLE videos ADD COLUMN url TEXT NULL');
  await addColumnIfMissing('ALTER TABLE videos ADD COLUMN filename VARCHAR(255) NULL');
  await addColumnIfMissing("ALTER TABLE videos ADD COLUMN source_type VARCHAR(30) NOT NULL DEFAULT 'url'");
  await addColumnIfMissing('ALTER TABLE videos ADD COLUMN original_filename VARCHAR(255) NULL');
  await addColumnIfMissing('ALTER TABLE videos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  await addIndexIfMissing('CREATE INDEX idx_videos_session_user ON videos (session_id, user_id)');

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS clips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        video_id INT NULL,
        user_id INT NULL,
        session_id VARCHAR(255) NOT NULL,
        label VARCHAR(255) NOT NULL,
        start_time DECIMAL(10,3) NOT NULL,
        end_time DECIMAL(10,3) NOT NULL,
        file_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Clips table created or already exists');
  } catch (error) {
    console.error('Error creating clips table:', error.message);
    throw error;
  }

  await addIndexIfMissing('CREATE INDEX idx_clips_session_user ON clips (session_id, user_id)');
  await addIndexIfMissing('CREATE INDEX idx_clips_video ON clips (video_id)');

  schemaReady = true;
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
    'SELECT id, filename FROM videos WHERE session_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1',
    [sessionId, userId]
  );

  await db.query('DELETE FROM clips WHERE session_id = ? AND user_id = ?', [sessionId, userId]);
  await db.query('DELETE FROM videos WHERE session_id = ? AND user_id = ?', [sessionId, userId]);

  // Delete file from disk if it exists
  if (existing && existing.filename) {
    const filePath = path.join(uploadsDir, existing.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

// Helper function to extract a clip from a video
function extractClip(inputPath, outputPath, startTime, endTime) {
  return new Promise((resolve, reject) => {
    // Ensure clips directory exists
    const clipsParentDir = path.dirname(outputPath);
    if (!fs.existsSync(clipsParentDir)) {
      fs.mkdirSync(clipsParentDir, { recursive: true });
    }

    const duration = Math.max(0, endTime - startTime);
    
    // FFmpeg command: extract clip without re-encoding
    const args = [
      '-i', inputPath,
      '-ss', String(startTime),
      '-t', String(duration),
      '-c:v', 'copy',
      '-c:a', 'copy',
      '-y',  // Overwrite output file
      outputPath
    ];

    console.log(`FFmpeg: extracting clip from ${inputPath} -> ${outputPath} (${startTime}s to ${endTime}s)`);

    const ffmpegProcess = spawn(ffmpegPath, args);

    let stderrData = '';
    ffmpegProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        console.log('FFmpeg extraction successful');
        resolve(outputPath);
      } else {
        const error = new Error(`FFmpeg failed with code ${code}: ${stderrData}`);
        console.error('FFmpeg error:', error.message);
        reject(error);
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error('FFmpeg process error:', err.message);
      reject(err);
    });
  });
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
      return res.status(400).json({ error: 'session_id is required.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required.' });
    }

    await removeSessionVideo(String(session_id), req.user.userId);

    const fileSizeMB = (req.file.size / 1024 / 1024).toFixed(2);
    console.log(`Video uploaded: ${req.file.filename} (${fileSizeMB}MB)`);

    const cleanTitle = String(title || req.file.originalname || 'Uploaded Video').trim().slice(0, 255) || 'Uploaded Video';
    
    // Local file URL
    const videoUrl = `/uploads/${req.file.filename}`;

    const [insertResult] = await db.query(
      'INSERT INTO videos (user_id, session_id, title, url, filename, source_type, original_filename) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.userId, String(session_id), cleanTitle, videoUrl, req.file.filename, 'upload', req.file.originalname]
    );

    const [[created]] = await db.query('SELECT * FROM videos WHERE id = ?', [insertResult.insertId]);
    res.status(201).json({ video: formatVideoRow(created), message: 'Video uploaded successfully.' });
  } catch (error) {
    console.error('Error uploading session video:', error.message);
    res.status(500).json({ error: error.message || 'Failed to upload video.' });
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
      'SELECT id, label, start_time, end_time, file_path, created_at FROM clips WHERE session_id = ? AND user_id = ? ORDER BY start_time ASC, created_at ASC',
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
      'SELECT id, filename FROM videos WHERE session_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1',
      [sessionId, req.user.userId]
    );

    if (!video || !video.filename) {
      return res.status(400).json({ error: 'Add a video to this session before creating clips.' });
    }

    // Extract the clip using FFmpeg to persistent clips directory
    const inputPath = path.join(uploadsDir, video.filename);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const clipFilename = `clip_${timestamp}_${random}.mp4`;
    const outputPath = path.join(clipsDir, clipFilename);

    try {
      await extractClip(inputPath, outputPath, start, end);
    } catch (ffmpegError) {
      console.error('FFmpeg extraction error:', ffmpegError);
      return res.status(500).json({ error: 'Failed to extract clip. Please ensure FFmpeg is installed.' });
    }

    // Store clip metadata with persistent uploads path
    const clipPath = `/uploads/clips/${clipFilename}`;
    const [result] = await db.query(
      'INSERT INTO clips (video_id, user_id, session_id, label, start_time, end_time, file_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [video.id, req.user.userId, sessionId, clipLabel, start, end, clipPath]
    );

    const [[created]] = await db.query(
      'SELECT id, label, start_time, end_time, file_path, created_at FROM clips WHERE id = ?',
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
    
    // Get clip details before deleting
    const [[clip]] = await db.query(
      'SELECT file_path FROM clips WHERE id = ? AND user_id = ?',
      [req.params.clipId, req.user.userId]
    );

    if (!clip) {
      return res.status(404).json({ error: 'Clip not found.' });
    }

    // Delete from database
    const [result] = await db.query(
      'DELETE FROM clips WHERE id = ? AND user_id = ?',
      [req.params.clipId, req.user.userId]
    );

    // Delete file from disk if it exists (supports both old temp path and current uploads path)
    if (clip.file_path) {
      const filename = path.basename(clip.file_path);
      const baseDir = clip.file_path.includes('/temp-clip/') ? tempClipsDir : clipsDir;
      const filePath = path.join(baseDir, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error('Error deleting clip file:', fileError);
        }
      }
    }

    res.json({ message: 'Clip removed.' });
  } catch (error) {
    console.error('Error removing clip:', error);
    res.status(500).json({ error: 'Failed to remove clip.' });
  }
});

// Backward-compatibility route for clips created while temp path storage was enabled.
router.get('/temp-clip/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename.' });
    }

    const filePath = path.join(tempClipsDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Clip not found.' });
    }

    res.setHeader('Content-Type', 'video/mp4');
    return res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving temp clip:', error);
    return res.status(500).json({ error: 'Failed to fetch clip.' });
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

// Clips are stored in /uploads/clips and served by the static /uploads route.
// Older clips using /api/videos/temp-clip/:filename are still supported above.

module.exports = router;
