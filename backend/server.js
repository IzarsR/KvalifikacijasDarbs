const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const videosRouter = require('./routes/videos');
const authRouter   = require('./routes/auth');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/videos', videosRouter);
app.use('/api/auth',   authRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Playlytic API' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
