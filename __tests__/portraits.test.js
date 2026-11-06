jest.mock('../tools/build-static/xml.js', () => ({
  ...jest.requireActual('../tools/build-static/xml.js'),
  loadXMLDoc: jest.fn(),
}));
jest.mock('../tools/build-static/parsing.js', () => ({
  get_picture: jest.fn(async node => ({
    src: node.getAttribute('src'),
    primary: node.getAttribute('primary') === 'true',
  })),
}));

import { loadXMLDoc, parseXMLFragment } from '../tools/build-static/xml.js';
import { build_portraits_json } from '../tools/build-static/portraits.js';

const poet = { id: 'test', has_portraits: true };

describe('optional primary portrait', () => {
  it('accepts a gallery without a primary portrait', async () => {
    loadXMLDoc.mockReturnValue(parseXMLFragment('<pictures><picture src="family.jpg"/></pictures>'));
    await expect(build_portraits_json(poet, {})).resolves.toEqual([
      { src: 'family.jpg', primary: false },
    ]);
  });

  it('still rejects multiple primary portraits', async () => {
    loadXMLDoc.mockReturnValue(parseXMLFragment('<pictures><picture src="a.jpg" primary="true"/><picture src="b.jpg" primary="true"/></pictures>'));
    await expect(build_portraits_json(poet, {})).rejects.toContain('har flere primary');
  });
});
