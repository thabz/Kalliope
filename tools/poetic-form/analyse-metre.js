#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import {
  analyzePoem,
  formatMetreXml,
  poetryLinesFromXml,
} from './metre-analysis.js';
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
    else if (arg === '--poet' || arg === '--work' || arg === '--min-confidence') {
      index += 1;
      if (args[index] == null) throw new Error(`${arg} kræver en værdi.`);
      const key = arg === '--poet' ? 'poet' : arg === '--work' ? 'work' : 'minConfidence';
      options[key] = key === 'minConfidence' ? Number(args[index]) : args[index];
    } else if (arg.startsWith('--poet=')) options.poet = arg.slice(7);
    else if (arg.startsWith('--work=')) options.work = arg.slice(7);
    else if (arg.startsWith('--min-confidence=')) options.minConfidence = Number(arg.slice(17));
    else throw new Error(`Ukendt option: ${arg}`);
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
    return entry.isFile() && entry.name.endsWith('.xml') && entry.name !== 'info.xml' &&
      entry.name !== 'bio.xml' && entry.name !== 'portraits.xml' && entry.name !== 'artwork.xml'
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
  if (poet != null) {
    const directory = path.join(rootDir, 'fdirs', poet);
    if (fs.existsSync(directory) !== true || fs.statSync(directory).isDirectory() !== true) {
      throw new Error(`Digtermappen findes ikke: ${poet}`);
    }
    return walkXmlFiles(directory).sort();
  }
  return walkXmlFiles(path.join(rootDir, 'fdirs')).sort();
};

const directChildren = (node, name) => Array.from(node.childNodes)
  .filter(child => child.nodeType === 1 && child.nodeName === name);

const analyzeTextBlock = (textXml, options, language = null) => {
  const document = new DOMParser().parseFromString(textXml, 'text/xml');
  const text = document.documentElement;
  const textId = text.getAttribute('id') ?? '(uden id)';
  const head = directChildren(text, 'head')[0] ?? null;
  const body = directChildren(text, 'body')[0] ?? null;
  if (head == null || body == null) return { textXml, report: null };
  if (directChildren(head, 'metre').length > 0) {
    return { textXml, report: { textId, status: 'existing-metre', result: null } };
  }
  if (language != null && language !== 'da') {
    return { textXml, report: { textId, status: `unsupported-language:${language}`, result: null } };
  }

  const serializer = new XMLSerializer();
  const rawLines = directChildren(body, 'poetry')
    .flatMap(poetry => poetryLinesFromXml(serializer.serializeToString(poetry)));
  if (rawLines.length === 0) return { textXml, report: null };
  const result = analyzePoem(rawLines, { minConfidence: options.minConfidence });
  if (result.analyses.length === 0) {
    return { textXml, report: { textId, status: result.reason, result } };
  }

  const metreXml = formatMetreXml(result.analyses);
  const changed = textXml.replace(/<\/head>/, `${metreXml}\n</head>`);
  return { textXml: changed, report: { textId, status: 'proposed', result, metreXml } };
};

export const analyzeWorkXml = (xml, options = {}) => {
  const normalizedOptions = { minConfidence: 0.75, ...options };
  const reports = [];
  const document = new DOMParser().parseFromString(xml, 'text/xml');
  const textLanguages = Array.from(document.getElementsByTagName('text')).map(text => {
    let current = text;
    let author = null;
    while (current != null && author == null) {
      author = current.getAttribute?.('author') ?? null;
      current = current.parentNode;
    }
    return text.getAttribute('lang') ?? normalizedOptions.languageForPoet?.(author) ?? null;
  });
  let textIndex = 0;
  const changedXml = xml.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g, textXml => {
    const analyzed = analyzeTextBlock(textXml, normalizedOptions, textLanguages[textIndex] ?? null);
    textIndex += 1;
    if (analyzed.report != null) reports.push(analyzed.report);
    return analyzed.textXml;
  });
  return { xml: formatWorkXml(changedXml), reports };
};

const formatReport = (filename, report, { debug }) => {
  if (debug !== true && report.status !== 'proposed') return null;
  const lines = [`${filename} (${report.textId})`, `Status: ${report.status}`];
  if (report.result != null) {
    lines.push(`Lines analysed: ${report.result.lines.length}`);
    const shown = debug === true
      ? report.result.candidates
      : report.result.analyses;
    shown.forEach(candidate => {
      lines.push(
        `${candidate.pattern}: matching lines ${candidate.matchingLines}/${report.result.lines.length}, ` +
        `mean line score ${candidate.meanLineScore.toFixed(2)}, poem confidence ${candidate.confidence.toFixed(2)}`,
      );
    });
  }
  if (report.metreXml != null) lines.push('Proposed XML:', report.metreXml);
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
    const info = new DOMParser().parseFromString(fs.readFileSync(infoFilename, 'utf8'), 'text/xml');
    const language = info.documentElement.getAttribute('lang');
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
      const output = formatReport(relative, report, options);
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

const isMainModule = process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  try {
    run();
  } catch (error) {
    console.error(`Metrisk analyse fejlede: ${error.message}`);
    process.exitCode = 2;
  }
}
