import { DOMParser } from '@xmldom/xmldom';
import { buildBiographies } from '../tools/build-static/biographies.js';
import { getChildByTagName } from '../tools/build-static/xml.js';

describe('biography builder', () => {
  it('builds separate visible biographies and omits hidden ones', () => {
    const doc = new DOMParser().parseFromString(`
      <bio><biographies>
        <biography hidden="true"><head/><body>Skjult</body></biography>
        <biography><head><source href="https://example.com">Kilde</source></head><body>Synlig</body></biography>
      </biographies></bio>
    `, 'text/xml');

    const result = buildBiographies(getChildByTagName(doc, 'bio'), {});

    expect(result).toHaveLength(1);
    expect(JSON.stringify(result[0].content_html)).toContain('Synlig');
    expect(result[0].sources).toEqual([
      expect.objectContaining({ href: 'https://example.com' }),
    ]);
  });
});
