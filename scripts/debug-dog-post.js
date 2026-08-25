const { rankImagesForPost } = require('../src/services/rankingService');
const { pool } = require('../src/db');

async function debug() {
  const ranked = await rankImagesForPost(6); // dog post id from your seed output
  console.log('Top 5 candidates for dog post:');
  ranked.slice(0, 5).forEach(r => {
    console.log(`${r.filename} (${r.subject}) - similarity: ${r.similarity.toFixed(4)}`);
  });
  await pool.end();
}

debug();