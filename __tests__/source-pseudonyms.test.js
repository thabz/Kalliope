import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';
import { renderToStaticMarkup } from 'react-dom/server';
import LangContext from '../common/LangContext.js';
import { TextInline } from '../components/textcontent.js';
import { get_notes } from '../tools/build-static/parsing.js';
import { resolveSourceReference } from '../tools/build-static/source.js';
import { buildWorkSourceMetadata } from '../tools/build-static/work-metadata.js';
import { buildEditionReference, resolveEditionSource } from '../tools/build-static/edition-reference.js';

const parse = xml => new DOMParser().parseFromString(xml, 'text/xml').documentElement;
const render = content => renderToStaticMarkup(
  <LangContext.Provider value="da"><TextInline contentHtml={content} /></LangContext.Provider>
);
const plain = content => render(content).replace(/<[^>]*>/g, '');
const collected = {
  poets: new Map([['larsent', { name: { firstname: 'Et andet', lastname: 'navn' } }]]),
  works: new Map([['larsent/1895', { id: '1895', poet_id: 'larsent', title: 'Vilde Roser' }]]),
};
const sourceXml = attrs => `<source id="first"><author ${attrs}>Thøger Underbjerg</author>
  <title>Vilde Roser</title><place>Aarhus</place><publisher>Jydsk Forlags-Forretning</publisher><year>1895</year></source>`;

it.each(['id="larsent"', '', 'id="ukendt"'])(
  'renders explicit realname in Kilde and Andre udgaver, including inherited sources (%s)', id => {
    const source = resolveSourceReference({
      sourceNode: parse(sourceXml(`${id} realname="Thøger Larsen"`)), poets: collected.poets,
    });
    const cached = JSON.parse(JSON.stringify(source));
    expect(cached.bibliography.authors[0]).toMatchObject({ name: 'Thøger Underbjerg', realname: 'Thøger Larsen' });
    const sources = new Map([['first', cached]]);
    for (const xml of ['<source in="first" pages="7"/>', sourceXml(`${id} realname="Thøger Larsen"`)]) {
      const resolved = resolveEditionSource({ sourceNode: parse(xml), workSources: sources, poets: collected.poets });
      const citation = buildEditionReference({
        id: 'larsent1895', poetId: 'larsent', workId: '1895', title: 'Digt', editionSource: resolved,
      }, collected).citation;
      for (const reference of [resolved.source, citation]) {
        expect(plain([[reference, { html: true }]])).toContain('Thøger Underbjerg (Thøger Larsen): Vilde Roser');
        expect(render([[reference, { html: true }]]).includes('href="/da/works/larsent"')).toBe(reference === resolved.source && id === 'id="larsent"');
        expect(reference).not.toContain('Et andet');
      }
      expect(resolved.bibliography.authors[0].realname).toBe('Thøger Larsen');
    }
    expect(plain([[source.source, { html: true }]])).toBe(
      'Thøger Underbjerg (Thøger Larsen): Vilde Roser, Aarhus: Jydsk Forlags-Forretning, 1895.'
    );
  }
);

it('does not infer a real name and drops inherited realname for a replacement bibliography', () => {
  const source = resolveSourceReference({ sourceNode: parse(sourceXml('id="larsent" realname="Thøger Larsen"')) });
  const replacement = resolveSourceReference({
    sourceNode: parse(sourceXml('id="larsent"')), inheritedSource: source, poets: collected.poets,
  });
  expect(replacement.bibliography.authors).toEqual([{ name: 'Thøger Underbjerg', id: 'larsent' }]);
  expect(replacement.source).toContain('>Thøger Underbjerg</a>:');
  expect(replacement.source).not.toContain('(');
});

it('escapes both names as text and trims surrounding attribute whitespace', () => {
  const source = resolveSourceReference({ sourceNode: parse(
    '<source><author realname="  A &amp; &lt;B&gt;  ">&lt;C&gt; &amp; D</author><title>Titel</title></source>'
  ) });
  expect(source.bibliography.authors[0].realname).toBe('A & <B>');
  expect(source.source).toBe('&lt;C&gt; &amp; D (A &amp; &lt;B&gt;): <i>Titel</i>.');
});

it.each(['realname=""', 'realname="   "', 'realname="&#x9;&#xA;"'])(
  'rejects empty realname: %s', attrs => {
    expect(() => resolveSourceReference({ sourceNode: parse(sourceXml(attrs)) })).toThrow(/realname/);
  }
);
it.each(['editor', 'translator'])('rejects realname on %s', role => {
  expect(() => resolveSourceReference({ sourceNode: parse(
    `<source><${role} realname="Navn">Pseudonym</${role}><title>Titel</title></source>`
  ) })).toThrow(/realname/);
});

it('generates one work note per pseudonym across sources while preserving other notes', () => {
  const head = parse(`<workhead>
    <notes><note>Titelbladets motto er bevaret.</note><note type="credits">Bidrag.</note></notes>
    ${sourceXml('realname="Thøger Larsen"')}
    ${sourceXml('id="larsent" realname="Thøger Larsen"').replace('id="first"', 'id="second"')}
    <source><author realname="En anden">Andet navn</author><author realname="Tredje">Tredje navn</author><title>Bog</title></source>
    <source><author id="larsent">Uden attribut</author><title>Bog</title></source>
    <source>Gammel fritekst.</source>
  </workhead>`);
  const notes = get_notes(head, collected);
  expect(notes.map(note => plain(note.content_html))).toEqual([
    'Titelbladets motto er bevaret.', 'Bidrag.',
    'Udgivet under pseudonymet Thøger Underbjerg.',
    'Udgivet under pseudonymet Andet navn.',
    'Udgivet under pseudonymet Tredje navn.',
  ]);
  expect(notes[1].type).toBe('credits');
  expect(notes[2]).toMatchObject({ type: null, content_lang: 'da' });
});

it('generates notes without a notes element, but never for a text or biography head', () => {
  const xml = sourceXml('realname="Thøger Larsen"');
  expect(get_notes(parse(`<workhead>${xml}</workhead>`), collected)).toHaveLength(1);
  expect(get_notes(parse(`<head>${xml}</head>`), collected)).toEqual([]);
  expect(get_notes(parse('<workhead/>'), collected)).toEqual([]);
  const escaped = get_notes(parse('<workhead><source><author realname="Navn">A &amp; &lt;B&gt;</author><title>Bog</title></source></workhead>'), collected);
  expect(plain(escaped[0].content_html)).toBe('Udgivet under pseudonymet A &amp; &lt;B&gt;.');
});

it.each([
  ['daugaard/1856', 'Erica'], ['daugaard/1861', 'Erica'],
  ['blicherclausen/1885', 'John Bentsen'], ['blicherclausen/1888', 'John Bentsen'],
  ['goldstein/1884', 'Alexander Herz'], ['goldstein/1886', 'Hugo Falck'],
  ['drachmann/1881', 'Svend Trøst'], ['bagger/1835', 'Johannes Harring'],
  ['larsent/1895', 'Thøger Underbjerg'], ['stenersen/1752', 'Frønning Skeyværingsen'],
  ['preetzmann/1867', 'Caralis'], ['preetzmann/1867d', 'Caralis'],
  ['pedersen/1724', 'Philedor'], ['sehested/1671b', 'Siennest'],
])('migrates %s with a separate realname and no manual pseudonym note', (key, name) => {
  const filename = `fdirs/${key}.xml`;
  const xml = fs.readFileSync(filename, 'utf8');
  const work = parse(xml);
  const { sources } = JSON.parse(JSON.stringify(buildWorkSourceMetadata(work, collected.poets, filename)));
  expect(sources.default.bibliography.authors[0]).toMatchObject({ name, realname: expect.any(String) });
  const head = work.getElementsByTagName('workhead')[0];
  for (const note of Array.from(head.getElementsByTagName('note'))) {
    expect(note.textContent).not.toMatch(/pseudonym/);
  }
  if (key === 'larsent/1895') expect(head.textContent).toContain('Titelbladets motto er »Alt, som er af Sandhed, det har Evighed!«');
  if (key === 'blicherclausen/1885') expect(head.textContent).toContain('Digterens debutsamling.');
  if (key === 'stenersen/1752') expect(head.textContent).toContain('signaturens identifikation med Stenersen er omdiskuteret');
});
