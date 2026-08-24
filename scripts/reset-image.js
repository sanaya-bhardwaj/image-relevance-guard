const { pool } = require('../src/db');

async function resetImage(filename) {
  await pool.query(`DELETE FROM image_tags WHERE image_id = (SELECT id FROM images WHERE filename = $1)`, [filename]);
  await pool.query(`UPDATE images SET status = 'pending' WHERE filename = $1`, [filename]);
  console.log(`Reset ${filename} to pending, cleared old tags.`);
  await pool.end();
}

resetImage(process.argv[2]).catch(err => {
  console.error(err);
  process.exit(1);
});