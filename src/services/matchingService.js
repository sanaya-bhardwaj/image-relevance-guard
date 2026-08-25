const { rankImagesForPost } = require('./rankingService');
const { evaluateCandidate } = require('./guardService');
const { pool } = require('../db');

async function getMatchesForPost(postId) {
  const { rows: postRows } = await pool.query(`SELECT title, body FROM posts WHERE id = $1`, [postId]);
  if (postRows.length === 0) throw new Error(`Post ${postId} not found`);
  const post = postRows[0];
  const postText = `${post.title}. ${post.body}`;

  const ranked = await rankImagesForPost(postId);

  const evaluated = ranked.map(candidate => {
    const verdict = evaluateCandidate(postText, candidate);
    return { ...candidate, ...verdict };
  });

  const bestMatch = evaluated.find(c => c.approved);

  return {
    postId,
    postTitle: post.title,
    match: bestMatch || null,
    allCandidates: evaluated.slice(0, 5), // top 5 for transparency/debugging
    noMatchReason: bestMatch
      ? null
      : 'No confident match found. Similarity below threshold and/or detected subjects do not match article topic.',
  };
}

module.exports = { getMatchesForPost };