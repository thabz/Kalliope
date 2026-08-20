#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';
import { buildPageInventory, normalizeLine, readJsonLines, splitBodyPages, directChild, parseXml, textEntries } from './audit-utils.js';

const rules = [
  ['ocr-symbol', /[{}%$]/gu, 'OCR-symbol fra rå genkendelse'],
  ['image-token', /\bImage\b/gu, 'Fremmed Image-token'],
  ['digit-inside-word', /\p{L}\d|\d\p{L}/gu, 'Ciffer inde i ord'],
  ['period-without-space', /\p{L}\.\p{L}/gu, 'Punktum uden efterfølgende mellemrum'],
  ['suspicious-internal-space', /\b\p{L}{1,2} \p{Ll}{3,}\b/gu, 'Muligt mellemrum inde i ord'],
  ['long-s-parenthesis', /\([a-zæøå]/gu, 'Mulig lang-s-fejllæsning som parentes'],
  ['long-s-brace', /\{[a-zæøå]/gu, 'Mulig lang-s-fejllæsning som klammeparentes'],
  ['likely-long-s-substitution', /\b(?:diffe|faa|faae|fig|fin|flig|fkal|fkulle|fom)\b/giu, 'Sandsynlig lang-s-fejllæsning som f'],
  ['singleton', /(?:^|\s)[bcdfghjklmnpqrstvwxz](?=\s|[.,;:!?]|$)/gimu, 'Usandsynligt enkeltbogstav'],
  ['implausible-ending', /\b\p{L}{3,}([bcdfghjklmnpqrstvwxz])\1{2,}\b/giu, 'Usandsynlig gentaget ordendelse'],
];

const stableAnchor = (line, column) => {
  const start = Math.max(0, column - 24);
  return line.slice(start, column + 48).trim();
};

const historicalOcrCandidates = ({ xml, inventory = null }) => {
  const document = parseXml(xml);
  const generated = inventory ?? buildPageInventory({ xml });
  const byText = new Map();
  generated.forEach(row => {
    const rows = byText.get(row.text_id) ?? [];
    rows.push(row);
    byText.set(row.text_id, rows);
  });
  const candidates = [];
  for (const entry of textEntries(document)) {
    const textId = entry.getAttribute('id') ?? '';
    const pages = splitBodyPages(directChild(entry, 'body'));
    pages.forEach((page, pageIndex) => {
      const inventoryRows = byText.get(textId) ?? [];
      const printedPage = pageIndex === 0
        ? inventoryRows[0]?.printed_page
        : page.transition?.printed_page;
      const metadata = inventoryRows.find(row => row.printed_page === printedPage) ?? {};
      const lines = page.content.replace(/<[^>]+>/g, ' ').split(/\r?\n/);
      lines.forEach((rawLine, lineIndex) => {
        const line = normalizeLine(rawLine);
        if (!line) return;
        for (const [rule, pattern, reason] of rules) {
          pattern.lastIndex = 0;
          for (const match of line.matchAll(pattern)) {
            candidates.push({
              id: `${textId}:${metadata.printed_page ?? '?'}:${rule}:${lineIndex + 1}:${match.index + 1}`,
              rule,
              reason,
              text_id: textId,
              printed_page: metadata.printed_page ?? null,
              facsimile: metadata.facsimile ?? null,
              line: lineIndex + 1,
              column: match.index + 1,
              match: match[0],
              anchor: stableAnchor(line, match.index),
            });
          }
        }
      });
      const normalized = lines.map(normalizeLine).filter(Boolean);
      normalized.forEach((line, index) => {
        if (line === normalized[index - 1]) candidates.push({
          id: `${textId}:${metadata.printed_page ?? '?'}:duplicate-adjacent-line:${index + 1}`,
          rule: 'duplicate-adjacent-line',
          reason: 'Identiske nabolinjer',
          text_id: textId,
          printed_page: metadata.printed_page ?? null,
          facsimile: metadata.facsimile ?? null,
          line: index + 1,
          column: 1,
          match: line,
          anchor: line,
        });
      });
    });
  }
  return candidates;
};

const main = () => {
  const [xmlFile, inventoryFile] = process.argv.slice(2);
  if (!xmlFile) {
    console.error('Brug: node audit-ocr-candidates.js WORK.xml [INVENTORY.jsonl]');
    process.exitCode = 2;
    return;
  }
  const candidates = historicalOcrCandidates({
    xml: fs.readFileSync(xmlFile, 'utf8'),
    inventory: inventoryFile ? readJsonLines(inventoryFile) : null,
  });
  candidates.forEach(candidate => console.log(JSON.stringify(candidate)));
  console.error(`${candidates.length} kandidat(er) fundet.`);
};

if (fileURLToPath(import.meta.url) === process.argv[1]) main();

export { historicalOcrCandidates };
