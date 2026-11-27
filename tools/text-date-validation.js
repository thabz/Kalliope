import { extractDates } from './build-static/parsing.js';
import { textDateEntries } from './build-static/text-dates.js';
import {
  getChildByTagName,
  getChildren,
  getElementsByTagName,
  parseXMLFragment,
} from './build-static/xml.js';

const monthNames = [
  ['januar', 'januari', 'januarii', 'january', 'janvier', 'jan'],
  ['februar', 'februari', 'februarii', 'february', 'février', 'febr', 'feb'],
  ['marts', 'martii', 'mars', 'märz', 'march', 'mar'],
  ['april', 'aprilis', 'avril', 'apr'],
  ['maj', 'mai', 'may'],
  ['juni', 'junii', 'june', 'juin', 'jun'],
  ['juli', 'julii', 'july', 'juillet', 'jul'],
  ['august', 'augusti', 'août', 'aug'],
  ['september', 'septembre', 'septbr', 'sepbr', 'sept', 'sep'],
  ['oktober', 'october', 'octobre', 'oktbr', 'octbr', 'okt', 'oct'],
  ['november', 'novembre', 'novbr', 'nov'],
  ['december', 'décembre', 'decbr', 'decmbr', 'dec', 'dezember', 'dez'],
];
const months = new Map(monthNames.flatMap((names, index) =>
  names.map(name => [name, index + 1])));
const monthPattern = [...months.keys()].sort((a, b) => b.length - a.length).join('|');
const ordinal = '(?:ste|den|die|te|de|st|nd|rd|th|er)?';
const namedDate = new RegExp(
  `(?<![\\p{L}\\p{N}])(\\d{1,2})${ordinal}\\.?\\s+(?:of\\s+)?(${monthPattern})\\.?,?\\s+(\\d{4})(?![\\d–-])`, 'giu');
const monthFirstDate = new RegExp(
  `(?<![\\p{L}\\p{N}])(${monthPattern})\\.?\\s+(\\d{1,2})${ordinal}\\.?,?\\s+(\\d{4})(?![\\d–-])`, 'giu');
const isoDate = /(?<![\d-])(\d{4})-(\d{2})-(\d{2})(?![\d-])/gu;

const normalizedDate = (year, month, day) => {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  if (year < 1 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const fullDatesInText = value => {
  const dates = [];
  const add = (match, year, month, day) => {
    const iso = normalizedDate(Number(year), Number(month), Number(day));
    const prefix = value.slice(Math.max(0, match.index - 8), match.index);
    const suffix = value.slice(match.index + match[0].length);
    if (iso == null || /(?:ca\.|circa)\s*$/iu.test(prefix) === true || /^\s*\?/u.test(suffix) === true) return;
    dates.push({ date: iso, printedDate: match[0], index: match.index });
  };
  for (const match of value.matchAll(namedDate)) add(match, match[3], months.get(match[2].toLowerCase()), match[1]);
  for (const match of value.matchAll(monthFirstDate)) add(match, match[3], months.get(match[1].toLowerCase()), match[2]);
  for (const match of value.matchAll(isoDate)) add(match, match[1], match[2], match[3]);
  return dates.sort((a, b) => a.index - b.index);
};

const visibleText = node => {
  if (node.nodeType === 3 || node.nodeType === 4) return node.nodeValue;
  if (node.nodeType !== 1 || ['note', 'footnote', 'text'].includes(node.tagName)) return '';
  if (node.tagName === 'br') return '\n';
  const separator = ['line', 'p', 'nonum'].includes(node.tagName) ? '\n' : '';
  return separator + Array.from(node.childNodes).map(visibleText).join('') + separator;
};

const textDateCandidates = text => {
  const head = getChildByTagName(text, 'head');
  const candidates = [];
  for (const field of getChildren(head) ?? []) {
    if (['title', 'subtitle', 'suptitle'].includes(field.tagName) === false) continue;
    const value = visibleText(field);
    for (const date of fullDatesInText(value)) {
      candidates.push({ ...date, location: field.tagName, line: field.lineNumber, context: value.trim() });
    }
  }
  const body = getChildByTagName(text, 'body');
  if (body != null) {
    const lines = visibleText(body).split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const last = lines.at(-1) ?? '';
    for (const date of fullDatesInText(last)) {
      const prefix = last.slice(0, date.index);
      const suffix = last.slice(date.index + date.printedDate.length);
      // A closing date may have a short place name and punctuation, but no trailing prose.
      if (/^[\s\p{L}.,()—–-]*$/u.test(prefix) === false ||
          (prefix.match(/[\p{L}]+/gu) ?? []).length > 5 ||
          /^[\s.,;:()\]—–-]*$/u.test(suffix) === false) continue;
      candidates.push({ ...date, location: 'closing', line: body.lineNumber, context: last });
    }
  }
  return candidates;
};

const findMissingTextDates = ({ file, data }) => {
  const document = parseXMLFragment(data);
  const findings = [];
  for (const text of getElementsByTagName(document, 'text')) {
    const head = getChildByTagName(text, 'head');
    const registered = new Set(textDateEntries(
      extractDates(head), ['written', 'performed', 'event', 'published'],
    ).map(entry => entry.date));
    const seen = new Set();
    for (const candidate of textDateCandidates(text)) {
      if (registered.has(candidate.date) === true || seen.has(candidate.date) === true) continue;
      seen.add(candidate.date);
      findings.push({ file, textId: text.getAttribute('id'), ...candidate });
    }
  }
  return findings;
};

export { fullDatesInText, textDateCandidates, findMissingTextDates };
