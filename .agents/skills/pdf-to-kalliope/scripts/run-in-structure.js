import { parseXml } from './audit-utils.js';

const pageBreakPattern = /<pb\b[^>]*\bfacs="([^"]+)"[^>]*\/>/gu;

const visibleText = xml => parseXml(`<fragment>${xml
  .replace(/<!--[\s\S]*?-->/gu, '')
  .replace(/<[^>]+>/gu, '')}</fragment>`)
  .documentElement.textContent;

// A wrap is a printed running stanza, not a reconstructed verse line.
// Keep physical page segments separate, including page breaks inside words.
const extractRunInUnits = ({ serialized, startingFacsimile = null }) => {
  const units = [];
  let facsimile = startingFacsimile;
  let cursor = 0;
  for (const match of serialized.matchAll(/<wrap\b[^>]*>([\s\S]*?)<\/wrap>/gu)) {
    const preceding = serialized.slice(cursor, match.index);
    for (const pageBreak of preceding.matchAll(pageBreakPattern)) {
      facsimile = pageBreak[1];
    }
    const lineStart = serialized.lastIndexOf('\n', match.index - 1) + 1;
    const prefix = serialized.slice(lineStart, match.index).replace(pageBreakPattern, '');
    const indentation = /^[ \t]*$/u.test(prefix) === true
      ? [...prefix].reduce((sum, character) => sum + (character === '\t' ? 4 : 1), 0)
      : 0;
    const segments = [];
    let segmentStart = 0;
    const appendSegment = end => {
      const text = visibleText(match[1].slice(segmentStart, end));
      if (text.trim() !== '') segments.push({ facsimile, text });
    };
    for (const pageBreak of match[1].matchAll(pageBreakPattern)) {
      appendSegment(pageBreak.index);
      facsimile = pageBreak[1];
      segmentStart = pageBreak.index + pageBreak[0].length;
    }
    appendSegment(match[1].length);
    units.push({
      unit_index: units.length + 1,
      indentation,
      text: segments.map(segment => segment.text).join(''),
      segments,
    });
    cursor = match.index + match[0].length;
  }
  return units;
};

export { extractRunInUnits };
