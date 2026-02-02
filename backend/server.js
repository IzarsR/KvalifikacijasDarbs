const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const videosRouter = require('./routes/videos');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/videos', videosRouter);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Playlytic API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
