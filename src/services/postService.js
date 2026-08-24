const { pool } = require('../db');
const { embedText } = require('./embeddingService');

async function createPost(title, body) {
  const { rows } = await pool.query(
    `INSERT INTO posts (title, body) VALUES ($1, $2) RETURNING id`,
    [title, body]
  );
  const postId = rows[0].id;

  const textToEmbed = `${title}. ${body}`;
  const vector = await embedText(textToEmbed);

  await pool.query(
    `INSERT INTO post_vectors (post_id, embedding, model_used) VALUES ($1, $2, $3)`,
    [postId, vector, 'gemini-embedding-001']
  );

  return postId;
}

module.exports = { createPost };