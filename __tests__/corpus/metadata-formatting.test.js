import fs from 'fs';
import { execFileSync } from 'child_process';
import {
  formatMetadataXml,
  formatMetadataXmlFiles,
} from '../../tools/format-metadata-xml.js';

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
    const files = metadataFiles().map(filename => ({
      filename,
      xml: fs.readFileSync(filename, 'utf8'),
    }));
    const formatted = formatMetadataXmlFiles(files);
    const incorrectlyFormatted = files
      .filter(file => file.xml !== formatted.get(file.filename))
      .map(file => file.filename);

    expect(incorrectlyFormatted).toEqual([]);
  });

  it('maps batched xmllint output back to input order', () => {
    const files = [
      {
        filename: 'second.xml',
        xml: '<person id="second"/>',
      },
      {
        filename: 'first.xml',
        xml: '<person id="first"/>',
      },
    ];
    const formattedSecond = '<?xml version="1.0"?>\n<person id="second"/>\n';
    const formattedFirst = '<?xml version="1.0"?>\n<person id="first"/>\n';
    const formatFiles = jest.fn(() => formattedSecond + formattedFirst);

    expect(formatMetadataXmlFiles(files, { formatFiles })).toEqual(new Map([
      ['second.xml', formattedSecond],
      ['first.xml', formattedFirst],
    ]));
    expect(formatFiles).toHaveBeenCalledWith(['second.xml', 'first.xml']);
  });

  it('rejects incomplete batched xmllint output', () => {
    const files = [
      { filename: 'first.xml', xml: '<person id="first"/>' },
      { filename: 'second.xml', xml: '<person id="second"/>' },
    ];

    expect(() => formatMetadataXmlFiles(files, {
      formatFiles: () => '<?xml version="1.0"?>\n<person id="first"/>\n',
    })).toThrow('xmllint returnerede 1 dokumenter for 2 metadatafiler');
  });
});
