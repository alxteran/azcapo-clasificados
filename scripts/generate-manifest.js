#!/usr/bin/env node
/**
 * scripts/generate-manifest.js  (CommonJS)
 *
 * Scans the /imagenes directory and writes /imagenes/manifest.json
 * containing an array of all .jpg / .png filenames found.
 *
 * Runs automatically during Vercel build (see vercel.json buildCommand).
 * Usage locally: node scripts/generate-manifest.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const IMG_DIR  = path.join(ROOT, 'imagenes');
const OUT_FILE = path.join(IMG_DIR, 'manifest.json');

// Ensure the imagenes folder exists
if (!fs.existsSync(IMG_DIR)) {
  fs.mkdirSync(IMG_DIR, { recursive: true });
}

// Collect image filenames (skip manifest.json and README.md)
const files = fs.readdirSync(IMG_DIR)
  .filter(f => /\.(jpe?g|png)$/i.test(f))
  .sort();

// Write manifest
fs.writeFileSync(OUT_FILE, JSON.stringify(files, null, 2) + '\n', 'utf8');

console.log(`✅ manifest.json generated with ${files.length} image(s):`, files);
