const { pool } = require('../src/db');

async function checkStatus() {
  const { rows } = await pool.query(`
    SELECT status, COUNT(*) FROM images GROUP BY status
  `);
  console.log(rows);

  const { rows: flagged } = await pool.query(`
    SELECT i.filename, t.subject, t.confidence
    FROM image_tags t JOIN images i ON i.id = t.image_id
    WHERE t.flagged = true
  `);
  console.log('Flagged (low confidence):', flagged);

  await pool.end();
}

checkStatus();