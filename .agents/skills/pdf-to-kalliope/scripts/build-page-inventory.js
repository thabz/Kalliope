#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';
import { buildPageInventory, writeJsonLines } from './audit-utils.js';

const main = () => {
  const [xmlFile, outputFile] = process.argv.slice(2);
  if (!xmlFile || !outputFile) {
    console.error('Brug: node build-page-inventory.js WORK.xml INVENTORY.jsonl');
    process.exitCode = 2;
    return;
  }
  const rows = buildPageInventory({ xml: fs.readFileSync(xmlFile, 'utf8'), workFile: xmlFile });
  writeJsonLines(outputFile, rows);
  console.error(`${rows.length} side(r) skrevet til ${outputFile}.`);
};

if (fileURLToPath(import.meta.url) === process.argv[1]) main();
