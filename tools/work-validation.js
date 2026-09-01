import { DOMParser } from '@xmldom/xmldom';
import {
  pageIntervalError,
  pageOnlySourceError,
  parsePageInterval,
} from './build-static/source-validation.js';

const directChildren = (element, name) =>
  Array.from(element.childNodes).filter(
    child => child.nodeType === 1 && child.nodeName === name,
  );

const directChild = (node, name) =>
  directChildren(node, name)[0] ?? null;

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

const standalonePageBreaks = xml => {
  const pattern = /<pb\b[^>]*\/>[ \t]*(?=\r?\n|$)/g;
  return Array.from(xml.matchAll(pattern)).map(match => ({
    line: xml.slice(0, match.index).split(/\r?\n/).length,
    markup: match[0].trim(),
  }));
};

const indentedPageBreaks = xml => {
  const pattern = /^[ \t]+(<pb\b[^>]*\/>)/gm;
  return Array.from(xml.matchAll(pattern)).map(match => ({
    line: xml.slice(0, match.index).split(/\r?\n/).length,
    markup: match[1],
  }));
};

const textEntries = document => {
  const texts = Array.from(document.getElementsByTagName('text'));
  const proseTexts = Array.from(document.getElementsByTagName('prose')).filter(
    prose =>
      directChild(prose, 'head') != null && directChild(prose, 'body') != null,
  );
  return [...texts, ...proseTexts];
};

const textEntryAncestor = node => {
  let current = node.parentNode;
  while (current != null) {
    if (
      current.nodeName === 'text' ||
      (current.nodeName === 'prose' &&
        directChild(current, 'head') != null &&
        directChild(current, 'body') != null)
    ) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
};

const facsimileSourceId = pageBreak => {
  const textEntry = textEntryAncestor(pageBreak);
  const head = textEntry == null ? null : directChild(textEntry, 'head');
  const source = head == null ? null : directChild(head, 'source');
  return source?.getAttribute('in') ?? '';
};

const parseWorkXml = xml =>
  new DOMParser().parseFromString(xml, 'text/xml');

const checksForWorkXml = xml => ({
  bodyLinks: /<(?:a|xref)\b/.test(xml),
  facsimiles: /<source\b[^>]*\bfacsimile\s*=/.test(xml),
  pageBreaks: /<(?:pagebreaks|pb)\b/.test(xml),
  sources: /<source\b[^>]*\bpages\s*=/.test(xml),
  textStructure: /<text\b/.test(xml),
});

const collectBodyLinkIssues = (filename, document) => {
  const issues = [];

  ['a', 'xref'].forEach(tagName => {
    Array.from(document.getElementsByTagName(tagName)).forEach(link => {
      if (
        hasAncestor(link, 'body') !== true ||
        hasAncestor(link, 'note') === true ||
        hasAncestor(link, 'footnote') === true
      ) {
        return;
      }

      const text = textEntryAncestor(link);
      const textId = text?.getAttribute('id') ?? '(ukendt tekst)';
      issues.push(
        `${filename}: text ${textId} has <${tagName}> directly in <body>; move the link to <note> or <footnote>.`,
      );
    });
  });

  return issues;
};

const collectTextStructureIssues = (filename, document) => {
  const issues = [];

  Array.from(document.getElementsByTagName('text')).forEach(text => {
    const head = directChild(text, 'head');
    const body = directChild(text, 'body');
    if (head == null || body == null || directChild(head, 'firstline') == null) {
      return;
    }

    const bodyElements = Array.from(body.childNodes).filter(
      child => child.nodeType === 1,
    );
    if (
      bodyElements.length > 0 &&
      bodyElements.every(element => element.nodeName === 'prose')
    ) {
      const textId = text.getAttribute('id') ?? '(missing id)';
      issues.push(
        `${filename}: text ${textId} has only <prose> in <body> and must not have <firstline> in <head>.`,
      );
    }
  });

  return issues;
};

const collectSourceStructureIssues = (filename, document) => {
  const pageOnlySources = [];
  const pageIntervals = [];
  const work = document.documentElement;
  const workhead = directChild(work, 'workhead');

  Array.from(work.getElementsByTagName('text')).forEach(text => {
    const head = directChild(text, 'head');
    if (head == null) {
      return;
    }

    directChildren(head, 'source').forEach(textSource => {
      const textId = text.getAttribute('id') ?? '(ukendt tekst)';
      const sourceError = pageOnlySourceError({
        filename,
        textId,
        textSource,
        workhead,
      });
      if (sourceError != null) {
        pageOnlySources.push(sourceError);
      }
    });
  });

  Array.from(work.getElementsByTagName('source')).forEach(textSource => {
    if (
      textSource.getAttribute('pages') == null ||
      textSource.parentNode?.nodeName !== 'head' ||
      textSource.parentNode?.parentNode?.nodeName === 'workhead'
    ) {
      return;
    }
    const text = textSource.parentNode.parentNode;
    const intervalError = pageIntervalError({
      filename,
      textId: text.getAttribute('id') ?? '(ukendt tekst)',
      textSource,
    });
    if (intervalError != null) {
      pageIntervals.push(intervalError);
    }
  });

  return { pageIntervals, pageOnlySources };
};

const collectPageBreakIssues = (
  filename,
  xml,
  document = parseWorkXml(xml),
) => {
  const work = document.documentElement;
  const declarations = Array.from(document.getElementsByTagName('pagebreaks'));
  const issues = [];

  indentedPageBreaks(xml).forEach(({ line, markup }) => {
    issues.push(
      `${filename}:${line}: indentation before ${markup} belongs after the page break.`,
    );
  });

  declarations.forEach(declaration => {
    if (declaration.parentNode?.nodeName !== 'workhead') {
      issues.push(`${filename}: <pagebreaks/> must be a child of <workhead>.`);
    }
  });

  if (declarations.length > 1) {
    issues.push(
      `${filename}: <workhead> must not contain multiple <pagebreaks/> declarations.`,
    );
  }
  if (declarations.length === 0) {
    return issues;
  }

  standalonePageBreaks(xml).forEach(({ line, markup }) => {
    issues.push(
      `${filename}:${line}: ${markup} must prefix the first content on its source page on the same XML line.`,
    );
  });

  const pageBreaks = Array.from(document.getElementsByTagName('pb'));
  pageBreaks.forEach(pageBreak => {
    const facs = pageBreak.getAttribute('facs');
    if (facs == null || facs.trim() === '') {
      issues.push(`${filename}: every <pb> requires a non-empty facs attribute.`);
    } else if (!/^[^/\\]+\.jpg$/i.test(facs)) {
      issues.push(
        `${filename}: pb/@facs must be a JPEG filename without a path: ${facs}`,
      );
    } else if (parseFacsimilePageNumber(facs) == null) {
      issues.push(
        `${filename}: pb/@facs must use a numeric JPEG filename: ${facs}`,
      );
    }
    if (!hasAncestor(pageBreak, 'body')) {
      issues.push(`${filename}: <pb> must occur inside a text body.`);
    }
  });

  const previousFacsimilePages = new Map();
  pageBreaks.forEach(pageBreak => {
    const facs = pageBreak.getAttribute('facs');
    const facsimilePage = facs == null ? null : parseFacsimilePageNumber(facs);
    const sourceId = facsimileSourceId(pageBreak);
    const previousFacsimilePage = previousFacsimilePages.get(sourceId) ?? null;
    if (
      facsimilePage != null &&
      previousFacsimilePage != null &&
      facsimilePage < previousFacsimilePage.number
    ) {
      issues.push(
        `${filename}: pb/@facs must not decrease within one source: ${previousFacsimilePage.label} before ${facs}.`,
      );
    }
    if (facsimilePage != null) {
      previousFacsimilePages.set(sourceId, {
        label: facs,
        number: facsimilePage,
      });
    }
  });

  textEntries(document).forEach(text => {
    let previousPrintedPage = null;
    Array.from(text.getElementsByTagName('pb')).forEach(pageBreak => {
      const printedLabel = pageBreak.getAttribute('n');
      const printedPage =
        printedLabel == null ? null : parseArabicPageNumber(printedLabel);
      if (
        printedPage != null &&
        previousPrintedPage != null &&
        printedPage < previousPrintedPage.number
      ) {
        issues.push(
          `${filename}: pb/@n must not decrease within a text: ${previousPrintedPage.label} before ${printedLabel}.`,
        );
      }
      if (printedPage != null) {
        previousPrintedPage = { label: printedLabel, number: printedPage };
      }
    });
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
          `${filename}: text ${textId} has an uninterpretable pages value: ${pages}.`,
        );
      } else if (pageBreakCount > 0 && !ignorePageBreakCount) {
        issues.push(
          `${filename}: text ${textId} has ${pageBreakCount} <pb> elements, but no simple pages interval.`,
        );
      }
      return;
    }
    if (ignorePageBreakCount) {
      return;
    }
    if (pageBreakCount !== expected) {
      issues.push(
        `${filename}: text ${textId} with pages="${pages}" requires ${expected} <pb> elements, but found ${pageBreakCount}.`,
      );
    }
  });

  return issues;
};

export {
  checksForWorkXml,
  collectBodyLinkIssues,
  collectPageBreakIssues,
  collectSourceStructureIssues,
  collectTextStructureIssues,
  parseWorkXml,
};
