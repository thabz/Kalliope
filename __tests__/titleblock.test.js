import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DOMParser } from '@xmldom/xmldom';
import { countHeadingFootnotes, extractTitleBlock } from '../tools/build-static/parsing.js';
import TitleBlock from '../components/titleblock.js';

const collected = { texts: new Map(), keywords: new Map(), dict: new Map() };
const parse = xml => new DOMParser().parseFromString(xml, 'text/xml').documentElement;
it('preserves mixed title layout and flows prose without source line breaks', () => {
  const parts = extractTitleBlock(parse('<head><titleblock><part type="main" align="center" size="large"><line>STOR TITEL</line><line>ANDEN LINJE</line></part><part type="sub"><p>Lang <i>forklaring</i> med flere ord.</p></part></titleblock></head>'), collected);
  expect(parts[0].blocks).toHaveLength(2);
  expect(parts[1].align).toBe('left');
  expect(parts[1].blocks[0].type).toBe('p');
  const html = renderToStaticMarkup(<TitleBlock parts={parts} lang="da" />);
  expect(html).toContain('text-align:center');
  expect(html).toContain('<h2');
  expect(html).toContain('<i>forklaring</i>');
  expect(html).not.toContain('data-num=');
});
it('leaves legacy headings without a title block', () => {
  expect(extractTitleBlock(parse('<head><title>Titel</title></head>'), collected)).toBeNull();
});
it('counts title-block footnotes with the body numbering', () => {
  const head = parse('<head><title>Titel</title><titleblock><part type="sub"><p>Ord<footnote>Note</footnote></p></part></titleblock></head>');
  expect(countHeadingFootnotes(head)).toBe(1);
});
