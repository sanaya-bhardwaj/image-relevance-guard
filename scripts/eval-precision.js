const fs = require('fs');
const path = require('path');
const { getMatchesForPost } = require('../src/services/matchingService');
const { pool } = require('../src/db');

async function runEval() {
  const evalSetPath = path.join(__dirname, '..', 'db', 'eval-set.json');
  const evalSet = JSON.parse(fs.readFileSync(evalSetPath, 'utf8'));

  let correct = 0;
  const results = [];

  for (const item of evalSet) {
    const result = await getMatchesForPost(item.postId);
    const topPick = result.match; // top-1 approved candidate, or null

    const isCorrect = topPick && topPick.filename.toLowerCase().startsWith(item.expectedSubject);
    if (isCorrect) correct++;

    results.push({
      post: item.title,
      expected: item.expectedSubject,
      topPick: topPick ? `${topPick.filename} (${topPick.subject})` : 'NO MATCH',
      correct: isCorrect,
    });
  }

  console.log('=== Eval Results ===');
  results.forEach(r => {
    console.log(`${r.correct ? '✓' : '✗'} "${r.post}" -> expected: ${r.expected}, got: ${r.topPick}`);
  });

  const precision = correct / evalSet.length;
  console.log(`\nTop-1 Precision: ${(precision * 100).toFixed(1)}% (${correct}/${evalSet.length})`);

  await pool.end();
}

runEval().catch(err => {
  console.error(err);
  process.exit(1);
});