import { DOMParser } from '@xmldom/xmldom';
import {
  pageOnlySourceError,
  parsePageInterval,
} from '../../tools/build-static/source-validation.js';
import {
  collectSourcePolicyIssues,
  collectFacsimilePageSourceIssues,
  parseWorkXml,
} from '../../tools/work-validation.js';

describe('work source structure', () => {
  const facsimileWork = (texts, sources = '<source facsimile="scan" facsimile-pages-num="20">Kilde</source>') =>
    parseWorkXml(`<kalliopework><workhead>${sources}</workhead><workbody>${texts}</workbody></kalliopework>`);

  it('requires pages for poems, nested texts and legacy prose using a work facsimile', () => {
    const document = facsimileWork(`
      <text id="poem"><head/><body><poetry>Vers</poetry></body></text>
      <section><content><text id="nested"><head><source/></head></text></content></section>
      <prose id="preface"><head/><body><prose>Prosa</prose></body></prose>
    `);
    expect(collectFacsimilePageSourceIssues('work.xml', document)).toEqual([
      'work.xml: text poem requires source pages or facsimile-pages for its work facsimile.',
      'work.xml: text nested requires source pages or facsimile-pages for its work facsimile.',
      'work.xml: text preface requires source pages or facsimile-pages for its work facsimile.',
    ]);
  });

  it.each(['pages="11-13"', 'pages="iii–v"', 'facsimile-pages="4-5"', 'pages="9" facsimile-pages="16"'])(
    'accepts legal page references: %s', attributes => {
      const document = facsimileWork(`<text id="poem"><head><source ${attributes}/></head></text>`);
      expect(collectFacsimilePageSourceIssues('work.xml', document)).toEqual([]);
    },
  );

  it.each(['pages=""', 'pages="13-11"', 'pages="102-08"', 'pages="11-"',
    'facsimile-pages=""', 'facsimile-pages="0"', 'facsimile-pages="21"', 'facsimile-pages="5-4"', 'facsimile-pages="iii"'])(
    'rejects illegal page references: %s', attributes => {
      const document = facsimileWork(`<text id="poem"><head><source ${attributes}/></head></text>`);
      expect(collectFacsimilePageSourceIssues('work.xml', document)).toHaveLength(1);
    },
  );

  it('uses the selected work source instead of requiring pages for unrelated sources', () => {
    const sources = '<source id="scan" facsimile="scan" facsimile-pages-num="20"/><source>Kilde uden facsimile</source>';
    const document = facsimileWork(`
      <text id="unrelated"><head/></text>
      <text id="missing"><head><source in="scan"/></head></text>
      <text id="located"><head><source in="scan" pages="4"/></head></text>
    `, sources);
    expect(collectFacsimilePageSourceIssues('work.xml', document)).toEqual([
      'work.xml: text missing requires source pages or facsimile-pages for its work facsimile.',
    ]);
  });

  it('requires pages on the source used by the renderer even when a second source has pages', () => {
    const document = facsimileWork('<text id="poem"><head><source href="https://example.org"/><source pages="4-5"/></head></text>');
    expect(collectFacsimilePageSourceIssues('work.xml', document)).toEqual([
      'work.xml: text poem requires source pages or facsimile-pages for its work facsimile.',
    ]);
  });

  it.each(['<source/>', '<source facsimile="scan"/>', '<source facsimile-pages-num="20"/>'])(
    'does not require pages without both facsimile attributes: %s', sources => {
      const document = facsimileWork('<text id="poem"><head/></text>', sources);
      expect(collectFacsimilePageSourceIssues('work.xml', document)).toEqual([]);
    },
  );

  it('accepts only complete, nondecreasing page intervals', () => {
    expect(parsePageInterval('11')).toEqual({ from: 11, to: 11 });
    expect(parsePageInterval('11-13')).toEqual({ from: 11, to: 13 });
    expect(parsePageInterval('iii–v')).toEqual({ from: 3, to: 5 });
    expect(parsePageInterval('140-47')).toBeNull();
    expect(parsePageInterval('147-140')).toBeNull();
    expect(parsePageInterval('106-')).toBeNull();
  });

  it('reports a page-only source without a matching workhead source', () => {
    const document = new DOMParser().parseFromString(
      '<root><source pages="4-5"/></root>',
      'text/xml',
    );
    const textSource = document.documentElement.firstChild;

    expect(
      pageOnlySourceError({
        filename: 'fdirs/poet/work.xml',
        textId: 'poet1',
        textSource,
        workSources: {},
      }),
    ).toContain('no matching source in <workhead>');
  });

  it('reports disallowed source structures and source-like notes', () => {
    const document = parseWorkXml(`
      <kalliopework>
        <workhead><source>Kilde</source></workhead>
        <workbody>
          <text id="poet1">
            <head>
              <source><a href="https://example.org">Udgave</a></source>
              <notes><note>Teksten\n  følger denne udgave.</note></notes>
            </head>
          </text>
        </workbody>
      </kalliopework>
    `);

    const issues = collectSourcePolicyIssues('fdirs/poet/andre.xml', document);

    expect(issues.andreWorkheadSources).toHaveLength(1);
    expect(issues.externalSourceLinks).toHaveLength(1);
    expect(issues.textFollowsNotes).toHaveLength(1);
  });

  it.each(['a', 'xref'])('rejects external linked titles in notes and sources: %s', tag => {
    const document = parseWorkXml(`<kalliopework><workhead>
      <source><${tag} href="https://example.org/edition">Udgave</${tag}></source>
      <note>Gendigtning af <${tag} href="https://example.org/poem">Digtet</${tag}>.</note>
      <footnote>Jf. <${tag} href="//example.org/edition">Udgaven</${tag}>.</footnote>
    </workhead></kalliopework>`);
    expect(collectSourcePolicyIssues('work.xml', document).externalSourceLinks).toHaveLength(3);
  });

  it('rejects direct external literary texts even behind an icon', () => {
    const document = parseWorkXml(`<kalliopework><workhead>
      <note><a href="https://fr.wikisource.org/wiki/Les_Rayons_et_les_Ombres/Guitare">↬</a></note>
    </workhead></kalliopework>`);
    expect(collectSourcePolicyIssues('work.xml', document).externalSourceLinks).toHaveLength(1);
  });

  it.each([
    'https://fr.wikisource.org/wiki/Livre:Victor_Hugo.djvu',
    'https://en.wikisource.org/wiki/Page%3APoems.djvu/12',
    'https://de.wikisource.org/wiki/Seite:Gedichte.djvu/12',
    'https://de.wikisource.org/wiki/ADB:Hensel,_Louise',
  ])('allows scan pages and reference works: %s', href => {
    const document = parseWorkXml(`<kalliopework><workhead>
      <note>Kilde <a href="${href}">↬</a>.</note>
    </workhead></kalliopework>`);
    expect(collectSourcePolicyIssues('work.xml', document).externalSourceLinks).toEqual([]);
  });

  it('allows scan icons, internal text links, and email in notes', () => {
    const document = parseWorkXml(`<kalliopework><workhead>
      <note>Trykt kilde <a href="https://example.org/scan.pdf">↬</a>;
        <xref poem="original"/> <a href="/da/text/original">Digt</a>
        <a href="mailto:editor@example.org">Redaktør</a>.</note>
      <!-- <note><a href="https://example.org/poem">Digt</a></note> -->
    </workhead></kalliopework>`);
    expect(collectSourcePolicyIssues('work.xml', document).externalSourceLinks).toEqual([]);
  });

  it('allows internal source links and ignores commented-out markup', () => {
    const document = parseWorkXml(`
      <kalliopework>
        <workhead/>
        <workbody>
          <text id="poet1">
            <head>
              <source href="https://example.org"><a poet="poet">Digter</a>: <a href="/da/work/poet/1850">Udgave</a></source>
              <notes><note>Kildekritisk bemærkning.</note></notes>
            </head>
          </text>
          <!-- <note>Teksten følger en anden udgave.</note> -->
        </workbody>
      </kalliopework>
    `);

    expect(
      collectSourcePolicyIssues('fdirs/poet/andre.xml', document),
    ).toEqual({
      andreWorkheadSources: [],
      externalSourceLinks: [],
      textFollowsNotes: [],
    });
  });
});
