#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { poetryLinesFromXml } from './metre-analysis.js';
import {
  analyzeSyllables,
  formatSyllablesXml,
} from './syllable-analysis.js';
import { formatWorkXml } from '../format-work-xml.js';

const normalizePath = filename => filename.replace(/\\/g, '/').replace(/^\.\//, '');

export const parseArgs = (args = process.argv.slice(2)) => {
  const options = {
    debug: false,
    dryRun: false,
    minConfidence: 0.75,
    onlyMissing: false,
    poet: null,
    work: null,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--debug') options.debug = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--only-missing') options.onlyMissing = true;
    else if (['--poet', '--work', '--min-confidence'].includes(arg)) {
      const value = args[++index];
      if (value == null) throw new Error(`${arg} kræver en værdi.`);
      if (arg === '--poet') options.poet = value;
      else if (arg === '--work') options.work = value;
      else options.minConfidence = Number(value);
    } else if (arg.startsWith('--poet=')) options.poet = arg.slice(7);
    else if (arg.startsWith('--work=')) options.work = arg.slice(7);
    else if (arg.startsWith('--min-confidence=')) {
      options.minConfidence = Number(arg.slice(17));
    } else throw new Error(`Ukendt option: ${arg}`);
  }
  if (Number.isFinite(options.minConfidence) !== true ||
      options.minConfidence < 0 || options.minConfidence > 1) {
    throw new Error('--min-confidence skal være et tal mellem 0 og 1.');
  }
  if (options.poet != null && options.work != null) {
    throw new Error('--poet og --work kan ikke bruges samtidig.');
  }
  return options;
};

const walkXmlFiles = directory => fs.readdirSync(directory, { withFileTypes: true })
  .flatMap(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkXmlFiles(filename);
    const excluded = ['info.xml', 'bio.xml', 'portraits.xml', 'artwork.xml'];
    return entry.isFile() && entry.name.endsWith('.xml') && excluded.includes(entry.name) !== true
      ? [filename]
      : [];
  });

export const resolveWorkFiles = ({ rootDir, poet, work }) => {
  if (work != null) {
    const relative = normalizePath(work).replace(/^fdirs\//, '');
    const filename = path.join(rootDir, 'fdirs', relative);
    if (fs.existsSync(filename) !== true || fs.statSync(filename).isFile() !== true) {
      throw new Error(`Værkfilen findes ikke: ${work}`);
    }
    return [filename];
  }
  const directory = path.join(rootDir, 'fdirs', poet ?? '');
  if (fs.existsSync(directory) !== true || fs.statSync(directory).isDirectory() !== true) {
    throw new Error(`Digtermappen findes ikke: ${poet}`);
  }
  return walkXmlFiles(directory).sort();
};

const directChildren = (node, name) => Array.from(node.childNodes)
  .filter(child => child.nodeType === 1 && child.nodeName === name);

const analyzeTextBlock = (textXml, language, options) => {
  const document = new DOMParser().parseFromString(textXml, 'text/xml');
  const text = document.documentElement;
  const id = text.getAttribute('id');
  const textId = id !== '' ? id : '(uden id)';
  const head = directChildren(text, 'head')[0] ?? null;
  const body = directChildren(text, 'body')[0] ?? null;
  if (head == null || body == null) return { textXml, report: null };
  if (directChildren(head, 'syllables').length > 0) {
    return { textXml, report: { textId, status: 'existing-syllables', result: null } };
  }
  if (language != null && language !== 'da') {
    return {
      textXml,
      report: { textId, status: `unsupported-language:${language}`, result: null },
    };
  }

  const serializer = new XMLSerializer();
  const rawLines = directChildren(body, 'poetry')
    .flatMap(poetry => poetryLinesFromXml(serializer.serializeToString(poetry)));
  if (rawLines.length === 0) return { textXml, report: null };
  const result = analyzeSyllables(rawLines, { minConfidence: options.minConfidence });
  if (result.analyses.length === 0) {
    return { textXml, report: { textId, status: result.reason, result } };
  }

  const syllablesXml = formatSyllablesXml(result.analyses);
  const changed = textXml.replace(/<\/head>/, `${syllablesXml}\n</head>`);
  return {
    textXml: changed,
    report: { textId, status: 'proposed', result, syllablesXml },
  };
};

export const analyzeWorkXml = (xml, options = {}) => {
  const normalizedOptions = { minConfidence: 0.75, ...options };
  const reports = [];
  const document = new DOMParser().parseFromString(xml, 'text/xml');
  const textLanguages = Array.from(document.getElementsByTagName('text')).map(text => {
    let current = text;
    let author = null;
    while (current != null && author == null) {
      const attribute = current.getAttribute?.('author');
      author = attribute != null && attribute !== '' ? attribute : null;
      current = current.parentNode;
    }
    const explicitLanguage = text.getAttribute('lang');
    if (explicitLanguage !== '') return explicitLanguage;
    return normalizedOptions.languageForPoet?.(author) ?? null;
  });
  let textIndex = 0;
  const changedXml = xml.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g, textXml => {
    const analyzed = analyzeTextBlock(
      textXml,
      textLanguages[textIndex] ?? null,
      normalizedOptions,
    );
    textIndex += 1;
    if (analyzed.report != null) reports.push(analyzed.report);
    return analyzed.textXml;
  });
  return { xml: formatWorkXml(changedXml), reports };
};

const formatReport = (filename, report, debug) => {
  if (debug !== true && report.status !== 'proposed') return null;
  const lines = [`${filename} (${report.textId})`, `Status: ${report.status}`];
  if (debug === true && report.result != null) {
    report.result.lines.forEach((line, index) => {
      const uncertain = line.words
        .filter(word => word.confidence < 0.8)
        .map(word => word.word);
      const suffix = uncertain.length > 0 ? `  [${uncertain.join(', ')}]` : '';
      lines.push(
        `${String(index + 1).padStart(2, '0')}  ` +
        `${String(line.syllables).padStart(2, ' ')}  ${line.text}${suffix}`,
      );
    });
  }
  if (report.result?.analyses.length > 0) {
    lines.push('', 'Dominant pattern:');
    report.result.analyses.forEach(analysis => {
      lines.push(
        `${analysis.pattern} ${analysis.confidence.toFixed(2)} ` +
        `(${analysis.matchingLines}/${report.result.lines.length} exact lines)`,
      );
    });
  }
  if (report.syllablesXml != null) lines.push('Proposed XML:', report.syllablesXml);
  return lines.join('\n');
};

export const run = (args = process.argv.slice(2), rootDir = process.cwd()) => {
  const options = parseArgs(args);
  const files = resolveWorkFiles({ rootDir, poet: options.poet, work: options.work });
  const languages = new Map();
  const languageForPoet = poetId => {
    if (poetId == null) return null;
    if (languages.has(poetId)) return languages.get(poetId);
    const infoFilename = path.join(rootDir, 'fdirs', poetId, 'info.xml');
    if (fs.existsSync(infoFilename) !== true) {
      languages.set(poetId, null);
      return null;
    }
    const info = new DOMParser().parseFromString(
      fs.readFileSync(infoFilename, 'utf8'),
      'text/xml',
    );
    const attribute = info.documentElement.getAttribute('lang');
    const language = attribute !== '' ? attribute : null;
    languages.set(poetId, language);
    return language;
  };
  let changedFiles = 0;
  let proposedPoems = 0;

  files.forEach(filename => {
    const original = fs.readFileSync(filename, 'utf8');
    const analyzed = analyzeWorkXml(original, { ...options, languageForPoet });
    const relative = normalizePath(path.relative(rootDir, filename));
    analyzed.reports.forEach(report => {
      const output = formatReport(relative, report, options.debug);
      if (output != null) console.log(`${output}\n`);
      if (report.status === 'proposed') proposedPoems += 1;
    });
    if (analyzed.xml !== formatWorkXml(original)) {
      changedFiles += 1;
      if (options.dryRun !== true) fs.writeFileSync(filename, analyzed.xml);
    }
  });

  const action = options.dryRun === true ? 'foreslået' : 'skrevet';
  console.log(`${proposedPoems} analyser ${action} i ${changedFiles} værkfiler.`);
  return { changedFiles, proposedPoems };
};

if (process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    run();
  } catch (error) {
    console.error(`Stavelsesanalyse fejlede: ${error.message}`);
    process.exitCode = 2;
  }
}
