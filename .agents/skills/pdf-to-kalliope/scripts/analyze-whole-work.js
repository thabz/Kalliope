#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';
import { analyzeIndentation } from './analyze-indentation.js';
import { analyzeIndentationGeometry } from './analyze-indentation-geometry.js';
import { analyzeStanzaGeometry } from './analyze-stanza-geometry.js';
import { analyzeStanzas } from './analyze-stanzas.js';
import { directChild, parseXml, serializeChildren, textEntries } from './audit-utils.js';
import {
  loadTsvVariants,
  preparePoetryGeometry,
} from './prepare-poetry-geometry.js';

const longBlockThreshold = 80;

const plainText = line =>
  line
    .replace(/<[^>]+>/gu, '')
    .replace(/&nbsp;/gu, ' ')
    .trim();

const isVerseLine = line =>
  line.trim() !== '' &&
  !/<nonum(?:\s|>)/u.test(line) &&
  !/^\s*<wrap(?:\s|>)/u.test(line) &&
  !/^\s*<right(?:\s|>)/u.test(line) &&
  !/^\s*-{3,}\s*$/u.test(line) &&
  plainText(line) !== '';

const bodyAndPageBreaks = serializedBody => {
  let verseLine = 0;
  let pendingPageBreak = false;
  const pageBreaks = [];
  const body = serializedBody
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .map(line => {
      if (/<pb\b[^>]*\/>/u.test(line)) pendingPageBreak = true;
      const withoutPageBreak = line.replace(/<pb\b[^>]*\/>/gu, '');
      if (isVerseLine(withoutPageBreak)) {
        verseLine += 1;
        if (pendingPageBreak) {
          pageBreaks.push(verseLine);
          pendingPageBreak = false;
        }
      }
      return withoutPageBreak;
    })
    .join('\n');
  return { body, page_breaks: pageBreaks };
};

const poetryBlocks = xml => {
  const document = parseXml(xml);
  return textEntries(document).flatMap(entry => {
    const textId = entry.getAttribute('id') ?? '';
    const source = directChild(directChild(entry, 'head'), 'source');
    return Array.from(directChild(entry, 'body')?.getElementsByTagName('poetry') ?? [])
      .map((poetry, blockIndex) => ({
        text_id: textId,
        pages: source?.getAttribute('pages') ?? null,
        block_index: blockIndex + 1,
        ...bodyAndPageBreaks(serializeChildren(poetry)),
      }));
  });
};

const geometrySummary = preparation => ({
  status: preparation.status,
  poetry_block_count: preparation.poetry_block_count,
  ready_block_count: preparation.blocks.filter(block => block.geometry_ready).length,
  manual_review_block_count: preparation.blocks.filter(
    block => !block.geometry_ready
  ).length,
  stanza_ready_block_count: preparation.blocks.filter(
    block => block.stanza_geometry_ready ?? block.geometry_ready
  ).length,
  indentation_ready_block_count: preparation.blocks.filter(
    block => block.indentation_geometry_ready ?? block.geometry_ready
  ).length,
  expected_line_count: preparation.blocks.reduce(
    (sum, block) => sum + block.coverage.expected_line_count,
    0
  ),
  matched_line_count: preparation.blocks.reduce(
    (sum, block) => sum + block.coverage.matched_line_count,
    0
  ),
  safe_geometry_line_count: preparation.blocks.reduce(
    (sum, block) => sum + block.coverage.safe_geometry_line_count,
    0
  ),
  excluded_ocr_line_count: preparation.blocks.reduce(
    (sum, block) => sum + block.excluded.length,
    0
  ),
});

const analyzeWholeWork = (xml, options = {}) => {
  const preparation = options.variantsByFacsimile == null
    ? null
    : preparePoetryGeometry({
      xml,
      variantsByFacsimile: options.variantsByFacsimile,
    });
  const geometryByBlock = new Map((preparation?.blocks ?? []).map(block => [
    `${block.text_id}:${block.block_index}`,
    block,
  ]));
  const poems = poetryBlocks(xml).map(poem => {
    const stanza = analyzeStanzas({ body: poem.body });
    const indentation = analyzeIndentation({
      body: poem.body,
      page_breaks: poem.page_breaks,
    });
    const longUnbrokenBlock =
      stanza.observed_stanza_lengths.length === 1 &&
      stanza.verse_line_count >= longBlockThreshold;
    const unresolvedIndentationPattern =
      indentation.status === 'no_stable_pattern';
    const preparedGeometry = geometryByBlock.get(
      `${poem.text_id}:${poem.block_index}`
    ) ?? null;
    const stanzaGeometry = (
      preparedGeometry?.stanza_geometry_ready ?? preparedGeometry?.geometry_ready
    )
      ? analyzeStanzaGeometry({
        lines: preparedGeometry.lines,
        observed_boundaries: preparedGeometry.observed_boundaries,
      })
      : null;
    const indentationGeometry = (
      preparedGeometry?.indentation_geometry_ready ?? preparedGeometry?.geometry_ready
    )
      ? analyzeIndentationGeometry({
        lines: preparedGeometry.lines,
        observed_indentation: preparedGeometry.observed_indentation,
        indentation_sections: preparedGeometry.indentation_sections,
      })
      : null;
    const geometry = preparedGeometry == null ? null : {
      status: preparedGeometry.status,
      stanza_geometry_ready:
        preparedGeometry.stanza_geometry_ready ?? preparedGeometry.geometry_ready,
      indentation_geometry_ready:
        preparedGeometry.indentation_geometry_ready ?? preparedGeometry.geometry_ready,
      coverage: preparedGeometry.coverage,
      selected_variants: preparedGeometry.selected_variants,
      excluded_ocr_line_count: preparedGeometry.excluded.length,
      ambiguous: preparedGeometry.ambiguous,
      stanza: stanzaGeometry,
      indentation: indentationGeometry,
    };
    return {
      text_id: poem.text_id,
      pages: poem.pages,
      block_index: poem.block_index,
      page_breaks: poem.page_breaks,
      stanza,
      indentation,
      ...(geometry == null ? {} : { geometry }),
      candidates: [
        ...stanza.candidates.map(candidate => ({
          source: 'stanza',
          ...candidate,
          at_page_break:
            Number.isInteger(candidate.after_verse_line) &&
            poem.page_breaks.includes(candidate.after_verse_line + 1),
        })),
        ...indentation.candidates.map(candidate => ({ source: 'indentation', ...candidate })),
        ...(longUnbrokenBlock ? [{
          source: 'wrapper',
          type: 'very-long-unbroken-block',
          verse_line_count: stanza.verse_line_count,
          reason: `Poesiblokken har ${stanza.verse_line_count} linjer uden strofegrænser.`,
        }] : []),
        ...(unresolvedIndentationPattern ? [{
          source: 'wrapper',
          type: 'indentation_pattern_unresolved',
          verse_line_count: indentation.verse_line_count,
          reason:
            'Indrykningsanalysen kunne ikke etablere et stabilt mønster. Profilen skal kontrolleres og dispositioneres manuelt mod facsimilet.',
          action:
            'Kontrollér først strofegrænserne, kør analysen igen, og registrér derefter den facsimilebaserede vurdering.',
        }] : []),
        ...(stanzaGeometry?.candidates ?? []).map(candidate => ({
          source: 'stanza_geometry',
          ...candidate,
        })),
        ...(indentationGeometry?.candidates ?? []).map(candidate => ({
          source: 'indentation_geometry',
          ...candidate,
        })),
        ...(preparedGeometry != null && !preparedGeometry.geometry_ready ? [{
          source: 'geometry_preparation',
          type: 'geometry_manual_review',
          coverage: preparedGeometry.coverage,
          issues: preparedGeometry.ambiguous,
          reason: preparedGeometry.indentation_geometry_ready &&
            !preparedGeometry.stanza_geometry_ready
            ? 'OCR og XML er sikkert forbundet linjevis, men strofegeometrien kræver manuel kontrol.'
            : 'OCR og XML kunne ikke forbindes sikkert én-til-én for hele poesiblokken.',
        }] : []),
      ],
    };
  });
  return {
    poems,
    ...(preparation == null ? {} : {
      geometry_summary: geometrySummary(preparation),
    }),
  };
};

const main = () => {
  const [xmlFile, tsvDirectory] = process.argv.slice(2);
  if (!xmlFile) {
    console.error('Brug: node analyze-whole-work.js WORK.xml [TSV_DIRECTORY]');
    process.exitCode = 2;
    return;
  }
  const options = tsvDirectory == null
    ? {}
    : { variantsByFacsimile: loadTsvVariants(tsvDirectory) };
  console.log(JSON.stringify(
    analyzeWholeWork(fs.readFileSync(xmlFile, 'utf8'), options),
    null,
    2
  ));
};

if (fileURLToPath(import.meta.url) === process.argv[1]) main();

export { analyzeWholeWork, poetryBlocks };
