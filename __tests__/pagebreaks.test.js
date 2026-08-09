import fs from 'fs';
import { execFileSync } from 'child_process';
import { DOMParser } from '@xmldom/xmldom';

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

const parsePageNumber = value => {
  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  if (!/^[ivxlcdm]+$/i.test(value)) {
    return null;
  }

  const values = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
  const characters = value.toLowerCase().split('');
  return characters.reduce((total, character, index) => {
    const current = values[character];
    const next = values[characters[index + 1]] ?? 0;
    return total + (current < next ? -current : current);
  }, 0);
};

const expectedPageBreakCount = pages => {
  if (pages == null || pages.trim() === '') {
    return null;
  }
  const labels = pages.trim().split(/\s*[-–]\s*/);
  if (labels.length > 2) {
    return null;
  }
  const from = parsePageNumber(labels[0]);
  const to = parsePageNumber(labels[1] ?? labels[0]);
  if (from == null || to == null || to < from) {
    return null;
  }
  return to - from;
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

  Array.from(document.getElementsByTagName('pb')).forEach(pageBreak => {
    const facs = pageBreak.getAttribute('facs');
    if (facs == null || facs.trim() === '') {
      issues.push(
        `${filename}: every <pb> requires a non-empty facs attribute.`
      );
    } else if (!/^[^/\\]+\.jpg$/i.test(facs)) {
      issues.push(
        `${filename}: pb/@facs must be a JPEG filename without a path: ${facs}`
      );
    }
    if (!hasAncestor(pageBreak, 'body')) {
      issues.push(`${filename}: <pb> must occur inside a text body.`);
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

    if (expected == null) {
      if (pageBreakCount > 0) {
        issues.push(
          `${filename}: text ${textId} has ${pageBreakCount} <pb> elements, but no simple pages interval.`
        );
      }
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
          <text id="digter1900a">
            <head><firstline>Første linje</firstline><source pages="11–13"/></head>
            <body><poetry>Første linje
<pb n="12" facs="019.jpg"/>Anden linje
<pb n="13" facs="020.jpg"/>Tredje linje</poetry></body>
          </text>
          <text id="digter1900b">
            <head><firstline>Første linje</firstline><source pages="iii-v"/></head>
            <body><poetry>Første linje
<pb n="iv" facs="003.jpg"/>Anden linje
<pb n="v" facs="004.jpg"/>Tredje linje</poetry></body>
          </text>
        </workbody>
      </kalliopework>
    `;

    expect(collectPageBreakIssues('work.xml', xml)).toEqual([]);
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
