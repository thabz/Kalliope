#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMParser } from '@xmldom/xmldom';

const textPattern = /<text\b[^>]*>[\s\S]*?<\/text>/gi;
const structurePattern = /[ \t]*<structure\b[^>]*>[\s\S]*?<\/structure>[ \t]*(?:\r?\n)?/i;
const specialTextLinePattern = /^[-–—_=*\dIVXLCDM. ]+$/iu;
const ignoredContent = new Set(['footnote', 'note']);
const specialLineContent = new Set([
  'asterism',
  'block-center',
  'hr',
  'img',
  'metrik',
  'nonum',
  'two-columns',
  'versenum',
]);
const ignoredMarkers = new Set(['margin', 'num', 'pb', 'resetnum']);
const specialMarker = '\uE000';

const directChild = (element, name) => Array.from(element.childNodes)
  .find(node => node.nodeName === name);

const directChildren = (element, name) => Array.from(element.childNodes)
  .filter(node => node.nodeName === name);

const semanticContent = element => Array.from(element.childNodes)
  .map(node => {
    if (node.nodeName === '#text') return node.nodeValue ?? '';
    if (specialLineContent.has(node.nodeName)) return specialMarker;
    if (node.nodeName === 'br') return '\n';
    if (ignoredContent.has(node.nodeName) || ignoredMarkers.has(node.nodeName)) return '';
    return semanticContent(node);
  })
  .join('');

export const analyzePoetryBlocks = poetryBlocks => {
  const stanzaLengths = [];
  let currentStanza = 0;
  let emptyLines = 0;
  let specialLines = 0;
  const endStanza = () => {
    if (currentStanza > 0) stanzaLengths.push(currentStanza);
    currentStanza = 0;
  };

  poetryBlocks.forEach((poetry, blockIndex) => {
    if (blockIndex > 0) endStanza();
    const rawLines = semanticContent(poetry).split(/\r?\n/);
    while (rawLines.length > 0 && rawLines[0].trim() === '') rawLines.shift();
    while (rawLines.length > 0 && rawLines.at(-1).trim() === '') rawLines.pop();

    rawLines.forEach(rawLine => {
      const visible = rawLine.replaceAll(specialMarker, '').trim();
      const special = rawLine.includes(specialMarker) ||
        (visible !== '' && specialTextLinePattern.test(visible));
      if (visible === '' || special === true) {
        if (special === true) specialLines += 1;
        else emptyLines += 1;
        endStanza();
      } else {
        currentStanza += 1;
      }
    });
  });
  endStanza();

  return {
    confidence: 1,
    emptyLines,
    lineCount: stanzaLengths.reduce((sum, length) => sum + length, 0),
    pattern: stanzaLengths.join('-'),
    regular: stanzaLengths.length > 0 && new Set(stanzaLengths).size === 1,
    specialLines,
    stanzaCount: stanzaLengths.length,
    stanzaLengths,
  };
};

const structureXml = analysis => [
  '<structure>',
  `  <analysis pattern="${analysis.pattern}" confidence="1.0"/>`,
  '</structure>',
].join('\n');

const nextMetadataIndentation = headPrefix => {
  const lower = headPrefix.toLowerCase();
  const headStart = Math.max(lower.lastIndexOf('<head>'), lower.lastIndexOf('<head '));
  let metadataDepth = 0;
  headPrefix.slice(headStart).split(/\r?\n/).slice(1).forEach(line => {
    const content = line.trimStart();
    const closing = content.match(/^<\/([A-Za-z][A-Za-z0-9-]*)>/);
    if (closing != null) metadataDepth = Math.max(0, metadataDepth - 1);
    const opening = content.match(/^<([A-Za-z][A-Za-z0-9-]*)(?:[ \t>])/);
    if (
      closing == null &&
      opening != null &&
      content.endsWith('/>') !== true &&
      content.includes(`</${opening[1]}>`) !== true
    ) {
      metadataDepth += 1;
    }
  });
  return '  '.repeat(metadataDepth + 1);
};

const updateTextFragment = (fragment, { onlyMissing = false } = {}) => {
  const text = new DOMParser().parseFromString(fragment, 'text/xml').documentElement;
  const head = directChild(text, 'head');
  const body = directChild(text, 'body');
  const existing = head != null && directChild(head, 'structure') != null;
  if (existing === true && onlyMissing === true) return { analysis: null, fragment };
  if (head == null || body == null) return { analysis: null, fragment };
  const poetryBlocks = directChildren(body, 'poetry');
  if (poetryBlocks.length === 0) return { analysis: null, fragment };
  const analysis = analyzePoetryBlocks(poetryBlocks);
  if (analysis.lineCount === 0) return { analysis: null, fragment };

  const metadata = structureXml(analysis);
  const withoutExisting = fragment.replace(structurePattern, '');
  if (/<head\b[^>]*\/>/i.test(withoutExisting)) {
    const indented = metadata.replaceAll('\n', '\n  ');
    return {
      analysis,
      fragment: withoutExisting.replace(/<head\b[^>]*\/>/i, `<head>\n  ${indented}\n</head>`),
    };
  }

  const closing = withoutExisting.match(/<\/head>/i);
  if (closing == null || closing.index == null) return { analysis: null, fragment };
  const before = withoutExisting.slice(0, closing.index);
  const indentation = nextMetadataIndentation(before);
  const indented = metadata.replaceAll('\n', `\n${indentation}`);
  const separator = /\r?\n$/.test(before) ? '' : '\n';
  return {
    analysis,
    fragment: before + separator + indentation + indented + '\n' +
      withoutExisting.slice(closing.index),
  };
};

export const analyzeWorkXml = (xml, options = {}) => {
  const reports = [];
  const updated = xml.replace(textPattern, fragment => {
    const result = updateTextFragment(fragment, options);
    if (result.analysis != null) {
      const textId = fragment.match(/\bid="([^"]+)"/)?.[1] ?? '(uden id)';
      reports.push({ result: result.analysis, textId });
    }
    return result.fragment;
  });
  return { reports, xml: updated };
};

const parseArgs = (args = process.argv.slice(2)) => {
  const options = { debug: false, dryRun: false, onlyMissing: false, work: null };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--debug') options.debug = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--only-missing') options.onlyMissing = true;
    else if (arg === '--work') {
      const value = args[++index];
      if (value == null) throw new Error('--work kræver en værdi.');
      options.work = value;
    } else if (arg.startsWith('--work=')) options.work = arg.slice(7);
    else throw new Error(`Ukendt option: ${arg}`);
  }
  return options;
};

const workFiles = (rootDir, work) => {
  if (work != null) {
    const normalized = work.replace(/^fdirs\//, '');
    return [path.isAbsolute(work) ? work : path.join(rootDir, 'fdirs', normalized)];
  }
  const excluded = new Set(['artwork.xml', 'bio.xml', 'info.xml', 'portraits.xml']);
  const files = [];
  const walk = current => fs.readdirSync(current, { withFileTypes: true }).forEach(entry => {
    const filename = path.join(current, entry.name);
    if (entry.isDirectory()) walk(filename);
    else if (entry.isFile() && entry.name.endsWith('.xml') && excluded.has(entry.name) !== true) {
      files.push(filename);
    }
  });
  walk(path.join(rootDir, 'fdirs'));
  return files.sort();
};

const formatReport = (filename, report) => {
  const { result } = report;
  return [
    `${filename}: ${report.textId}`,
    `Lines: ${result.lineCount}`,
    `Stanzas: ${result.stanzaCount}`,
    '',
    ...result.stanzaLengths.map((length, index) => `Stanza ${index + 1}: ${length} lines`),
    '',
    `Empty lines: ${result.emptyLines}`,
    `Special lines: ${result.specialLines}`,
    `Regular: ${result.regular ? 'yes' : 'no'}`,
    `Pattern: ${result.pattern}`,
    'Confidence: 1.0',
  ].join('\n');
};

export const run = (args = process.argv.slice(2), rootDir = process.cwd()) => {
  const options = parseArgs(args);
  let analyses = 0;
  let changedFiles = 0;
  workFiles(rootDir, options.work).forEach(filename => {
    if (fs.existsSync(filename) !== true) throw new Error(`Værkfilen findes ikke: ${filename}`);
    const original = fs.readFileSync(filename, 'utf8');
    const analyzed = analyzeWorkXml(original, options);
    if (analyzed.xml !== original) {
      analyses += analyzed.reports.length;
      changedFiles += 1;
      if (options.dryRun !== true) fs.writeFileSync(filename, analyzed.xml);
    }
    if (options.debug === true) {
      analyzed.reports.forEach(report => console.log(`${formatReport(filename, report)}\n`));
    }
  });
  console.log(`${analyses} strukturanalyser ${options.dryRun ? 'foreslået' : 'skrevet'} i ${changedFiles} værkfiler.`);
  return { analyses, changedFiles };
};

if (process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    run();
  } catch (error) {
    console.error(`Strukturanalyse fejlede: ${error.message}`);
    process.exitCode = 2;
  }
}
