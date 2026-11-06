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

it('renders wish labels and internal links with their original wording and typography', () => {
  const doc = new DOMParser().parseFromString('<bio><biographies><biography><head/><body>Se <span data-wish="missing"><i>Den gamle Titel</i></span>, <a poem="text1">en anden Titel</a>, <a work="p/w">Bogen</a> og <a person="p">Maleren</a>.</body></biography></biographies></bio>', 'text/xml');
  const result = buildBiographies(getChildByTagName(doc, 'bio'), {texts:new Map()});
  const rendered = JSON.stringify(result[0].content_html);
  expect(rendered).not.toContain('data-wish');
  expect(rendered).toContain('<i>Den gamle Titel</i>');
  expect(rendered).toContain('en anden Titel');
  expect(rendered).toContain('Maleren');
});
