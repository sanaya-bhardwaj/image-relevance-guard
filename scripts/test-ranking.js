const { createPost } = require('../src/services/postService');
const { rankImagesForPost } = require('../src/services/rankingService');
const { pool } = require('../src/db');

async function test() {
  const postId = await createPost(
    'The Secret Life of Red Foxes',
    'Red foxes are cunning, adaptable animals found across forests and grasslands. Known for their vibrant orange-red fur and bushy tails, they are skilled hunters that thrive in a variety of habitats, from wild forests to suburban neighborhoods.'
  );
  console.log(`Created post ${postId}`);

  const ranked = await rankImagesForPost(postId);
  console.log('\nTop 5 ranked images:');
  ranked.slice(0, 5).forEach((r, i) => {
    console.log(`${i + 1}. ${r.filename} - ${r.subject} (similarity: ${r.similarity.toFixed(4)})`);
  });

  await pool.end();
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});