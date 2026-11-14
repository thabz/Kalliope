import { extractPoetryBlocks, normalizeForMatch, textSimilarity } from './prepare-poetry-geometry.js';

// OCR rows are observations, never editorial verse boundaries. Fragmented TSV
// boxes on the same baseline are assembled before contiguous windows are tried.
const physicalRows = lines => {
  const rows = [];
  [...lines].filter(line => String(line.text ?? '').trim() !== '')
    .sort((a, b) => a.top === b.top ? a.left - b.left : a.top - b.top)
    .forEach(line => {
      const centre = line.top + line.height / 2;
      const row = rows.at(-1);
      if (row != null && Math.abs(centre - row.centre) <= Math.min(row.height, line.height) * 0.4) {
        row.parts.push(line);
        row.top = Math.min(row.top, line.top);
        row.bottom = Math.max(row.bottom, line.top + line.height);
        row.height = row.bottom - row.top;
      } else {
        rows.push({ centre, top: line.top, bottom: line.top + line.height, height: line.height, parts: [line] });
      }
    });
  return rows.map((row, index) => {
    const parts = row.parts.sort((a, b) => a.left - b.left);
    const text = parts.map(part => part.text).join(' ');
    return { row_index: index, text, normalized: normalizeForMatch(text), left: parts[0].left,
      top: row.top, width: Math.max(...parts.map(part => part.left + part.width)) - parts[0].left,
      height: row.height };
  });
};

const bigrams = text => {
  const result = new Map();
  for (let i = 0; i < text.length - 1; i += 1) {
    const pair = text.slice(i, i + 2);
    result.set(pair, (result.get(pair) ?? 0) + 1);
  }
  return result;
};
const coarseSimilarity = (wanted, actual, wantedPairs) => {
  if (wanted === actual) return 1;
  const actualPairs = bigrams(actual);
  let shared = 0;
  for (const [pair, count] of wantedPairs) shared += Math.min(count, actualPairs.get(pair) ?? 0);
  return 2 * shared / Math.max(1, wanted.length + actual.length - 2);
};

const candidateWindows = (text, rows, { maximumRows, shortlistSize, minimumSimilarity }) => {
  const wanted = normalizeForMatch(text);
  if (wanted.length === 0) return [];
  const pairs = bigrams(wanted);
  const shortlist = [];
  rows.forEach((_row, start) => {
    let actual = '';
    for (let end = start; end < Math.min(rows.length, start + maximumRows); end += 1) {
      actual += rows[end].normalized;
      if (actual.length > wanted.length * 1.65 + 8) break;
      if (actual.length < wanted.length * 0.55 - 4) continue;
      const coarse = coarseSimilarity(wanted, actual, pairs);
      if (shortlist.length === shortlistSize && coarse < shortlist.at(-1).coarse) continue;
      shortlist.push({ start, end: end + 1, actual, coarse });
      shortlist.sort((a, b) => b.coarse !== a.coarse ? b.coarse - a.coarse : a.start !== b.start ? a.start - b.start : a.end - b.end);
      if (shortlist.length > shortlistSize) shortlist.pop();
    }
  });
  return shortlist.map(candidate => ({ ...candidate, similarity: textSimilarity(wanted, candidate.actual) }))
    .filter(candidate => candidate.similarity >= minimumSimilarity)
    .sort((a, b) => b.similarity !== a.similarity ? b.similarity - a.similarity : a.start - b.start);
};

// Align every segment on a page jointly. Missing segments remain visible, and
// no OCR row can be consumed twice even for repeated refrains or duplicate text.
const alignSegments = (segments, rows, options) => {
  let states = new Map([[0, { score: 0, path: [] }]]);
  const candidateLists = segments.map(segment => candidateWindows(segment.text, rows, options));
  candidateLists.forEach(candidates => {
    const next = new Map();
    const keep = (end, state) => {
      if (next.has(end) === false || state.score > next.get(end).score) next.set(end, state);
    };
    for (const [previousEnd, state] of states) {
      keep(previousEnd, { score: state.score, path: [...state.path, null] });
      for (const candidate of candidates) {
        if (candidate.start < previousEnd) continue;
        keep(candidate.end, { score: state.score + candidate.similarity,
          path: [...state.path, candidate] });
      }
    }
    states = next;
  });
  const winner = [...states.values()].sort((a, b) => b.score - a.score)[0];
  return { ...winner, candidateLists };
};

const prepareRunInGeometry = ({ xml, variantsByFacsimile = {}, maximumRows = 40,
  shortlistSize = 18, minimumSimilarity = 0.55, ambiguityMargin = 0.035 }) => {
  const options = { maximumRows, shortlistSize, minimumSimilarity };
  const blocks = extractPoetryBlocks(xml).filter(block => block.runInUnits.length > 0);
  const byPage = new Map();
  const reports = blocks.map(block => ({ text_id: block.textId, block_index: block.blockIndex,
    units: block.runInUnits.map(unit => ({ unit_index: unit.unit_index, indentation: unit.indentation,
      segments: unit.segments.map((segment, index) => {
        const report = { segment_index: index + 1, facsimile: segment.facsimile, text: segment.text,
          status: 'missing_ocr', physical_line_count: 0, rows: [] };
        if (byPage.has(segment.facsimile) === false) byPage.set(segment.facsimile, []);
        byPage.get(segment.facsimile).push(report);
        return report;
      }) })) }));
  const pages = [];
  for (const [facsimile, segments] of byPage) {
    const variants = (variantsByFacsimile[facsimile] ?? []).map(variant => {
      const rows = physicalRows(variant.lines);
      return { name: variant.name, rows, ...alignSegments(segments, rows, options) };
    }).sort((a, b) => b.score !== a.score ? b.score - a.score : a.name.localeCompare(b.name));
    const selected = variants[0];
    if (selected == null) {
      pages.push({ facsimile, status: 'missing_ocr', segment_count: segments.length });
      continue;
    }
    const used = new Set();
    selected.path.forEach((match, index) => {
      const report = segments[index];
      report.variant = selected.name;
      if (match == null) { report.status = 'unmatched'; return; }
      const previousEnd = selected.path.slice(0, index).filter(value => value != null).at(-1)?.end ?? 0;
      const followingStart = selected.path.slice(index + 1).find(value => value != null)?.start ?? selected.rows.length;
      const alternatives = selected.candidateLists[index].filter(candidate =>
        candidate.start >= previousEnd && candidate.end <= followingStart &&
        (candidate.start !== match.start || candidate.end !== match.end) &&
        candidate.similarity >= match.similarity - ambiguityMargin);
      report.status = alternatives.length === 0 ? 'matched' : 'ambiguous';
      report.similarity = match.similarity;
      report.alternative_windows = alternatives.map(candidate => ({ first_row: candidate.start, end_row: candidate.end, similarity: candidate.similarity }));
      report.rows = selected.rows.slice(match.start, match.end).map(({ normalized: _normalized, ...row }) => row);
      report.physical_line_count = report.rows.length;
      report.variant_alternatives = variants.slice(1).flatMap(variant => {
        const alternative = variant.path[index];
        if (alternative == null || alternative.similarity < match.similarity - ambiguityMargin) return [];
        const alternativeRows = variant.rows.slice(alternative.start, alternative.end);
        const displaced = Math.abs(alternativeRows[0].top - report.rows[0].top) >
          Math.max(alternativeRows[0].height, report.rows[0].height);
        if (alternativeRows.length === report.rows.length && displaced === false) return [];
        return [{ variant: variant.name, similarity: alternative.similarity,
          physical_line_count: alternativeRows.length, first_top: alternativeRows[0].top }];
      });
      if (report.variant_alternatives.length > 0) report.status = 'ambiguous';
      report.first_text = report.rows[0].text;
      report.last_text = report.rows.at(-1).text;
      for (let row = match.start; row < match.end; row += 1) used.add(row);
    });
    pages.push({ facsimile, variant: selected.name, segment_count: segments.length,
      matched_segment_count: segments.filter(segment => segment.status === 'matched').length,
      unmatched_rows: selected.rows.filter(row => used.has(row.row_index) === false)
        .map(({ normalized: _normalized, ...row }) => row) });
  }
  return { status: reports.every(block => block.units.every(unit => unit.segments.every(segment => segment.status === 'matched'))) ? 'matched' : 'manual_review',
    blocks: reports, pages };
};

export { physicalRows, prepareRunInGeometry };
