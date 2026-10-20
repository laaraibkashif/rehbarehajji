/**
 * Generate PWA icon PNGs for Rehbar-e-Hajji.
 *
 * Prerequisites:
 *   npm install -g sharp-cli
 *
 * OR use https://realfavicongenerator.net/ to generate icons from favicon.svg.
 *
 * Usage:
 *   node scripts/generate-assets.js
 */

const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");
const svgPath = path.join(publicDir, "favicon.svg");
const sizes = [192, 512];

// Check if sharp is available
try {
  require.resolve("sharp");
  const sharp = require("sharp");

  async function generate() {
    const svgBuffer = fs.readFileSync(svgPath);

    for (const size of sizes) {
      const pngPath = path.join(publicDir, `icon-${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(pngPath);
      console.log(`✅ Generated ${pngPath} (${size}x${size})`);
    }
  }

  generate().catch((err) => {
    console.error("Failed to generate icons:", err.message);
    printFallback();
  });
} catch {
  printFallback();
}

function printFallback() {
  console.log(`
⚠️  sharp not found. Please generate icons manually:

  Option 1 (recommended): Upload ${svgPath} to
     https://realfavicongenerator.net/
     and download the generated icons.

  Option 2: Install sharp and re-run:
     npm install --save-dev sharp
     node scripts/generate-assets.js

  Option 3: Create simple placeholder PNGs with a solid #047857
     background and white text via any image editor.

Required files:
  - public/icon-192.png  (192×192)
  - public/icon-512.png  (512×512)
`);
}
