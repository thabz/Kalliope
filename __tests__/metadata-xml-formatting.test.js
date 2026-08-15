import fs from 'fs';
import { execFileSync } from 'child_process';
import { formatMetadataXml } from '../tools/format-metadata-xml.js';

const metadataFiles = () =>
  execFileSync('git', [
    'ls-files',
    'fdirs/*/info.xml',
    'fdirs/*/portraits.xml',
    'fdirs/*/artwork.xml',
    'content/artwork.xml',
  ], { encoding: 'utf8' })
    .split('\n')
    .filter(filename => filename.length > 0);

describe('metadata XML formatting', () => {
  it('formats nested person elements with two spaces', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<person id="test" country="dk" lang="da" type="poet"><name><firstname>Test</firstname><lastname>Person</lastname></name></person>
`;

    expect(formatMetadataXml(xml)).toBe(`<?xml version="1.0" encoding="UTF-8"?>
<person id="test" country="dk" lang="da" type="poet">
  <name>
    <firstname>Test</firstname>
    <lastname>Person</lastname>
  </name>
</person>
`);
  });

  it('formats picture metadata without moving inline markup', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<pictures><picture src="p1.jpg" primary="true"><i>Test</i>, olie på lærred.</picture><picture artwork="test/p2" /></pictures>
`;

    expect(formatMetadataXml(xml)).toBe(`<?xml version="1.0" encoding="UTF-8"?>
<pictures>
  <picture src="p1.jpg" primary="true">
    <i>Test</i>, olie på lærred.
  </picture>
  <picture artwork="test/p2"/>
</pictures>
`);
  });

  it('formats every tracked metadata XML file', () => {
    const incorrectlyFormatted = metadataFiles().filter(filename => {
      const xml = fs.readFileSync(filename, 'utf8');
      return xml !== formatMetadataXml(xml);
    });

    expect(incorrectlyFormatted).toEqual([]);
  });
});
