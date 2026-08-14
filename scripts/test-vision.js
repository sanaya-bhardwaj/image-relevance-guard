const path = require('path');
const { classifyImage } = require('../src/services/visionService');

async function test() {
  const imagePath = path.join(__dirname, '..', 'corpus', 'wolf1.jpg');
  console.log('Classifying:', imagePath);

  const result = await classifyImage(imagePath);
  console.log(JSON.stringify(result, null, 2));
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});