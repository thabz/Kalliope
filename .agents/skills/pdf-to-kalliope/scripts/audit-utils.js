import crypto from 'crypto';
import fs from 'fs';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

const elementChildren = (node, name = null) =>
  Array.from(node?.childNodes ?? []).filter(
    child => child.nodeType === 1 && (name == null || child.nodeName === name),
  );

const directChild = (node, name) => elementChildren(node, name)[0] ?? null;

const parseXml = xml => new DOMParser().parseFromString(xml, 'text/xml');

const serializeChildren = node => {
  const serializer = new XMLSerializer();
  return Array.from(node?.childNodes ?? [])
    .map(child => serializer.serializeToString(child))
    .join('');
};

const normalizeLine = line =>
  line
    .replace(/<pb\b[^>]*\/>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .trim();

const visibleLines = text =>
  text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean);

const parseSimplePages = pages => {
  const match = /^(\d+|[ivxlcdm]+)(?:[-–](\d+|[ivxlcdm]+))?$/i.exec(pages ?? '');
  if (match == null) return null;
  const roman = /^[ivxlcdm]+$/i.test(match[1]);
  if (roman !== /^[ivxlcdm]+$/i.test(match[2] ?? match[1])) return null;
  const romanValue = value => {
    const values = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
    return value.toLowerCase().split('').reduce((sum, character, index, chars) => {
      const current = values[character];
      return sum + (current < (values[chars[index + 1]] ?? 0) ? -current : current);
    }, 0);
  };
  const toRoman = number => {
    const pairs = [['m', 1000], ['cm', 900], ['d', 500], ['cd', 400], ['c', 100], ['xc', 90], ['l', 50], ['xl', 40], ['x', 10], ['ix', 9], ['v', 5], ['iv', 4], ['i', 1]];
    let result = '';
    for (const [glyph, value] of pairs) while (number >= value) { result += glyph; number -= value; }
    return match[1] === match[1].toUpperCase() ? result.toUpperCase() : result;
  };
  const from = roman ? romanValue(match[1]) : Number(match[1]);
  const to = roman ? romanValue(match[2] ?? match[1]) : Number(match[2] ?? match[1]);
  return to < from ? null : {
    from,
    to,
    label: number => {
      if (number === from) return match[1];
      if (number === to && match[2] != null) return match[2];
      return roman ? toRoman(number) : String(number);
    },
  };
};

const textEntries = document => {
  const entries = Array.from(document.getElementsByTagName('text'));
  const prose = Array.from(document.getElementsByTagName('prose')).filter(
    node => directChild(node, 'head') != null && directChild(node, 'body') != null,
  );
  return [...entries, ...prose];
};

const incrementFacsimile = (facsimile, offset) => {
  const match = /^(\d+)(\.jpg)$/i.exec(facsimile ?? '');
  if (match == null) return null;
  return `${String(Number(match[1]) + offset).padStart(match[1].length, '0')}${match[2]}`;
};

const sourceForText = (workhead, source) => {
  const wanted = source?.getAttribute('in') ?? 'default';
  return elementChildren(workhead, 'source').find(
    candidate => (candidate.getAttribute('id') ?? 'default') === wanted,
  ) ?? null;
};

const facsimileBeforeFirstPb = (source, workSource, firstPb, printedPage) => {
  const explicit = source?.getAttribute('facsimile-pages') ?? '';
  const explicitFirst = /^(\d+)/.exec(explicit)?.[1];
  if (explicitFirst != null) return `${String(Number(explicitFirst) - 1).padStart(3, '0')}.jpg`;
  const offset = workSource?.getAttribute('facsimile-pages-offset');
  if (/^-?\d+$/.test(offset ?? '') && /^\d+$/.test(printedPage ?? '')) {
    const pdfPage = Number(printedPage) + Number(offset);
    return `${String(pdfPage - 1).padStart(3, '0')}.jpg`;
  }
  const facs = firstPb?.getAttribute('facs') ?? '';
  const match = /^(\d+)\.jpg$/i.exec(facs);
  if (match == null) return null;
  return `${String(Number(match[1]) - 1).padStart(match[1].length, '0')}.jpg`;
};

const splitBodyPages = body => {
  const serialized = serializeChildren(body);
  const pattern = /<pb\b([^>]*)\/>/g;
  const pages = [];
  let cursor = 0;
  let transition = null;
  for (const match of serialized.matchAll(pattern)) {
    pages.push({ content: serialized.slice(cursor, match.index), transition });
    const n = /\bn="([^"]*)"/.exec(match[1])?.[1] ?? null;
    const facs = /\bfacs="([^"]*)"/.exec(match[1])?.[1] ?? null;
    const before = serialized.slice(Math.max(0, match.index - 1), match.index);
    const afterIndex = match.index + match[0].length;
    const after = serialized.slice(afterIndex, afterIndex + 1);
    transition = {
      markup: match[0],
      printed_page: n,
      facsimile: facs,
      kind: /[\p{L}\p{N}]/u.test(before) && /[\p{L}\p{N}]/u.test(after)
        ? 'pb-within-word'
        : 'pb',
    };
    cursor = afterIndex;
  }
  pages.push({ content: serialized.slice(cursor), transition });
  return pages;
};

const buildPageInventory = ({ xml, workFile = null, includeExpectedPages = true }) => {
  const document = parseXml(xml);
  const rows = [];
  const workhead = directChild(document.documentElement, 'workhead');
  for (const entry of textEntries(document)) {
    const textId = entry.getAttribute('id') ?? '';
    const head = directChild(entry, 'head');
    const source = directChild(head, 'source');
    const pages = source?.getAttribute('pages') ?? '';
    const interval = parseSimplePages(pages);
    const body = directChild(entry, 'body');
    if (body == null) continue;
    const bodyPages = splitBodyPages(body);
    const pbs = Array.from(body.getElementsByTagName('pb'));
    const firstPrintedPage = interval?.label(interval.from) ?? (pages || null);
    const firstFacsimile = facsimileBeforeFirstPb(
      source,
      sourceForText(workhead, source),
      pbs[0],
      firstPrintedPage,
    );
    const actualSlots = bodyPages.map((page, index) => ({
      page,
      printedPage: index === 0 ? firstPrintedPage : page.transition?.printed_page,
      facsimile: index === 0 ? firstFacsimile : page.transition?.facsimile,
      expectedTransition: index === 0 ? 'text-start' : page.transition?.kind,
    }));
    let slots = actualSlots;
    if (includeExpectedPages && interval != null) {
      const expectedLabels = Array.from(
        { length: interval.to - interval.from + 1 },
        (_, index) => interval.label(interval.from + index),
      );
      const actualByLabel = new Map(actualSlots.map(slot => [slot.printedPage, slot]));
      slots = expectedLabels.map((printedPage, index) => {
        const actual = actualByLabel.get(printedPage);
        return actual ?? {
          page: { content: '', transition: null },
          printedPage,
          facsimile: incrementFacsimile(firstFacsimile, index),
          expectedTransition: index === 0 ? 'text-start' : 'pb',
        };
      });
      const expectedSet = new Set(expectedLabels);
      slots.push(...actualSlots.filter(slot => !expectedSet.has(slot.printedPage)));
    }
    slots.forEach((slot, index) => {
      const { page, printedPage } = slot;
      const lines = visibleLines(page.content);
      rows.push({
        work_file: workFile,
        text_id: textId,
        printed_page: printedPage,
        facsimile: slot.facsimile ?? incrementFacsimile(firstFacsimile, index),
        first_line: lines[0] ?? '',
        last_line: lines.at(-1) ?? '',
        expected_transition: slot.expectedTransition ?? 'pb',
        status: 'pending',
        reviewer: null,
        disposition: null,
      });
    });
  }
  return rows;
};

const inventoryKey = row => `${row.text_id}:${row.printed_page}`;

const auditPageInventory = ({ xml, inventory }) => {
  const actual = buildPageInventory({ xml, includeExpectedPages: false });
  const actualByKey = new Map(actual.map(row => [inventoryKey(row), row]));
  const issues = [];
  const orderExceptions = new Set(
    inventory
      .filter(row => row.order_exception && row.disposition)
      .map(inventoryKey),
  );
  const actualKeys = new Set();
  let previousFacsimile = null;
  const previousPrintedByText = new Map();
  actual.forEach(row => {
    const key = inventoryKey(row);
    if (actualKeys.has(key)) issues.push({ rule: 'duplicate-xml-page', key });
    actualKeys.add(key);
    const facsimileNumber = /^(\d+)\.jpg$/i.exec(row.facsimile ?? '')?.[1];
    if (facsimileNumber != null) {
      const number = Number(facsimileNumber);
      if (previousFacsimile != null && number < previousFacsimile.number && !orderExceptions.has(key)) {
        issues.push({ rule: 'decreasing-facsimile', key, previous: previousFacsimile.label, actual: row.facsimile });
      }
      previousFacsimile = { number, label: row.facsimile };
    }
    if (/^\d+$/.test(row.printed_page ?? '')) {
      const number = Number(row.printed_page);
      const previous = previousPrintedByText.get(row.text_id);
      if (previous != null && number < previous.number && !orderExceptions.has(key)) {
        issues.push({ rule: 'decreasing-printed-page', key, previous: previous.label, actual: row.printed_page });
      }
      previousPrintedByText.set(row.text_id, { number, label: row.printed_page });
    }
  });
  const seen = new Set();
  for (const expected of inventory) {
    const key = inventoryKey(expected);
    if (seen.has(key)) issues.push({ rule: 'duplicate-inventory-page', key });
    seen.add(key);
    const found = actualByKey.get(key);
    if (found == null) {
      issues.push({ rule: 'missing-xml-page', key });
      continue;
    }
    for (const field of ['facsimile', 'first_line', 'last_line', 'expected_transition']) {
      if ((expected[field] ?? null) !== (found[field] ?? null)) {
        issues.push({
          rule: `mismatched-${field.replaceAll('_', '-')}`,
          key,
          expected: expected[field] ?? null,
          actual: found[field] ?? null,
        });
      }
    }
    if (expected.status !== 'reviewed') {
      issues.push({ rule: 'page-not-reviewed', key, status: expected.status ?? null });
    } else {
      if (!expected.reviewer) issues.push({ rule: 'missing-page-reviewer', key });
      if (!expected.disposition) issues.push({ rule: 'missing-page-disposition', key });
    }
    if (expected.order_exception && !expected.disposition) {
      issues.push({ rule: 'undocumented-order-exception', key });
    }
  }
  for (const row of actual) {
    const key = inventoryKey(row);
    if (!seen.has(key)) issues.push({ rule: 'missing-inventory-page', key });
  }
  return { status: issues.length === 0 ? 'ok' : 'issues', page_count: actual.length, issues };
};

const readJsonLines = filename => {
  if (!fs.existsSync(filename)) return [];
  return fs.readFileSync(filename, 'utf8').split(/\r?\n/).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); }
    catch (error) { throw new Error(`${filename}:${index + 1}: ${error.message}`); }
  });
};

const writeJsonLines = (filename, rows) => {
  fs.writeFileSync(filename, rows.map(row => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : ''));
};

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

export {
  auditPageInventory,
  buildPageInventory,
  directChild,
  elementChildren,
  normalizeLine,
  parseSimplePages,
  parseXml,
  readJsonLines,
  serializeChildren,
  sha256,
  splitBodyPages,
  textEntries,
  visibleLines,
  writeJsonLines,
};
