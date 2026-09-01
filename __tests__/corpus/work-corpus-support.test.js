import {
  loadTrackedWorkFiles,
  trackedWorkFilenames,
} from '../../tools/libs/work-files.js';
import {
  checksForWorkXml,
  collectBodyLinkIssues,
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
      sources: false,
      textStructure: false,
    });
    expect(checksForWorkXml('<source\n pages="1-2"/>')).toEqual({
      bodyLinks: false,
      facsimiles: false,
      pageBreaks: false,
      sources: true,
      textStructure: false,
    });
    expect(checksForWorkXml('<pagebreaks/>')).toEqual({
      bodyLinks: false,
      facsimiles: false,
      pageBreaks: true,
      sources: false,
      textStructure: false,
    });
    expect(checksForWorkXml('<pb n="2"/>Tekst')).toEqual({
      bodyLinks: false,
      facsimiles: false,
      pageBreaks: true,
      sources: false,
      textStructure: false,
    });
    expect(checksForWorkXml('<source facsimile="scan.pdf"/>')).toEqual({
      bodyLinks: false,
      facsimiles: true,
      pageBreaks: false,
      sources: false,
      textStructure: false,
    });
    expect(checksForWorkXml('<a poem="text-id">Tekst</a>')).toEqual({
      bodyLinks: true,
      facsimiles: false,
      pageBreaks: false,
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
