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
        '  <metre>\n' +
        '    <analysis pattern="iambic-pentameter" confidence="0.91"/>\n' +
        '  </metre>\n' +
        '  <structure>\n' +
        '    <analysis pattern="4-4-3-3" confidence="1.0"/>\n' +
        '  </structure>\n' +
        '  <syllables>\n' +
        '    <analysis pattern="hendecasyllabic" confidence="0.89"/>\n' +
        '  </syllables>\n' +
        '  <quality>korrektur1</quality>\n' +
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

  it('sorts text metadata canonically and keeps quality last', () => {
    const xml = `<text id="test">
<head>
  <quality>korrektur1</quality>
  <keywords>person</keywords>
  <metre>
    <analysis pattern="iambic" confidence="0.9"/>
  </metre>
  <source pages="1"/>
  <firstline>Første linje</firstline>
  <subtitle>Undertitel</subtitle>
  <title>Titel</title>
</head>
<body><poetry>Linje</poetry></body>
</text>
`;

    expect(formatWorkXml(xml)).toContain(
      '<head>\n' +
        '  <title>Titel</title>\n' +
        '  <subtitle>Undertitel</subtitle>\n' +
        '  <firstline>Første linje</firstline>\n' +
        '  <source pages="1"/>\n' +
        '  <keywords>person</keywords>\n' +
        '  <metre>\n' +
        '    <analysis pattern="iambic" confidence="0.9"/>\n' +
        '  </metre>\n' +
        '  <quality>korrektur1</quality>\n' +
        '</head>',
    );
  });

  it('uses the canonical order for every supported text metadata field', () => {
    const order = [
      'suptitle',
      'title',
      'subtitle',
      'toctitle',
      'indextitle',
      'linktitle',
      'breadcrumbtitle',
      'firstline',
      'nofirstline',
      'year',
      'dates',
      'written',
      'performed',
      'event',
      'begivenhed',
      'notes',
      'pictures',
      'source',
      'keywords',
      'form',
      'metre',
      'rhyme',
      'structure',
      'syllables',
      'quality',
    ];
    const analysisFields = new Set([
      'form',
      'metre',
      'rhyme',
      'structure',
      'syllables',
    ]);
    const metadata = order.toReversed().map(name => {
      if (name === 'nofirstline') {
        return `  <${name}/>`;
      }
      if (analysisFields.has(name)) {
        return `  <${name}><analysis pattern="x"/></${name}>`;
      }
      return `  <${name}>v</${name}>`;
    }).join('\n');
    const formatted = formatWorkXml(
      `<text id="test">\n<head>\n${metadata}\n</head>\n</text>\n`,
    );
    const head = formatted.match(/<head>([\s\S]*?)<\/head>/)[1];
    const actual = [...head.matchAll(/^  <([a-z][a-z0-9-]*)/gm)]
      .map(match => match[1]);

    expect(actual).toEqual(order);
  });

  it('does not sort work or section metadata', () => {
    const xml = `<kalliopework>
<workhead>
  <quality>korrektur1</quality>
  <title>Værk</title>
</workhead>
<workbody>
<section>
<head>
  <quality>korrektur1</quality>
  <title>Afsnit</title>
</head>
<content></content>
</section>
</workbody>
</kalliopework>
`;
    const formatted = formatWorkXml(xml);

    expect(formatted).toContain(
      '<workhead>\n' +
        '  <quality>korrektur1</quality>\n' +
        '  <title>Værk</title>\n' +
        '</workhead>',
    );
    expect(formatted).toContain(
      '<section>\n' +
        '<head>\n' +
        '  <quality>korrektur1</quality>\n' +
        '  <title>Afsnit</title>\n' +
        '</head>',
    );
  });

  it('moves leading comments with their metadata and leaves trailing comments', () => {
    const xml = `<text id="test">
<head>
  <quality>korrektur1</quality>
  <!-- Kildekommentar -->
  <source pages="1"/>
  <title>Titel</title>
  <!-- Afsluttende kommentar -->
</head>
<body><poetry>Linje</poetry></body>
</text>
`;

    expect(formatWorkXml(xml)).toContain(
      '<head>\n' +
        '  <title>Titel</title>\n' +
        '  <!-- Kildekommentar -->\n' +
        '  <source pages="1"/>\n' +
        '  <quality>korrektur1</quality>\n' +
        '  <!-- Afsluttende kommentar -->\n' +
        '</head>',
    );
  });

  it('keeps an inline comment with the preceding metadata field', () => {
    const xml = `<text id="test">
<head>
  <quality>korrektur1</quality>
  <title>Titel</title>
  <source pages="1"/> <!-- Kildekommentar -->
</head>
<body><poetry>Linje</poetry></body>
</text>
`;

    expect(formatWorkXml(xml)).toContain(
      '<head>\n' +
        '  <title>Titel</title>\n' +
        '  <source pages="1"/> <!-- Kildekommentar -->\n' +
        '  <quality>korrektur1</quality>\n' +
        '</head>',
    );
  });

  it('keeps repeated fields stable and preserves direct text with its field', () => {
    const xml = `<text id="test">
<head>
  <source pages="1"/>/>
  <quality>korrektur1</quality>
  <notes><note>Første</note></notes>
  <notes><note>Anden</note></notes>
  <title>Titel</title>
</head>
<body><poetry>Linje</poetry></body>
</text>
`;
    const formatted = formatWorkXml(xml);

    expect(formatted).toContain(
      '<notes>\n' +
        '    <note>Første</note>\n' +
        '  </notes>\n' +
        '  <notes>\n' +
        '    <note>Anden</note>\n' +
        '  </notes>',
    );
    expect(formatted).toContain('<source pages="1"/>/>\n  <quality>');
    expect(formatWorkXml(formatted)).toBe(formatted);
  });

  it('puts notes and pictures on indented lines inside metadata containers', () => {
    const xml = `<kalliopework>
<workhead>
  <pictures><picture type="titlepage" src="p1.jpg">Titelblad</picture></pictures>
</workhead>
<workbody>
<text>
<head>
  <notes><note>Første note</note><note>Anden note</note></notes>
</head>
<body><prose>Brødtekst<note>Inline note</note></prose></body>
</text>
</workbody>
</kalliopework>
`;
    const formatted = formatWorkXml(xml);

    expect(formatted).toContain(
      '<pictures>\n' +
        '    <picture type="titlepage" src="p1.jpg">Titelblad</picture>\n' +
        '  </pictures>',
    );
    expect(formatted).toContain(
      '<notes>\n' +
        '    <note>Første note</note>\n' +
        '    <note>Anden note</note>\n' +
        '  </notes>',
    );
    expect(formatted).toContain(
      '<body><prose>Brødtekst<note>Inline note</note></prose></body>',
    );
    expect(formatWorkXml(formatted)).toBe(formatted);
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

  it('keeps resetnum inline after a nonum line', () => {
    const xml = '<poetry>\n<nonum><center>2.</center></nonum><resetnum/>\nVerslinje\n</poetry>\n';

    expect(formatWorkXml(xml)).toContain(
      '<poetry>\n' +
        '<nonum><center>2.</center></nonum><resetnum/>\n' +
        'Verslinje',
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
