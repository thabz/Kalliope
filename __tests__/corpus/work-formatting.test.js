import {
  formatWorkXml,
  structuralTagsOutsideColumnZero,
} from '../../tools/format-work-xml.js';

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
});
