#!/usr/bin/env node

import fs from 'fs';
import { fileURLToPath } from 'url';
import { analyzeIndentation } from './analyze-indentation.js';
import { analyzeStanzas } from './analyze-stanzas.js';
import { directChild, parseXml, serializeChildren, textEntries } from './audit-utils.js';

const longBlockThreshold = 80;

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
        body: serializeChildren(poetry).replace(/<pb\b[^>]*\/>/g, ''),
      }));
  });
};

const analyzeWholeWork = xml => ({
  poems: poetryBlocks(xml).map(poem => {
    const stanza = analyzeStanzas({ body: poem.body });
    const indentation = analyzeIndentation({ body: poem.body });
    const longUnbrokenBlock =
      stanza.observed_stanza_lengths.length === 1 &&
      stanza.verse_line_count >= longBlockThreshold;
    const unresolvedIndentationPattern =
      indentation.status === 'no_stable_pattern';
    return {
      text_id: poem.text_id,
      pages: poem.pages,
      block_index: poem.block_index,
      stanza,
      indentation,
      candidates: [
        ...stanza.candidates.map(candidate => ({ source: 'stanza', ...candidate })),
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
      ],
    };
  }),
});

const main = () => {
  const [xmlFile] = process.argv.slice(2);
  if (!xmlFile) {
    console.error('Brug: node analyze-whole-work.js WORK.xml');
    process.exitCode = 2;
    return;
  }
  console.log(JSON.stringify(analyzeWholeWork(fs.readFileSync(xmlFile, 'utf8')), null, 2));
};

if (fileURLToPath(import.meta.url) === process.argv[1]) main();

export { analyzeWholeWork, poetryBlocks };
