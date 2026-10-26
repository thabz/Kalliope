import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TextContent, { TextInline } from '../components/textcontent.js';
import { createStyleRegistry, StyleRegistry } from 'styled-jsx';
import { htmlToXml } from '../tools/libs/helpers.js';

const collected = { texts: new Map(), keywords: new Map(), dict: new Map() };

describe('epigraph rendering', () => {
  it('keeps motto styling, language and width without verse numbers', () => {
    const registry = createStyleRegistry();
    const html = renderToStaticMarkup(
      <StyleRegistry registry={registry}><TextContent
        type="epigraph"
        contentLang="la"
        options={{ maxWidth: '60%' }}
        contentHtml={htmlToXml('Første motto\nAnden linje', collected, false)}
      /></StyleRegistry>,
    );

    expect(html).toMatch(/class="[^"]*small[^"]*blockquote/);
    expect(html).toContain('lang="la"');
    expect(renderToStaticMarkup(registry.styles())).toContain('max-width:60%');
    expect(html).not.toContain('data-num=');
    expect(html).not.toContain('<code');
  });

  it('renders embedded verse excerpts as ordinary text with explicit line breaks', () => {
    const html = renderToStaticMarkup(
      <TextInline contentHtml={htmlToXml(
        '<poetry>Første <i>vers</i><br/>Anden linje</poetry>', collected, false,
      )} />,
    );

    expect(html).toContain('Første <i>vers</i><br/>Anden linje');
    expect(html).not.toContain('<code');
    expect(html).not.toContain('blockquote');
  });

  it('keeps an indented prose quotation in the document flow', () => {
    const html = renderToStaticMarkup(<TextInline contentHtml={htmlToXml(
      '<blockquote left="10%" right="0">Et langt citat.</blockquote>Efter citatet.',
      collected, false,
    )} />);
    expect(html).toContain('position:relative');
    expect(html).toContain('margin:0.25lh 0 0.25lh 10%');
    expect(html).not.toContain('position:absolute');
    expect(html).toContain('</blockquote>Efter citatet.');
  });

  it('gives prose quotations a modest indent, smaller type and quarter-line spacing by default', () => {
    const html = renderToStaticMarkup(<TextContent type="prose" contentHtml={htmlToXml(
      'Før citatet.<blockquote>Et <i>citat</i>.</blockquote>Efter citatet.',
      collected, false,
    )} />);
    expect(html).toContain('margin:0.25lh 0 0.25lh 4ch');
    expect(html).toContain('font-size:0.9em');
    expect(html).toContain('text-indent:0');
    expect(html).toContain('Et <i>citat</i>.</blockquote>Efter citatet.');
  });

  it('renders a section epigraph in mixed content', () => {
    const html = renderToStaticMarkup(
      <TextContent contentHtml={htmlToXml(
        '<epigraph lang="de" max-width="60%">Motto<br/>Forfatter</epigraph>',
        collected, false,
      )} />,
    );

    expect(html).toContain('class="blockquote small" lang="de" style="max-width:60%"');
    expect(html).toContain('Motto<br/>Forfatter');
    expect(html).not.toContain('<code');
  });
});
