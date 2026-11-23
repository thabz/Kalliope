import { DOMParser } from '@xmldom/xmldom';
import { filterTextDataByMinDate } from '../tools/text-quality-filters.js';
import { textBlocks } from '../tools/report-ocr-candidates.js';
import { findPoemLineFindingsInText } from '../tools/text-quality-poem-lines.js';
import { textMatches } from '../tools/libs/text-ranges.js';

const poem = id => `<text id="${id}"><head><firstline>Et digt</firstline></head>
<body><poetry>Første linje
Anden linje</poetry></body></text>`;
const work = (parentId, childId) => `<kalliopework><workhead><title>Drama</title></workhead><workbody>
<text id="${parentId}" skip-index="true"><head><title>Akt</title></head><body>
<prose>Før digtet.</prose>
${poem(childId)}
<prose>Efter digtet.</prose></body></text>
</workbody></kalliopework>`;
const parse = xml => new DOMParser({ onError: (_level, message) => { throw new Error(message); } }).parseFromString(xml, 'text/xml');

describe('quality tools with nested text entries', () => {
  it('filters out the complete older act without leaving unbalanced closing tags', () => {
    const data = work('test2019010101', 'test2005010101');
    const filtered = filterTextDataByMinDate(data, '20210101');
    expect(() => parse(filtered)).not.toThrow();
    expect(filtered.split('\n')).toHaveLength(data.split('\n').length);
    expect(filtered).not.toContain('Før digtet');
    expect(filtered).not.toContain('Første linje');
  });

  it('still checks a newer child independently of an excluded parent', () => {
    const filtered = filterTextDataByMinDate(work('test2019010101', 'test2026010101'), '20210101');
    expect(() => parse(filtered)).not.toThrow();
    expect(filtered).toContain('test2026010101');
    expect(filtered).toContain('Første linje');
    expect(filtered).not.toContain('Før digtet');
    expect(() => findPoemLineFindingsInText({ file: 'work.xml', data: filtered })).not.toThrow();
  });

  it('keeps the complete parent and masks only its excluded older child', () => {
    const filtered = filterTextDataByMinDate(work('test2026010101', 'test2005010101'), '20210101');
    expect(() => parse(filtered)).not.toThrow();
    expect(filtered).toContain('Efter digtet');
    expect(filtered).not.toContain('Første linje');
  });

  it('attributes poem diagnostics to the child once, retaining original line offsets', () => {
    const data = work('act', 'poem').replace('Første linje', '  Første linje').replace('Anden linje', '  Anden linje');
    const issues = findPoemLineFindingsInText({ file: 'work.xml', data });
    const indentation = issues.filter(issue => issue.rule === 'common-poetry-indentation');
    expect(indentation).toHaveLength(1);
    expect(indentation[0].textId).toBe('poem');
    expect(indentation[0].line).toBe(data.slice(0, data.indexOf('  Første')).split('\n').length);
    const blocks = textBlocks(data);
    expect(blocks.map(block => block.id)).toEqual(['act', 'poem']);
    expect(blocks[0].text).not.toContain('Første linje');
    expect(blocks[1].text).toContain('Første linje');
  });

  it('ignores text-tag examples inside XML comments and CDATA', () => {
    const matches = textMatches(`<!-- <text id="example"> -->${poem('real')}<![CDATA[<text>]]>`);
    expect(matches).toHaveLength(1);
    expect(matches[0][0]).toContain('id="real"');
  });
});
