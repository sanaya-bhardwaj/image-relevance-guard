// Downloads the ~50-image corpus from Unsplash/Pexels for reproducibility.
// Populate IMAGE_MANIFEST with { url, filename, category } entries.

const fs = require('fs');
const path = require('path');

const IMAGE_MANIFEST = [
  // { url: 'https://...', filename: 'fox-01.jpg', category: 'fox' },
];

async function fetchCorpus() {
  const outDir = path.join(__dirname, '..', 'corpus');
  fs.mkdirSync(outDir, { recursive: true });
  // TODO: fetch each URL, write to outDir
  console.log(`Would fetch ${IMAGE_MANIFEST.length} images to ${outDir}`);
}

fetchCorpus();