#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeWorkXml, resolveWorkFiles } from './analyse-form.js';

const normalizePath = filename => filename.replace(/\\/g, '/');

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const findText = (textId, rootDir = process.cwd()) => {
  const idPattern = new RegExp(`<text\\b[^>]*\\bid="${escapeRegExp(textId)}"`);
  for (const filename of resolveWorkFiles({ rootDir, poet: null, work: null })) {
    const xml = fs.readFileSync(filename, 'utf8');
    if (idPattern.test(xml)) return { filename, xml };
  }
  return null;
};

const formattedAnalyses = analyses => analyses.length === 0
  ? ['  Ingen sikker analyse.']
  : analyses.map(analysis =>
    `  ${analysis.pattern.padEnd(26)} ${analysis.confidence.toFixed(2)}`);

export const formatPoeticFormReport = ({ filename, report, rootDir }) => {
  const source = report.sourceAnalyses;
  const formAnalyses = report.result.analyses.filter(analysis => analysis.confidence >= 0.5);
  const strongestForm = formAnalyses[0] ?? report.result.analyses[0];
  const explanationForm = strongestForm.pattern.endsWith('-sonnet')
    ? 'sonnet'
    : strongestForm.pattern;
  const explanationSignals = report.result.formSignals[explanationForm] ?? [];
  const lines = [
    `Digt: ${report.textId}`,
    `Værk: ${normalizePath(path.relative(path.join(rootDir, 'fdirs'), filename))}`,
    '',
    'STRUKTUR',
    `  ${source.structure.pattern.padEnd(26)} ${source.structure.confidence.toFixed(2)}`,
    `  ${report.result.lineCount} verslinjer i ${report.result.stanzaLengths.length} ` +
      (report.result.stanzaLengths.length === 1 ? 'strofe' : 'strofer'),
    '',
    'RIM',
    ...(source.rhyme == null
      ? ['  Ingen analyse for tekstens sprog.']
      : formattedAnalyses([source.rhyme])),
    '',
    'METRIK',
    ...formattedAnalyses(source.metre),
    '',
    'STAVELSER',
    ...formattedAnalyses(source.syllables),
    '',
    'POETISK FORM',
    ...formattedAnalyses(formAnalyses),
    '',
    'BEGRUNDELSE',
    `  ${strongestForm.pattern}`,
    ...explanationSignals.map(signal =>
      `  ${signal.contribution >= 0 ? '+' : '-'} ${signal.description}`),
  ];
  if (report.existingForm === true) lines.push('', 'Eksisterende <form> er bevaret.');
  return lines.join('\n');
};

export const run = (args = process.argv.slice(2), rootDir = process.cwd()) => {
  if (args.length !== 1 || args[0].startsWith('-')) {
    throw new Error('Brug: npm run poetic-form -- <digt-id>');
  }
  const textId = args[0];
  const match = findText(textId, rootDir);
  if (match == null) throw new Error(`Digt-id findes ikke: ${textId}`);
  const author = match.xml.match(/<kalliopework\b[^>]*\bauthor="([^"]+)"/)?.[1] ?? null;
  const infoFilename = author == null ? null : path.join(rootDir, 'fdirs', author, 'info.xml');
  const infoXml = infoFilename != null && fs.existsSync(infoFilename)
    ? fs.readFileSync(infoFilename, 'utf8')
    : '';
  const language = infoXml.match(/<person\b[^>]*\blang="([^"]+)"/)?.[1] ?? 'da';
  const analyzed = analyzeWorkXml(match.xml, { language, minConfidence: 0 });
  const report = analyzed.reports.find(candidate => candidate.textId === textId);
  if (report == null) throw new Error(`Digtet kan ikke analyseres: ${textId}`);
  const output = formatPoeticFormReport({ ...match, report, rootDir });
  console.log(output);
  return { filename: match.filename, report };
};

if (process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    run();
  } catch (error) {
    console.error(`Poetisk formanalyse fejlede: ${error.message}`);
    process.exitCode = 2;
  }
}
