#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';
import { auditPageInventory, readJsonLines } from './audit-utils.js';

const main = () => {
  const [xmlFile, inventoryFile] = process.argv.slice(2);
  if (!xmlFile || !inventoryFile) {
    console.error('Brug: node audit-pagebreaks.js WORK.xml INVENTORY.jsonl');
    process.exitCode = 2;
    return;
  }
  const result = auditPageInventory({
    xml: fs.readFileSync(xmlFile, 'utf8'),
    inventory: readJsonLines(inventoryFile),
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.issues.length > 0) process.exitCode = 1;
};

if (fileURLToPath(import.meta.url) === process.argv[1]) main();
