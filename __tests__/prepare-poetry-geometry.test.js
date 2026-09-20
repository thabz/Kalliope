import {
  alignPage,
  extractPoetryBlocks,
  facsimileFromTsvFilename,
  normalizeForMatch,
  preparePoetryGeometry,
} from '../.codex/skills/pdf-to-kalliope/scripts/prepare-poetry-geometry.js';

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<kalliopework id="fixture" author="fixture">
<workhead>
  <source facsimile-pages-offset="5">Fixture</source>
</workhead>
<workbody>
<text id="poem1">
<head><source pages="8-9"/></head>
<body>
<poetry>
Første Verslinje
    Anden Verslinje

Tredje Verslinje
<right>Forfatter.</right>
<pb n="9" facs="013.jpg"/>Fjerde Verslinje
</poetry>
</body>
</text>
</workbody>
</kalliopework>`;

const ocrLine = (text, top, left = 300) => ({
  page: 1,
  left,
  top,
  width: text.length * 18,
  height: 30,
  text,
});

describe('forberedelse af helværksgeometri', () => {
  it('extracts page-aware verse lines without using whitespace as match text', () => {
    const [block] = extractPoetryBlocks(xml);

    expect(block.lines).toEqual([
      expect.objectContaining({
        source_verse_line: 1,
        text: 'Første Verslinje',
        indentation: 0,
        facsimile: '012.jpg',
      }),
      expect.objectContaining({
        source_verse_line: 2,
        text: 'Anden Verslinje',
        indentation: 4,
        facsimile: '012.jpg',
      }),
      expect.objectContaining({
        source_verse_line: 3,
        text: 'Tredje Verslinje',
        facsimile: '012.jpg',
      }),
      expect.objectContaining({
        source_verse_line: 4,
        text: 'Fjerde Verslinje',
        facsimile: '013.jpg',
      }),
    ]);
    expect(block.observedBoundaries).toEqual([2, 3]);
    expect(block.lines.map(line => line.indentation_section)).toEqual([1, 1, 1, 1]);
    expect(block.equipment).toEqual([
      expect.objectContaining({
        text: 'Forfatter.',
        facsimile: '012.jpg',
        after_source_verse_line: 3,
      }),
    ]);
  });

  it('includes poetry blocks inside prose text entries', () => {
    const proseEntryXml = xml
      .replace('<text id="poem1">', '<prose id="poem1">')
      .replace('</text>', '</prose>');

    expect(extractPoetryBlocks(proseEntryXml)).toHaveLength(1);
  });

  it('preserves semantic XML dividers as observed boundaries', () => {
    const dividedXml = xml.replace(
      'Tredje Verslinje',
      'Tredje Verslinje\n<nonum><center>II.</center></nonum>',
    );
    const [block] = extractPoetryBlocks(dividedXml);

    expect(block.observedBoundaries).toEqual([2, 3]);
    expect(block.lines.map(line => line.indentation_section)).toEqual([1, 1, 1, 2]);
  });

  it('selects the best OCR variant and explicitly excludes page equipment', () => {
    const result = preparePoetryGeometry({
      xml,
      variantsByFacsimile: {
        '012.jpg': [
          {
            name: '012-psm3.tsv',
            lines: [
              ocrLine('8', 40),
              ocrLine('Første Verslinie', 200),
              ocrLine('Anden Verslinie', 260, 380),
              ocrLine('Tredje Verslinie', 380),
              ocrLine('M. E. Matthiessen', 700),
            ],
          },
          {
            name: '012-psm6.tsv',
            lines: [
              ocrLine('Fvrste ulæselig', 200),
              ocrLine('Andet ulæseligt', 260),
            ],
          },
        ],
        '013.jpg': [{
          name: '013-psm6.tsv',
          lines: [ocrLine('Fjerde Verslinje', 120)],
        }],
      },
    });
    const [block] = result.blocks;

    expect(result.status).toBe('ready');
    expect(block.geometry_ready).toBe(true);
    expect(block.lines).toHaveLength(4);
    expect(block.observed_boundaries).toEqual([2, 3]);
    expect(block.observed_indentation).toEqual([0, 4, 0, 0]);
    expect(block.indentation_sections).toEqual([1, 1, 1, 1]);
    expect(block.selected_variants).toEqual([
      expect.objectContaining({ facsimile: '012.jpg', variant: '012-psm3.tsv' }),
      expect.objectContaining({ facsimile: '013.jpg', variant: '013-psm6.tsv' }),
    ]);
    expect(block.excluded).toEqual([
      expect.objectContaining({ reason: 'page_or_section_number' }),
      expect.objectContaining({ reason: 'unmatched_page_content' }),
    ]);
    expect(block.coverage).toEqual({
      expected_line_count: 4,
      matched_line_count: 4,
      safe_geometry_line_count: 4,
      ratio: 1,
    });
  });

  it('does not make equivalent OCR variants ambiguous because equipment differs', () => {
    const onePageXml = xml.replace(
      '<pb n="9" facs="013.jpg"/>Fjerde Verslinje',
      'Fjerde Verslinje',
    ).replace('pages="8-9"', 'pages="8"');
    const verseLines = [
      ocrLine('Første Verslinje', 200),
      ocrLine('Anden Verslinje', 260),
      ocrLine('Tredje Verslinje', 380),
      ocrLine('Fjerde Verslinje', 440),
    ];
    const result = preparePoetryGeometry({
      xml: onePageXml,
      variantsByFacsimile: {
        '012.jpg': [
          { name: '012-psm3.tsv', lines: [ocrLine('8', 40), ...verseLines] },
          { name: '012-psm6.tsv', lines: verseLines },
        ],
      },
    });

    expect(result.status).toBe('ready');
    expect(result.blocks[0].ambiguous).toEqual([]);
    expect(result.blocks[0].excluded).toHaveLength(1);
  });

  it('recognizes structural XML text as known equipment inside a poem', () => {
    const onePageXml = xml.replace(
      '<pb n="9" facs="013.jpg"/>Fjerde Verslinje',
      'Fjerde Verslinje',
    ).replace('pages="8-9"', 'pages="8"');
    const result = preparePoetryGeometry({
      xml: onePageXml,
      variantsByFacsimile: {
        '012.jpg': [{
          name: '012-psm3.tsv',
          lines: [
            ocrLine('Første Verslinje', 200),
            ocrLine('Anden Verslinje', 260),
            ocrLine('Tredje Verslinje', 380),
            ocrLine('Forfatter.', 420, 800),
            ocrLine('Fjerde Verslinje', 500),
          ],
        }],
      },
    });

    expect(result.status).toBe('ready');
    expect(result.blocks[0].ambiguous).toEqual([]);
    expect(result.blocks[0].excluded).toEqual([
      expect.objectContaining({ reason: 'known_xml_equipment' }),
    ]);
  });

  it('requires review for an unmatched OCR line inside a poem', () => {
    const onePageXml = xml.replace(
      '<pb n="9" facs="013.jpg"/>Fjerde Verslinje',
      'Fjerde Verslinje',
    ).replace('pages="8-9"', 'pages="8"');
    const result = preparePoetryGeometry({
      xml: onePageXml,
      variantsByFacsimile: {
        '012.jpg': [{
          name: '012-psm3.tsv',
          lines: [
            ocrLine('Første Verslinje', 200),
            ocrLine('Anden Verslinje', 260),
            ocrLine('Denne verslinje findes kun i OCR', 320),
            ocrLine('Tredje Verslinje', 380),
            ocrLine('Fjerde Verslinje', 440),
          ],
        }],
      },
    });

    expect(result.status).toBe('manual_review');
    expect(result.blocks[0].geometry_ready).toBe(false);
    expect(result.blocks[0].ambiguous).toEqual([
      expect.objectContaining({
        type: 'unmatched_internal_ocr_line',
        text: 'Denne verslinje findes kun i OCR',
      }),
    ]);
  });

  it.each([
    {
      name: 'missing',
      expected: ['Første linje', 'Anden linje'],
      ocr: ['Første linje'],
      type: 'missing_xml',
    },
    {
      name: 'merged OCR',
      expected: ['En meget lang verslinje'],
      ocr: ['En meget lang', 'verslinje'],
      type: 'merge_ocr',
    },
    {
      name: 'split XML',
      expected: ['Første halve', 'anden halve'],
      ocr: ['Første halve anden halve'],
      type: 'split_xml',
    },
  ])('keeps $name matches out of safe geometry', ({ expected, ocr, type }) => {
    const result = alignPage({
      expectedLines: expected.map(text => ({ text, blockKey: 'poem:1' })),
      ocrLines: ocr.map((text, index) => ocrLine(text, index * 50)),
    });

    expect(result.operations).toEqual(expect.arrayContaining([
      expect.objectContaining({ type }),
    ]));
  });

  it('keeps a physically wrapped XML verse as one geometry line', () => {
    const wrappedXml = xml.replace(
      /<poetry>[\s\S]*?<\/poetry>/u,
      '<poetry>En meget lang verslinje</poetry>',
    ).replace('pages="8-9"', 'pages="8"');
    const result = preparePoetryGeometry({
      xml: wrappedXml,
      variantsByFacsimile: {
        '012.jpg': [{
          name: '012-psm6.tsv',
          lines: [
            ocrLine('En meget lang', 200),
            ocrLine('verslinje', 260),
          ],
        }],
      },
    });

    expect(result.status).toBe('ready');
    expect(result.blocks[0].lines).toEqual([
      expect.objectContaining({
        source_verse_line: 1,
        physical_line_span: 2,
        text: 'En meget lang verslinje',
      }),
    ]);
    expect(result.blocks[0].ambiguous).toEqual([]);
  });

  it('prefers a complete physical wrap over a truncated high-similarity row', () => {
    const wrappedXml = xml.replace(
      /<poetry>[\s\S]*?<\/poetry>/u,
      '<poetry>En Blomst kun af Grenen, hvor Livets Æbler hang!</poetry>',
    ).replace('pages="8-9"', 'pages="8"');
    const result = preparePoetryGeometry({
      xml: wrappedXml,
      variantsByFacsimile: {
        '012.jpg': [{
          name: '012-psm3.tsv',
          lines: [
            ocrLine('En Blomst kun af Grenen, hvor Livets Æbler', 200),
            ocrLine('hang!', 260, 900),
          ],
        }],
      },
    });

    expect(result.blocks[0].lines[0]).toEqual(expect.objectContaining({
      physical_line_span: 2,
      text: 'En Blomst kun af Grenen, hvor Livets Æbler hang!',
    }));
  });

  it('marks dense physical wrapping for manual review', () => {
    const denseXml = xml.replace(
      /<poetry>[\s\S]*?<\/poetry>/u,
      '<poetry>Første lange linje\nAnden lange linje\nTredje lange linje\nFjerde lange linje</poetry>',
    ).replace('pages="8-9"', 'pages="8"');
    const lines = [
      ['Første lange', 'linje'],
      ['Anden lange', 'linje'],
      ['Tredje lange', 'linje'],
      ['Fjerde lange', 'linje'],
    ].flatMap((parts, index) => parts.map((text, part) =>
      ocrLine(text, 200 + index * 120 + part * 50, part === 0 ? 300 : 700)
    ));
    const result = preparePoetryGeometry({
      xml: denseXml,
      variantsByFacsimile: {
        '012.jpg': [{ name: '012-psm3.tsv', lines }],
      },
    });

    expect(result.status).toBe('manual_review');
    expect(result.blocks[0].ambiguous).toEqual([
      expect.objectContaining({
        type: 'dense_physical_wrapping',
        physically_wrapped_line_count: 4,
      }),
    ]);
  });

  it.each([
    ['— det er næsten for ofte sagt', 'det er næsten for ofte sagt'],
    ['skal det svinge sig frit', 'al det svinge sig frit'],
  ])('marks a missing OCR line start as unsafe for indentation', (source, ocr) => {
    const oneLineXml = xml.replace(
      /<poetry>[\s\S]*?<\/poetry>/u,
      `<poetry>${source}</poetry>`,
    ).replace('pages="8-9"', 'pages="8"');
    const result = preparePoetryGeometry({
      xml: oneLineXml,
      variantsByFacsimile: {
        '012.jpg': [{ name: '012-psm3.tsv', lines: [ocrLine(ocr, 200, 420)] }],
      },
    });

    expect(result.blocks[0].lines[0]).toEqual(expect.objectContaining({
      indentation_geometry_safe: false,
      indentation_geometry_issue: 'ocr_missing_leading_content',
    }));
  });

  it('normalizes historical glyphs and recognizes supported TSV names', () => {
    expect(normalizeForMatch('Høi ſang, Ære!')).toBe('hoisangære'.replace('æ', 'ae'));
    expect(facsimileFromTsvFilename('page-013-psm6.tsv')).toBe('013.jpg');
    expect(facsimileFromTsvFilename('notes.tsv')).toBeNull();
  });
});
