import fs from 'fs';
import { execFileSync } from 'child_process';
import { DOMParser } from '@xmldom/xmldom';
import { parsePageInterval } from '../tools/build-static/source-validation.js';

const trackedWorkFiles = () =>
  execFileSync('git', ['ls-files', 'fdirs/*/*.xml'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .filter(filename =>
      /<kalliopework[\s>]/.test(fs.readFileSync(filename, 'utf8'))
    );

const hasAncestor = (node, name) => {
  let current = node.parentNode;
  while (current != null) {
    if (current.nodeName === name) {
      return true;
    }
    current = current.parentNode;
  }
  return false;
};

const directChild = (node, name) =>
  Array.from(node.childNodes).find(child => child.nodeName === name) ?? null;

const ignoresTest = (node, testName) =>
  (node.getAttribute('ignore-tests') ?? '')
    .split(',')
    .map(value => value.trim())
    .includes(testName);

const parseArabicPageNumber = value => {
  if (!/^\d+$/.test(value)) {
    return null;
  }
  return parseInt(value, 10);
};

const expectedPageBreakCount = pages => {
  const interval = parsePageInterval(pages);
  return interval == null ? null : interval.to - interval.from;
};

const parseFacsimilePageNumber = value => {
  const match = /^(\d+)\.jpg$/i.exec(value);
  return match == null ? null : parseInt(match[1], 10);
};

const textEntries = document => {
  const texts = Array.from(document.getElementsByTagName('text'));
  const proseTexts = Array.from(document.getElementsByTagName('prose')).filter(
    prose =>
      directChild(prose, 'head') != null && directChild(prose, 'body') != null
  );
  return [...texts, ...proseTexts];
};

const collectPageBreakIssues = (filename, xml) => {
  const document = new DOMParser().parseFromString(xml, 'text/xml');
  const work = document.documentElement;
  const declarations = Array.from(
    document.getElementsByTagName('pagebreaks')
  );
  const issues = [];

  declarations.forEach(declaration => {
    if (declaration.parentNode?.nodeName !== 'workhead') {
      issues.push(`${filename}: <pagebreaks/> must be a child of <workhead>.`);
    }
  });

  if (declarations.length > 1) {
    issues.push(
      `${filename}: <workhead> must not contain multiple <pagebreaks/> declarations.`
    );
  }
  if (declarations.length === 0) {
    return issues;
  }

  const pageBreaks = Array.from(document.getElementsByTagName('pb'));
  pageBreaks.forEach(pageBreak => {
    const facs = pageBreak.getAttribute('facs');
    if (facs == null || facs.trim() === '') {
      issues.push(
        `${filename}: every <pb> requires a non-empty facs attribute.`
      );
    } else if (!/^[^/\\]+\.jpg$/i.test(facs)) {
      issues.push(
        `${filename}: pb/@facs must be a JPEG filename without a path: ${facs}`
      );
    } else if (parseFacsimilePageNumber(facs) == null) {
      issues.push(
        `${filename}: pb/@facs must use a numeric JPEG filename: ${facs}`
      );
    }
    if (!hasAncestor(pageBreak, 'body')) {
      issues.push(`${filename}: <pb> must occur inside a text body.`);
    }
  });

  let previousPrintedPage = null;
  let previousFacsimilePage = null;
  pageBreaks.forEach(pageBreak => {
    const printedLabel = pageBreak.getAttribute('n');
    const printedPage =
      printedLabel == null ? null : parseArabicPageNumber(printedLabel);
    if (
      printedPage != null &&
      previousPrintedPage != null &&
      printedPage < previousPrintedPage.number
    ) {
      issues.push(
        `${filename}: pb/@n must not decrease through the work: ${previousPrintedPage.label} before ${printedLabel}.`
      );
    }
    if (printedPage != null) {
      previousPrintedPage = { label: printedLabel, number: printedPage };
    }

    const facs = pageBreak.getAttribute('facs');
    const facsimilePage =
      facs == null ? null : parseFacsimilePageNumber(facs);
    if (
      facsimilePage != null &&
      previousFacsimilePage != null &&
      facsimilePage < previousFacsimilePage.number
    ) {
      issues.push(
        `${filename}: pb/@facs must not decrease through the work: ${previousFacsimilePage.label} before ${facs}.`
      );
    }
    if (facsimilePage != null) {
      previousFacsimilePage = { label: facs, number: facsimilePage };
    }
  });

  textEntries(document).forEach(text => {
    const textId = text.getAttribute('id') ?? '(missing id)';
    const head = directChild(text, 'head');
    const source = head == null ? null : directChild(head, 'source');
    const pages = source?.getAttribute('pages') ?? null;
    const body = directChild(text, 'body');
    const pageBreakCount =
      body == null ? 0 : body.getElementsByTagName('pb').length;
    const expected = expectedPageBreakCount(pages);
    const ignorePageBreakCount =
      ignoresTest(work, 'pagebreak-count') ||
      ignoresTest(text, 'pagebreak-count');

    if (expected == null) {
      if (pages != null && pages.trim() !== '') {
        issues.push(
          `${filename}: text ${textId} has an uninterpretable pages value: ${pages}.`
        );
      } else if (pageBreakCount > 0) {
        issues.push(
          `${filename}: text ${textId} has ${pageBreakCount} <pb> elements, but no simple pages interval.`
        );
      }
      return;
    }
    if (ignorePageBreakCount) {
      return;
    }
    if (pageBreakCount !== expected) {
      issues.push(
        `${filename}: text ${textId} with pages="${pages}" requires ${expected} <pb> elements, but found ${pageBreakCount}.`
      );
    }
  });

  return issues;
};

describe('page-break markup', () => {
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

  it('allows gaps in page sequences but rejects decreases through the work', () => {
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

    expect(collectPageBreakIssues('work.xml', xml)).toEqual(
      expect.arrayContaining([
        'work.xml: pb/@n must not decrease through the work: 21 before 16.',
        'work.xml: pb/@facs must not decrease through the work: 030.jpg before 025.jpg.',
      ])
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

  it('checks all tracked works that declare complete page-break markup', () => {
    const issues = trackedWorkFiles().flatMap(filename =>
      collectPageBreakIssues(filename, fs.readFileSync(filename, 'utf8'))
    );

    expect(issues).toEqual([]);
  });
});
