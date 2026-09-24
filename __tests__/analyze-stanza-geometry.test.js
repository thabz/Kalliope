import {
  analyzeStanzaGeometry,
  parseTesseractTsv,
} from '../.agents/skills/pdf-to-kalliope/scripts/analyze-stanza-geometry.js';

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
      lines: linesAt([100, 200, 330, 430, 530]),
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'ambiguous_boundary_geometry',
        after_verse_line: 2,
        ratio: 1.3,
        confidence: 'possible',
      }),
    ]);
  });

  it('keeps a moderately spaced XML boundary manual instead of rejecting it', () => {
    const result = analyzeStanzaGeometry({
      lines: linesAt([100, 200, 320, 420, 520]),
      observed_boundaries: [2],
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'ambiguous_boundary_geometry',
        after_verse_line: 2,
        observed_boundary: true,
        confidence: 'possible',
      }),
    ]);
  });

  it('recognizes the moderate stanza gap used across a reviewed anthology', () => {
    const result = analyzeStanzaGeometry({
      lines: linesAt([100, 200, 350, 450, 550]),
    });

    expect(result.suggested_boundaries).toEqual([2]);
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

  it('does not mistake a physically wrapped verse line for a stanza gap', () => {
    const lines = linesAt([100, 200, 400, 500]);
    lines[1].physical_line_span = 2;
    const result = analyzeStanzaGeometry({ lines });

    expect(result.pages[0].normal_line_pitch).toBe(100);
    expect(result.pages[0].gaps[1]).toEqual(expect.objectContaining({
      preceding_physical_line_span: 2,
      ratio: 1,
      classification: 'continuous',
    }));
    expect(result.suggested_boundaries).toEqual([]);
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
        anchor_left: 100,
        anchor_center_y: 210,
        centre_x: 140,
        centre_y: 210,
        text: 'Første linje',
      },
      {
        page: 1,
        left: 101,
        top: 260,
        width: 50,
        height: 21,
        anchor_left: 101,
        anchor_center_y: 270.5,
        centre_x: 126,
        centre_y: 270.5,
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
      '5\t1\t1\t1\t1\t2\t60\t200\t61\t30\t30\tAN:',
      '5\t1\t1\t1\t1\t3\t400\t200\t80\t30\t96\tFørste',
      '5\t1\t1\t1\t1\t4\t490\t200\t60\t30\t96\tlinje',
      '5\t1\t1\t1\t1\t5\t1930\t200\t4\t30\t80\t|',
    ].join('\n');

    expect(parseTesseractTsv(tsv)).toEqual([
      {
        page: 1,
        left: 400,
        top: 200,
        width: 150,
        height: 30,
        anchor_left: 400,
        anchor_center_y: 215,
        centre_x: 475,
        centre_y: 215,
        text: 'Første linje',
      },
    ]);
  });

  it('preserves confident short words at the text edge', () => {
    const header = 'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext';
    const tsv = [
      header,
      '1\t1\t0\t0\t0\t0\t0\t0\t1400\t2200\t-1\t',
      '5\t1\t1\t1\t1\t1\t7\t200\t38\t30\t92\tI',
      '5\t1\t1\t1\t1\t2\t60\t200\t130\t30\t96\tDanmark',
      '5\t1\t1\t1\t2\t1\t29\t260\t48\t30\t96\tog',
      '5\t1\t1\t1\t2\t2\t90\t260\t180\t30\t96\tPolens',
    ].join('\n');

    expect(parseTesseractTsv(tsv).map(line => ({
      left: line.left,
      text: line.text,
    }))).toEqual([
      { left: 7, text: 'I Danmark' },
      { left: 29, text: 'og Polens' },
    ]);
  });

  it('removes an uncertain single-glyph artifact before a verse line', () => {
    const header = 'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext';
    const tsv = [
      header,
      '1\t1\t0\t0\t0\t0\t0\t0\t1400\t2200\t-1\t',
      '5\t1\t1\t1\t1\t1\t28\t200\t8\t30\t76\ti',
      '5\t1\t1\t1\t1\t2\t150\t200\t130\t30\t96\tNoget',
    ].join('\n');

    expect(parseTesseractTsv(tsv)[0]).toEqual(expect.objectContaining({
      left: 150,
      text: 'Noget',
    }));
  });

  it.each([7, -7])(
    'preserves stanza gaps after correcting a %s degree rotation',
    angleDegrees => {
      const angle = angleDegrees * Math.PI / 180;
      const tops = [100, 164, 228, 420, 484, 548, 740, 804, 868];
      const lines = tops.map((y, index) => {
        const x = 350 + (index % 3) * 140;
        const screenX = x * Math.cos(angle) - y * Math.sin(angle);
        const screenY = x * Math.sin(angle) + y * Math.cos(angle);
        return {
          page: 1,
          left: screenX - 250,
          top: screenY - 16,
          width: 500,
          height: 32,
          centre_x: screenX,
          centre_y: screenY,
          rotation_slope: Math.tan(angle),
          text: `Verslinje ${index + 1}`,
        };
      });
      const result = analyzeStanzaGeometry({ lines });

      expect(result.pages[0].rotation_degrees).toBeCloseTo(angleDegrees, 3);
      expect(result.suggested_boundaries).toEqual([3, 6]);
      expect(result.suggested_stanza_lengths).toEqual([3, 3, 3]);
    }
  );

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
