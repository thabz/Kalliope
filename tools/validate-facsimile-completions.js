#!/usr/bin/env node

import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { DOMParser } from '@xmldom/xmldom';

const requiredQualityFlags = ['korrektur1', 'korrektur2', 'kilde', 'side'];
const timestampWithTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const elementChildren = (node, name = null) => Array.from(node?.childNodes ?? [])
  .filter(child => child.nodeType === 1 && (name == null || child.nodeName === name));

const directChild = (node, name) => elementChildren(node, name)[0] ?? null;

const parseWork = xml => {
  if (xml == null) return null;
  const errors = [];
  const document = new DOMParser({
    onError: (level, message) => {
      if (level !== 'warning') errors.push(message);
    },
  }).parseFromString(xml, 'application/xml');
  if (errors.length > 0 || document.documentElement?.nodeName !== 'kalliopework') return null;
  return document.documentElement;
};

const isComplete = work => work?.getAttribute('status') === 'complete';

const hasFacsimile = work => {
  const workhead = directChild(work, 'workhead');
  return elementChildren(workhead, 'source')
    .some(source => (source.getAttribute('facsimile') ?? '').trim().length > 0);
};

const textEntries = work => {
  const texts = Array.from(work.getElementsByTagName('text'));
  const legacyProse = Array.from(work.getElementsByTagName('prose'))
    .filter(prose => ['workbody', 'content'].includes(prose.parentNode?.nodeName));
  return [...texts, ...legacyProse];
};

const validateAttestations = (work, filename) => {
  const errors = [];
  const workhead = directChild(work, 'workhead');
  const containers = elementChildren(workhead, 'proofreadings');
  if (containers.length !== 1) {
    return [`${filename}: et nyt komplet facsimileværk skal have præcis ét <proofreadings> i <workhead>`];
  }
  const attestations = elementChildren(containers[0], 'proofreading');
  if (attestations.length === 0) {
    return [`${filename}: <proofreadings> skal indeholde mindst én <proofreading>`];
  }
  attestations.forEach((attestation, index) => {
    const label = `${filename}: proofreading ${index + 1}`;
    const model = (attestation.getAttribute('model') ?? '').trim();
    const datetime = attestation.getAttribute('datetime') ?? '';
    if (model.length === 0) errors.push(`${label} mangler modelnavn`);
    if (timestampWithTimezone.test(datetime) !== true || Number.isNaN(Date.parse(datetime))) {
      errors.push(`${label} har ugyldigt ISO 8601-tidspunkt med tidszone: ${datetime || '(mangler)'}`);
    }
  });
  return errors;
};

const validateQuality = (work, filename) => {
  const entries = textEntries(work);
  if (entries.length === 0) return [`${filename}: et komplet facsimileværk skal indeholde mindst én tekstpost`];
  return entries.flatMap((entry, index) => {
    const head = directChild(entry, 'head');
    const quality = directChild(head, 'quality');
    const flags = new Set((quality?.textContent ?? '').split(',').map(value => value.trim()).filter(Boolean));
    const missing = requiredQualityFlags.filter(flag => flags.has(flag) !== true);
    if (missing.length === 0) return [];
    const id = entry.getAttribute('id') ?? `${entry.nodeName}-${index + 1}`;
    return [`${filename}: ${id} mangler kvalitetsmærkerne ${missing.join(',')}`];
  });
};

const validateFacsimileCompletion = ({ baseXml = null, headXml, filename = 'værk.xml' }) => {
  const head = parseWork(headXml);
  if (head == null) return [];
  const base = parseWork(baseXml);
  if (isComplete(head) !== true || hasFacsimile(head) !== true || isComplete(base) === true) return [];
  return [
    ...validateAttestations(head, filename),
    ...validateQuality(head, filename),
  ];
};

const git = args => execFileSync('git', args, { encoding: 'utf8' });

const gitShow = (revision, filename) => {
  try {
    return git(['show', `${revision}:${filename}`]);
  } catch {
    return null;
  }
};

const validateChangedFacsimileCompletions = ({ baseRef, headRef }) => {
  const filenames = git([
    'diff', '--name-only', '--diff-filter=AM', baseRef, headRef, '--', 'fdirs',
  ]).split('\n').filter(filename => /^fdirs\/[^/]+\/[^/]+\.xml$/.test(filename));
  return filenames.flatMap(filename => validateFacsimileCompletion({
    baseXml: gitShow(baseRef, filename),
    headXml: gitShow(headRef, filename),
    filename,
  }));
};

const main = () => {
  const [baseRef, headRef = 'HEAD'] = process.argv.slice(2);
  if (baseRef == null) {
    console.error('Brug: validate-facsimile-completions.js BASE-REF [HEAD-REF]');
    process.exitCode = 1;
    return;
  }
  const errors = validateChangedFacsimileCompletions({ baseRef, headRef });
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log('Alle nye komplette facsimileværker har korrekturattest og kvalitetsmærker.');
};

if (process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1]) main();

export {
  requiredQualityFlags,
  validateChangedFacsimileCompletions,
  validateFacsimileCompletion,
};
