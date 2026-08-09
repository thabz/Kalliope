import {
  analyzeIndentation,
  parseBody,
} from '../.codex/skills/pdf-to-kalliope/scripts/analyze-indentation.js';

const bodyWithProfile = profile =>
  profile
    .map((indentation, index) => `${' '.repeat(indentation)}Verslinje ${index + 1}`)
    .join('\n');

describe('indentation profile parsing', () => {
  it('records leading spaces for every verse line', () => {
    const parsed = parseBody('Ingen\n  To\n\n    Fire');

    expect(parsed.verseLines.map(line => line.indentation)).toEqual([0, 2, 4]);
    expect(parsed.sections).toHaveLength(1);
  });

  it('expands tabs to four-column tab stops', () => {
    const parsed = parseBody('\tFire\n  \tFire igen');

    expect(parsed.verseLines.map(line => line.indentation)).toEqual([4, 4]);
  });

  it('ignores blank lines and non-section nonum lines', () => {
    const parsed = parseBody(
      ['Første', '', '<nonum><center>* * *</center></nonum>', '  Anden'].join(
        '\n'
      )
    );

    expect(parsed.verseLines.map(line => line.indentation)).toEqual([0, 2]);
    expect(parsed.sections).toHaveLength(1);
  });

  it('ignores inline markup when retaining indentation', () => {
    const parsed = parseBody('  <i>To mellemrum</i>\n    Ord med <note>note</note>');

    expect(parsed.verseLines.map(line => line.indentation)).toEqual([2, 4]);
    expect(parsed.verseLines.map(line => line.text)).toEqual([
      'To mellemrum',
      'Ord med note',
    ]);
  });

  it('creates sections for roman and arabic numbered headings', () => {
    const parsed = parseBody(
      [
        '<nonum><center>I.</center></nonum>',
        'Første',
        '  Anden',
        '<nonum><center>2.</center></nonum>',
        '    Tredje',
      ].join('\n')
    );

    expect(parsed.sections).toEqual([
      expect.objectContaining({
        heading: 'I.',
        indentations: [0, 2],
        verseLineStart: 1,
        verseLineEnd: 2,
      }),
      expect.objectContaining({
        heading: '2.',
        indentations: [4],
        verseLineStart: 3,
        verseLineEnd: 3,
      }),
    ]);
  });

  it('keeps an unnumbered opening before the first numbered section', () => {
    const parsed = parseBody(
      ['Indledning', '<nonum><center>II.</center></nonum>', 'Anden del'].join(
        '\n'
      )
    );

    expect(parsed.sections.map(section => section.heading)).toEqual([
      null,
      'II.',
    ]);
  });
});

describe('indentation candidate analysis', () => {
  it('finds the shifted passage in the motivating profile', () => {
    const profile = [0, 2, 0, 2, 0, 2, 6, 8, 6, 8, 6, 8, 6, 2, 0, 2, 0];
    const result = analyzeIndentation({ body: bodyWithProfile(profile) });

    expect(result.indentation_profile).toEqual(profile);
    expect(result.sections[0].dominant_pattern).toEqual([0, 2]);
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_indentation_shift',
        verse_line_start: 7,
        verse_line_end: 13,
        observed_offset: 6,
        expected_profile: [0, 2, 0, 2, 0, 2, 0],
        observed_profile: [6, 8, 6, 8, 6, 8, 6],
        confidence: 'strong',
      }),
    ]);
  });

  it('finds a negative shift', () => {
    const result = analyzeIndentation({
      body: bodyWithProfile([4, 6, 4, 6, 4, 6, 0, 2, 0, 2, 4, 6, 4, 6]),
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        verse_line_start: 7,
        verse_line_end: 10,
        observed_offset: -4,
      }),
    ]);
  });

  it('accepts a regular alternating profile', () => {
    const result = analyzeIndentation({
      body: bodyWithProfile([0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2]),
    });

    expect(result.status).toBe('no_candidates');
    expect(result.sections[0].dominant_pattern).toEqual([0, 2]);
    expect(result.candidates).toEqual([]);
  });

  it('accepts a constant non-zero baseline', () => {
    const result = analyzeIndentation({
      body: bodyWithProfile([4, 4, 4, 4, 4, 4, 4, 4]),
    });

    expect(result.sections[0].dominant_pattern).toEqual([4]);
    expect(result.candidates).toEqual([]);
  });

  it('accepts a regular four-line indentation profile', () => {
    const result = analyzeIndentation({
      body: bodyWithProfile([
        0, 4, 4, 0, 0, 4, 4, 0, 0, 4, 4, 0, 0, 4, 4, 0,
      ]),
    });

    expect(result.sections[0].dominant_pattern).toEqual([0, 4, 4, 0]);
    expect(result.candidates).toEqual([]);
  });

  it('raises confidence when a shift begins at a known page break', () => {
    const result = analyzeIndentation({
      body: bodyWithProfile([0, 2, 0, 2, 0, 2, 4, 6, 4, 2, 0, 2, 0, 2]),
      page_breaks: [7],
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        verse_line_start: 7,
        verse_line_end: 9,
        at_page_break: true,
        confidence: 'likely',
      }),
    ]);
  });

  it('reports an opening shift with lower confidence', () => {
    const result = analyzeIndentation({
      body: bodyWithProfile([4, 6, 4, 2, 0, 2, 0, 2, 0, 2, 0, 2]),
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        verse_line_start: 1,
        verse_line_end: 3,
        confidence: 'likely',
      }),
    ]);
  });

  it('does not treat a short local indentation as a shifted passage', () => {
    const result = analyzeIndentation({
      body: bodyWithProfile([0, 2, 0, 2, 4, 2, 0, 2, 0, 2, 0, 2]),
    });

    expect(result.candidates).toEqual([]);
  });

  it('does not invent a stable pattern for a short poem', () => {
    const result = analyzeIndentation({
      body: bodyWithProfile([0, 3, 1, 7, 2]),
    });

    expect(result.status).toBe('insufficient_evidence');
    expect(result.sections[0].dominant_pattern).toBeNull();
    expect(result.candidates).toEqual([]);
  });

  it('does not invent a stable pattern for a long irregular poem', () => {
    const result = analyzeIndentation({
      body: bodyWithProfile([0, 7, 2, 11, 4, 1, 9, 3, 12, 5, 8, 2]),
    });

    expect(result.status).toBe('no_stable_pattern');
    expect(result.sections[0].dominant_pattern).toBeNull();
    expect(result.candidates).toEqual([]);
  });

  it('does not compare unrelated section profiles', () => {
    const first = bodyWithProfile([0, 2, 0, 2, 0, 2, 0, 2]);
    const second = bodyWithProfile([4, 4, 0, 0, 4, 4, 0, 0]);
    const result = analyzeIndentation({
      body: `${first}\n<nonum><center>II.</center></nonum>\n${second}`,
    });

    expect(result.sections).toHaveLength(2);
    expect(result.candidates).toEqual([]);
  });

  it('reports a matching section profile at another baseline cautiously', () => {
    const first = bodyWithProfile([0, 2, 0, 2, 0, 2, 0, 2, 0, 2]);
    const second = bodyWithProfile([6, 8, 6, 8, 6, 8, 6, 8, 6, 8]);
    const result = analyzeIndentation({
      body: `${first}\n<nonum><center>II.</center></nonum>\n${second}`,
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_section_indentation_shift',
        section_number: 2,
        observed_offset: 6,
        confidence: 'possible',
      }),
    ]);
  });

  it('does not flag sections with the same baseline', () => {
    const section = bodyWithProfile([0, 2, 0, 2, 0, 2]);
    const result = analyzeIndentation({
      body: `${section}\n<nonum><center>II.</center></nonum>\n${section}`,
    });

    expect(result.candidates).toEqual([]);
  });

  it('finds an internal shift in a later section with global line numbers', () => {
    const first = bodyWithProfile([0, 2, 0, 2, 0, 2]);
    const second = bodyWithProfile([
      0, 2, 0, 2, 0, 2, 6, 8, 6, 8, 0, 2, 0, 2,
    ]);
    const result = analyzeIndentation({
      body: `${first}\n<nonum><center>II.</center></nonum>\n${second}`,
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_indentation_shift',
        section_number: 2,
        verse_line_start: 13,
        verse_line_end: 16,
        observed_offset: 6,
      }),
    ]);
  });

  it('accepts a malformed closing nonum from raw working input', () => {
    const first = bodyWithProfile([0, 2, 0, 2, 0, 2]);
    const second = bodyWithProfile([4, 4, 0, 0, 4, 4]);
    const result = analyzeIndentation({
      body: `${first}\n<nonum><center>II.</center><nonum>\n${second}`,
    });

    expect(result.sections.map(section => section.heading)).toEqual([
      null,
      'II.',
    ]);
  });

  it('keeps page break metadata out of unrelated candidates', () => {
    const result = analyzeIndentation({
      body: bodyWithProfile([0, 2, 0, 2, 0, 2, 4, 6, 4, 2, 0, 2, 0, 2]),
      page_breaks: [2],
    });

    expect(result.candidates[0]).toMatchObject({ at_page_break: false });
  });

  it('normalizes CRLF input', () => {
    const result = analyzeIndentation({
      body: bodyWithProfile([0, 2, 0, 2, 0, 2]).replace(/\n/gu, '\r\n'),
    });

    expect(result.indentation_profile).toEqual([0, 2, 0, 2, 0, 2]);
  });

  it('rejects invalid input and page breaks', () => {
    expect(() => analyzeIndentation(null)).toThrow(
      'Input skal være et JSON-objekt med feltet "body" og eventuelt "page_breaks".'
    );
    expect(() => analyzeIndentation({ body: [] })).toThrow(
      'Inputfeltet "body" skal være en streng.'
    );
    expect(() =>
      analyzeIndentation({ body: bodyWithProfile([0, 2, 0]), page_breaks: [0] })
    ).toThrow(
      'Inputfeltet "page_breaks" skal være en liste af gyldige verslinjenumre.'
    );
  });
});
