import { DOMParser } from '@xmldom/xmldom';
import { getNoteType } from '../tools/build-static/parsing.js';

const parseNote = xml =>
  new DOMParser().parseFromString(xml, 'text/xml').documentElement;

describe('note metadata', () => {
  it('recognizes a translation source from its xref', () => {
    const note = parseNote(
      '<note>Gendigtning af <xref type="translation" poem="original"/></note>'
    );

    expect(getNoteType(note)).toBe('translation-source');
  });

  it('preserves an explicitly assigned note type', () => {
    const note = parseNote(
      '<note type="credits"><xref type="translation" poem="original"/></note>'
    );

    expect(getNoteType(note)).toBe('credits');
  });

  it('leaves ordinary notes unclassified', () => {
    expect(getNoteType(parseNote('<note>En almindelig note.</note>'))).toBeNull();
  });
});
