const { createPost } = require('../src/services/postService');
const { pool } = require('../src/db');

const EVAL_POSTS = [
  { title: 'The Secret Life of Red Foxes', body: 'Red foxes are cunning, adaptable animals found across forests and grasslands, known for their vibrant orange-red fur and bushy tails.', expectedSubject: 'fox' },
  { title: 'Understanding Gray Wolf Packs', body: 'Gray wolves are apex predators that live and hunt in tightly organized packs across the northern wilderness.', expectedSubject: 'wolf' },
  { title: 'Why Dogs Make Great Companions', body: 'Dogs have been loyal companions to humans for thousands of years, prized for their loyalty, playfulness, and trainability.', expectedSubject: 'dog' },
  { title: 'Grizzly Bears of North America', body: 'Grizzly bears are powerful omnivores found in forests and mountains, known for their strength and thick fur.', expectedSubject: 'bear' },
  { title: 'The Majestic Red Deer Stag', body: 'Red deer stags are known for their impressive antlers and graceful presence in woodland and grassland habitats.', expectedSubject: 'deer' },
];

async function seed() {
  const results = [];
  for (const post of EVAL_POSTS) {
    const postId = await createPost(post.title, post.body);
    results.push({ postId, expectedSubject: post.expectedSubject, title: post.title });
    console.log(`Created eval post ${postId}: "${post.title}" (expects: ${post.expectedSubject})`);
    await new Promise(r => setTimeout(r, 1500)); // throttle embedding calls
  }

  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(
    path.join(__dirname, '..', 'db', 'eval-set.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\nSaved eval set to db/eval-set.json');

  await pool.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});