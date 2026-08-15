import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
  normalizeFacsimileId,
  resolveFacsimileForPosition,
} = require('../tools/vscode-kalliope-syntax/facsimile.cjs');

const filename = '/repo/fdirs/testpoet/1900.xml';

const resolveAt = (xml, marker) => {
  const offset = xml.indexOf(marker);
  expect(offset).toBeGreaterThanOrEqual(0);
  return resolveFacsimileForPosition(xml, filename, offset);
};

describe('VS Code Kalliope facsimile resolver', () => {
  it('deduces facsimile pages from printed pages and offset', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<kalliopework>
  <workhead>
    <source facsimile="book.pdf" facsimile-pages-num="40" facsimile-pages-offset="8">Book</source>
  </workhead>
  <workbody>
    <text id="poem1">
      <head>
        <title>Poem One</title>
        <source pages="11-12"/>
      </head>
      <body><poetry>marker</poetry></body>
    </text>
  </workbody>
</kalliopework>`;

    expect(resolveAt(xml, 'marker')).toMatchObject({
      ok: true,
      facsimile: 'book',
      facsimilePages: [19, 20],
      pages: [
        { page: 19, filename: '018.jpg' },
        { page: 20, filename: '019.jpg' },
      ],
    });
  });

  it('lets explicit facsimile-pages override computed pages', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<kalliopework>
  <workhead>
    <source facsimile="book" facsimile-pages-num="40" facsimile-pages-offset="8">Book</source>
  </workhead>
  <workbody>
    <text id="poem1">
      <head>
        <title>Poem One</title>
        <source pages="11-12" facsimile-pages="9-11"/>
      </head>
      <body><poetry>marker</poetry></body>
    </text>
  </workbody>
</kalliopework>`;

    expect(resolveAt(xml, 'marker')).toMatchObject({
      ok: true,
      facsimilePages: [9, 11],
      pages: [
        { page: 9, filename: '008.jpg' },
        { page: 10, filename: '009.jpg' },
        { page: 11, filename: '010.jpg' },
      ],
    });
  });

  it('removes pdf suffixes from facsimile ids', () => {
    expect(normalizeFacsimileId('115308068587.pdf')).toBe('115308068587');
    expect(normalizeFacsimileId('115308068587.PDF')).toBe('115308068587');
  });

  it('uses named work sources from source in attributes', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<kalliopework>
  <workhead>
    <source id="bd1" facsimile="first" facsimile-pages-num="40" facsimile-pages-offset="1">First</source>
    <source id="bd2" facsimile="second.pdf" facsimile-pages-num="80" facsimile-pages-offset="20">Second</source>
  </workhead>
  <workbody>
    <text id="poem2">
      <head>
        <title>Poem Two</title>
        <source in="bd2" pages="3"/>
      </head>
      <body><poetry>marker</poetry></body>
    </text>
  </workbody>
</kalliopework>`;

    expect(resolveAt(xml, 'marker')).toMatchObject({
      ok: true,
      sourceId: 'bd2',
      facsimile: 'second',
      facsimilePages: [23, 23],
      pages: [{ page: 23, filename: '022.jpg' }],
    });
  });

  it('uses the enclosing text source when the cursor is inside prose', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<kalliopework>
  <workhead>
    <source facsimile="book.pdf" facsimile-pages-num="61" facsimile-pages-offset="6">Book</source>
  </workhead>
  <workbody>
    <text id="prose1">
      <head>
        <title>Den Første Psalme</title>
        <source pages="2-10"/>
      </head>
      <body>
        <prose font-size="small">Indledning</prose>
        <prose>marker</prose>
      </body>
    </text>
  </workbody>
</kalliopework>`;

    expect(resolveAt(xml, 'marker')).toMatchObject({
      ok: true,
      textId: 'prose1',
      title: 'Den Første Psalme',
      facsimile: 'book',
      facsimilePages: [8, 16],
    });
  });

  it('uses the latest page break before the cursor', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<kalliopework>
  <workhead>
    <source facsimile="book.pdf" facsimile-pages-num="40" facsimile-pages-offset="8">Book</source>
  </workhead>
  <workbody>
    <text id="poem1">
      <head>
        <title>Poem One</title>
        <source pages="11-13"/>
      </head>
      <body><poetry>første<pb n="12" facs="019.jpg"/>anden<pb n="13" facs="020.jpg"/>sidste</poetry></body>
    </text>
  </workbody>
</kalliopework>`;

    expect(resolveAt(xml, 'første')).toMatchObject({
      facsimilePages: [19, 21],
    });
    expect(resolveAt(xml, 'anden')).toMatchObject({
      facsimilePages: ['12'],
      pages: [{ page: '12', filename: '019.jpg' }],
    });
    expect(resolveAt(xml, 'sidste')).toMatchObject({
      facsimilePages: ['13'],
      pages: [{ page: '13', filename: '020.jpg' }],
    });
  });

  it('ignores page breaks without facs and keeps the source interval', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<kalliopework>
  <workhead>
    <source facsimile="book" facsimile-pages-num="40" facsimile-pages-offset="8">Book</source>
  </workhead>
  <workbody>
    <text id="poem1">
      <head><source pages="11-12"/></head>
      <body><poetry>første<pb n="12"/>anden</poetry></body>
    </text>
  </workbody>
</kalliopework>`;

    expect(resolveAt(xml, 'anden')).toMatchObject({
      facsimilePages: [19, 20],
    });
  });
});
