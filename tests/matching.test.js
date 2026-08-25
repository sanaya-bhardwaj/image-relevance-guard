const { getMatchesForPost } = require('../src/services/matchingService');
const { pool } = require('../src/db');
const fs = require('fs');
const path = require('path');

describe('Matching accuracy against labeled eval set', () => {
  afterAll(async () => {
    await pool.end();
  });

  test('top-1 precision meets minimum bar on eval set', async () => {
    const evalSetPath = path.join(__dirname, '..', 'db', 'eval-set.json');
    const evalSet = JSON.parse(fs.readFileSync(evalSetPath, 'utf8'));

    let correct = 0;
    for (const item of evalSet) {
      const result = await getMatchesForPost(item.postId);
      const topPick = result.match;
      if (topPick && topPick.filename.toLowerCase().startsWith(item.expectedSubject)) {
        correct++;
      }
    }

    const precision = correct / evalSet.length;
    expect(precision).toBeGreaterThanOrEqual(0.8); // regression guard: don't let precision silently drop
  }, 60000); // longer timeout since this makes real API calls
});