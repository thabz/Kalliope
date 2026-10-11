import {
  findPoetrySpacingFindings,
  findPoemLineFindingsInText,
} from '../tools/text-quality-poem-lines.js';

const file = 'fdirs/test/work.xml';
const rule = 'isolated-double-poetry-gap';
const stanza = 'Første verslinje\nAnden verslinje';
const singleSpaced = Array(5).fill(stanza).join('\n\n');
const poem = content => `<text id="poem"><body><poetry>\n${content}\n</poetry></body></text>`;
const findings = content => findPoetrySpacingFindings({ file, data: poem(content) });

describe('isolated double gaps in poetry', () => {
  it('reports the first blank source line, text id and following passage', () => {
    expect(findings(`${singleSpaced}\n\n\n${stanza}`)).toEqual([
      expect.objectContaining({
        file,
        textId: 'poem',
        rule,
        line: 16,
        excerpt: 'Første verslinje',
      }),
    ]);
  });

  it('runs through the corpus quality entry point', () => {
    const issues = findPoemLineFindingsInText({
      file,
      data: poem(`${singleSpaced}\n\n\n${stanza}`),
      lang: 'da',
      shouldUseModernFrenchPunctuationSpacing: false,
    });
    expect(issues.filter(issue => issue.rule === rule)).toHaveLength(1);
  });

  it('allows consistent single spacing', () => {
    expect(findings(singleSpaced)).toEqual([]);
  });

  it('requires at least four single gaps', () => {
    const shorter = Array(4).fill(stanza).join('\n\n');
    expect(findings(`${shorter}\n\n\n${stanza}`)).toEqual([]);
  });

  it('does not infer an isolated error from repeated double gaps', () => {
    expect(findings(`${singleSpaced}\n\n\n${stanza}\n\n\n${stanza}`)).toEqual([]);
  });

  it('allows consistently double-spaced stanzas', () => {
    expect(findings(Array(6).fill(stanza).join('\n\n\n'))).toEqual([]);
  });

  it('does not treat a triple gap as the isolated double gap', () => {
    expect(findings(`${singleSpaced}\n\n\n\n${stanza}`)).toEqual([]);
  });

  it('still reports a double gap when a separate larger gap exists', () => {
    expect(findings(`${singleSpaced}\n\n\n${stanza}\n\n\n\n${stanza}`)).toHaveLength(1);
  });

  it.each([
    '<nonum><center><i>Moral</i></center></nonum>',
    '<nonum><center>Hun:</center></nonum>',
    'II.',
    '----',
    'En enkelt verslinje',
  ])('allows an isolated single line: %s', heading => {
    expect(findings(`${singleSpaced}\n\n\n${heading}\n\n${stanza}`)).toEqual([]);
  });

  it('allows a final single-line credit without a following blank line', () => {
    expect(findings(`${singleSpaced}\n\n\n<nonum>Forfatteren.</nonum>`)).toEqual([]);
  });

  it('does not exempt a numbered heading immediately followed by verse', () => {
    expect(findings(`${singleSpaced}\n\n\n<nonum>12.</nonum>\n${stanza}`)).toHaveLength(1);
  });

  it.each(['\n \n\t\n', '\r\n \r\n\t\r\n'])(
    'counts whitespace-only blank lines and preserves their source location (%j)',
    gap => {
      expect(findings(`${singleSpaced}${gap}${stanza}`)).toEqual([
        expect.objectContaining({ line: 16, rule }),
      ]);
    },
  );

  it('ignores blank lines at block boundaries', () => {
    expect(findings(`\n\n${singleSpaced}\n\n\n`)).toEqual([]);
  });

  it.each(['note', 'footnote'])('does not count blank lines inside %s', tag => {
    expect(findings(`${singleSpaced}<${tag}>En note\n\n\nTo linjer\nmed forklaring.</${tag}>`)).toEqual([]);
    const noteWithFourGaps = `<${tag}>${singleSpaced}</${tag}>`;
    expect(findings(`${stanza}${noteWithFourGaps}\n\n\n${stanza}`)).toEqual([]);
    expect(findings(`${singleSpaced}\n\n\n${stanza}<${tag}>Note\n\n\nMere</${tag}>`)).toHaveLength(1);
  });

  it('does not count blank lines inside comments', () => {
    expect(findings(`${singleSpaced}<!-- kommentar\n\n\nfortsat -->`)).toEqual([]);
  });

  it('ignores complete poems inside comments or notes', () => {
    const invalid = poem(`${singleSpaced}\n\n\n${stanza}`);
    const data = `<!-- ${invalid} --><note>${invalid}</note>`;
    expect(findPoetrySpacingFindings({ file, data })).toEqual([]);
  });

  it('evaluates each poetry block independently', () => {
    const data = `<text id="blocks"><body><poetry>${singleSpaced}</poetry><poetry>${stanza}\n\n\n${stanza}</poetry></body></text>`;
    expect(findPoetrySpacingFindings({ file, data })).toEqual([]);
  });

  it('evaluates each text independently', () => {
    const data = poem(singleSpaced) + poem(`${stanza}\n\n\n${stanza}`);
    expect(findPoetrySpacingFindings({ file, data })).toEqual([]);
  });

  it('does not check prose or quote blocks', () => {
    const content = `${singleSpaced}\n\n\n${stanza}`;
    const data = `<text id="other"><body><prose>${content}</prose><quote>${content}</quote></body></text>`;
    expect(findPoetrySpacingFindings({ file, data })).toEqual([]);
  });
});
