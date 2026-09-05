import fs from 'fs';

describe('VS Code Kalliope text-format syntax', () => {
  const grammar = JSON.parse(
    fs.readFileSync(
      'tools/vscode-kalliope-syntax/syntaxes/kalliope-text.tmLanguage.json',
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

describe('VS Code Kalliope facsimile layout', () => {
  const extensionSource = fs.readFileSync(
    'tools/vscode-kalliope-syntax/extension.js',
    'utf8',
  );

  it('fits the complete facsimile page inside the available panel height', () => {
    expect(extensionSource).toContain('grid-template-rows: auto minmax(0, 1fr)');
    expect(extensionSource).toContain(
      'height: 100%; min-height: 0; object-fit: contain',
    );
  });
});
