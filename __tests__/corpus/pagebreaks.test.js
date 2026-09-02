import { collectPageBreakIssues } from '../../tools/work-validation.js';

describe('page-break markup', () => {
  it('requires indentation on a new page to follow the page break', () => {
    const xml = `<kalliopework><workbody><text><body><poetry>
    <pb n="2"/>Indrykket linje
</poetry></body></text></workbody></kalliopework>`;

    expect(collectPageBreakIssues('work.xml', xml)).toEqual([
      'work.xml:2: indentation before <pb n="2"/> belongs after the page break.',
    ]);
  });

  it('allows indentation after a page break', () => {
    const xml = `<kalliopework><workbody><text><body><poetry>
<pb n="2"/>    Indrykket linje
</poetry></body></text></workbody></kalliopework>`;

    expect(collectPageBreakIssues('work.xml', xml)).toEqual([]);
  });

  it('accepts a complete declaration even when the work has no page breaks', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year><pagebreaks/></workhead>
        <workbody/>
      </kalliopework>
    `;

    expect(collectPageBreakIssues('work.xml', xml)).toEqual([]);
  });

  it('requires facs filenames on page breaks in declared works', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year><pagebreaks/></workhead>
        <workbody>
          <text id="digter1900a"><head><firstline>Første linje</firstline></head>
            <body><poetry>Første linje\n<pb n="2"/>Anden linje</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;

    expect(collectPageBreakIssues('work.xml', xml)).toContain(
      'work.xml: every <pb> requires a non-empty facs attribute.'
    );
  });

  it('requires page breaks to prefix same-line content', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year><pagebreaks/></workhead>
        <workbody>
          <text id="digter1900a">
            <head><firstline>Første linje</firstline><source pages="11-12"/></head>
            <body><poetry>Første linje
<pb n="12" facs="019.jpg"/>
Anden linje</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;

    expect(collectPageBreakIssues('work.xml', xml)).toContain(
      'work.xml:8: <pb n="12" facs="019.jpg"/> must prefix the first content on its source page on the same XML line.'
    );
  });

  it('allows page breaks before text, inline markup and word continuations', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year><pagebreaks/></workhead>
        <workbody>
          <text id="digter1900a">
            <head><firstline>Første linje</firstline><source pages="11-14"/></head>
            <body><poetry>Første linje
<pb n="12" facs="019.jpg"/>Anden linje
<pb n="13" facs="020.jpg"/><span>Et fremhævet ord</span>
En linje fort<pb n="14" facs="021.jpg"/>sætter</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;

    expect(collectPageBreakIssues('work.xml', xml)).toEqual([]);
  });

  it('requires one page break for each boundary in a page interval', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year><pagebreaks/></workhead>
        <workbody>
          <text id="digter1900a">
            <head><firstline>Første linje</firstline><source pages="11-13"/></head>
            <body><poetry>Første linje
<pb n="12" facs="019.jpg"/>Anden linje</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;

    expect(collectPageBreakIssues('work.xml', xml)).toContain(
      'work.xml: text digter1900a with pages="11-13" requires 2 <pb> elements, but found 1.'
    );
  });

  it('rejects abbreviated and otherwise uninterpretable page intervals', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year><pagebreaks/></workhead>
        <workbody>
          <text id="digter1900a" ignore-tests="pagebreak-count">
            <head><firstline>Første linje</firstline><source pages="102-08"/></head>
            <body><poetry>Første linje</poetry></body>
          </text>
          <text id="digter1900b">
            <head><firstline>Anden linje</firstline><source pages="106-"/></head>
            <body><poetry>Anden linje</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;

    expect(collectPageBreakIssues('work.xml', xml)).toEqual(
      expect.arrayContaining([
        'work.xml: text digter1900a has an uninterpretable pages value: 102-08.',
        'work.xml: text digter1900b has an uninterpretable pages value: 106-.',
      ])
    );
  });

  it('allows the pagebreak-count exception on a text or the complete work', () => {
    const textException = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year><pagebreaks/></workhead>
        <workbody>
          <text id="digter1900a" ignore-tests="pagebreak-count">
            <head><firstline>Første linje</firstline><source pages="102-108"/></head>
            <body><poetry>Første linje</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;
    const workException = textException.replace(
      '<kalliopework id="1900" author="digter">',
      '<kalliopework id="1900" author="digter" ignore-tests="pagebreak-count">'
    ).replace(
      '<text id="digter1900a" ignore-tests="pagebreak-count">',
      '<text id="digter1900a">'
    );

    expect(collectPageBreakIssues('text.xml', textException)).toEqual([]);
    expect(collectPageBreakIssues('work.xml', workException)).toEqual([]);
  });

  it('rejects page breaks in a text whose source covers one page', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year><pagebreaks/></workhead>
        <workbody>
          <text id="digter1900a">
            <head><firstline>Første linje</firstline><source pages="11"/></head>
            <body><poetry>Første linje
<pb facs="019.jpg"/>Anden linje</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;

    expect(collectPageBreakIssues('work.xml', xml)).toContain(
      'work.xml: text digter1900a with pages="11" requires 0 <pb> elements, but found 1.'
    );
  });

  it('accepts matching Arabic and Roman page intervals', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year><pagebreaks/></workhead>
        <workbody>
          <text id="digter1900b">
            <head><firstline>Første linje</firstline><source pages="iii-v"/></head>
            <body><poetry>Første linje
<pb n="iv" facs="003.jpg"/>Anden linje
<pb n="v" facs="004.jpg"/>Tredje linje</poetry></body>
          </text>
          <text id="digter1900a">
            <head><firstline>Første linje</firstline><source pages="11–13"/></head>
            <body><poetry>Første linje
<pb n="12" facs="019.jpg"/>Anden linje
<pb n="13" facs="020.jpg"/>Tredje linje</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;

    expect(collectPageBreakIssues('work.xml', xml)).toEqual([]);
  });

  it('allows printed pagination to restart between texts but rejects decreasing facsimile pages', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year><pagebreaks/></workhead>
        <workbody>
          <text id="digter1900a">
            <head><firstline>Første linje</firstline><source pages="11-12"/></head>
            <body><poetry>Første linje
<pb n="12" facs="019.jpg"/>Anden linje</poetry></body>
          </text>
          <text id="digter1900b">
            <head><firstline>Første linje</firstline><source pages="20-21"/></head>
            <body><poetry>Første linje
<pb n="21" facs="030.jpg"/>Anden linje</poetry></body>
          </text>
          <text id="digter1900c">
            <head><firstline>Første linje</firstline><source pages="15-16"/></head>
            <body><poetry>Første linje
<pb n="16" facs="025.jpg"/>Anden linje</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;

    expect(collectPageBreakIssues('work.xml', xml)).toEqual([
      'work.xml: pb/@facs must not decrease within one source: 030.jpg before 025.jpg.',
    ]);
  });

  it('allows facsimile page numbers to restart for a new source', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead>
          <title>Samlede værker</title><year>1900</year>
          <source id="bind1"/><source id="bind2"/><pagebreaks/>
        </workhead>
        <workbody>
          <text id="digter1900a">
            <head><firstline>Første linje</firstline><source in="bind1" pages="11-12"/></head>
            <body><poetry>Første linje
<pb n="12" facs="030.jpg"/>Anden linje</poetry></body>
          </text>
          <text id="digter1900b">
            <head><firstline>Første linje</firstline><source in="bind2" pages="7-8"/></head>
            <body><poetry>Første linje
<pb n="8" facs="017.jpg"/>Anden linje</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;

    expect(collectPageBreakIssues('work.xml', xml)).toEqual([]);
  });

  it('rejects decreasing printed page numbers within one text', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year><pagebreaks/></workhead>
        <workbody>
          <text id="digter1900a">
            <head><firstline>Første linje</firstline><source pages="15-21"/></head>
            <body><poetry>Første linje
<pb n="21" facs="030.jpg"/>Anden linje
<pb n="16" facs="031.jpg"/>Tredje linje</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;

    expect(collectPageBreakIssues('work.xml', xml)).toContain(
      'work.xml: pb/@n must not decrease within a text: 21 before 16.'
    );
  });

  it('applies the page-boundary count to standalone prose texts', () => {
    const xml = `
      <kalliopework id="1900" author="digter">
        <workhead><title>Digte</title><year>1900</year><pagebreaks/></workhead>
        <workbody>
          <prose id="digter1900a">
            <head><title>Forord</title><source pages="i-iii"/></head>
            <body><prose>Første afsnit
<pb n="ii" facs="001.jpg"/>Andet afsnit</prose></body>
          </prose>
        </workbody>
      </kalliopework>
    `;

    expect(collectPageBreakIssues('work.xml', xml)).toContain(
      'work.xml: text digter1900a with pages="i-iii" requires 2 <pb> elements, but found 1.'
    );
  });

});
