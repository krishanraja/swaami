// Script to generate all required favicon sizes from the main favicon.png
// NOTE: Run `pnpm add -D sharp` first if sharp is not installed
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../public/favicon.png');
const outputDir = path.join(__dirname, '../public');

const sizes = [
  { size: 16, name: 'favicon-16.png' },
  { size: 32, name: 'favicon-32.png' },
  { size: 180, name: 'favicon-180.png' },
  { size: 192, name: 'favicon-192.png' },
];

async function generateFavicons() {
  console.log('Generating favicons from:', inputPath);
  
  for (const { size, name } of sizes) {
    const outputPath = path.join(outputDir, name);
    
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      })
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }
  
  console.log('\\nAll favicons generated successfully!');
}

generateFavicons().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
