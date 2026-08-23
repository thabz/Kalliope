import {
  collectPoemLineQualityFindings,
  formatPoemLineIssue,
  findPoemLineFindingsInText,
} from '../../tools/text-quality-poem-lines.js';

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
});
