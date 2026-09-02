#!/usr/bin/env node

import fs from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { readJsonLines, sha256 } from './audit-utils.js';
import { validateFindings } from './findings-register.js';

const git = (root, args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });

const facsimileNumber = value => Number(/^(\d+)\.jpg$/i.exec(value ?? '')?.[1] ?? NaN);
const requiredCandidateKinds = ['ocr', 'page', 'stanza', 'indentation'];

const validateReviewerRanges = (ranges, inventory, producer = null) => {
  const errors = [];
  const normalized = ranges.map((range, index) => ({
    ...range,
    index,
    from: facsimileNumber(range.facsimile_from),
    to: facsimileNumber(range.facsimile_to),
  }));
  normalized.forEach(range => {
    if (range.reviewer == null || range.reviewer === '' || !Number.isFinite(range.from) || !Number.isFinite(range.to) || range.to < range.from) {
      errors.push(`ugyldigt reviewer-range ${range.index + 1}`);
    }
    if (producer != null && range.reviewer === producer) {
      errors.push(`reviewer-range ${range.index + 1} er tildelt producenten ${producer}`);
    }
  });
  normalized
    .filter(range => Number.isFinite(range.from) && Number.isFinite(range.to))
    .sort((left, right) => left.from - right.from)
    .forEach((range, index, sorted) => {
      if (index > 0 && range.from <= sorted[index - 1].to) {
        errors.push(`overlappende reviewer-ranges: ${sorted[index - 1].reviewer} og ${range.reviewer}`);
      }
    });
  inventory.forEach(page => {
    const number = facsimileNumber(page.facsimile);
    const matches = normalized.filter(range => number >= range.from && number <= range.to);
    if (matches.length !== 1) {
      errors.push(`facsimileside ${page.facsimile ?? '?'} dækkes af ${matches.length} reviewer-ranges`);
    } else if (page.reviewer !== matches[0].reviewer) {
      errors.push(`facsimileside ${page.facsimile} er gennemgået af ${page.reviewer ?? '?'}, men tildelt ${matches[0].reviewer}`);
    }
  });
  return errors;
};

const validateCandidateReviews = (reviews, producer) => {
  const errors = [];
  requiredCandidateKinds.forEach(kind => {
    const matches = reviews.filter(review => review.kind === kind);
    if (matches.length !== 1) {
      errors.push(`kandidatkontrollen ${kind} forekommer ${matches.length} gange`);
      return;
    }
    const review = matches[0];
    if (review.reviewer == null || review.reviewer === '') errors.push(`kandidatkontrollen ${kind} mangler reviewer`);
    if (review.reviewer === producer) errors.push(`kandidatkontrollen ${kind} er udført af producenten ${producer}`);
    if (review.status !== 'reviewed') errors.push(`kandidatkontrollen ${kind} er ikke gennemgået`);
    if (!Number.isInteger(review.candidate_count) || review.candidate_count < 0) {
      errors.push(`kandidatkontrollen ${kind} har ugyldigt candidate_count`);
    }
    if (!Number.isInteger(review.reviewed_count) || review.reviewed_count !== review.candidate_count) {
      errors.push(`kandidatkontrollen ${kind} har uverificerede kandidater`);
    }
  });
  return errors;
};

const currentReviewState = root => {
  const trackedChanges = git(root, ['diff', '--name-only', '-z', 'HEAD'])
    .split('\0')
    .filter(Boolean);
  const untrackedChanges = git(root, ['ls-files', '--others', '--exclude-standard', '-z'])
    .split('\0')
    .filter(Boolean);
  const changedFiles = [...new Set([...trackedChanges, ...untrackedChanges])].sort();
  const diff = git(root, ['diff', '--binary', 'HEAD']);
  return {
    head: git(root, ['rev-parse', 'HEAD']).trim(),
    diff_sha256: sha256(diff),
    changed_files: changedFiles,
    file_sha256: Object.fromEntries(changedFiles.map(filename => [
      filename,
      fs.existsSync(`${root}/${filename}`) ? sha256(fs.readFileSync(`${root}/${filename}`)) : null,
    ])),
  };
};

const createCheckpoint = ({
  root,
  findings,
  inventory,
  tests,
  reviewerRanges,
  producer = null,
  candidateReviews = [],
  state = null,
  artifactFiles = {},
}) => {
  const findingErrors = validateFindings(findings);
  const unresolved = findings.filter(finding => finding.status === 'open' || finding.status === 'fixed');
  const uncovered = inventory.filter(page => page.status !== 'reviewed');
  const failedTests = tests.filter(test => test.status !== 'passed');
  const errors = [
    ...findingErrors,
    ...(producer != null && producer !== '' ? [] : ['reviewet mangler producent']),
    ...validateReviewerRanges(reviewerRanges, inventory, producer),
    ...validateCandidateReviews(candidateReviews, producer),
    ...unresolved.map(finding => `uverificeret finding: ${finding.id}`),
    ...findings.filter(finding => finding.reviewer === producer).map(finding => `finding er registreret af producenten: ${finding.id}`),
    ...findings.filter(finding => finding.verified_by === producer).map(finding => `finding er verificeret af producenten: ${finding.id}`),
    ...uncovered.map(page => `ikke gennemgået side: ${page.text_id}:${page.printed_page}`),
    ...inventory.filter(page => page.reviewer === producer).map(page => `side er gennemgået af producenten: ${page.text_id}:${page.printed_page}`),
    ...inventory.filter(page => page.disposition == null || page.disposition === '').map(page => `side mangler disposition: ${page.text_id}:${page.printed_page}`),
    ...(tests.length > 0 ? [] : ['ingen tests er registreret']),
    ...failedTests.map(test => `test bestod ikke: ${test.command}`),
  ];
  if (errors.length) throw new Error(errors.join('\n'));
  return {
    version: 1,
    created_at: new Date().toISOString(),
    ...(state ?? currentReviewState(root)),
    producer,
    tests,
    candidate_reviews: candidateReviews,
    findings: {
      count: findings.length,
      status_counts: Object.fromEntries(
        [...new Set(findings.map(row => row.status))].map(status => [status, findings.filter(row => row.status === status).length]),
      ),
      sha256: sha256(findings.map(row => JSON.stringify(row)).join('\n')),
    },
    inventory: {
      page_count: inventory.length,
      sha256: sha256(inventory.map(row => JSON.stringify(row)).join('\n')),
    },
    reviewer_ranges: reviewerRanges,
    artifact_sha256: Object.fromEntries(
      Object.entries(artifactFiles).map(([name, filename]) => [
        name,
        { filename, sha256: sha256(fs.readFileSync(filename)) },
      ]),
    ),
  };
};

const verifyCheckpoint = ({ root, checkpoint, state = null }) => {
  state = state ?? currentReviewState(root);
  const errors = [];
  for (const field of ['head', 'diff_sha256']) {
    if (state[field] !== checkpoint[field]) errors.push(`${field} er ændret`);
  }
  if (JSON.stringify(state.changed_files) !== JSON.stringify(checkpoint.changed_files)) errors.push('listen over ændrede filer er ændret');
  for (const [filename, hash] of Object.entries(checkpoint.file_sha256 ?? {})) {
    if (state.file_sha256[filename] !== hash) errors.push(`${filename} er ændret`);
  }
  for (const [name, artifact] of Object.entries(checkpoint.artifact_sha256 ?? {})) {
    if (!fs.existsSync(artifact.filename)) {
      errors.push(`${name}-artefakt mangler: ${artifact.filename}`);
    } else if (sha256(fs.readFileSync(artifact.filename)) !== artifact.sha256) {
      errors.push(`${name}-artefakt er ændret`);
    }
  }
  return { status: errors.length ? 'invalid' : 'valid', errors, state };
};

const main = () => {
  const [command, checkpointFile, findingsFile, inventoryFile, reviewFile] = process.argv.slice(2);
  const root = process.cwd();
  try {
    if (command === 'create') {
      if (!checkpointFile || !findingsFile || !inventoryFile || !reviewFile) throw new Error('Brug: review-checkpoint.js create CHECKPOINT.json FINDINGS.jsonl INVENTORY.jsonl REVIEW.json');
      const review = JSON.parse(fs.readFileSync(reviewFile, 'utf8'));
      const checkpoint = createCheckpoint({
        root,
        findings: readJsonLines(findingsFile),
        inventory: readJsonLines(inventoryFile),
        tests: review.tests ?? [],
        reviewerRanges: review.reviewer_ranges ?? [],
        producer: review.producer ?? null,
        candidateReviews: review.candidate_reviews ?? [],
        artifactFiles: {
          findings: findingsFile,
          inventory: inventoryFile,
          review: reviewFile,
        },
      });
      fs.writeFileSync(checkpointFile, `${JSON.stringify(checkpoint, null, 2)}\n`);
      return;
    }
    if (command === 'verify') {
      if (!checkpointFile) throw new Error('Brug: review-checkpoint.js verify CHECKPOINT.json');
      const result = verifyCheckpoint({ root, checkpoint: JSON.parse(fs.readFileSync(checkpointFile, 'utf8')) });
      console.log(JSON.stringify(result, null, 2));
      if (result.status !== 'valid') process.exitCode = 1;
      return;
    }
    throw new Error('Brug: review-checkpoint.js create|verify ...');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
};

if (fileURLToPath(import.meta.url) === process.argv[1]) main();

export { createCheckpoint, currentReviewState, validateReviewerRanges, verifyCheckpoint };
