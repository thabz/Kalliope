import { DOMParser } from '@xmldom/xmldom';
import { extractTitle } from '../tools/build-static/parsing.js';

describe('titeludtrækning', () => {
  it('fjerner et tomt nummerfelt fra en indholdsfortegnelsestitel', () => {
    const doc = new DOMParser().parseFromString(
      '<head><toctitle><num></num>Korset og Kronen</toctitle></head>',
      'text/xml'
    );

    expect(extractTitle(doc.documentElement, 'toctitle')).toEqual({
      title: 'Korset og Kronen',
    });
  });
});
