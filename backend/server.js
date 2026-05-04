require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const videosRouter = require('./routes/videos');
const authRouter   = require('./routes/auth');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
// Increase limits for large file uploads
app.use(bodyParser.json({ limit: '10gb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10gb' }));

// Serve uploaded videos as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/videos', videosRouter);
app.use('/api/auth',   authRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Playlytic API' });
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Increase timeout for large file uploads (2GB+)
server.timeout = 1200000; // 20 minutes
server.keepAliveTimeout = 1200000;
