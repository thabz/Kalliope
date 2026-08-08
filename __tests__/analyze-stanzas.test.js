import {
  analyzeStanzas,
  parseBody,
} from '../.codex/skills/pdf-to-kalliope/scripts/analyze-stanzas.js';

const bodyWithStanzas = stanzaLengths => {
  let verseLine = 0;
  return stanzaLengths
    .map(length =>
      Array.from({ length }, () => `Verslinje ${++verseLine}`).join('\n')
    )
    .join('\n\n');
};

describe('stanza candidate analysis', () => {
  it('finds an extra boundary in the first sonnet quatrain', () => {
    const result = analyzeStanzas({ body: bodyWithStanzas([2, 2, 4, 3, 3]) });

    expect(result.verse_line_count).toBe(14);
    expect(result.observed_stanza_lengths).toEqual([2, 2, 4, 3, 3]);
    expect(result.recognized_forms[0]).toMatchObject({
      name: 'sonnet-petrarchan',
      expected_stanza_lengths: [4, 4, 3, 3],
      boundary_changes: 1,
      preferred: true,
    });
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_extra_boundary',
        after_verse_line: 2,
        confidence: 'strong',
      }),
    ]);
  });

  it('finds an extra boundary in the second sonnet quatrain', () => {
    const result = analyzeStanzas({ body: bodyWithStanzas([4, 2, 2, 3, 3]) });

    expect(result.recognized_forms[0]).toMatchObject({
      name: 'sonnet-petrarchan',
      preferred: true,
    });
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_extra_boundary',
        after_verse_line: 6,
        confidence: 'strong',
      }),
    ]);
  });

  it('finds a missing boundary between two eight-line stanzas', () => {
    const result = analyzeStanzas({ body: bodyWithStanzas([8, 8, 8, 8, 16]) });

    expect(result.dominant_stanza_length).toBe(8);
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_missing_boundary',
        after_verse_line: 40,
        confidence: 'likely',
        reason: 'Digtet består ellers overvejende af strofer på 8 linjer.',
      }),
    ]);
  });

  it('finds a one-line and three-line split among four-line stanzas', () => {
    const result = analyzeStanzas({ body: bodyWithStanzas([1, 3, 4, 4]) });

    expect(result.dominant_stanza_length).toBeNull();
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_extra_boundary',
        after_verse_line: 1,
        confidence: 'likely',
      }),
    ]);
  });

  it('finds multiple four-line splits among eight-line stanzas', () => {
    const result = analyzeStanzas({
      body: bodyWithStanzas([8, 8, 8, 8, 4, 4, 8, 8, 8, 4, 4]),
    });

    expect(result.dominant_stanza_length).toBe(8);
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_extra_boundary',
        after_verse_line: 36,
        confidence: 'likely',
      }),
      expect.objectContaining({
        type: 'possible_extra_boundary',
        after_verse_line: 68,
        confidence: 'likely',
      }),
    ]);
  });

  it('finds a three-line and two-line split among five-line stanzas', () => {
    const result = analyzeStanzas({
      body: bodyWithStanzas([5, 5, 5, 5, 5, 5, 5, 3, 2]),
    });

    expect(result.dominant_stanza_length).toBe(5);
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_extra_boundary',
        after_verse_line: 38,
        confidence: 'likely',
      }),
    ]);
  });

  it('finds a three-line and one-line split in a two-stanza poem', () => {
    const result = analyzeStanzas({ body: bodyWithStanzas([4, 3, 1]) });

    expect(result.dominant_stanza_length).toBeNull();
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_extra_boundary',
        after_verse_line: 7,
        confidence: 'likely',
      }),
    ]);
  });

  it('finds mixed boundary errors among six-line stanzas', () => {
    const result = analyzeStanzas({
      body: bodyWithStanzas([
        6, 6, 6, 6, 6, 2, 2, 2, 12, 6, 4, 2, 6, 6, 6, 6,
      ]),
    });

    expect(result.dominant_stanza_length).toBe(6);
    expect(
      result.candidates.map(candidate => [
        candidate.type,
        candidate.after_verse_line,
      ])
    ).toEqual([
      ['possible_extra_boundary', 32],
      ['possible_extra_boundary', 34],
      ['possible_missing_boundary', 42],
      ['possible_extra_boundary', 58],
    ]);
  });

  it('finds three adjacent fragments of a four-line stanza', () => {
    const result = analyzeStanzas({
      body: bodyWithStanzas([4, 4, 2, 1, 1, 4]),
    });

    expect(result.dominant_stanza_length).toBeNull();
    expect(
      result.candidates.map(candidate => [
        candidate.type,
        candidate.after_verse_line,
        candidate.confidence,
      ])
    ).toEqual([
      ['possible_extra_boundary', 10, 'likely'],
      ['possible_extra_boundary', 11, 'likely'],
    ]);
  });

  it('prefers merging a split stanza over dividing the intact stanzas', () => {
    const result = analyzeStanzas({
      body: bodyWithStanzas([4, 2, 2, 4]),
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_extra_boundary',
        after_verse_line: 6,
        confidence: 'likely',
      }),
    ]);
  });

  it('finds two separately fragmented four-line stanzas', () => {
    const result = analyzeStanzas({
      body: bodyWithStanzas([2, 2, 4, 3, 1]),
    });

    expect(
      result.candidates.map(candidate => [
        candidate.type,
        candidate.after_verse_line,
      ])
    ).toEqual([
      ['possible_extra_boundary', 2],
      ['possible_extra_boundary', 11],
    ]);
  });

  it('accepts a regular stanza pattern without candidates', () => {
    const result = analyzeStanzas({ body: bodyWithStanzas([4, 4, 4, 4]) });

    expect(result.status).toBe('no_candidates');
    expect(result.dominant_stanza_length).toBe(4);
    expect(result.candidates).toEqual([]);
  });

  it('reports an unexplained deviation from a dominant stanza length', () => {
    const result = analyzeStanzas({ body: bodyWithStanzas([4, 4, 4, 6]) });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_irregular_stanza',
        stanza_number: 4,
        verse_line_start: 13,
        verse_line_end: 18,
        observed_length: 6,
        expected_length: 4,
        confidence: 'possible',
      }),
    ]);
  });

  it('does not invent a stable pattern for an irregular poem', () => {
    const result = analyzeStanzas({ body: bodyWithStanzas([3, 5, 7, 11]) });

    expect(result.status).toBe('no_stable_pattern');
    expect(result.dominant_stanza_length).toBeNull();
    expect(result.recognized_forms).toEqual([]);
    expect(result.candidates).toEqual([]);
  });

  it('ignores coincidental sums and halves in a long irregular poem', () => {
    const result = analyzeStanzas({
      body: bodyWithStanzas([
        3, 13, 11, 6, 8, 4, 10, 4, 6, 3, 23, 11, 4, 2, 7, 2,
      ]),
    });

    expect(result.status).toBe('no_stable_pattern');
    expect(result.dominant_stanza_length).toBeNull();
    expect(result.candidates).toEqual([]);
  });

  it('does not cascade boundary changes after a legitimate long stanza', () => {
    const result = analyzeStanzas({
      body: bodyWithStanzas([6, 5, 5, 5, 5, 5, 4]),
    });

    expect(result.dominant_stanza_length).toBe(5);
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_irregular_stanza',
        stanza_number: 1,
        observed_length: 6,
        expected_length: 5,
        confidence: 'possible',
      }),
      expect.objectContaining({
        type: 'possible_irregular_stanza',
        stanza_number: 7,
        observed_length: 4,
        expected_length: 5,
        confidence: 'possible',
      }),
    ]);
  });

  it('flags an isolated comma-ended line between comma-ended passages', () => {
    const body = [
      'Første linje',
      'Syttende linje,',
      '',
      'Den løse linje,',
      '',
      'Næste passage',
      'Sidste linje.',
    ].join('\n');
    const result = analyzeStanzas({ body });

    expect(result.observed_stanza_lengths).toEqual([2, 1, 2]);
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_extra_boundary',
        after_verse_line: 2,
        confidence: 'likely',
      }),
      expect.objectContaining({
        type: 'possible_extra_boundary',
        after_verse_line: 3,
        confidence: 'likely',
      }),
    ]);
  });

  it('reports insufficient evidence for a short unstructured input', () => {
    const result = analyzeStanzas({ body: bodyWithStanzas([3, 5]) });

    expect(result.status).toBe('insufficient_evidence');
    expect(result.candidates).toEqual([]);
  });

  it('normalizes CRLF and repeated blank lines', () => {
    const parsed = parseBody('\r\nEn\r\nTo\r\n\r\n\r\nTre\r\nFire\r\n');

    expect(parsed.verseLineCount).toBe(4);
    expect(parsed.stanzaLengths).toEqual([2, 2]);
  });

  it('rejects invalid input', () => {
    expect(() => analyzeStanzas(null)).toThrow(
      'Input skal være et JSON-objekt med feltet "body".'
    );
    expect(() => analyzeStanzas({ body: [] })).toThrow(
      'Inputfeltet "body" skal være en streng.'
    );
  });
});
