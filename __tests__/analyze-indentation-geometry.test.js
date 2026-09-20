import { analyzeIndentationGeometry } from '../.codex/skills/pdf-to-kalliope/scripts/analyze-indentation-geometry.js';

const linesAt = lefts => lefts.map((left, index) => ({
  page: 1,
  left,
  top: 100 + index * 64,
  width: 600,
  height: 32,
  character_advance: 20,
  text: `Verslinje ${index + 1}`,
}));

describe('facsimile indentation geometry', () => {
  it('treats the measured Tempelvers variation as aligned noise', () => {
    const result = analyzeIndentationGeometry({
      lines: linesAt([374, 375, 376, 376, 375, 375, 377, 378, 379, 376, 379, 378]),
    });

    expect(result.suggested_indented_lines).toEqual([]);
    expect(result.candidates).toEqual([]);
    expect(result.pages[0].measurements.every(
      measurement => measurement.classification === 'aligned'
    )).toBe(true);
  });

  it('finds repeated displacements greater than one character', () => {
    const result = analyzeIndentationGeometry({
      lines: linesAt([100, 100, 140, 100, 100, 140]),
      observed_indentation: [0, 0, 0, 0, 0, 0],
    });

    expect(result.suggested_indented_lines).toEqual([3, 6]);
    expect(result.candidates.map(candidate => candidate.type)).toEqual([
      'possible_missing_indentation',
      'possible_missing_indentation',
    ]);
  });

  it('reports raw OCR indentation without claiming that XML is missing it', () => {
    const result = analyzeIndentationGeometry({
      lines: linesAt([100, 100, 140]),
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_indentation',
        verse_line: 3,
      }),
    ]);
  });

  it('rejects XML indentation when the printed starts are aligned', () => {
    const result = analyzeIndentationGeometry({
      lines: linesAt([100, 101, 99, 100, 102, 100]),
      observed_indentation: [0, 0, 4, 0, 0, 4],
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_extra_indentation',
        verse_line: 3,
        confidence: 'strong',
      }),
      expect.objectContaining({
        type: 'possible_extra_indentation',
        verse_line: 6,
        confidence: 'strong',
      }),
    ]);
  });

  it('reports displacements between one and one-and-a-half characters as ambiguous', () => {
    const result = analyzeIndentationGeometry({
      lines: linesAt([100, 100, 125, 100]),
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'ambiguous_indentation_geometry',
        verse_line: 3,
        displacement_characters: 1.25,
      }),
    ]);
  });

  it('estimates independent baselines on separate pages', () => {
    const lines = [
      ...linesAt([100, 100, 140]),
      ...linesAt([300, 300, 340]).map(line => ({
        ...line,
        page: 2,
        top: line.top + 800,
      })),
    ];
    const result = analyzeIndentationGeometry({ lines });

    expect(result.pages.map(page => page.baseline_left)).toEqual([100, 300]);
    expect(result.suggested_indented_lines).toEqual([3, 6]);
  });

  it('validates observed indentation and thresholds', () => {
    expect(() => analyzeIndentationGeometry({
      lines: linesAt([100, 100]),
      observed_indentation: [0],
    })).toThrow('observed_indentation');
    expect(() => analyzeIndentationGeometry({
      lines: linesAt([100, 100]),
      thresholds: {
        aligned_max_characters: 1.6,
        indent_min_characters: 1.5,
      },
    })).toThrow('Indrykningstærsklerne');
  });
});
