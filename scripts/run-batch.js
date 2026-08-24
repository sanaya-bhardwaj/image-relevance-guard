const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');
const { classifyImage } = require('../src/services/visionService');

const CORPUS_DIR = path.join(__dirname, '..', 'corpus');

function guessCategory(filename) {
  // filenames like fox1.jpg, wolf3.jpg -> category guess for reference only
  const match = filename.match(/^([a-z]+)\d*\./i);
  return match ? match[1].toLowerCase() : null;
}

async function registerImages() {
  const files = fs.readdirSync(CORPUS_DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f));

  for (const filename of files) {
    const filePath = path.join(CORPUS_DIR, filename);
    const categoryGuess = guessCategory(filename);

    await pool.query(
      `INSERT INTO images (filename, file_path, category_guess, status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (filename) DO NOTHING`,
      [filename, filePath, categoryGuess]
    );
  }

  console.log(`Registered ${files.length} images (existing ones skipped).`);
}

async function processPendingImages() {
  const { rows: pending } = await pool.query(
    `SELECT id, filename, file_path FROM images WHERE status IN ('pending', 'failed') ORDER BY id`
  );

  console.log(`Processing ${pending.length} images...`);

  let succeeded = 0;
  let flaggedCount = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i++) {
    const img = pending[i];
    console.log(`[${i + 1}/${pending.length}] ${img.filename}...`);

    await pool.query(`UPDATE images SET status = 'processing' WHERE id = $1`, [img.id]);

    try {
      const result = await classifyImage(img.file_path);

      if (!result.valid) {
        console.log(`  -> Invalid model output, marking failed: ${JSON.stringify(result.errors)}`);
        await pool.query(`UPDATE images SET status = 'failed' WHERE id = $1`, [img.id]);
        failed++;
        continue;
      }

      const { subject, category, attributes, caption, confidence } = result.data;

      await pool.query(
        `INSERT INTO image_tags (image_id, subject, category, attributes, caption, confidence, flagged)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [img.id, subject, category, attributes, caption, confidence, result.flagged]
      );

      await pool.query(`UPDATE images SET status = 'done' WHERE id = $1`, [img.id]);

      if (result.flagged) {
        console.log(`  -> Tagged (LOW CONFIDENCE, flagged): ${subject} (${confidence})`);
        flaggedCount++;
      } else {
        console.log(`  -> Tagged: ${subject} (${confidence})`);
      }
      succeeded++;

        } catch (err) {
      console.log(`  -> Error: ${err.message}`);
      await pool.query(`UPDATE images SET status = 'failed' WHERE id = $1`, [img.id]);
      failed++;
    }

    // throttle to respect free-tier rate limits
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log(`\nDone. Succeeded: ${succeeded}, Flagged: ${flaggedCount}, Failed: ${failed}`);
}

async function main() {
  await registerImages();
  await processPendingImages();
  await pool.end();
}

main().catch(err => {
  console.error('Batch job failed:', err);
  process.exit(1);
});