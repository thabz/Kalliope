import { FootnoteContainer, FootnoteList } from '../components/footnotes.js';
import { buildElasticsearchTextEntryDocuments } from '../tools/build-static/elastic.js';
import fs from 'fs';
import React from 'react';
import { execFileSync } from 'child_process';
import { renderToStaticMarkup } from 'react-dom/server';
import { createStyleRegistry, StyleRegistry } from 'styled-jsx';
import { DOMParser } from '@xmldom/xmldom';
import TextContent from '../components/textcontent.js';
import { buildTextBlocks } from '../tools/build-static/text-blocks.js';
import { normalizedFullText } from '../tools/build-static/corpus-dataset.js';

const fixture = fs.readFileSync('__tests__/fixtures/cast-list.xml', 'utf8');
const parse = xml => new DOMParser().parseFromString(xml, 'text/xml');
const collected = { texts: new Map(), keywords: new Map(), dict: new Map() };
const blocksFor = xml => buildTextBlocks(parse(xml).getElementsByTagName('text')[0], collected);
const renderBlocks = blocks => renderToStaticMarkup(<>{blocks.map((block, index) =>
  <TextContent key={index} type={block.type} contentHtml={block.lines} options={block.options} />)}</>);
const validate = xml => execFileSync('xmllint',
  ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'],
  { input: xml, stdio: ['pipe', 'pipe', 'pipe'] });
const group = (count, rend = 'braced') => `<castGroup rend="${rend}">${Array.from({ length: count },
  (_, index) => `<castItem><role>Person ${index + 1}.</role></castItem>`).join('')}<roleDesc>fælles beskrivelse.</roleDesc></castGroup>`;
const withList = content => fixture.replace(/<castList[\s\S]*?<\/castList>/,
  `<castList>${content}</castList>`);

describe('TEI cast lists', () => {
  it('validates the complete list from #2075 and preserves its text through the static API', () => {
    expect(() => validate(fixture)).not.toThrow();
    const blocks = JSON.parse(JSON.stringify(blocksFor(fixture)));
    expect(blocks.map(block => block.type)).toEqual(['front', 'prose']);
    expect(blocks[0].lines).toHaveLength(1);
    const html = renderBlocks(blocks);
    expect(html).toMatch(/class="[^"]*cast-list small-caps"/);
    expect(html).toContain('class="cast-role">Lavst Bagge</span>,');
    expect(html).toContain('Kærestrr.'); // Verified against the issue's facsimile.
    expect(html.indexOf('Tyge.')).toBeLessThan(html.indexOf('unge Haandværkere.'));
    expect(html.indexOf('unge Haandværkere.')).toBeLessThan(html.indexOf('Esther.'));
    expect(html.indexOf('Indbyggere')).toBeLessThan(html.indexOf('Handlingen foregaar'));
    expect(html.indexOf('Handlingen foregaar')).toBeLessThan(html.indexOf('Efter personlisten.'));
    expect(html).not.toContain('<code');
    expect(html).not.toContain('data-num=');
    const text = normalizedFullText({ blocks });
    expect(text).toContain('Lavst Bagge, Raadsherre og Bygmester.');
    expect(text).toContain('Kærestrr.');
    expect(text).not.toMatch(/<(?:cast|role|set|p)\b/);
    expect(text).toContain('Efter personlisten.');
  });

  it.each([2, 4, 8])('keeps %i roles in one accessible group with a stretching decorative brace', count => {
    const xml = withList(group(count));
    expect(() => validate(xml)).not.toThrow();
    const html = renderBlocks(blocksFor(xml));
    expect((html.match(/class="cast-item"/g) ?? []).length).toBe(count);
    expect((html.match(/<svg /g) ?? []).length).toBe(1);
    expect(html).toContain('preserveAspectRatio="none" aria-hidden="true" focusable="false"');
    expect(html).toContain('vector-effect="non-scaling-stroke"');
    const descriptionId = html.match(/aria-describedby="([^"]+)"/)[1];
    expect(html).toContain(`id="${descriptionId}"`);
  });

  it('supports nested and unbraced groups, roles without descriptions and description-first source order', () => {
    const xml = withList(`<castGroup><head>Gruppe</head>${group(2)}<castItem><role>Enlig.</role></castItem></castGroup>
      <castGroup rend="braced"><roleDesc>Foranstillet.</roleDesc><castItem><role>Sidste.</role></castItem></castGroup>`);
    expect(() => validate(xml)).not.toThrow();
    const html = renderBlocks(blocksFor(xml));
    expect((html.match(/<svg /g) ?? []).length).toBe(2);
    expect(html).toContain('class="cast-group" role="group"');
    expect(html).toContain('Enlig.');
    expect(html.indexOf('Foranstillet.')).toBeLessThan(html.indexOf('Sidste.'));
    const interleaved = withList('<castGroup rend="braced"><head>Gruppen</head><castItem><role>Først</role></castItem><roleDesc>Beskrivelse</roleDesc><castItem><role>Sidst</role></castItem></castGroup>');
    const interleavedHtml = renderBlocks(blocksFor(interleaved));
    expect(interleavedHtml.indexOf('Først')).toBeLessThan(interleavedHtml.indexOf('Beskrivelse'));
    expect(interleavedHtml.indexOf('Beskrivelse')).toBeLessThan(interleavedHtml.indexOf('Sidst'));
    expect(interleavedHtml).toContain('grid-row:2 / span 2');
    expect(html).not.toContain('<code');
  });

  it('keeps punctuation outside roles, inline formatting, collective descriptions and body cast lists', () => {
    const xml = withList('<castItem type="list"><role><i>A</i></role>: <roleDesc>B &amp; C.</roleDesc>!</castItem><castItem type="list">Kollektiv <i>rolle</i>.</castItem>')
      .replace('<front>', '<body>').replace('</front>', '</body>');
    const html = renderBlocks(blocksFor(xml));
    expect(html).toContain('<span class="cast-role"><i>A</i></span>: <span class="cast-role-desc">B &amp; C.</span>!');
  });

  it('preserves page markers, inline notes and verse quotations inside front matter', () => {
    const xml = withList('<castItem><role>En rolle<note>Et verscitat:<poetry>Første vers\nAndet vers</poetry></note></role><roleDesc>med beskrivelse.<pb facs="002.jpg"/></roleDesc></castItem>');
    expect(() => validate(xml)).not.toThrow();
    const blocks = blocksFor(xml);
    expect(blocks[0].lines).toHaveLength(1);
    expect(blocks[0].lines[0][0]).toContain('Første vers<br/>Andet vers');
    expect(blocks[0].lines[0][0]).toContain('<pb facs="002.jpg"/>');
    const html = renderToStaticMarkup(<FootnoteContainer>
      <TextContent type="front" contentHtml={blocks[0].lines} /><FootnoteList />
    </FootnoteContainer>);
    expect(html).not.toContain('<code');
    expect(html).toContain('Første vers');
    expect(html).toContain('Andet vers');
  });

  it('keeps multiple group descriptions in separate grid rows and in source order', () => {
    const xml = withList('<castGroup rend="braced"><roleDesc>Første beskrivelse.</roleDesc><castItem><role>En rolle.</role></castItem><roleDesc>Anden beskrivelse.</roleDesc></castGroup>');
    expect(() => validate(xml)).not.toThrow();
    const html = renderBlocks(blocksFor(xml));
    expect(html).toContain('grid-row:1 / span 1');
    expect(html).toContain('grid-row:2 / span 1');
    expect(html.indexOf('Første beskrivelse.')).toBeLessThan(html.indexOf('En rolle.'));
    expect(html.indexOf('En rolle.')).toBeLessThan(html.indexOf('Anden beskrivelse.'));
    const ids = html.match(/aria-describedby="([^"]+)"/)[1].split(' ');
    expect(ids).toHaveLength(2);
    ids.forEach(id => expect(html).toContain(`id="${id}"`));
  });

  it('includes front matter in search text without leaking null or XML markup', () => {
    const work = { id: '1807', title: 'Ossians Digte' };
    const searchCollected = { ...collected, texts: new Map(), works: new Map() };
    const documents = buildElasticsearchTextEntryDocuments(searchCollected, {
      poet: { id: 'blicher' }, poetId: 'blicher', workId: '1807', work,
      textEntryKey: 'blicher-1807',
    });
    const list = documents.find(document => document.id === 'blicher2026101746');
    expect(list.data.text.content_html).toContain('Mornis Dottre');
    expect(list.data.text.content_html).toContain('Melilcoma');
    expect(list.data.text.content_html).not.toMatch(/null|<(?:role|cast)/);
    const ordinary = documents.find(document => document.id === 'blicher2026101747');
    expect(ordinary.data.text.content_html).not.toContain('null');
  });

  it('rejects malformed groups, misplaced roles and unsupported cast item types', () => {
    for (const content of ['<castGroup/>', '<role>Alene</role>',
      '<castItem type="invented"><role>A</role></castItem>',
      '<castItem><castGroup><castItem><role>A</role></castItem></castGroup></castItem>']) {
      expect(() => validate(withList(content))).toThrow();
    }
  });

  it('uses width-aware grids, current text colour and print-safe braces', () => {
    const registry = createStyleRegistry();
    const html = renderToStaticMarkup(<StyleRegistry registry={registry}>
      <TextContent type="front" contentHtml={blocksFor(fixture)[0].lines} />
    </StyleRegistry>);
    const css = renderToStaticMarkup(registry.styles());
    expect(css).toContain('minmax(0,');
    expect(css).toContain('@media(max-width:480px)');
    expect(css).toContain('@media print');
    expect(css).toContain('break-inside:avoid');
    expect(html).toContain('stroke="currentColor"');
  });
});
