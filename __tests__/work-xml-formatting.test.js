import fs from 'fs';
import { execFileSync } from 'child_process';
import {
  formatWorkXml,
  structuralTagsOutsideColumnZero,
} from '../tools/format-work-xml.js';

const workFiles = () =>
  execFileSync('git', ['ls-files', 'fdirs/*/*.xml'], { encoding: 'utf8' })
    .split('\n')
    .filter(filename => filename.length > 0)
    .filter(filename => /<kalliopework[\s>]/.test(fs.readFileSync(filename, 'utf8')));

describe('work XML formatting', () => {
  it('puts structural tags in column zero and spaces texts and sections', () => {
    const xml = `<kalliopework>
  <workbody>
    <text>
      <head>
        <title>Æbler, øer og åer</title>
      </head>
      <body>
        <prose>
  Brødtekst med betydningsfuld indrykning
        </prose>
      </body>
    </text>
    <text>
      <body>
        <quote>
Et citat
        </quote>
      </body>
    </text>
    <section>
      <content>
      </content>
    </section>
  </workbody>
</kalliopework>
`;
    const formatted = formatWorkXml(xml);

    expect(formatted).toContain(
      '<prose>\n  Brødtekst med betydningsfuld indrykning\n</prose>',
    );
    expect(formatted).toContain(
      '<head>\n  <title>Æbler, øer og åer</title>\n</head>',
    );
    expect(formatted).toContain('</text>\n\n<text>');
    expect(formatted).toContain('</text>\n\n<section>');
    expect(formatted).toContain('</section>\n\n</workbody>');
    expect(formatted).not.toMatch(
      /^[ \t]+<\/?(?:body|content|head|poetry|prose|quote|section|subwork|text|workbody|workhead)(?:[ \t>/])/m,
    );
    expect(structuralTagsOutsideColumnZero(formatted)).toEqual([]);
  });

  it('formats the structure in every tracked work file', () => {
    const incorrectlyFormatted = workFiles().filter(filename => {
      const xml = fs.readFileSync(filename, 'utf8');
      return xml !== formatWorkXml(xml) ||
        structuralTagsOutsideColumnZero(xml).length > 0;
    });

    expect(incorrectlyFormatted).toEqual([]);
  });
});
