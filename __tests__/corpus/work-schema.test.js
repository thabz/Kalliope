import { execFileSync } from 'child_process';

describe('kalliopework RELAX NG schema', () => {
  const poetryWork = content => `
    <kalliopework id="1900" author="digter">
      <workhead><title>Digte</title><year>1900</year></workhead>
      <workbody>
        <text id="digter1900a">
          <head><firstline>Første linje</firstline></head>
          <body><poetry>${content}</poetry></body>
        </text>
      </workbody>
    </kalliopework>
  `;

  const validate = xml => execFileSync(
    'xmllint',
    ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'],
    { input: xml, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  );

  it('accepts type-specific identifiers on workhead, source and picture', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead>
          <title>Digte</title><year>1900</year>
          <source>Tekst <i>med markup</i><identifiers><kb-alma>A1</kb-alma><dbc-pid>P1</dbc-pid><openlibrary-edition>OL1M</openlibrary-edition></identifiers></source>
          <picture src="cover.jpg"><identifiers><wikidata>Q2</wikidata><smk>S1</smk><kid>K1</kid></identifiers></picture>
          <identifiers><wikidata>Q3</wikidata><dbc-work>work-of:1</dbc-work><openlibrary-work>OL1W</openlibrary-work><dansklitteraturshistorie-lex-dk>kapitel</dansklitteraturshistorie-lex-dk><runeberg-book>digte</runeberg-book></identifiers>
        </workhead>
      </kalliopework>
    `;

    expect(() => {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'],
        { input: xml, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
      );
    }).not.toThrow();
  });

  it('rejects identifiers not allowed for source and picture', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead>
          <title>Digte</title><year>1900</year>
          <source><identifiers><oclc>1</oclc></identifiers></source>
        </workhead>
      </kalliopework>
    `;

    expect(() => {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'],
        { input: xml, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
      );
    }).toThrow();
  });

  it('rejects the obsolete picture wikidata attribute', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead>
          <title>Digte</title><year>1900</year>
          <picture src="cover.jpg" wikidata="Q2"/>
        </workhead>
      </kalliopework>
    `;

    expect(() => {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'],
        { input: xml, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
      );
    }).toThrow();
  });

  it('accepts page-break declarations and facsimile filenames', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead>
          <title>Digte</title>
          <year>1900</year>
          <pagebreaks/>
        </workhead>
        <workbody>
          <text id="digter1900a">
            <head><firstline>Første linje</firstline></head>
            <body><poetry>Første linje
<pb n="2" facs="019.jpg"/>Anden linje</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;

    expect(() => {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'],
        { input: xml, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
    }).not.toThrow();
  });

  it('accepts one or more model proofreading attestations', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead>
          <title>Digte</title><year>1900</year>
          <proofreadings>
            <proofreading model="gpt-5.6-sol" datetime="2026-09-01T21:00:00+02:00"/>
            <proofreading model="future-model" datetime="2027-01-02T03:04:05Z"/>
          </proofreadings>
        </workhead>
      </kalliopework>
    `;

    expect(() => validate(xml)).not.toThrow();
  });

  it.each([
    '',
    '<proofreading datetime="2026-09-01T21:00:00+02:00"/>',
    '<proofreading model="gpt-5.6-sol"/>',
    '<proofreading model="" datetime="2026-09-01T21:00:00+02:00"/>',
    '<proofreading model="gpt-5.6-sol" datetime="ikke-en-dato"/>',
    '<proofreading model="gpt-5.6-sol" datetime="2026-09-01T21:00:00+02:00" extra="nej"/>',
    '<proofreading model="gpt-5.6-sol" datetime="2026-09-01T21:00:00+02:00">tekst</proofreading>',
  ])('rejects an invalid proofreading attestation: %s', proofreading => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year><proofreadings>${proofreading}</proofreadings></workhead>
      </kalliopework>
    `;

    expect(() => validate(xml)).toThrow();
  });

  it('rejects proofreading attestations outside workhead', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year></workhead>
        <workbody><proofreadings><proofreading model="gpt-5.6-sol" datetime="2026-09-01T21:00:00+02:00"/></proofreadings></workbody>
      </kalliopework>
    `;

    expect(() => validate(xml)).toThrow();
  });

  it('accepts metre analyses with confidence from zero to one', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year></workhead>
        <workbody>
          <text id="digter1900a">
            <head><firstline>Første linje</firstline><metre><analysis pattern="iambic-pentameter" confidence="0.91"/><analysis pattern="hendecasyllabic" confidence="1"/></metre></head>
            <body><poetry>Første linje</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;

    expect(() => validate(xml)).not.toThrow();
  });

  it('accepts compatible form analyses with bounded confidence', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year></workhead>
        <workbody><text><head><form><analysis pattern="sonnet" confidence="0.99"/><analysis pattern="petrarchan-sonnet" confidence="0.96"/></form></head></text></workbody>
      </kalliopework>
    `;

    expect(() => validate(xml)).not.toThrow();
  });

  it.each(['-0.01', '1.01', 'sikker'])('rejects invalid form confidence %s', confidence => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year></workhead>
        <workbody><text><head><form><analysis pattern="sonnet" confidence="${confidence}"/></form></head></text></workbody>
      </kalliopework>
    `;

    expect(() => validate(xml)).toThrow();
  });

  it('rejects an unknown form analysis pattern', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year></workhead>
        <workbody><text><head><form><analysis pattern="fourteen-lines" confidence="0.9"/></form></head></text></workbody>
      </kalliopework>
    `;

    expect(() => validate(xml)).toThrow();
  });

  it.each(['-0.01', '1.01', 'sikker'])('rejects invalid metre confidence %s', confidence => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year></workhead>
        <workbody><text><head><metre><analysis pattern="iambic-pentameter" confidence="${confidence}"/></metre></head></text></workbody>
      </kalliopework>
    `;

    expect(() => validate(xml)).toThrow();
  });

  it('accepts structure analysis with positive stanza lengths', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year></workhead>
        <workbody>
          <text id="digter1900a">
            <head><firstline>Første linje</firstline><structure><analysis pattern="4-4-3-3" confidence="1.0"/></structure></head>
            <body><poetry>Første linje</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;

    expect(() => validate(xml)).not.toThrow();
  });

  it('accepts one or more syllable analyses with bounded confidence', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year></workhead>
        <workbody><text><head><syllables><analysis pattern="decasyllabic" confidence="0.94"/><analysis pattern="hendecasyllabic" confidence="0.81"/></syllables></head></text></workbody>
      </kalliopework>
    `;

    expect(() => validate(xml)).not.toThrow();
  });

  it.each(['4--4', '0-4', 'ABBA'])('rejects invalid structure pattern %s', pattern => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year></workhead>
        <workbody><text><head><structure><analysis pattern="${pattern}" confidence="1"/></structure></head></text></workbody>
      </kalliopework>
    `;

    expect(() => validate(xml)).toThrow();
  });

  it.each(['-0.01', '1.01', 'sikker'])('rejects invalid structure confidence %s', confidence => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year></workhead>
        <workbody><text><head><structure><analysis pattern="4-4" confidence="${confidence}"/></structure></head></text></workbody>
      </kalliopework>
    `;

    expect(() => validate(xml)).toThrow();
  });

  it.each(['-0.01', '1.01', 'sikker'])('rejects invalid syllable confidence %s', confidence => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year></workhead>
        <workbody><text><head><syllables><analysis pattern="hendecasyllabic" confidence="${confidence}"/></syllables></head></text></workbody>
      </kalliopework>
    `;

    expect(() => validate(xml)).toThrow();
  });

  it('accepts a page break immediately before a canonical nonum line', () => {
    const xml = poetryWork(
      '<pb n="49" facs="055.jpg"/><nonum><center>2</center></nonum>',
    );

    expect(() => validate(xml)).not.toThrow();
  });

  it('accepts canonical nonum alignment with nested appearance markup', () => {
    const xml = poetryWork(
      '<nonum><right><small><i>F. H. Guldberg</i></small></right></nonum>',
    );

    expect(() => validate(xml)).not.toThrow();
  });

  it.each([
    '<right><nonum>Signatur</nonum></right>',
    '<nonum><small><right>Signatur</right></small></nonum>',
    '<nonum><right><center>Signatur</center></right></nonum>',
  ])('rejects non-canonical poetry line markup: %s', content => {
    expect(() => validate(poetryWork(content))).toThrow();
  });

  it('accepts bible references but rejects the obsolete bibel attribute', () => {
    const validXml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year></workhead>
        <workbody>
          <text id="digter1900a">
            <head><firstline>Første linje</firstline></head>
            <body><poetry>Første linje<note><xref bible="bibeljohannes03,16"/></note></poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;
    const obsoleteXml = validXml.replace('bible=', 'bibel=');

    expect(() => {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'],
        { input: validXml, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
    }).not.toThrow();

    expect(() => {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'],
        { input: obsoleteXml, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
    }).toThrow();
  });

  it('accepts quote max-width and rejects quote styling attributes', () => {
    const baseXml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year></workhead>
        <workbody>
          <text id="digter1900a">
            <head><firstline>Første linje</firstline></head>
            <body><quote max-width="70%" lang="de">Erste Zeile</quote></body>
          </text>
        </workbody>
      </kalliopework>
    `;
    const legacyXml = baseXml
      .replace('max-width="70%"', 'margin-left="30%"')
      .replace(' lang="de"', ' font-size="small" lang="de"');

    expect(() => {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'],
        { input: baseXml, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
    }).not.toThrow();

    expect(() => {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'],
        { input: legacyXml, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
    }).toThrow();
  });

  it('rejects unsupported blocks directly in a text body', () => {
    const validXml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year></workhead>
        <workbody>
          <text id="digter1900a">
            <head><firstline>Første linje</firstline></head>
            <body><prose>Første afsnit</prose><poetry>Første verslinje</poetry><quote>Citat</quote></body>
          </text>
        </workbody>
      </kalliopework>
    `;
    const invalidXml = validXml.replace('<poetry>', '<poem>').replace('</poetry>', '</poem>');

    expect(() => {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'],
        { input: validXml, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
    }).not.toThrow();

    expect(() => {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'],
        { input: invalidXml, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
    }).toThrow();
  });

  it('rejects the obsolete poem wrapper', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year></workhead>
        <workbody>
          <poem id="digter1900a">
            <head><firstline>Første linje</firstline></head>
            <body><poetry>Første linje</poetry></body>
          </poem>
        </workbody>
      </kalliopework>
    `;

    expect(() => {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/kalliopework.rng', '-'],
        { input: xml, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
    }).toThrow();
  });
});
