import {
  formatWorkXml,
  structuralTagsOutsideColumnZero,
} from '../../tools/format-work-xml.js';

describe('work XML formatting', () => {
  it('puts structural tags in column zero and spaces texts and sections', () => {
    const xml = `<kalliopework>
  <workhead>
    <title>Værk</title><proofreadings><proofreading model="gpt-5.6-sol" datetime="2026-09-01T21:00:00+02:00"/></proofreadings>
  </workhead>
  <workbody>
    <text>
      <head>
        <title>Æbler, øer og åer</title><firstline>Første linje</firstline><source pages="1"/><quality>korrektur1</quality><metre><analysis pattern="iambic-pentameter" confidence="0.91"/></metre><structure><analysis pattern="4-4-3-3" confidence="1.0"/></structure><syllables><analysis pattern="hendecasyllabic" confidence="0.89"/></syllables>
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
      '<workhead>\n' +
        '  <title>Værk</title>\n' +
        '  <proofreadings>\n' +
        '    <proofreading model="gpt-5.6-sol" datetime="2026-09-01T21:00:00+02:00"/>\n' +
        '  </proofreadings>\n' +
        '</workhead>',
    );

    expect(formatted).toContain(
      '<prose>\n  Brødtekst med betydningsfuld indrykning\n</prose>',
    );
    expect(formatted).toContain(
      '<head>\n' +
        '  <title>Æbler, øer og åer</title>\n' +
        '  <firstline>Første linje</firstline>\n' +
        '  <source pages="1"/>\n' +
        '  <quality>korrektur1</quality>\n' +
        '  <metre>\n' +
        '    <analysis pattern="iambic-pentameter" confidence="0.91"/>\n' +
        '  </metre>\n' +
        '  <structure>\n' +
        '    <analysis pattern="4-4-3-3" confidence="1.0"/>\n' +
        '  </structure>\n' +
        '  <syllables>\n' +
        '    <analysis pattern="hendecasyllabic" confidence="0.89"/>\n' +
        '  </syllables>\n' +
        '</head>',
    );
    expect(formatted).toContain('</text>\n\n<text>');
    expect(formatted).toContain('</text>\n\n<section>');
    expect(formatted).toContain('</section>\n\n</workbody>');
    expect(formatted).not.toMatch(
      /^[ \t]+<\/?(?:body|content|head|poetry|prose|quote|section|subwork|text|workbody|workhead)(?:[ \t>/])/m,
    );
    expect(structuralTagsOutsideColumnZero(formatted)).toEqual([]);
  });

  it('always leaves a blank line after text and section elements', () => {
    expect(formatWorkXml('<workbody>\n<text>Tekst</text>\n</workbody>\n'))
      .toContain('</text>\n\n</workbody>');
    expect(formatWorkXml('<workbody>\n<section>Del</section>\n</workbody>\n'))
      .toContain('</section>\n\n</workbody>');
  });

  it('puts poetry content and nonum lines on separate lines', () => {
    const xml = `<text>
<body>
<poetry><nonum><center>I</center></nonum><nonum><center>a</center></nonum>Første verslinje
</poetry>
</body>
</text>
`;

    expect(formatWorkXml(xml)).toContain(
      '<poetry>\n' +
        '<nonum><center>I</center></nonum>\n' +
        '<nonum><center>a</center></nonum>\n' +
        'Første verslinje',
    );
  });

  it('puts nonum outside alignment and appearance markup', () => {
    const xml = '<poetry>\n<right><small><i><nonum>Signatur</nonum></i></small></right>\n</poetry>\n';

    expect(formatWorkXml(xml)).toBe(
      '<poetry>\n<nonum><right><small><i>Signatur</i></small></right></nonum>\n</poetry>\n',
    );
  });

  it('puts alignment outside appearance markup without reordering appearances', () => {
    const xml = '<poetry>\n<nonum><w><i><center>Scene</center></i></w></nonum>\n</poetry>\n';

    expect(formatWorkXml(xml)).toBe(
      '<poetry>\n<nonum><center><w><i>Scene</i></w></center></nonum>\n</poetry>\n',
    );
  });

  it('formats canonical nonum markup idempotently', () => {
    const xml = '<poetry>\n<nonum><right><i><small>Signatur</small></i></right></nonum>\n</poetry>\n';

    expect(formatWorkXml(formatWorkXml(xml))).toBe(xml);
  });
});
