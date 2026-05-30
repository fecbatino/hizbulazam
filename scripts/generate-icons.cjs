const sharp = require('sharp');
const path = require('path');

const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');

async function generate() {
  const sizes = [192, 512];
  for (const size of sizes) {
    const outPath = path.join(__dirname, '..', 'public', `icon-${size}.png`);
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated: icon-${size}.png`);
  }
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
