import fs from 'fs';

import {
  analyzeIndentation,
  parseBody,
} from '../.codex/skills/pdf-to-kalliope/scripts/analyze-indentation.js';

const bodyWithProfile = profile =>
  profile
    .map((indentation, index) => `${' '.repeat(indentation)}Verslinje ${index + 1}`)
    .join('\n');

const bodyWithStanzaProfiles = profiles =>
  profiles.map(bodyWithProfile).join('\n\n');

const poetryBodiesFromXml = xml =>
  [...xml.matchAll(/<poetry\b[^>]*>([\s\S]*?)<\/poetry>/gu)].map(
    match => match[1]
  );

describe('indentation profile parsing', () => {
  it('records leading spaces for every verse line', () => {
    const parsed = parseBody('Ingen\n  To\n\n    Fire');

    expect(parsed.verseLines.map(line => line.indentation)).toEqual([0, 2, 4]);
    expect(parsed.sections).toHaveLength(1);
    expect(parsed.sections[0].stanzas.map(stanza => stanza.indentations)).toEqual([
      [0, 2],
      [4],
    ]);
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

  it('creates sections for lower-case and Greek centered headings', () => {
    const parsed = parseBody(
      [
        '<nonum><center>a</center></nonum>',
        'Første',
        '<nonum><center>β</center></nonum>',
        'Anden',
      ].join('\n')
    );

    expect(parsed.sections.map(section => section.heading)).toEqual(['a', 'β']);
  });

  it('does not create a section for a centered decoration', () => {
    const parsed = parseBody(
      ['Første', '<nonum><center>— — —</center></nonum>', 'Anden'].join('\n')
    );

    expect(parsed.sections).toHaveLength(1);
    expect(parsed.sections[0].stanzas).toHaveLength(2);
  });

  it('ignores non-verse block markup and raw dividers', () => {
    const parsed = parseBody(
      [
        'Første',
        '<center><nonum><small><i>Går.</i></small></nonum></center>',
        '<wrap><small>Sceneanvisning</small></wrap>',
        '---',
        '  Anden',
      ].join('\n')
    );

    expect(parsed.verseLines.map(line => line.text)).toEqual([
      'Første',
      'Anden',
    ]);
    expect(parsed.verseLines.map(line => line.indentation)).toEqual([0, 2]);
    expect(parsed.sections).toHaveLength(1);
  });

  it('treats centered speaker labels as stanza dividers, not sections', () => {
    const parsed = parseBody(
      [
        '<nonum><center><sc>Chor</sc></center></nonum>',
        'Første',
        '<nonum><center><sc>Een Stemme</sc></center></nonum>',
        'Anden',
      ].join('\n')
    );

    expect(parsed.sections).toHaveLength(1);
    expect(parsed.sections[0].heading).toBeNull();
    expect(parsed.sections[0].stanzas).toHaveLength(2);
  });

  it('creates sections for uppercase divisions and melody headings', () => {
    const parsed = parseBody(
      [
        '<nonum><center>FØRSTE AFDELING<note>Redaktionel note</note></center></nonum>',
        'Første',
        '<nonum><center>Mel.: Folkevise.</center></nonum>',
        'Anden',
      ].join('\n')
    );

    expect(parsed.sections.map(section => section.heading)).toEqual([
      'FØRSTE AFDELING',
      'Mel.: Folkevise.',
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

  it('uses repeated stanza profiles instead of crossing blank-line resets', () => {
    const result = analyzeIndentation({
      body: bodyWithStanzaProfiles([
        [0, 6, 2, 4],
        [0, 6, 2, 4],
        [0, 6, 2, 4],
        [0, 6, 2, 4],
      ]),
    });

    expect(result.sections[0]).toMatchObject({
      analysis_basis: 'stanza',
      dominant_pattern: [0, 6, 2, 4],
    });
    expect(result.candidates).toEqual([]);
  });

  it('checks an opening capital against the profile of later stanzas', () => {
    const result = analyzeIndentation({
      body: bodyWithStanzaProfiles([
        [7, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        Array(12).fill(0),
        Array(12).fill(0),
        Array(12).fill(0),
      ]),
    });

    expect(result.sections[0]).toMatchObject({
      analysis_basis: 'stanza',
      dominant_pattern: Array(12).fill(0),
    });
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_stanza_indentation_mismatch',
        verse_line_start: 1,
        verse_line_end: 12,
        expected_profile: Array(12).fill(0),
        observed_profile: [7, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        confidence: 'likely',
      }),
    ]);
  });

  it('finds scattered line mismatches in two minority stanzas', () => {
    const regular = [0, 4, 0, 4, 0, 0];
    const result = analyzeIndentation({
      body: bodyWithStanzaProfiles([
        [0, 0, 0, 4, 0, 0],
        [0, 4, 0, 0, 8, 0],
        regular,
        regular,
        regular,
      ]),
    });

    expect(result.sections[0]).toMatchObject({
      analysis_basis: 'stanza',
      dominant_pattern: regular,
    });
    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_stanza_indentation_mismatch',
        verse_line_start: 1,
        verse_line_end: 6,
        expected_profile: regular,
        observed_profile: [0, 0, 0, 4, 0, 0],
        mismatches: [
          { verse_line: 2, stanza_position: 2, expected: 4, observed: 0 },
        ],
        confidence: 'possible',
      }),
      expect.objectContaining({
        type: 'possible_stanza_indentation_mismatch',
        verse_line_start: 7,
        verse_line_end: 12,
        expected_profile: regular,
        observed_profile: [0, 4, 0, 0, 8, 0],
        mismatches: [
          { verse_line: 10, stanza_position: 4, expected: 4, observed: 0 },
          { verse_line: 11, stanza_position: 5, expected: 0, observed: 8 },
        ],
        confidence: 'possible',
      }),
    ]);
  });

  it('flags rare opening capital offsets without a stable stanza pattern', () => {
    const result = analyzeIndentation({
      body: bodyWithStanzaProfiles([
        [7, 0, 8, 0, 2, 0, 0, 0, 0, 0, 0, 2],
        [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        Array(21).fill(0).map((value, index) =>
          [4, 10, 16].includes(index) ? 2 : value
        ),
      ]),
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_opening_capital_indentation',
        verse_line_start: 1,
        verse_line_end: 3,
        expected_profile: [2, 0, 2],
        observed_profile: [7, 0, 8],
        confidence: 'likely',
      }),
    ]);
  });

  it('uses a strong zero baseline for an opening capital candidate', () => {
    const result = analyzeIndentation({
      body: bodyWithStanzaProfiles([
        [4, 0, 5, ...Array(12).fill(0)],
        Array(15).fill(0),
        Array(15).fill(0),
      ]),
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        type: 'possible_opening_capital_indentation',
        expected_profile: [0, 0, 0],
        observed_profile: [4, 0, 5],
      }),
    ]);
  });

  it('does not flag an opening offset repeated later in the poem', () => {
    const result = analyzeIndentation({
      body: bodyWithStanzaProfiles([
        [7, 0, 8, 0, 2, 0, 0, 0],
        [0, 2, 0, 7, 0, 8, 0, 2],
        [0, 2, 0, 2, 0, 2, 0, 2],
      ]),
    });

    expect(
      result.candidates.filter(
        candidate => candidate.type === 'possible_opening_capital_indentation'
      )
    ).toEqual([]);
  });

  it('finds an Egelunden-style shift across repeated stanzas', () => {
    const regular = [0, 15, 9, 9];
    const shifted = regular.map(indentation => indentation + 14);
    const result = analyzeIndentation({
      body: bodyWithStanzaProfiles([
        regular,
        regular,
        regular,
        shifted,
        shifted,
        regular,
        regular,
      ]),
    });

    expect(result.sections[0].analysis_basis).toBe('stanza');
    expect(result.candidates).toEqual([
      expect.objectContaining({
        verse_line_start: 13,
        verse_line_end: 20,
        observed_offset: 14,
        confidence: 'strong',
      }),
    ]);
  });

  it('accepts a regular alternation between stanza baselines', () => {
    const result = analyzeIndentation({
      body: bodyWithStanzaProfiles([
        Array(8).fill(0),
        Array(8).fill(9),
        Array(8).fill(0),
        Array(8).fill(9),
      ]),
    });

    expect(result.sections[0].stanza_patterns[0]).toMatchObject({
      baseline_pattern: [0, 9],
      occurrences: 4,
    });
    expect(result.candidates).toEqual([]);
  });

  it('learns distinct relative profiles with the same stanza length', () => {
    const first = [0, 2, 0, 2];
    const second = [0, 4, 4, 0];
    const result = analyzeIndentation({
      body: bodyWithStanzaProfiles([
        first,
        second,
        first,
        second,
        first,
        second,
      ]),
    });

    expect(result.sections[0].stanza_patterns).toEqual([
      expect.objectContaining({ pattern: first, occurrences: 3 }),
      expect.objectContaining({ pattern: second, occurrences: 3 }),
    ]);
    expect(result.candidates).toEqual([]);
  });

  it('finds partial shifts in a dominant repeated stanza length', () => {
    const regular = lastIndentation => [
      0, 15, 0, 15, 0, 15, 0, 15, 9, 9, 9, lastIndentation,
    ];
    const shifted = lastIndentation => [
      14, 29, 14, 29, 14, 29, 14, 29, 9, 9, 9, lastIndentation,
    ];
    const result = analyzeIndentation({
      body: bodyWithStanzaProfiles([
        regular(9),
        regular(10),
        regular(11),
        shifted(12),
        shifted(13),
        regular(14),
        regular(15),
      ]),
    });

    expect(result.sections[0].analysis_basis).toBe('stanza_position');
    expect(result.candidates).toEqual([
      expect.objectContaining({
        verse_line_start: 37,
        verse_line_end: 44,
        observed_offset: 14,
      }),
      expect.objectContaining({
        verse_line_start: 49,
        verse_line_end: 56,
        observed_offset: 14,
      }),
    ]);
  });

  it('does not flatten several unrelated stanza shapes into one profile', () => {
    const result = analyzeIndentation({
      body: bodyWithStanzaProfiles([
        [0, 2, 0],
        [8, 8, 8, 8],
        [0, 3, 1, 3, 0],
      ]),
    });

    expect(result.sections[0].analysis_basis).toBeNull();
    expect(result.candidates).toEqual([]);
  });

  it('reports an isolated shifted stanza cautiously', () => {
    const regular = [0, 3, 0, 3];
    const shifted = regular.map(indentation => indentation + 6);
    const result = analyzeIndentation({
      body: bodyWithStanzaProfiles([
        regular,
        regular,
        shifted,
        regular,
        regular,
      ]),
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        verse_line_start: 9,
        verse_line_end: 12,
        confidence: 'possible',
      }),
    ]);
  });

  it('raises an isolated stanza shift at a known page break', () => {
    const regular = [0, 3, 0, 3];
    const shifted = regular.map(indentation => indentation + 6);
    const result = analyzeIndentation({
      body: bodyWithStanzaProfiles([
        regular,
        regular,
        shifted,
        regular,
        regular,
      ]),
      page_breaks: [9],
    });

    expect(result.candidates).toEqual([
      expect.objectContaining({
        verse_line_start: 9,
        at_page_break: true,
        confidence: 'likely',
      }),
    ]);
  });

  it('learns different patterns for different stanza lengths', () => {
    const result = analyzeIndentation({
      body: bodyWithStanzaProfiles([
        [0, 2, 0, 2],
        [0, 4, 4, 0, 2, 2],
        [0, 2, 0, 2],
        [0, 4, 4, 0, 2, 2],
        [0, 2, 0, 2],
        [0, 4, 4, 0, 2, 2],
      ]),
    });

    expect(result.sections[0].stanza_patterns).toEqual([
      expect.objectContaining({
        stanza_length: 6,
        occurrences: 3,
        pattern: [0, 4, 4, 0, 2, 2],
      }),
      expect.objectContaining({
        stanza_length: 4,
        occurrences: 3,
        pattern: [0, 2, 0, 2],
      }),
    ]);
    expect(result.candidates).toEqual([]);
  });

  it('does not let an isolated stanza length distort repeated stanzas', () => {
    const result = analyzeIndentation({
      body: bodyWithStanzaProfiles([
        [0, 2, 0, 2],
        [0, 2, 0, 2],
        [30, 10, 25, 8, 13],
        [0, 2, 0, 2],
      ]),
    });

    expect(result.sections[0].dominant_pattern).toEqual([0, 2, 0, 2]);
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

  it('stays cautious on the reviewed indentation in Oehlenschläger 1803', () => {
    const xml = fs.readFileSync('fdirs/oehlenschlaeger/1803.xml', 'utf8');
    const candidates = poetryBodiesFromXml(xml).flatMap(
      body => analyzeIndentation({ body }).candidates
    );

    expect(candidates).toHaveLength(6);
    expect(candidates.every(candidate => candidate.confidence === 'possible')).toBe(
      true
    );
  });
});
