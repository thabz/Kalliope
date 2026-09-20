import {
  analyzeStanzaGeometry,
  parseTesseractTsv,
} from '../.codex/skills/pdf-to-kalliope/scripts/analyze-stanza-geometry.js';

const linesAt = tops => tops.map((top, index) => ({
  page: 1,
  left: 375,
  top,
  width: 600,
  height: 32,
  text: `Verslinje ${index + 1}`,
}));

describe('facsimile stanza geometry', () => {
  it('finds the three printed stanza gaps on the Tempelvers page', () => {
    const result = analyzeStanzaGeometry({
      lines: linesAt([
        615, 678, 742,
        931, 996, 1071,
        1252, 1326, 1379,
        1570, 1635, 1698,
      ]),
    });

    expect(result.pages[0].normal_line_pitch).toBe(65);
    expect(result.suggested_boundaries).toEqual([3, 6, 9]);
    expect(result.suggested_stanza_lengths).toEqual([3, 3, 3, 3]);
    expect(result.candidates.every(
      candidate => candidate.type === 'possible_stanza_boundary'
    )).toBe(true);
  });

  it('rejects a false 2+1 XML split when vertical spacing is normal', () => {
    const result = analyzeStanzaGeometry({
      lines: linesAt([100, 164, 228, 420, 484, 548]),
      observed_boundaries: [2, 3],
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_extra_boundary',
        after_verse_line: 2,
        confidence: 'strong',
      }),
    ]);
  });

  it('keeps borderline distances as explicit manual candidates', () => {
    const result = analyzeStanzaGeometry({
      lines: linesAt([100, 200, 350, 450, 550]),
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'ambiguous_boundary_geometry',
        after_verse_line: 2,
        ratio: 1.5,
        confidence: 'possible',
      }),
    ]);
  });

  it('does not infer a boundary across facsimile pages', () => {
    const lines = [
      ...linesAt([100, 164, 228]),
      ...linesAt([900, 964, 1028]).map(line => ({ ...line, page: 2 })),
    ];
    const result = analyzeStanzaGeometry({ lines });

    expect(result.suggested_boundaries).toEqual([]);
    expect(result.pages).toHaveLength(2);
    expect(result.pages.every(page => page.normal_line_pitch === 64)).toBe(true);
  });

  it('groups Tesseract words into positioned OCR lines', () => {
    const header = 'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext';
    const tsv = [
      header,
      '5\t1\t1\t1\t1\t1\t100\t200\t40\t20\t96\tFørste',
      '5\t1\t1\t1\t1\t2\t150\t198\t30\t24\t95\tlinje',
      '5\t1\t1\t1\t2\t1\t101\t260\t50\t21\t94\tAnden',
      '',
    ].join('\n');

    expect(parseTesseractTsv(tsv)).toEqual([
      {
        page: 1,
        left: 100,
        top: 198,
        width: 80,
        height: 24,
        text: 'Første linje',
      },
      {
        page: 1,
        left: 101,
        top: 260,
        width: 50,
        height: 21,
        text: 'Anden',
      },
    ]);
  });

  it('removes narrow decorative artifacts at page edges', () => {
    const header = 'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext';
    const tsv = [
      header,
      '1\t1\t0\t0\t0\t0\t0\t0\t2000\t2800\t-1\t',
      '5\t1\t1\t1\t1\t1\t35\t200\t3\t30\t80\t|',
      '5\t1\t1\t1\t1\t2\t400\t200\t80\t30\t96\tFørste',
      '5\t1\t1\t1\t1\t3\t490\t200\t60\t30\t96\tlinje',
      '5\t1\t1\t1\t1\t4\t1930\t200\t4\t30\t80\t|',
    ].join('\n');

    expect(parseTesseractTsv(tsv)).toEqual([
      {
        page: 1,
        left: 400,
        top: 200,
        width: 150,
        height: 30,
        text: 'Første linje',
      },
    ]);
  });

  it('validates thresholds and observed boundaries', () => {
    expect(() => analyzeStanzaGeometry({ lines: [] })).not.toThrow();
    expect(() => analyzeStanzaGeometry({ lines: linesAt([10, 20]), thresholds: {
      aligned_max_ratio: 1.8,
      boundary_min_ratio: 1.5,
    } })).toThrow('Geometritærsklerne');
    expect(() => analyzeStanzaGeometry({
      lines: linesAt([10, 20]),
      observed_boundaries: [2],
    })).toThrow('observed_boundaries');
  });
});
