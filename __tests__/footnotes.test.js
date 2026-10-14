import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FootnoteContainer, FootnoteList } from '../components/footnotes.js';
import { TextInline } from '../components/textcontent.js';

const renderNote = note => renderToStaticMarkup(
  <FootnoteContainer>
    <TextInline contentHtml={[[`Vers<note>${note}</note>`]]} />
    <FootnoteList />
  </FootnoteContainer>
);

describe('author note markers', () => {
  it.each(['*', '**', '**)'])('floats %s at the start of the note text', marker => {
    const html = renderNote(`${marker}\n<poetry>Første vers\nAndet vers</poetry>Kilde.`);
    const content = html.split('class="footnote-text"')[1];
    expect(content).toContain('class="author-note-marker"');
    expect(content).toContain('float:left;margin-inline-end:0.35em');
    expect(content).toContain(`>${marker}</span>`);
    expect(content).toContain('aria-label="Forfatterens note"');
    expect(content.indexOf('author-note-marker')).toBeLessThan(content.indexOf('Første vers'));
    expect(content.split('</span>')[1].split('</div>')[0]).not.toContain('*');
    expect(html).toContain('Kilde.');
    expect(html.split('class="footnote-text"')[0]).not.toContain('author-note-marker');
  });

  it('wraps each cited verse separately and preserves italics, indentation and stanzas', () => {
    const html = renderNote('Indledning.<poetry lang="en">\n<i>Første lange vers<br/>  Andet vers<br/><br/>Tredje vers</i>\n</poetry>Kilde.');
    expect(html.match(/class="note-verse-line"/g)).toHaveLength(4);
    expect(html).toContain('margin-inline-start:3em;text-indent:-3em');
    expect(html).toContain('<i>Første lange vers</i>');
    expect(html).toContain('<i>  Andet vers</i>');
    expect(html).toContain('<i>Tredje vers</i>');
    expect(html).toMatch(/class="note-verse-line"[^>]*><br\/><\/div>/);
    expect(html).toContain('lang="en"');
    expect(html).toContain('Kilde.');
  });

  it('preserves blank stanzas in citations written with XML newlines', () => {
    const html = renderNote('<poetry>\nFørste\n\nAndet\n</poetry>');
    expect(html.match(/class="note-verse-line"/g)).toHaveLength(3);
    expect(html).toMatch(/class="note-verse-line"[^>]*><br\/><\/div>/);
  });

  it('preserves an asterisk within an ordinary note', () => {
    const html = renderNote('Henvisning til * i teksten.');
    expect(html).not.toContain('class="author-note-marker"');
    expect(html).toContain('Henvisning til * i teksten.');
  });
});
