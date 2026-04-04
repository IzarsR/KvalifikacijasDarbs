const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const videosRouter = require('./routes/videos');
const authRouter   = require('./routes/auth');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.use('/api/videos', videosRouter);
app.use('/api/auth',   authRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Playlytic API' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
