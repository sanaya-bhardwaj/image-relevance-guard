const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const corpusDir = path.join(__dirname, '..', 'corpus');

async function convertAll() {
  const files = fs.readdirSync(corpusDir).filter(f => f.endsWith('.avif'));
  console.log(`Found ${files.length} avif files to convert...`);

  for (const file of files) {
    const inputPath = path.join(corpusDir, file);
    const outputPath = path.join(corpusDir, file.replace('.avif', '.jpg'));

    await sharp(inputPath).jpeg({ quality: 90 }).toFile(outputPath);
    console.log(`Converted: ${file} -> ${path.basename(outputPath)}`);

    fs.unlinkSync(inputPath); // remove original avif
  }

  console.log('Done.');
}

convertAll().catch(err => {
  console.error('Conversion failed:', err);
  process.exit(1);
});