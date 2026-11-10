import fs from 'fs';
import { parseXMLFragment } from '../tools/build-static/xml.js';
import { embeddedContext } from '../tools/build-static/embedded-context.js';

const parse = xml => parseXMLFragment(xml);
const named = (doc, id) => Array.from(doc.getElementsByTagName('text')).find(text => text.getAttribute('id') === id);

describe('automatic embedded poem context', () => {
  it.each([
    ['molbech/1877', 'molbech2005042801', 'Ambrosius', [{ number: 3, unit: 'akt' }, { number: 3, unit: 'scene' }]],
    ['molbech/1877', 'molbech2005042802', 'Ambrosius', [{ number: 4, unit: 'akt' }, { number: 2, unit: 'scene' }]],
    ['oehlenschlaeger/1805', 'oehlenschlaeger2026110901', 'Freyas Altar', [{ number: 1, unit: 'akt' }, { title: 'En Lund' }]],
    ['oehlenschlaeger/1805', 'oehlenschlaeger2026110902', 'Freyas Altar', [{ number: 2, unit: 'akt' }, { title: 'Værelse' }]],
    ['oehlenschlaeger/1805', 'oehlenschlaeger2026110903', 'Freyas Altar', [{ number: 2, unit: 'akt' }, { title: 'Lunden om Freyas Altar' }]],
    ['wessel/1772', 'wessel2026110901', 'Kierlighed uden Strømper', [{ number: 1, unit: 'optog' }, { number: 5, unit: 'optrin' }]],
  ])('derives %s/%s from the existing publication structure without a hand-written note', (work, id, title, parts) => {
    const doc = parse(fs.readFileSync(`fdirs/${work}.xml`, 'utf8'));
    const poem = named(doc, id);
    expect(embeddedContext(poem)).toEqual({ title, parts });
    expect(embeddedContext(poem.parentNode.parentNode)).toBeNull();
    expect(Array.from(poem.getElementsByTagName('note')).some(note => /^Fra /.test(note.textContent))).toBe(false);
  });

  it('uses only actual scene headings before the poem, ignoring notes, dialogue and later headings', () => {
    const doc = parse(`<kalliopework><workhead><title>Drama</title></workhead><workbody>
      <text id="act"><head><title>Tredje Akt</title></head><body>
      <prose><center><b>ANDEN SCENE.</b></center><note><center>Niende Scene</center></note>
      Hun taler om Tredie Scene.</prose>
      <text id="poem"><head><firstline>Rose</firstline></head><body><poetry>Rose</poetry></body></text>
      <prose><center><b>FJERDE SCENE.</b></center></prose>
      </body></text></workbody></kalliopework>`);
    expect(embeddedContext(named(doc, 'poem'))).toEqual({
      title: 'Drama', parts: [{ number: 3, unit: 'akt' }, { number: 2, unit: 'scene' }],
    });
    named(doc, 'act').getElementsByTagName('b')[0].firstChild.data = '3. SCENE.';
    expect(embeddedContext(named(doc, 'poem')).parts.at(-1)).toEqual({ number: 3, unit: 'scene' });
  });
});
