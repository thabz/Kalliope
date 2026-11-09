jest.mock('../tools/libs/caching.js', () => ({
  isFileModified: jest.fn(() => true), loadCachedJSON: jest.fn(() => null),
  writeCachedJSON: jest.fn(), markFileDirty: jest.fn(), force_reload: false,
}));
import { build_textrefs } from '../tools/build-static/textrefs.js';
import fs from 'fs';
import { execFileSync } from 'child_process';
import { renderToStaticMarkup } from 'react-dom/server';
import { DOMParser } from '@xmldom/xmldom';
import { buildTextBlocks } from '../tools/build-static/text-blocks.js';
import { embeddedTextIssues } from '../tools/build-static/embedded-text.js';
import { build_section_toc } from '../tools/build-static/toc.js';
import TOC from '../components/toc.js';
import TextContent from '../components/textcontent.js';

const collected = { texts: new Map(), keywords: new Map(), dict: new Map() };
const parse = xml => new DOMParser().parseFromString(xml, 'text/xml');
const fixture = () => parse(`<workbody author="molbech"><text id="act" skip-index="true">
<head><title>Tredje Akt</title></head><body><prose>Før digtet.</prose>
<text id="poem" context-font-size="small" context-indent="8" context-quotes="stanzas">
<head><firstline>En rose</firstline><notes><note>Kun på digtsiden.</note></notes></head>
<body><poetry>En <i>rose</i>
blomstrer.

Og visner.</poetry></body></text>
<prose>Efter digtet.</prose></body></text></workbody>`);
const lines = blocks => blocks.flatMap(block => block.lines.map(([line]) => line)).join('\n');

describe('contiguous embedded poems', () => {
  it('uses the same verse in both views, with contextual styling only in the act', () => {
    const doc = fixture();
    const [act, poem] = Array.from(doc.getElementsByTagName('text'));
    const standalone = buildTextBlocks(poem, collected);
    const context = buildTextBlocks(act, collected);
    expect(context.map(block => block.type)).toEqual(['prose', 'poetry', 'prose']);
    expect(context[1].anchor).toBe('poem');
    expect(context[1].options.fontSize).toBe('small');
    expect(standalone[0].options.fontSize).toBeNull();
    expect(lines(standalone)).toContain('En <i>rose</i>');
    expect(lines(standalone)).not.toContain('»');
    expect(lines(context)).toContain('»En <i>rose</i>');
    expect(lines(context)).toContain('blomstrer.«');
    expect(lines(context)).toContain('»Og visner.«');
    expect(lines(context)).not.toContain('Kun på digtsiden');
    const html = renderToStaticMarkup(<TextContent type="poetry" options={context[1].options} contentHtml={context[1].lines}/>);
    expect(html).toContain('<i>rose</i>');
    expect(html).not.toContain('<code');
    poem.getElementsByTagName('i')[0].firstChild.data = 'blomst';
    expect(lines(buildTextBlocks(poem, collected))).toContain('blomst');
    expect(lines(buildTextBlocks(act, collected))).toContain('blomst');
  });

  it('nests poem links under the act in the work TOC without a separate collection', () => {
    const toc = build_section_toc(fixture().documentElement);
    expect(toc).toHaveLength(1);
    expect(toc[0].id).toBe('act');
    expect(toc[0].content.map(item => item.id)).toEqual(['poem']);
    const html = renderToStaticMarkup(<TOC toc={toc} lang="da"/>);
    expect(html).toContain('/da/text/act');
    expect(html).toContain('/da/text/poem');
    expect(html).toContain('En rose');
  });

  it('validates contiguous poems and rejects interrupted or misplaced structures', () => {
    const doc = fixture();
    const [act, poem] = Array.from(doc.getElementsByTagName('text'));
    expect(embeddedTextIssues(act)).toEqual([]);
    expect(embeddedTextIssues(poem)).toEqual([]);
    poem.getElementsByTagName('body')[0].appendChild(doc.createElement('prose'));
    expect(embeddedTextIssues(poem).join(' ')).toContain('exactly one poetry block');
    act.getElementsByTagName('prose')[0].appendChild(poem);
    expect(embeddedTextIssues(poem).join(' ')).toContain('directly inside');
    act.setAttribute('context-indent', '8');
    expect(embeddedTextIssues(act).join(' ')).toContain('require an embedded text');
  });

  it('attributes a note reference to its embedded poem rather than also to the act', () => {
    const refs = build_textrefs({
      poets: new Map([['molbech', {}]]),
      workids: new Map([['molbech', ['1877']]]), texts: new Map(),
    });
    expect(refs.get('stubmoralskea2').mention).toContain('molbech2005042801');
    expect(refs.get('stubmoralskea2').mention).not.toContain('molbech2019071604');
  });

  it.each([
    ['oehlenschlaeger/1805', 'oehlenschlaeger2026110901', 'oehlen2002102202', '12-13'],
    ['oehlenschlaeger/1805', 'oehlenschlaeger2026110902', 'oehlen2002102402', '52'],
    ['oehlenschlaeger/1805', 'oehlenschlaeger2026110903', 'oehlen2002102701', '93'],
    ['wessel/1772', 'wessel2026110901', '19990208005', '13-14'],
  ])('publishes the selected poem %s/%s under its original scene with its own source pages', (work, id, parentId, pages) => {
    const doc = parse(fs.readFileSync(`fdirs/${work}.xml`, 'utf8'));
    const texts = Array.from(doc.getElementsByTagName('text'));
    const poem = texts.find(node => node.getAttribute('id') === id);
    const parent = texts.find(node => node.getAttribute('id') === parentId);
    expect(embeddedTextIssues(poem)).toEqual([]);
    expect(poem.parentNode.parentNode).toBe(parent);
    expect(poem.getElementsByTagName('source')[0].getAttribute('pages')).toBe(pages);
    expect(parent.getAttribute('skip-index')).toBe('true');
    expect(buildTextBlocks(parent, collected).filter(block => block.anchor === id)).toHaveLength(1);
    expect(buildTextBlocks(poem, collected)).toHaveLength(1);
    if (work === 'wessel/1772') {
      expect(poem.getElementsByTagName('pb')[0].getAttribute('n')).toBe('14');
      expect(poem.textContent).not.toContain('Hvor nødig Hiertet');
      expect(parent.textContent).toContain('Hvor nødig Hiertet');
    }
    expect(() => execFileSync('xmllint', ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'], {
      input: doc.toString(), stdio: 'pipe',
    })).not.toThrow();
  });

  it('keeps the published Molbech IDs once, inside Ambrosius, with valid XML', () => {
    const xml = fs.readFileSync('fdirs/molbech/1877.xml', 'utf8');
    const other = fs.readFileSync('fdirs/molbech/andre.xml', 'utf8');
    const doc = parse(xml);
    for (const id of ['molbech2005042801', 'molbech2005042802']) {
      const texts = Array.from(doc.getElementsByTagName('text')).filter(text => text.getAttribute('id') === id);
      expect(texts).toHaveLength(1);
      expect(other).not.toContain(id);
      expect(embeddedTextIssues(texts[0])).toEqual([]);
    }
    expect(() => execFileSync('xmllint', ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'], { input: xml, stdio: 'pipe' })).not.toThrow();
  });
});
