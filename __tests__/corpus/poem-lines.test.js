import {
  collectPoemLineQualityFindings,
  findCommonPoetryIndentationFindings,
  formatPoemLineIssue,
  findPoemLineFindingsInText,
} from '../../tools/text-quality-poem-lines.js';

const commonIndentationIssues = data =>
  findCommonPoetryIndentationFindings({
    file: 'fdirs/test/work.xml',
    data,
    context: undefined,
  });

describe('Check workfiles', () => {
  it('has no poem-line quality issues', () => {
    const issues = collectPoemLineQualityFindings();
    if (issues.length > 0) {
      throw new Error(issues.map(formatPoemLineIssue).join('\n'));
    }
  });

  it('allows mmm in a correction note marked with a closing bracket', () => {
    const issues = findPoemLineFindingsInText({
      file: 'fdirs/test/notes.xml',
      data: '<text id="note"><note>Himmel] Himmmel</note></text>',
      lang: 'da',
      shouldUseModernFrenchPunctuationSpacing: false,
    });

    expect(issues.filter((issue) => issue.rule === 'm-ellipsis')).toEqual([]);
  });

  it('still reports mmm in a note without a closing bracket', () => {
    const issues = findPoemLineFindingsInText({
      file: 'fdirs/test/notes.xml',
      data: '<text id="note"><note>Himmel Himmmel</note></text>',
      lang: 'da',
      shouldUseModernFrenchPunctuationSpacing: false,
    });

    expect(issues.filter((issue) => issue.rule === 'm-ellipsis')).toHaveLength(1);
  });

  it('does not let a closing bracket outside a note excuse mmm', () => {
    const issues = findPoemLineFindingsInText({
      file: 'fdirs/test/notes.xml',
      data: '<text id="note">Himmel] Himmmel</text>',
      lang: 'da',
      shouldUseModernFrenchPunctuationSpacing: false,
    });

    expect(issues.filter((issue) => issue.rule === 'm-ellipsis')).toHaveLength(1);
  });

  it.each(['', ' ', '\t'])('reports an empty firstline containing %j', blank => {
    const issues = findPoemLineFindingsInText({
      file: 'fdirs/test/firstline.xml',
      data: `<text id="firstline"><firstline>${blank}</firstline></text>`,
      lang: 'da',
      shouldUseModernFrenchPunctuationSpacing: false,
    });

    expect(issues.filter(issue => issue.rule === 'empty-firstline')).toHaveLength(
      1
    );
  });

  it.each([',', ';', ':'])('reports a firstline ending with %s', punctuation => {
    const issues = findPoemLineFindingsInText({
      file: 'fdirs/test/firstline.xml',
      data: `<text id="firstline"><firstline>En første linje${punctuation}</firstline></text>`,
      lang: 'da',
      shouldUseModernFrenchPunctuationSpacing: false,
    });

    expect(
      issues.filter(issue => issue.rule === 'firstline-trailing-punctuation')
    ).toHaveLength(1);
  });

  it('reports a firstline ending with a period', () => {
    const issues = findPoemLineFindingsInText({
      file: 'fdirs/test/firstline.xml',
      data: '<text id="firstline"><firstline>En første linje.</firstline></text>',
      lang: 'da',
      shouldUseModernFrenchPunctuationSpacing: false,
    });

    expect(
      issues.filter(issue => issue.rule === 'firstline-trailing-punctuation')
    ).toHaveLength(1);
  });

  it('allows a firstline containing spaced dots', () => {
    const issues = findPoemLineFindingsInText({
      file: 'fdirs/test/firstline.xml',
      data: '<text id="firstline"><firstline>Kløften lukker sig, og Stien slipper . . .</firstline></text>',
      lang: 'da',
      shouldUseModernFrenchPunctuationSpacing: false,
    });

    expect(
      issues.filter(issue => issue.rule === 'firstline-trailing-punctuation')
    ).toHaveLength(0);
  });

  it.each(['„', '»', '"', ',,', '— ', '... ', '(', '¡'])(
    'reports a firstline beginning with %s',
    punctuation => {
      const issues = findPoemLineFindingsInText({
        file: 'fdirs/test/firstline.xml',
        data: `<text id="firstline"><firstline>${punctuation}Første linje</firstline></text>`,
        lang: 'da',
        shouldUseModernFrenchPunctuationSpacing: false,
      });

      expect(
        issues.filter(issue => issue.rule === 'firstline-leading-punctuation')
      ).toHaveLength(1);
    }
  );

  it.each(['Æbler falder', 'Én rose', 'Ἐν ἀρχῇ', '4 Sange'])(
    'allows a firstline beginning with a Unicode letter or number: %s',
    firstline => {
      const issues = findPoemLineFindingsInText({
        file: 'fdirs/test/firstline.xml',
        data: `<text id="firstline"><firstline>${firstline}</firstline></text>`,
        lang: 'da',
        shouldUseModernFrenchPunctuationSpacing: false,
      });

      expect(
        issues.filter(issue => issue.rule === 'firstline-leading-punctuation')
      ).toHaveLength(0);
    }
  );

  it('reports a common removable indentation in a poem', () => {
    const issues = commonIndentationIssues(
      '<text id="shifted"><body><poetry>\n  Første\n    Anden\n  Tredje\n</poetry></body></text>',
    );

    expect(issues).toEqual([
      expect.objectContaining({
        rule: 'common-poetry-indentation',
        textId: 'shifted',
        line: 2,
      }),
    ]);
    expect(issues[0].description).toContain('2 columns');
  });

  it('allows one-column relative indentation when a verse line starts at zero', () => {
    const issues = commonIndentationIssues(
      '<text id="relative"><body><poetry>\nFørste\n Anden\nFørste igen\n</poetry></body></text>',
    );

    expect(issues).toEqual([]);
  });

  it('measures indentation after a page break', () => {
    const issues = commonIndentationIssues(
      '<text id="page"><body><poetry>\n  Første\n<pb n="2"/>  Anden\n</poetry></body></text>',
    );

    expect(issues).toHaveLength(1);
  });

  it('ignores notes and non-verse lines', () => {
    const issues = commonIndentationIssues(
      [
        '<text id="paratext"><body><poetry>',
        '<nonum><center>TALER</center></nonum>',
        '  Første<footnote>En note',
        'uden versindrykning</footnote>',
        '<wrap>Sceneanvisning</wrap>',
        '  Anden',
        '</poetry></body></text>',
      ].join('\n'),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].description).toContain('2 verse lines');
  });

  it('checks each text independently', () => {
    const issues = commonIndentationIssues(
      [
        '<text id="shifted"><body><poetry>',
        '  Første',
        '  Anden',
        '</poetry></body></text>',
        '<text id="baseline"><body><poetry>',
        'Første',
        '  Anden',
        '</poetry></body></text>',
      ].join('\n'),
    );

    expect(issues.map(issue => issue.textId)).toEqual(['shifted']);
  });

  it('does not infer a common indentation from a single verse line', () => {
    const issues = commonIndentationIssues(
      '<text id="single"><body><poetry>\n  Eneste linje\n</poetry></body></text>',
    );

    expect(issues).toEqual([]);
  });
});
