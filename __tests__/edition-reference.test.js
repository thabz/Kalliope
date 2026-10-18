import { DOMParser } from '@xmldom/xmldom';
import { renderToStaticMarkup } from 'react-dom/server';
import LangContext from '../common/LangContext.js';
import { appendSourcePages } from '../common/source-reference.js';
import { TextInline } from '../components/textcontent.js';
import { buildEditionReference, resolveEditionSource } from '../tools/build-static/edition-reference.js';
import { resolveSourceReference } from '../tools/build-static/source.js';

const parse = xml => new DOMParser().parseFromString(xml, 'text/xml').documentElement;
const poet = { name: { firstname: 'Adam', lastname: 'Oehlenschläger' } };
const collected = {
  poets: new Map([['oehlenschlaeger', poet], ['liebenberg', {}], ['samler', { type: 'collection' }]]),
  works: new Map([['oehlenschlaeger/bd24', {
    id: 'bd24', poet_id: 'oehlenschlaeger', title: 'Samlede Skrifter', linktitle: 'Samlede Skrifter, 24. Bind', year: '1861',
  }]]),
};
const meta = {
  id: 'oehlenschlaeger18610101', poetId: 'oehlenschlaeger', workId: 'bd24', title: 'De to Røvere',
};
const completeSource = `<source>
  <author id="oehlenschlaeger">Adam Oehlenschläger</author><title>Poetiske Skrifter</title>
  <editor id="liebenberg">F. L. Liebenberg</editor><volume>24</volume><place>Kjøbenhavn</place>
  <publisher>Selskabet til Udgivelse af Oehlenschlägers Skrifter</publisher><year>1861</year>
</source>`;
const edition = (textXml, workSources = new Map()) => buildEditionReference({
  ...meta,
  editionSource: resolveEditionSource({ sourceNode: parse(textXml), workSources, poets: collected.poets }),
}, collected);
const render = citation => renderToStaticMarkup(
  <LangContext.Provider value="da">
    <TextInline contentHtml={[[citation, { html: true }]]} />
  </LangContext.Provider>
);

describe('other edition citations', () => {
  it('inherits a complete bibliography and links only the poem title in the complete bibliography', () => {
    const workSource = resolveSourceReference({ sourceNode: parse(completeSource), poets: collected.poets });
    const ref = edition('<source pages="353-356"/>', new Map([['default', workSource]]));
    const html = render(ref.citation);
    expect(html.replace(/<[^>]*>/g, '')).toBe(
      '»De to Røvere«, i: Adam Oehlenschläger: Poetiske Skrifter, udg. af F. L. Liebenberg, bd. 24, Kjøbenhavn: Selskabet til Udgivelse af Oehlenschlägers Skrifter, 1861, s. 353–356.'
    );
    expect(html).toContain('href="/da/text/oehlenschlaeger18610101"');
    expect(html.match(/<a\b/g)).toHaveLength(1);
    expect(html).not.toContain('href="/da/works/liebenberg"');
    expect(html).not.toContain('href="/da/work/oehlenschlaeger/bd24"');
    expect(html).toContain('<i>Poetiske Skrifter</i>');
    // The same source retains its existing volume label in Kilde.
    expect(workSource.source).toContain('bind 24');
  });

  it('uses a selected work source and replaces its bibliography for a text override', () => {
    const sources = new Map([
      ['default', resolveSourceReference({ sourceNode: parse(completeSource) })],
      ['other', resolveSourceReference({ sourceNode: parse('<source><title>Anden Udgave</title><year>1880</year></source>') })],
    ]);
    expect(edition('<source in="other" pages="5"/>', sources).citation)
      .toContain('<i>Anden Udgave</i>, 1880, s. 5.');
    const override = edition('<source in="other" pages="7"><title>Tredje Udgave</title></source>', sources);
    expect(override.citation).toContain('<i>Tredje Udgave</i>, s. 7.');
    expect(override.citation).not.toContain('1880');
  });

  it('inherits a work source even when the text has no source element', () => {
    const ref = buildEditionReference({ ...meta, editionSource: resolveEditionSource({
      sourceNode: null,
      workSources: new Map([['default', resolveSourceReference({ sourceNode: parse(completeSource) })]]),
      poets: collected.poets,
    }) }, collected);
    expect(ref.citation).toContain('Kjøbenhavn');
    expect(ref.citation).not.toContain('s. ');
  });

  it.each([
    ['<source><title>Bog</title></source>', '<i>Bog</i>.'],
    ['<source><title>Bog</title><publisher>Forlag</publisher></source>', '<i>Bog</i>, Forlag.'],
    ['<source><title>Bog</title><place>Kjøbenhavn</place><year>[1804]</year></source>', '<i>Bog</i>, Kjøbenhavn, [1804].'],
    ['<source><title>Bog</title><printer>Trykkeri</printer></source>', '<i>Bog</i>, trykt hos Trykkeri.'],
  ])('omits missing bibliographic fields cleanly (%s)', (xml, ending) => {
    expect(edition(xml).citation).toBe(
      `<a poem="${meta.id}">»De to Røvere«</a>, i: ${ending}`
    );
  });

  it.each(['anthology', 'periodical', 'newspaper'])('cites a %s through its actual publication', type => {
    const publication = { id: '1845', poet_id: 'samler', type, title: 'Udgivelsen', linktitle: 'Udgivelsen', year: '1845' };
    const data = { ...collected, works: new Map([['samler/1845', publication]]) };
    const text = { ...meta, sourcePoetId: 'samler', sourceWorkId: '1845' };
    expect(buildEditionReference(text, data).citation).toBe(
      `<a poem="${meta.id}">»De to Røvere«</a>, i: <i>Udgivelsen</i>, 1845.`
    );
    const source = resolveEditionSource({
      sourceNode: parse('<source pages="10-12"><title>Udgivelsen</title><editor type="editor">Redaktøren</editor><volume>2</volume><year>1845</year></source>'),
      workSources: new Map(), poets: data.poets,
    });
    expect(buildEditionReference({ ...text, editionSource: source }, data).citation).toContain(
      '<i>Udgivelsen</i>, red. af Redaktøren, bd. 2, 1845, s. 10–12.'
    );
  });

  it('preserves legacy source text and typography while removing bibliography links', () => {
    const ref = edition('<source pages="1-3"><a poet="oehlenschlaeger">Adam Oehlenschläger</a>: <i>Digte</i>, Kjøbenhavn, 1861.</source>');
    expect(ref.citation).toContain('Adam Oehlenschläger: <i>Digte</i>, Kjøbenhavn, 1861, s. 1–3.');
    expect(edition('<source><i><a work="oehlenschlaeger/bd24">Digte</a></i>.</source>').citation)
      .toContain('<i>Digte</i>.');
    expect(edition('<source><a work="oehlenschlaeger/bd24"><i>Digte</i></a>.</source>').citation)
      .toContain('<i>Digte</i>.');
  });

  it.each([
    '<source pages="67-76"><i>Danfana</i> 1816, bind I.</source>',
    '<source pages="67-76"><title>Danfana</title><volume>I</volume><year>1816</year></source>',
  ])('does not link an external publication title to Andre digte (%s)', xml => {
    const data = {
      ...collected,
      works: new Map([['oehlenschlaeger/andre', { id: 'andre', title: 'Andre digte' }]]),
    };
    const ref = buildEditionReference({
      ...meta,
      workId: 'andre',
      editionSource: resolveEditionSource({ sourceNode: parse(xml), workSources: new Map(), poets: data.poets }),
    }, data);
    const html = render(ref.citation);
    expect(html).toContain('<i>Danfana</i>');
    expect(html).toContain('s. 67–76.');
    expect(html).toContain(`href="/da/text/${meta.id}"`);
    expect(html).not.toContain('/da/work/');
  });

  it('falls back to available author, work title and year without fabricating metadata', () => {
    expect(buildEditionReference(meta, collected).citation).toBe(
      `<a poem="${meta.id}">»De to Røvere«</a>, i: Adam Oehlenschläger: <i>Samlede Skrifter, 24. Bind</i>, 1861.`
    );
  });

  it('escapes titles and page references rather than interpreting them as markup', () => {
    const ref = buildEditionReference({ ...meta, title: '<a> & Titel', editionSource: {
      bibliography: { title: '<Bog> & Titel' }, pages: '<5>',
    } }, collected);
    expect(render(ref.citation).replace(/<[^>]*>/g, '')).toContain('»&lt;a&gt; &amp; Titel«, i: &lt;Bog&gt; &amp; Titel, s. &lt;5&gt;.');
  });
});

describe('source pages', () => {
  it.each([
    ['Kilde.', '353-356', 'Kilde, s. 353–356.'],
    ['Kilde', 'iv - vi', 'Kilde, s. iv–vi.'],
    ['Kilde.', '5', 'Kilde, s. 5.'],
    ['Kilde.', ' ', 'Kilde.'],
    ['Kilde.', null, 'Kilde.'],
    ['', '5', 's. 5.'],
  ])('appends pages without redundant punctuation', (source, pages, expected) => {
    expect(appendSourcePages(source, pages)).toBe(expected);
  });
});
