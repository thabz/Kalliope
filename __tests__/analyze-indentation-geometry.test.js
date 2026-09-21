import { analyzeIndentationGeometry } from '../.agents/skills/pdf-to-kalliope/scripts/analyze-indentation-geometry.js';

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

  it('does not reject uniform XML indentation without a page baseline', () => {
    const result = analyzeIndentationGeometry({
      lines: linesAt([100, 101, 99]),
      observed_indentation: [3, 3, 3],
    });

    expect(result.pages[0].baseline_comparison).toBe('relative_only');
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'unanchored_page_indentation',
        page: 1,
        verse_lines: [1, 2, 3],
      }),
    ]);
  });

  it('rejects the false final-line indentation measured on Tempelvers page 10', () => {
    const starts = [
      896, 895, 893, 895, 894, 893, 894, 894, 894, 892, 893,
      893, 891, 892, 893, 892, 890, 889, 891, 889, 890, 890,
    ];
    const observedIndentation = Array(starts.length).fill(0);
    observedIndentation[starts.length - 1] = 4;
    const result = analyzeIndentationGeometry({
      lines: linesAt(starts),
      observed_indentation: observedIndentation,
    });

    expect(result.suggested_indented_lines).toEqual([]);
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_extra_indentation',
        verse_line: 22,
        confidence: 'strong',
      }),
    ]);
    expect(result.candidates[0].displacement_characters).toBeLessThan(1);
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

  it('does not turn a missing OCR line start into a strong indentation claim', () => {
    const lines = linesAt([100, 100, 160, 100]);
    lines[2].indentation_geometry_safe = false;
    lines[2].indentation_geometry_issue = 'ocr_missing_leading_content';
    const result = analyzeIndentationGeometry({
      lines,
      observed_indentation: [0, 0, 0, 0],
    });

    expect(result.suggested_indented_lines).toEqual([]);
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'unreliable_indentation_geometry',
        verse_line: 3,
      }),
    ]);
    expect(result.pages[0].measurements[2].classification).toBe('unreliable');
  });

  it('explains why clearance beside a drop capital is not poetic indentation', () => {
    const lines = linesAt([100, 160, 100]);
    lines[1].indentation_geometry_safe = false;
    lines[1].indentation_geometry_issue = 'drop_cap_clearance';
    const result = analyzeIndentationGeometry({
      lines,
      observed_indentation: [0, 1, 0],
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'unreliable_indentation_geometry',
        verse_line: 2,
        cause: 'drop_cap_clearance',
        reason: expect.stringContaining('begyndelseskapitæl'),
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

  it('estimates independent baselines for numbered sections on one page', () => {
    const result = analyzeIndentationGeometry({
      lines: linesAt([300, 300, 300, 100, 100, 100]),
      observed_indentation: [0, 0, 0, 0, 0, 0],
      indentation_sections: [1, 1, 1, 2, 2, 2],
    });

    expect(result.pages.map(page => page.baseline_left)).toEqual([300, 100]);
    expect(result.pages.map(page => page.indentation_section)).toEqual([1, 2]);
    expect(result.suggested_indented_lines).toEqual([]);
    expect(result.candidates).toEqual([]);
  });

  it('uses a repeated outdented refrain as the relative baseline', () => {
    const lefts = [40, 40, ...Array(10).fill(140)];
    const result = analyzeIndentationGeometry({
      lines: linesAt(lefts),
      observed_indentation: [0, 0, ...Array(10).fill(5)],
    });

    expect(result.pages[0].baseline_left).toBe(40);
    expect(result.suggested_indented_lines).toEqual(
      Array.from({ length: 10 }, (_, index) => index + 3)
    );
    expect(result.candidates).toEqual([]);
  });

  it('does not use repeated margin noise as the XML baseline', () => {
    const lefts = [20, 20, ...Array(10).fill(140)];
    const result = analyzeIndentationGeometry({
      lines: linesAt(lefts),
      observed_indentation: Array(lefts.length).fill(0),
    });

    expect(result.pages[0].baseline_left).toBe(140);
    expect(result.suggested_indented_lines).toEqual([]);
    expect(result.candidates).toEqual([]);
  });

  it('does not let a majority indented cluster hide an all-zero XML profile', () => {
    const result = analyzeIndentationGeometry({
      lines: linesAt([100, 100, 140, 140, 140]),
      observed_indentation: [0, 0, 0, 0, 0],
    });

    expect(result.pages[0].baseline_left).toBe(100);
    expect(result.candidates.map(candidate => candidate.type)).toEqual([
      'possible_missing_indentation',
      'possible_missing_indentation',
      'possible_missing_indentation',
    ]);
    expect(result.candidates.map(candidate => candidate.verse_line)).toEqual([3, 4, 5]);
  });

  it('keeps a single outdented XML zero-line as the page baseline', () => {
    const result = analyzeIndentationGeometry({
      lines: linesAt([100, 140, 140, 140, 140]),
      observed_indentation: [0, 4, 4, 4, 4],
    });

    expect(result.pages[0].baseline_left).toBe(100);
    expect(result.candidates).toEqual([]);
  });

  it('ignores a lone longer centred zero-line when repeated zero-lines establish the baseline', () => {
    const result = analyzeIndentationGeometry({
      lines: linesAt([100, 140, 140, 180, 180, 140, 140]),
      observed_indentation: [0, 0, 0, 2, 2, 0, 0],
    });

    expect(result.pages[0].baseline_left).toBe(140);
    expect(result.candidates).toEqual([]);
  });

  it('does not let a larger indented cluster hide missing indentation', () => {
    const result = analyzeIndentationGeometry({
      lines: linesAt([100, 100, 140, 140, 140, 140]),
      observed_indentation: [0, 0, 4, 4, 0, 0],
    });

    expect(result.pages[0].baseline_left).toBe(100);
    expect(result.candidates.map(candidate => candidate.type)).toEqual([
      'possible_missing_indentation',
      'possible_missing_indentation',
    ]);
    expect(result.candidates.map(candidate => candidate.verse_line)).toEqual([5, 6]);
  });

  it('does not anchor a page on an unreliable XML zero-line', () => {
    const lines = linesAt([100, 140, 140, 140]);
    lines[0].indentation_geometry_safe = false;
    lines[0].indentation_geometry_issue = 'ocr_missing_leading_content';
    const result = analyzeIndentationGeometry({
      lines,
      observed_indentation: [0, 4, 4, 4],
    });

    expect(result.pages[0].baseline_left).toBe(140);
    expect(result.pages[0].baseline_comparison).toBe('relative_only');
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'unreliable_indentation_geometry',
        verse_line: 1,
      }),
      expect.objectContaining({ type: 'unanchored_page_indentation' }),
    ]);
    expect(result.candidates.some(candidate => candidate.confidence === 'strong')).toBe(false);
  });

  it.each([7, -7])(
    'preserves indentation after correcting a %s degree rotation',
    angleDegrees => {
      const angle = angleDegrees * Math.PI / 180;
      const baseLefts = [100, 100, 140, 100, 100, 140];
      const lines = baseLefts.map((x, index) => {
        const y = 100 + index * 64;
        const screenX = x * Math.cos(angle) - y * Math.sin(angle);
        const screenY = x * Math.sin(angle) + y * Math.cos(angle);
        return {
          page: 1,
          left: screenX,
          top: screenY - 16,
          width: 600,
          height: 32,
          anchor_left: screenX,
          anchor_center_y: screenY,
          character_advance: 20,
          rotation_slope: Math.tan(angle),
          text: `Verslinje ${index + 1}`,
        };
      });
      const result = analyzeIndentationGeometry({ lines });

      expect(result.pages[0].rotation_degrees).toBeCloseTo(angleDegrees, 3);
      expect(result.suggested_indented_lines).toEqual([3, 6]);
    }
  );

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
