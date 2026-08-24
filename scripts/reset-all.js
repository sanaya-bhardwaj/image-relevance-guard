const { pool } = require('../src/db');

async function resetAll() {
  await pool.query(`DELETE FROM image_tags`);
  await pool.query(`UPDATE images SET status = 'pending'`);
  console.log('Reset all images to pending, cleared all tags.');
  await pool.end();
}

resetAll().catch(err => {
  console.error(err);
  process.exit(1);
});