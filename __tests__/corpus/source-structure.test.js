import { DOMParser } from '@xmldom/xmldom';
import {
  pageOnlySourceError,
  parsePageInterval,
} from '../../tools/build-static/source-validation.js';

describe('work source structure', () => {
  it('accepts only complete, nondecreasing page intervals', () => {
    expect(parsePageInterval('11')).toEqual({ from: 11, to: 11 });
    expect(parsePageInterval('11-13')).toEqual({ from: 11, to: 13 });
    expect(parsePageInterval('iii–v')).toEqual({ from: 3, to: 5 });
    expect(parsePageInterval('140-47')).toBeNull();
    expect(parsePageInterval('147-140')).toBeNull();
    expect(parsePageInterval('106-')).toBeNull();
  });

  it('reports a page-only source without a matching workhead source', () => {
    const document = new DOMParser().parseFromString(
      '<root><source pages="4-5"/></root>',
      'text/xml',
    );
    const textSource = document.documentElement.firstChild;

    expect(
      pageOnlySourceError({
        filename: 'fdirs/poet/work.xml',
        textId: 'poet1',
        textSource,
        workSources: {},
      }),
    ).toContain('no matching source in <workhead>');
  });
});
