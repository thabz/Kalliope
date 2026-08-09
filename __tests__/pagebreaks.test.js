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

  it('checks all tracked works that declare complete page-break markup', () => {
    const issues = trackedWorkFiles().flatMap(filename =>
      collectPageBreakIssues(filename, fs.readFileSync(filename, 'utf8'))
    );

    expect(issues).toEqual([]);
  });
});
