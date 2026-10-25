import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DOMParser } from '@xmldom/xmldom';
import { execFileSync } from 'child_process';
import { get_notes } from '../tools/build-static/parsing.js';
import { htmlToXml } from '../tools/libs/helpers.js';
import Note from '../components/note.js';
import { FootnoteContainer, FootnoteList } from '../components/footnotes.js';
import { TextInline } from '../components/textcontent.js';
import LangContext from '../common/LangContext.js';
import WorkPage from '../pages/work.js';

const parse = xml => new DOMParser().parseFromString(xml, 'text/xml').documentElement;

const inlineNotes = xml => renderToStaticMarkup(
  <FootnoteContainer>
    <TextInline contentHtml={[[xml]]} />
    <FootnoteList />
  </FootnoteContainer>
);

describe('editorial note provenance', () => {
  it('preserves editorial status independently of note type', () => {
    const notes = get_notes(parse(
      '<head><notes><note type="source" editorial="true">Kildeoplysning.</note><note>Trykt note.</note></notes></head>'
    ), {});
    expect(notes[0]).toMatchObject({ type: 'source', editorial: true });
    expect(notes[1]).not.toHaveProperty('editorial');
  });

  it('preserves inline provenance through conversion', () => {
    const result = htmlToXml(
      '<footnote type="errata" editorial="true">rettet] trykt</footnote>', {}, false
    );
    expect(JSON.stringify(result)).toContain('editorial=\\"true\\"');
  });

  it('accepts the attribute on notes and errata footnotes in work XML', () => {
    const xml = '<kalliopework id="test" author="test"><workhead><title>Test</title><year>1913</year></workhead><workbody><text id="test"><head><title>Test</title><notes><note editorial="true" type="source">Note</note></notes></head><body><prose>Ord<note editorial="true">Note</note><footnote editorial="true" type="errata">rettet] trykt</footnote></prose></body></text></workbody></kalliopework>';
    expect(() => execFileSync('xmllint', ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'], { input: xml, stdio: ['pipe', 'pipe', 'pipe'] })).not.toThrow();
  });

  it('labels only explicitly editorial metadata notes', () => {
    const html = renderToStaticMarkup(<><Note editorial>Redaktionel.</Note><Note>Trykt.</Note></>);
    expect(html.match(/>Kalliope</g)).toHaveLength(1);
    expect(html).toContain('data-tooltip="Kalliopes redaktionelle note"');
    expect(html).toContain('aria-label="Kalliopes redaktionelle note"');
    expect(html).toContain('tabindex="0"');
  });

  it('labels both inline note tags without changing numbering', () => {
    const html = inlineNotes('Ord<note editorial="true">Redaktionel.</note><footnote>Trykt.</footnote><footnote editorial="true" type="errata">rettet] trykt</footnote>');
    expect(html.match(/>Kalliope</g)).toHaveLength(2);
    expect(html).toContain('href="#note-1"');
    expect(html).toContain('href="#note-2"');
    expect(html).toContain('href="#note-3"');
  });

  it('hides correction comments without changing other footnote numbers', () => {
    const plain = 'Ord<footnote>Første.</footnote> og tekst<footnote>Anden.</footnote>';
    const corrected = plain.replace('Ord', 'Ord<!-- Rettelsesark: Ord] Trykfejl -->');
    const html = inlineNotes(corrected);
    expect(html).toBe(inlineNotes(plain));
    expect(html).not.toContain('Rettelsesark');
    expect(html).not.toContain('Trykfejl');
    expect(html).toContain('href="#note-2"');
    expect(html).not.toContain('href="#note-3"');
  });

  it.each([false, true])('preserves spacing and structure through build conversion (poetry=%s)', isPoetry => {
    const plain = '  Første linje og ord\nAnden linje\n\nTredje linje<footnote>Trykt.</footnote>';
    const corrected = plain.replace('linje og', 'linje<!-- Rettelsesark: linje] fejl --> og')
      .replace('Tredje', '<!-- Rettelsesark: Tredje] Anden -->Tredje');
    expect(htmlToXml(corrected, {}, isPoetry)).toEqual(htmlToXml(plain, {}, isPoetry));
  });

  it('translates the explanation for the English interface', () => {
    const html = renderToStaticMarkup(<LangContext.Provider value="en"><Note editorial>Note.</Note></LangContext.Provider>);
    expect(html).toContain('Kalliope editorial note');
  });

  it('keeps the source marker when a mixed note is split, without attributing editorial stars to the author', () => {
    const html = inlineNotes('Ord<note>* Trykt note.</note><note editorial="true">[Tilføjelse.]</note><note editorial="true">* Førstetrykkets læsemåde.</note>');
    expect(html.match(/title="Forfatterens note"/g)).toHaveLength(1);
    expect(html.match(/>Kalliope</g)).toHaveLength(2);
    expect(html).toContain('* Førstetrykkets læsemåde.');
    expect(html).toContain('href="#note-3"');
  });

  it.each(['applied', 'reviewed'])('labels the generated correction-sheet explanation (%s)', status => {
    const html = renderToStaticMarkup(
      <LangContext.Provider value="da">
        <WorkPage lang="da" poet={{ id: 'test', country: 'dk', name: { firstname: 'Test' } }}
          work={{ id: '1900', title: 'Test', year: '1900', sources: { default: { source: 'Trykt kilde.' } } }}
          notes={[]} pictures={[]} toc={[]}
          errata={[{ status, facsimile: 'scan', facsimilePageCount: 10, facsimilePages: [9], pages: '8' }]} />
      </LangContext.Provider>
    );
    expect(html.match(/data-tooltip="Kalliopes redaktionelle note"/g)).toHaveLength(1);
    expect(html).toContain('Rettelseslisten');
    expect(html).toContain('Trykt kilde.');
  });
});
