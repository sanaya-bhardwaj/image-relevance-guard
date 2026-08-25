const { getMatchesForPost } = require('../src/services/matchingService');
const { pool } = require('../src/db');

async function test() {
  console.log('=== Fox post (should match) ===');
  const foxResult = await getMatchesForPost(1);
  console.log(JSON.stringify(foxResult, null, 2));

  console.log('\n=== Vintage cars post (should NOT match) ===');
  const carResult = await getMatchesForPost(2);
  console.log(JSON.stringify(carResult, null, 2));

  await pool.end();
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});