import {
  collectPoemLineQualityFindings,
  findCommonPoetryIndentationFindings,
  findTitleMetadataFindings,
  formatPoemLineIssue,
  findPoemLineFindingsInText,
} from '../../tools/text-quality-poem-lines.js';

const commonIndentationIssues = data =>
  findCommonPoetryIndentationFindings({
    file: 'fdirs/test/work.xml',
    data,
    context: undefined,
  });

const titleMetadataIssues = data =>
  findTitleMetadataFindings({
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

  it('runs the common-indentation check through the corpus entry point', () => {
    const issues = findPoemLineFindingsInText({
      file: 'fdirs/test/work.xml',
      data:
        '<text id="shifted"><body><poetry>\n  Første\n  Anden\n</poetry></body></text>',
      lang: 'da',
      shouldUseModernFrenchPunctuationSpacing: false,
    });

    expect(
      issues.filter(issue => issue.rule === 'common-poetry-indentation'),
    ).toHaveLength(1);
  });

  it.each(['Æbler', 'Én sang', '4 Sange'])(
    'allows an effective index title beginning with a Unicode letter or number: %s',
    indextitle => {
      const issues = titleMetadataIssues(
        `<text id="valid"><head><title>„Trykt titel“</title><indextitle>${indextitle}</indextitle></head></text>`,
      );

      expect(
        issues.filter(issue => issue.rule === 'index-title-leading-character'),
      ).toHaveLength(0);
    },
  );

  it('checks the part of title after num', () => {
    const issues = titleMetadataIssues(
      '<text id="numbered"><head><title><num>III.</num>„Trykt titel“</title></head></text>',
    );

    expect(
      issues.filter(issue => issue.rule === 'index-title-leading-character'),
    ).toHaveLength(1);
  });

  it('does not let a blank indextitle excuse an invalid title', () => {
    const issues = titleMetadataIssues(
      '<text id="fallback"><head><title>[Motto]</title><indextitle> </indextitle></head></text>',
    );

    expect(
      issues.filter(issue => issue.rule === 'index-title-leading-character'),
    ).toHaveLength(1);
  });

  it('does not check index titles on texts marked skip-index', () => {
    const issues = titleMetadataIssues(
      '<text id="skipped" skip-index="true"><head><title>[Motto]</title></head></text>',
    );

    expect(
      issues.filter(issue => issue.rule === 'index-title-leading-character'),
    ).toHaveLength(0);
  });

  it.each([
    ['linktitle', '<linktitle>»Citeret«</linktitle>'],
    ['indextitle', '<indextitle>»Citeret«</indextitle>'],
    ['title', '<title>»Citeret«</title>'],
    ['firstline', '<firstline>»Citeret«</firstline>'],
  ])('checks quotation marks in the effective %s fallback', (_type, fields) => {
    const issues = titleMetadataIssues(
      `<text id="quoted"><head>${fields}</head></text>`,
    );

    expect(
      issues.filter(issue => issue.rule === 'link-title-leading-guillemet'),
    ).toHaveLength(1);
  });

  it('allows a quoted firstline when a separate link title takes precedence', () => {
    const firstline = 'Verbrannt iſt dir dein Haus. „Verbrannt iſt nur das Holz.“';
    const issues = titleMetadataIssues(
      `<text id="rueckert"><head><title>Verbrannt iſt dir dein Haus</title><firstline>${firstline}</firstline></head></text>`,
    );

    expect(
      issues.filter(issue => issue.rule === 'link-title-leading-guillemet'),
    ).toHaveLength(0);
  });

  it('allows ordinary quotation marks when firstline becomes the effective link title', () => {
    const firstline = 'Verbrannt iſt dir dein Haus. „Verbrannt iſt nur das Holz.“';
    const issues = titleMetadataIssues(
      `<text id="rueckert"><head><firstline>${firstline}</firstline></head></text>`,
    );

    expect(
      issues.filter(issue => issue.rule === 'link-title-leading-guillemet'),
    ).toHaveLength(0);
  });

  it.each([
    '«Citeret»',
    '»Citeret«',
    '‹Citeret›',
    '›Citeret‹',
  ])('reports a leading link-title guillemet: %s', linktitle => {
    const issues = titleMetadataIssues(
      `<text id="quoted"><head><linktitle>${linktitle}</linktitle></head></text>`,
    );

    expect(
      issues.filter(issue => issue.rule === 'link-title-leading-guillemet'),
    ).toHaveLength(1);
  });

  it.each([
    '„Citeret“',
    '“Citeret”',
    '"Citeret"',
    ",,Citeret''",
    '‘Citeret’',
    "'Citeret'",
    'Citeret«',
    'Citeret»',
    'Citeret‹',
    'Citeret›',
    '† Mindedigt',
    '[Motto]',
    '(Til læseren)',
    'Hvor er du?',
    'Kom!',
    'Bort —',
    "Kaphyw'",
  ])(
    'allows non-quoting link-title punctuation: %s',
    linktitle => {
      const issues = titleMetadataIssues(
        `<text id="allowed" skip-index="true"><head><linktitle>${linktitle}</linktitle></head></text>`,
      );

      expect(issues).toEqual([]);
    },
  );

  it.each([' Linktitel', 'Linktitel ', 'Linktitel\t'])(
    'reports surrounding link-title whitespace: %j',
    linktitle => {
      const issues = titleMetadataIssues(
        `<text id="spaced"><head><linktitle>${linktitle}</linktitle></head></text>`,
      );

      expect(
        issues.filter(
          issue => issue.rule === 'link-title-surrounding-whitespace',
        ),
      ).toHaveLength(1);
    },
  );
});
