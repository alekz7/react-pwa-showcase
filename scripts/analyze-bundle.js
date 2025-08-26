#!/usr/bin/env node

/**
 * Bundle analysis script for React PWA Showcase
 * Analyzes the built bundle and provides optimization recommendations
 */

const fs = require("fs");
const path = require("path");

const DIST_DIR = path.join(__dirname, "../dist");
const ASSETS_DIR = path.join(DIST_DIR, "assets");

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function analyzeDirectory(dirPath) {
  const files = [];

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isFile()) {
        files.push({
          name: item,
          path: itemPath,
          size: stats.size,
          type: path.extname(item).toLowerCase(),
        });
      } else if (stats.isDirectory()) {
        files.push(...analyzeDirectory(itemPath));
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dirPath}`);
  }

  return files;
}

function analyzeBundleSize() {
  console.log("🔍 Analyzing bundle size...\n");

  if (!fs.existsSync(DIST_DIR)) {
    console.error(
      '❌ Build directory not found. Please run "npm run build" first.'
    );
    process.exit(1);
  }

  const allFiles = analyzeDirectory(DIST_DIR);

  // Categorize files
  const categories = {
    javascript: allFiles.filter((f) => f.type === ".js"),
    css: allFiles.filter((f) => f.type === ".css"),
    images: allFiles.filter((f) =>
      [".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp", ".ico"].includes(
        f.type
      )
    ),
    fonts: allFiles.filter((f) =>
      [".woff", ".woff2", ".ttf", ".eot"].includes(f.type)
    ),
    other: allFiles.filter(
      (f) =>
        ![
          ".js",
          ".css",
          ".png",
          ".jpg",
          ".jpeg",
          ".svg",
          ".gif",
          ".webp",
          ".ico",
          ".woff",
          ".woff2",
          ".ttf",
          ".eot",
        ].includes(f.type)
    ),
  };

  // Calculate totals
  const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);

  console.log("📊 Bundle Analysis Results");
  console.log("=".repeat(50));
  console.log(`📦 Total Bundle Size: ${formatBytes(totalSize)}\n`);

  // JavaScript files analysis
  if (categories.javascript.length > 0) {
    console.log("🟨 JavaScript Files:");
    const jsTotal = categories.javascript.reduce(
      (sum, file) => sum + file.size,
      0
    );
    console.log(
      `   Total: ${formatBytes(jsTotal)} (${((jsTotal / totalSize) * 100).toFixed(1)}%)`
    );

    const sortedJs = categories.javascript.sort((a, b) => b.size - a.size);
    sortedJs.slice(0, 10).forEach((file, index) => {
      const percentage = ((file.size / jsTotal) * 100).toFixed(1);
      console.log(
        `   ${index + 1}. ${file.name}: ${formatBytes(file.size)} (${percentage}%)`
      );
    });
    console.log();
  }

  // CSS files analysis
  if (categories.css.length > 0) {
    console.log("🟦 CSS Files:");
    const cssTotal = categories.css.reduce((sum, file) => sum + file.size, 0);
    console.log(
      `   Total: ${formatBytes(cssTotal)} (${((cssTotal / totalSize) * 100).toFixed(1)}%)`
    );

    categories.css.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name}: ${formatBytes(file.size)}`);
    });
    console.log();
  }

  // Images analysis
  if (categories.images.length > 0) {
    console.log("🟩 Image Files:");
    const imagesTotal = categories.images.reduce(
      (sum, file) => sum + file.size,
      0
    );
    console.log(
      `   Total: ${formatBytes(imagesTotal)} (${((imagesTotal / totalSize) * 100).toFixed(1)}%)`
    );

    const largeImages = categories.images.filter((f) => f.size > 100 * 1024); // > 100KB
    if (largeImages.length > 0) {
      console.log("   Large images (>100KB):");
      largeImages.forEach((file, index) => {
        console.log(
          `     ${index + 1}. ${file.name}: ${formatBytes(file.size)}`
        );
      });
    }
    console.log();
  }

  // Performance recommendations
  console.log("💡 Performance Recommendations:");
  console.log("-".repeat(40));

  const jsTotal = categories.javascript.reduce(
    (sum, file) => sum + file.size,
    0
  );
  const largestJs = categories.javascript.sort((a, b) => b.size - a.size)[0];

  if (jsTotal > 1024 * 1024) {
    // > 1MB
    console.log("⚠️  JavaScript bundle is large (>1MB). Consider:");
    console.log("   - More aggressive code splitting");
    console.log("   - Lazy loading non-critical components");
    console.log("   - Tree shaking unused dependencies");
  }

  if (largestJs && largestJs.size > 500 * 1024) {
    // > 500KB
    console.log(
      `⚠️  Largest JS chunk (${largestJs.name}) is ${formatBytes(largestJs.size)}. Consider splitting it further.`
    );
  }

  const largeImages = categories.images.filter((f) => f.size > 200 * 1024); // > 200KB
  if (largeImages.length > 0) {
    console.log("⚠️  Large images detected. Consider:");
    console.log("   - Image compression and optimization");
    console.log("   - WebP format for better compression");
    console.log("   - Lazy loading for images");
  }

  if (totalSize > 5 * 1024 * 1024) {
    // > 5MB
    console.log(
      "⚠️  Total bundle size is very large (>5MB). This may impact loading performance."
    );
  } else if (totalSize > 2 * 1024 * 1024) {
    // > 2MB
    console.log(
      "⚠️  Total bundle size is moderately large (>2MB). Monitor loading performance."
    );
  } else {
    console.log("✅ Bundle size looks good for web performance.");
  }

  // Chunk analysis
  const chunks = categories.javascript.filter((f) => f.name.includes("-"));
  if (chunks.length > 0) {
    console.log("\n📋 Chunk Analysis:");
    console.log(`   Total chunks: ${chunks.length}`);

    if (chunks.length > 20) {
      console.log(
        "   ⚠️  Many chunks detected. Consider merging smaller chunks for HTTP/2 optimization."
      );
    }

    const tinyChunks = chunks.filter((f) => f.size < 10 * 1024); // < 10KB
    if (tinyChunks.length > 5) {
      console.log(
        `   ⚠️  ${tinyChunks.length} tiny chunks (<10KB) detected. Consider merging.`
      );
    }
  }

  console.log("\n🎯 Performance Score:");
  let score = 100;

  if (jsTotal > 1024 * 1024) score -= 20;
  if (largestJs && largestJs.size > 500 * 1024) score -= 15;
  if (totalSize > 2 * 1024 * 1024) score -= 15;
  if (largeImages.length > 3) score -= 10;

  score = Math.max(0, score);

  const getScoreEmoji = (score) => {
    if (score >= 90) return "🟢";
    if (score >= 70) return "🟡";
    return "🔴";
  };

  console.log(
    `   ${getScoreEmoji(score)} Bundle Performance Score: ${score}/100`
  );

  if (score >= 90) {
    console.log("   Excellent! Your bundle is well optimized.");
  } else if (score >= 70) {
    console.log("   Good, but there's room for improvement.");
  } else {
    console.log("   Consider implementing the recommendations above.");
  }
}

// Run the analysis
analyzeBundleSize();
