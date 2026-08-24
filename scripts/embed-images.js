const { pool } = require('../src/db');
const { embedText } = require('../src/services/embeddingService');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function embedImages() {
  const { rows } = await pool.query(`
    SELECT i.id, i.filename, t.caption, t.subject
    FROM images i
    JOIN image_tags t ON t.image_id = i.id
    WHERE i.id NOT IN (SELECT image_id FROM image_vectors)
    ORDER BY i.id
  `);

  console.log(`Embedding ${rows.length} images...`);

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const img = rows[i];
    console.log(`[${i + 1}/${rows.length}] ${img.filename} ("${img.caption}")`);

    try {
      // embed caption + subject together for richer semantic signal
      const textToEmbed = `${img.subject}. ${img.caption}`;
      const vector = await embedText(textToEmbed);

      await pool.query(
        `INSERT INTO image_vectors (image_id, embedding, model_used)
         VALUES ($1, $2, $3)
         ON CONFLICT (image_id) DO UPDATE SET embedding = $2, model_used = $3`,
        [img.id, vector, 'gemini-embedding-001']
      );

      succeeded++;
    } catch (err) {
      console.log(`  -> Error: ${err.message}`);
      failed++;
    }

    await sleep(1500); // throttle to be safe with quota
  }

  console.log(`\nDone. Succeeded: ${succeeded}, Failed: ${failed}`);
  await pool.end();
}

embedImages().catch(err => {
  console.error('Embedding job failed:', err);
  process.exit(1);
});