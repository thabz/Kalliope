import {
  loadTrackedWorkFiles,
  trackedWorkFilenames,
} from '../../tools/libs/work-files.js';
import {
  checksForWorkXml,
  collectBodyLinkIssues,
  collectStandaloneFootnoteIssues,
  collectRedundantTextTitleMetadataIssues,
  collectTextStructureIssues,
  parseWorkXml,
} from '../../tools/work-validation.js';

describe('work corpus support', () => {
  it('discovers tracked work files from git output', () => {
    const execute = jest.fn(() => 'fdirs/poet/one.xml\nfdirs/poet/two.xml\n');

    expect(trackedWorkFilenames({ execute })).toEqual([
      'fdirs/poet/one.xml',
      'fdirs/poet/two.xml',
    ]);
    expect(execute).toHaveBeenCalledWith(
      'git',
      expect.arrayContaining(['grep', '-l', 'fdirs/*/*.xml']),
      { encoding: 'utf8' },
    );
  });

  it('loads each discovered work exactly once', () => {
    const readFile = jest.fn(filename => `<kalliopework file="${filename}"/>`);

    expect(loadTrackedWorkFiles({
      filenames: ['first.xml', 'second.xml'],
      readFile,
    })).toEqual([
      { content: '<kalliopework file="first.xml"/>', filename: 'first.xml' },
      { content: '<kalliopework file="second.xml"/>', filename: 'second.xml' },
    ]);
    expect(readFile).toHaveBeenCalledTimes(2);
  });

  it('only requests DOM parsing for relevant work checks', () => {
    expect(checksForWorkXml('<kalliopework/>')).toEqual({
      bodyLinks: false,
      facsimiles: false,
      pageBreaks: false,
      sourcePolicy: false,
      sources: false,
      textStructure: false,
    });
    expect(checksForWorkXml('<source\n pages="1-2"/>')).toEqual({
      bodyLinks: false,
      facsimiles: false,
      pageBreaks: false,
      sourcePolicy: true,
      sources: true,
      textStructure: false,
    });
    expect(checksForWorkXml('<pagebreaks/>')).toEqual({
      bodyLinks: false,
      facsimiles: false,
      pageBreaks: true,
      sourcePolicy: false,
      sources: false,
      textStructure: false,
    });
    expect(checksForWorkXml('<pb n="2"/>Tekst')).toEqual({
      bodyLinks: false,
      facsimiles: false,
      pageBreaks: true,
      sourcePolicy: false,
      sources: false,
      textStructure: false,
    });
    expect(checksForWorkXml('<source facsimile="scan.pdf"/>')).toEqual({
      bodyLinks: false,
      facsimiles: true,
      pageBreaks: false,
      sourcePolicy: true,
      sources: false,
      textStructure: false,
    });
    expect(checksForWorkXml('<a poem="text-id">Tekst</a>')).toEqual({
      bodyLinks: true,
      facsimiles: false,
      pageBreaks: false,
      sourcePolicy: false,
      sources: false,
      textStructure: false,
    });
  });

  it('rejects first lines on prose-only text bodies', () => {
    const xml = `
      <kalliopework>
        <text id="prose-text">
          <head><title>Titel</title><firstline>Første linje</firstline></head>
          <body><prose>Prosa</prose></body>
        </text>
      </kalliopework>
    `;

    expect(collectTextStructureIssues('work.xml', parseWorkXml(xml))).toEqual([
      'work.xml: text prose-text has only <prose> in <body> and must not have <firstline> in <head>.',
    ]);
  });

  it('allows first lines when the body contains poetry', () => {
    const xml = `
      <kalliopework>
        <text id="poem-text">
          <head><title>Titel</title><firstline>Første linje</firstline></head>
          <body><poetry>Vers</poetry></body>
        </text>
      </kalliopework>
    `;

    expect(collectTextStructureIssues('work.xml', parseWorkXml(xml))).toEqual([]);
  });

  it('rejects redundant text title metadata', () => {
    const xml = `
      <kalliopework>
        <text id="duplicate-title">
          <head>
            <title>Titel</title>
            <toctitle>Titel</toctitle>
            <indextitle>Titel</indextitle>
            <linktitle>Titel</linktitle>
          </head>
        </text>
      </kalliopework>
    `;

    expect(
      collectRedundantTextTitleMetadataIssues('work.xml', parseWorkXml(xml)),
    ).toEqual([
      'work.xml: text duplicate-title has a redundant <toctitle> identical to <title>.',
      'work.xml: text duplicate-title has a redundant <indextitle> identical to <title>.',
      'work.xml: text duplicate-title has a redundant <linktitle> identical to <title>.',
    ]);
  });

  it('allows text title metadata that differs from the title', () => {
    const xml = `
      <kalliopework>
        <text id="distinct-title">
          <head>
            <title>Trykt titel</title>
            <toctitle>Kort titel</toctitle>
            <indextitle>Indekstitel</indextitle>
            <linktitle>Linktitel</linktitle>
          </head>
        </text>
      </kalliopework>
    `;

    expect(
      collectRedundantTextTitleMetadataIssues('work.xml', parseWorkXml(xml)),
    ).toEqual([]);
  });

  it.each([
    '<poetry>Vers <a poem="target"><i>mål</i></a></poetry>',
    '<prose>Prosa <w><xref poem="target"/></w></prose>',
    '<quote>Citat <a work="poet/work">værk</a></quote>',
  ])('rejects links directly in a text body: %s', bodyContent => {
    const xml = `
      <kalliopework>
        <text id="linked-text"><body>${bodyContent}</body></text>
      </kalliopework>
    `;

    expect(collectBodyLinkIssues('work.xml', parseWorkXml(xml))).toHaveLength(1);
  });

  it.each(['note', 'footnote'])('allows links inside <%s>', noteName => {
    const xml = `
      <kalliopework>
        <text id="linked-text">
          <body><prose>Prosa <${noteName}><xref poem="target"/></${noteName}></prose></body>
        </text>
      </kalliopework>
    `;

    expect(collectBodyLinkIssues('work.xml', parseWorkXml(xml))).toEqual([]);
  });
});


describe('standalone poetry footnotes', () => {
  const issuesFor = poetry => collectStandaloneFootnoteIssues(
    'work.xml',
    parseWorkXml(`<kalliopework><text id="poem"><body><poetry>${poetry}</poetry></body></text></kalliopework>`),
  );

  it.each(['note', 'footnote'])('detects a standalone <%s> despite layout markup', tag => {
    const issues = issuesFor(`Verslinje
<pb n="2"/><num>11</num><i><${tag}>En lang
note.</${tag}></i>
Næste verslinje`);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain(`work.xml: text poem has a standalone <${tag}>`);
  });

  it('detects multiple markers on an otherwise empty line', () => {
    expect(issuesFor('Vers<br/><note>A</note> <footnote>B</footnote>')).toHaveLength(2);
  });

  it('allows attached notes with multiline contents and heading notes', () => {
    expect(issuesFor(`Et ord<footnote>En lang
note.</footnote> i verset.
<nonum><center>Overskrift<note>Forklaring</note></center></nonum>`)).toEqual([]);
  });

  it('detects a marker alone in a heading wrapper', () => {
    expect(issuesFor('<nonum><center><note>Forklaring</note></center></nonum>')).toHaveLength(1);
  });

  it('ignores metadata notes and comments', () => {
    const document = parseWorkXml(`<text id="poem"><head><notes><note>Metadata</note></notes></head><body><poetry>Vers
<!-- <footnote>Kommentar</footnote> --></poetry></body></text>`);
    expect(collectStandaloneFootnoteIssues('work.xml', document)).toEqual([]);
  });
});
