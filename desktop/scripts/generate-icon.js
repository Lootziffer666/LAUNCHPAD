#!/usr/bin/env node
/**
 * generate-icon.js
 *
 * Renders desktop/build-resources/icon.svg to a 256x256 PNG at
 * desktop/build-resources/icon.png using the sharp library.
 *
 * electron-builder requires .ico or .png for Windows targets.
 * When given a 256x256+ PNG, it auto-generates the multi-size .ico.
 *
 * Usage:  node scripts/generate-icon.js
 */

'use strict';

const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const root = resolve(__dirname, '..');
const svgPath = resolve(root, 'build-resources', 'icon.svg');
const pngPath = resolve(root, 'build-resources', 'icon.png');

async function main() {
  const sharp = require('sharp');
  const svgBuffer = readFileSync(svgPath);

  await sharp(svgBuffer, { density: 300 })
    .resize(256, 256)
    .png()
    .toFile(pngPath);

  console.log(`Icon generated: ${pngPath}`);
}

main().catch((err) => {
  console.error('Failed to generate icon:', err);
  process.exit(1);
});
