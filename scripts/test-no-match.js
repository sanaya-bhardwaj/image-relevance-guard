const { createPost } = require('../src/services/postService');
const { rankImagesForPost } = require('../src/services/rankingService');
const { evaluateCandidate } = require('../src/services/guardService');
const { pool } = require('../src/db');

async function test() {
  const postId = await createPost(
    'Top 10 Vintage Cars of the 1960s',
    'Classic vintage automobiles from the 1960s remain iconic today, from muscle cars to elegant European sedans, prized for their design and engineering.'
  );
  console.log(`Created post ${postId}`);

  const ranked = await rankImagesForPost(postId);
  const postText = 'Top 10 Vintage Cars of the 1960s. Classic vintage automobiles from the 1960s remain iconic today.';

  console.log('\nTop 3 candidates and their guard verdicts:');
  ranked.slice(0, 3).forEach(r => {
    const verdict = evaluateCandidate(postText, r);
    console.log(`- ${r.filename} (${r.subject}, similarity: ${r.similarity.toFixed(4)}) -> ${JSON.stringify(verdict)}`);
  });

  const anyApproved = ranked.slice(0, 3).some(r => evaluateCandidate(postText, r).approved);
  console.log(`\nFinal result: ${anyApproved ? 'Match found' : 'No confident match found. Similarity below threshold; detected subjects do not match article topic.'}`);

  await pool.end();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});