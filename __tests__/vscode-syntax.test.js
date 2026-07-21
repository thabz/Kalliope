import fs from 'fs';

describe('VS Code old2kalliope syntax', () => {
  const grammar = JSON.parse(
    fs.readFileSync(
      'tools/vscode-kalliope-syntax/syntaxes/kalliope-old.tmLanguage.json',
      'utf8',
    ),
  );

  it('treats DIGTER below SEKTION as section metadata', () => {
    const sectionHead = grammar.repository['section-head'];
    const authorPattern = sectionHead.patterns.find(pattern =>
      pattern.match?.includes('DIGTER:'),
    );

    expect(sectionHead.begin).toContain('SEKTION');
    expect(authorPattern.captures['1'].name).toBe(
      'keyword.other.header.section.kalliope',
    );
  });
});
