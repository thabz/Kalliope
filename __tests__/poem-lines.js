import {
  collectPoemLineQualityFindings,
  formatPoemLineIssue,
  findPoemLineFindingsInText,
} from '../tools/text-quality-poem-lines.js';

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
});
