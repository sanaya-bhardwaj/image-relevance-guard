const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { createPost } = require('../services/postService');
const { getMatchesForPost } = require('../services/matchingService');

// POST /posts - create a post (auto-embeds it)
router.post('/', async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'title and body are required' });
    }
    const postId = await createPost(title, body);
    res.status(201).json({ id: postId, title, body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /posts - list all posts
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT id, title, body, created_at FROM posts ORDER BY id DESC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /posts/:id/images - ranked suggestions + guard verdicts
router.get('/:id/images', async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'invalid post id' });
    }
    const result = await getMatchesForPost(postId);

    // persist the suggestion for the review workflow
    if (result.match) {
      await pool.query(
        `INSERT INTO suggestions (post_id, image_id, similarity_score, guard_verdict, reason, status)
         VALUES ($1, $2, $3, 'approved', $4, 'pending')`,
        [postId, result.match.imageId, result.match.similarity, result.match.reason]
      );
    } else {
      await pool.query(
        `INSERT INTO suggestions (post_id, image_id, similarity_score, guard_verdict, reason, status)
         VALUES ($1, NULL, NULL, 'no_match', $2, 'pending')`,
        [postId, result.noMatchReason]
      );
    }

    res.json(result);
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;