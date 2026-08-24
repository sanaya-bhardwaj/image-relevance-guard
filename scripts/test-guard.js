const { pool } = require('../src/db');
const { evaluateCandidate } = require('../src/services/guardService');
const { cosineSimilarity } = require('../src/services/similarity');

async function test() {
  const postText = 'Red foxes are cunning, adaptable animals found across forests and grasslands.';

  const { rows: postRows } = await pool.query(
    `SELECT embedding FROM post_vectors WHERE post_id = 1`
  );
  const postVector = postRows[0].embedding;

  // grab a wolf image to force as a candidate
  const { rows: wolfRows } = await pool.query(`
    SELECT i.filename, iv.embedding, t.subject, t.category, t.confidence
    FROM images i
    JOIN image_vectors iv ON iv.image_id = i.id
    JOIN image_tags t ON t.image_id = i.id
    WHERE i.filename = 'wolf5.jpg'
  `);
  const wolf = wolfRows[0];
  const similarity = cosineSimilarity(postVector, wolf.embedding);

  const candidate = { subject: wolf.subject, category: wolf.category, confidence: wolf.confidence, similarity };
  const verdict = evaluateCandidate(postText, candidate);

  console.log(`Candidate: ${wolf.filename} (${wolf.subject}, similarity: ${similarity.toFixed(4)})`);
  console.log('Guard verdict:', verdict);

  await pool.end();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});