#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { analyzeRhyme } from './rhyme-analysis.js';
import { poetryStanzasFromXml } from './metre-analysis.js';

const parseArgs = (args = process.argv.slice(2)) => {
  const options = { debug: false, dryRun: false, minConfidence: 0.75, onlyMissing: false, refresh: false, poet: null, work: null };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--debug') options.debug = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--only-missing') options.onlyMissing = true;
    else if (arg === '--refresh') options.refresh = true;
    else if (['--poet', '--work', '--min-confidence'].includes(arg)) {
      const value = args[++index];
      if (value == null) throw new Error(`${arg} kræver en værdi.`);
      if (arg === '--poet') options.poet = value;
      else if (arg === '--work') options.work = value;
      else options.minConfidence = Number(value);
    } else if (arg.startsWith('--poet=')) options.poet = arg.slice(7);
    else if (arg.startsWith('--work=')) options.work = arg.slice(7);
    else if (arg.startsWith('--min-confidence=')) options.minConfidence = Number(arg.slice(17));
    else throw new Error(`Ukendt option: ${arg}`);
  }
  if (!Number.isFinite(options.minConfidence) || options.minConfidence < 0 || options.minConfidence > 1) {
    throw new Error('--min-confidence skal være et tal mellem 0 og 1.');
  }
  if (options.poet != null && options.work != null) throw new Error('--poet og --work kan ikke bruges samtidig.');
  return options;
};

const workFiles = (rootDir, options) => {
  const directory = options.work != null
    ? path.join(rootDir, 'fdirs', options.work.replace(/^fdirs\//, ''))
    : path.join(rootDir, 'fdirs', options.poet ?? '');
  if (options.work != null) return [directory];
  const files = [];
  const walk = current => fs.readdirSync(current, { withFileTypes: true }).forEach(entry => {
    const filename = path.join(current, entry.name);
    if (entry.isDirectory()) walk(filename);
    else if (entry.isFile() && entry.name.endsWith('.xml') &&
      !['info.xml', 'bio.xml', 'portraits.xml', 'artwork.xml'].includes(entry.name)) files.push(filename);
  });
  walk(directory);
  return files.sort();
};

export const analyzeWorkXml = (xml, options = {}) => {
  const document = new DOMParser().parseFromString(xml, 'text/xml');
  const serializer = new XMLSerializer();
  const reports = [];
  const textFragments = xml.match(/<text\b[^>]*>[\s\S]*?<\/text>/gi) ?? [];
  let changed = xml;
  Array.from(document.getElementsByTagName('text')).forEach((text, index) => {
    const head = Array.from(text.childNodes).find(node => node.nodeName === 'head');
    const body = Array.from(text.childNodes).find(node => node.nodeName === 'body');
    const poetry = body == null ? null : Array.from(body.childNodes).find(node => node.nodeName === 'poetry');
    if (head == null || poetry == null ||
      (options.refresh !== true && Array.from(head.childNodes).some(node => node.nodeName === 'rhyme'))) return;
    const result = analyzeRhyme(poetryStanzasFromXml(serializer.serializeToString(poetry)), options);
    if (result.accepted !== true) return;
    const rhyme = document.createElement('rhyme');
    const analysis = document.createElement('analysis');
    analysis.setAttribute('pattern', result.pattern);
    analysis.setAttribute('confidence', result.confidence.toFixed(2));
    rhyme.appendChild(analysis);
    head.appendChild(rhyme);
    const fragment = textFragments[index];
    const rhymeXml = serializer.serializeToString(rhyme);
    const withoutOldRhyme = options.refresh === true
      ? fragment.replace(/\s*<rhyme\b[^>]*>[\s\S]*?<\/rhyme>/i, '')
      : fragment;
    changed = changed.replace(fragment, withoutOldRhyme.replace('</head>', `${rhymeXml}\n</head>`));
    reports.push({ textId: text.getAttribute('id') ?? '(uden id)', result, status: 'proposed' });
  });
  return { xml: changed, reports };
};

const formatReport = (filename, report, debug) => {
  const { result } = report;
  const lines = [filename, `Detected rhyme scheme: ${result.pattern}`, `Confidence: ${result.confidence.toFixed(2)}`];
  if (debug) result.lines.forEach((line, index) => {
    const ending = result.endings[index];
    lines.push(`${String(index + 1).padStart(2, '0')}  ${line}  -> ${ending.signature ?? '-'} [${result.methods[index]}, ${ending.gender ?? '-'}]`);
  });
  return lines.join('\n');
};

export const run = (args = process.argv.slice(2), rootDir = process.cwd()) => {
  const options = parseArgs(args);
  let changedFiles = 0;
  let proposed = 0;
  workFiles(rootDir, options).forEach(filename => {
    const original = fs.readFileSync(filename, 'utf8');
    const analyzed = analyzeWorkXml(original, options);
    analyzed.reports.forEach(report => { console.log(`${formatReport(filename, report, options.debug)}\n`); });
    if (analyzed.xml !== original) {
      changedFiles += 1;
      proposed += analyzed.reports.length;
      if (options.dryRun !== true) fs.writeFileSync(filename, analyzed.xml);
    }
  });
  console.log(`${proposed} analyser ${options.dryRun ? 'foreslået' : 'skrevet'} i ${changedFiles} værkfiler.`);
  return { changedFiles, proposed };
};

if (process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { run(); } catch (error) { console.error(`Rimanalyse fejlede: ${error.message}`); process.exitCode = 2; }
}
