const { embedText } = require('../src/services/embeddingService');

async function test() {
  const vec = await embedText('A red fox standing in a forest');
  console.log('Vector length:', vec.length);
  console.log('First 5 values:', vec.slice(0, 5));
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});