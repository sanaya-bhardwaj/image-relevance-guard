require('dotenv').config();
const express = require('express');
const { pool } = require('./db');

const postsRouter = require('./routes/posts');
const suggestionsRouter = require('./routes/suggestions');

const app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'unreachable', error: err.message });
  }
});

app.use('/posts', postsRouter);
app.use('/suggestions', suggestionsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});