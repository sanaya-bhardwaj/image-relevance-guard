const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// POST /suggestions/:id/approve
router.post('/:id/approve', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE suggestions SET status = 'approved' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'suggestion not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /suggestions/:id/reject
router.post('/:id/reject', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE suggestions SET status = 'rejected' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'suggestion not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /suggestions - list all, for the review table
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, p.title as post_title, i.filename as image_filename
      FROM suggestions s
      JOIN posts p ON p.id = s.post_id
      LEFT JOIN images i ON i.id = s.image_id
      ORDER BY s.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;