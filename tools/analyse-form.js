#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { analyzePoetryBlocks } from './analyse-structure.js';
import { classifyPoeticForm, formatFormXml } from './form-analysis.js';
import { formatWorkXml } from './format-work-xml.js';
import { analyzePoem, poetryStanzasFromXml } from './metre-analysis.js';
import { analyzeRhyme } from './rhyme-analysis.js';
import { analyzeSyllables } from './syllable-analysis.js';

const directChildren = (node, name) => Array.from(node.childNodes)
  .filter(child => child.nodeType === 1 && child.nodeName === name);

const analysisElements = (head, name) => {
  const container = directChildren(head, name)[0] ?? null;
  if (container == null) return [];
  return directChildren(container, 'analysis').map(analysis => ({
    confidence: Number(analysis.getAttribute('confidence')),
    pattern: analysis.getAttribute('pattern'),
  }));
};

const normalizePath = filename => filename.replace(/\\/g, '/').replace(/^\.\//, '');

export const parseArgs = (args = process.argv.slice(2)) => {
  const options = {
    debug: false,
    dryRun: false,
    find: null,
    form: 'sonnet',
    minConfidence: 0.8,
    onlyMissing: false,
    poet: null,
    work: null,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--debug') options.debug = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--only-missing') options.onlyMissing = true;
    else if (['--find', '--form', '--min-confidence', '--poet', '--work'].includes(arg)) {
      const value = args[++index];
      if (value == null) throw new Error(`${arg} kræver en værdi.`);
      if (arg === '--find') options.find = value;
      else if (arg === '--form') options.form = value;
      else if (arg === '--min-confidence') options.minConfidence = Number(value);
      else if (arg === '--poet') options.poet = value;
      else options.work = value;
    } else if (arg.startsWith('--find=')) options.find = arg.slice(7);
    else if (arg.startsWith('--form=')) options.form = arg.slice(7);
    else if (arg.startsWith('--min-confidence=')) options.minConfidence = Number(arg.slice(17));
    else if (arg.startsWith('--poet=')) options.poet = arg.slice(7);
    else if (arg.startsWith('--work=')) options.work = arg.slice(7);
    else throw new Error(`Ukendt option: ${arg}`);
  }
  if (Number.isFinite(options.minConfidence) !== true ||
      options.minConfidence < 0 || options.minConfidence > 1) {
    throw new Error('--min-confidence skal være et tal mellem 0 og 1.');
  }
  if (options.form !== 'sonnet' || (options.find != null && options.find !== 'sonnet')) {
    throw new Error('Første version understøtter kun formen sonnet.');
  }
  if (options.poet != null && options.work != null) {
    throw new Error('--poet og --work kan ikke bruges samtidig.');
  }
  if (options.find != null) options.dryRun = true;
  return options;
};

const walkWorkFiles = directory => fs.readdirSync(directory, { withFileTypes: true })
  .flatMap(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkWorkFiles(filename);
    return entry.isFile() && entry.name.endsWith('.xml') &&
      ['artwork.xml', 'bio.xml', 'info.xml', 'portraits.xml'].includes(entry.name) !== true
      ? [filename]
      : [];
  });

export const resolveWorkFiles = ({ poet, rootDir, work }) => {
  if (work != null) {
    const filename = path.join(rootDir, 'fdirs', normalizePath(work).replace(/^fdirs\//, ''));
    if (fs.existsSync(filename) !== true || fs.statSync(filename).isFile() !== true) {
      throw new Error(`Værkfilen findes ikke: ${work}`);
    }
    return [filename];
  }
  const directory = path.join(rootDir, 'fdirs', poet ?? '');
  if (fs.existsSync(directory) !== true || fs.statSync(directory).isDirectory() !== true) {
    throw new Error(`Digtermappen findes ikke: ${poet}`);
  }
  return walkWorkFiles(directory).sort();
};

const strongestAnalysis = analyses => analyses
  .sort((left, right) => right.confidence - left.confidence)[0] ?? null;

export const computedSignals = (head, poetryBlocks, language) => {
  const serializer = new XMLSerializer();
  const stanzas = poetryBlocks.flatMap(poetry =>
    poetryStanzasFromXml(serializer.serializeToString(poetry)));
  const lines = stanzas.flat();
  const existingStructure = strongestAnalysis(analysisElements(head, 'structure'));
  const structure = existingStructure ?? analyzePoetryBlocks(poetryBlocks);
  const existingRhyme = strongestAnalysis(analysisElements(head, 'rhyme'));
  const existingMetre = analysisElements(head, 'metre');
  const existingSyllables = analysisElements(head, 'syllables');
  const linguisticAnalysisAllowed = language == null || language === 'da';
  return {
    metre: existingMetre.length > 0
      ? existingMetre
      : linguisticAnalysisAllowed ? analyzePoem(lines, { minConfidence: 0 }).analyses : [],
    rhyme: existingRhyme ?? (linguisticAnalysisAllowed
      ? analyzeRhyme(stanzas, { minConfidence: 0 })
      : null),
    structure,
    syllables: existingSyllables.length > 0
      ? existingSyllables
      : linguisticAnalysisAllowed ? analyzeSyllables(lines, { minConfidence: 0 }).analyses : [],
  };
};

const analyzeTextXml = (textXml, language, options) => {
  const document = new DOMParser().parseFromString(textXml, 'text/xml');
  const text = document.documentElement;
  const head = directChildren(text, 'head')[0] ?? null;
  const body = directChildren(text, 'body')[0] ?? null;
  if (head == null || body == null) return { report: null, textXml };
  const poetryBlocks = directChildren(body, 'poetry');
  if (poetryBlocks.length === 0) return { report: null, textXml };
  const existingForm = directChildren(head, 'form').length > 0;
  const sourceAnalyses = computedSignals(head, poetryBlocks, language);
  const result = classifyPoeticForm(sourceAnalyses);
  const analyses = result.analyses.filter(analysis =>
    analysis.confidence > 0 &&
    analysis.confidence >= options.minConfidence &&
    (analysis.pattern === 'sonnet' || analysis.pattern.endsWith('-sonnet')));
  const sonnet = result.analyses.find(analysis => analysis.pattern === 'sonnet');
  const report = {
    analyses,
    existingForm,
    formXml: analyses.length > 0 ? formatFormXml(analyses) : null,
    result,
    sourceAnalyses,
    sonnetConfidence: sonnet.confidence,
    status: existingForm ? 'existing-form' : analyses.length > 0 ? 'proposed' : 'below-threshold',
    textId: text.getAttribute('id') || '(uden id)',
  };
  if (existingForm || analyses.length === 0) return { report, textXml };
  const selfClosingHead = /<head\b[^>]*\/>/;
  if (selfClosingHead.test(textXml)) {
    return {
      report,
      textXml: textXml.replace(selfClosingHead, `<head>\n${report.formXml}\n</head>`),
    };
  }
  return {
    report,
    textXml: textXml.replace(/<\/head>/, `${report.formXml}\n</head>`),
  };
};

export const analyzeWorkXml = (xml, options = {}) => {
  const normalizedOptions = { minConfidence: 0.8, ...options };
  const document = new DOMParser().parseFromString(xml, 'text/xml');
  const textLanguages = Array.from(document.getElementsByTagName('text')).map(text => {
    const explicit = text.getAttribute('lang');
    return explicit !== '' ? explicit : normalizedOptions.language ?? null;
  });
  const reports = [];
  let index = 0;
  const changed = xml.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g, textXml => {
    const analyzed = analyzeTextXml(textXml, textLanguages[index] ?? null, normalizedOptions);
    index += 1;
    if (analyzed.report != null) reports.push(analyzed.report);
    return analyzed.textXml;
  });
  return { reports, xml: changed === xml ? xml : formatWorkXml(changed) };
};

const formatExplanation = report => {
  const lines = [
    `SONNET: ${report.sonnetConfidence.toFixed(2)}`,
    '',
    ...report.result.signals.map(signal =>
      `${signal.contribution >= 0 ? '+' : '-'} ${signal.description}`),
  ];
  const subtype = report.analyses.find(analysis => analysis.pattern !== 'sonnet');
  if (subtype != null) {
    lines.push('', 'Subtype:', `${subtype.pattern}: ${subtype.confidence.toFixed(2)}`);
  }
  if (report.formXml != null) lines.push('', 'Proposed XML:', report.formXml);
  if (report.existingForm) lines.push('', 'Existing <form> preserved.');
  return lines.join('\n');
};

export const run = (args = process.argv.slice(2), rootDir = process.cwd()) => {
  const options = parseArgs(args);
  const reports = [];
  let changedFiles = 0;
  resolveWorkFiles({ rootDir, poet: options.poet, work: options.work }).forEach(filename => {
    const original = fs.readFileSync(filename, 'utf8');
    const author = original.match(/<kalliopework\b[^>]*\bauthor="([^"]+)"/)?.[1] ?? null;
    const infoFilename = author == null ? null : path.join(rootDir, 'fdirs', author, 'info.xml');
    const infoXml = infoFilename != null && fs.existsSync(infoFilename)
      ? fs.readFileSync(infoFilename, 'utf8')
      : '';
    const language = infoXml.match(/<person\b[^>]*\blang="([^"]+)"/)?.[1] ?? 'da';
    const analyzed = analyzeWorkXml(original, { ...options, language });
    const relative = normalizePath(path.relative(path.join(rootDir, 'fdirs'), filename));
    analyzed.reports.forEach(report => reports.push({ ...report, filename: relative }));
    if (analyzed.xml !== original) {
      changedFiles += 1;
      if (options.dryRun !== true) fs.writeFileSync(filename, analyzed.xml);
    }
  });

  const candidates = reports
    .filter(report => report.sonnetConfidence >= options.minConfidence)
    .sort((left, right) => right.sonnetConfidence - left.sonnetConfidence ||
      left.filename.localeCompare(right.filename) || left.textId.localeCompare(right.textId));
  if (options.find != null) {
    candidates.forEach(report => console.log(
      `${report.sonnetConfidence.toFixed(2)}  ${report.filename} (${report.textId})`,
    ));
  } else {
    candidates.forEach(report => {
      if (options.debug === true || options.dryRun === true) {
        console.log(`${report.filename} (${report.textId})\n${formatExplanation(report)}\n`);
      }
    });
    const proposed = reports.filter(report => report.status === 'proposed').length;
    const action = options.dryRun === true ? 'foreslået' : 'skrevet';
    console.log(`${proposed} formanalyser ${action} i ${changedFiles} værkfiler.`);
  }
  return { candidates: candidates.length, changedFiles };
};

if (process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    run();
  } catch (error) {
    console.error(`Formanalyse fejlede: ${error.message}`);
    process.exitCode = 2;
  }
}
