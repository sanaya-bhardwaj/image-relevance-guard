const { pool } = require('../db');
const { cosineSimilarity } = require('./similarity');

async function rankImagesForPost(postId) {
  const { rows: postVecRows } = await pool.query(
    `SELECT embedding FROM post_vectors WHERE post_id = $1`,
    [postId]
  );
  if (postVecRows.length === 0) {
    throw new Error(`No embedding found for post ${postId}`);
  }
  const postVector = postVecRows[0].embedding;

  const { rows: imageRows } = await pool.query(`
    SELECT i.id, i.filename, iv.embedding, t.subject, t.category, t.confidence, t.flagged
    FROM images i
    JOIN image_vectors iv ON iv.image_id = i.id
    JOIN image_tags t ON t.image_id = i.id
    WHERE t.flagged = false
  `);

  const ranked = imageRows
    .map(img => ({
      imageId: img.id,
      filename: img.filename,
      subject: img.subject,
      category: img.category,
      confidence: img.confidence,
      similarity: cosineSimilarity(postVector, img.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  return ranked;
}

module.exports = { rankImagesForPost };