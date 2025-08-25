import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, "../public/icons/icon.svg");
const outputDir = path.join(__dirname, "../public/icons");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  console.log("Generating PWA icons...");

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    try {
      await sharp(inputSvg).resize(size, size).png().toFile(outputPath);

      console.log(`✓ Generated ${size}x${size} icon`);
    } catch (error) {
      console.error(
        `✗ Failed to generate ${size}x${size} icon:`,
        error.message
      );
    }
  }

  // Generate favicon
  try {
    await sharp(inputSvg)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, "../public/favicon.png"));

    console.log("✓ Generated favicon.png");
  } catch (error) {
    console.error("✗ Failed to generate favicon:", error.message);
  }

  console.log("Icon generation complete!");
}

generateIcons().catch(console.error);
