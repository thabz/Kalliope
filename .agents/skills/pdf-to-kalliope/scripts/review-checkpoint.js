#!/usr/bin/env node

import fs from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { readJsonLines, sha256 } from './audit-utils.js';
import { analyzeWholeWork } from './analyze-whole-work.js';
import { DOMParser } from '@xmldom/xmldom';
import { child, children, facsimileInterval } from '../../../../tools/errata.js';
import { validateFindings } from './findings-register.js';

const git = (root, args) => execFileSync('git', args, {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 128 * 1024 * 1024,
});

const facsimileNumber = value => Number(/^(\d+)\.jpg$/i.exec(value ?? '')?.[1] ?? NaN);
const requiredCandidateKinds = ['ocr', 'page', 'stanza', 'indentation', 'typography'];

const validateErrataInventory = (inventory, workXml) => {
  if (workXml == null) return [];
  const work = new DOMParser().parseFromString(workXml, 'text/xml').documentElement;
  const declarations = children(child(work, 'workhead'), 'errata');
  const applied = declarations.filter(node => node.getAttribute('status') === 'applied');
  const errataPages = inventory.filter(page => page.page_type === 'errata');
  const issues = [];
  errataPages.forEach(page => {
    const number = facsimileNumber(page.facsimile) + 1;
    if (!applied.some(node => {
      const range = facsimileInterval(node.getAttribute('facsimile-pages'));
      return range != null && number >= range[0] && number <= range[1];
    })) issues.push(`rettelsesark på ${page.facsimile} mangler indført <errata>`);
  });
  applied.forEach(node => {
    const range = facsimileInterval(node.getAttribute('facsimile-pages'));
    if (range != null) {
      for (let number = range[0]; number <= range[1]; number += 1) {
        if (!errataPages.some(page => facsimileNumber(page.facsimile) + 1 === number)) {
          issues.push(`indført <errata> på facsimileside ${number} mangler i sideinventaret`);
        }
      }
    }
  });
  return issues;
};

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

const validateWholeWorkCandidates = ({ analysis, workXml, findings }) => {
  if (analysis == null || workXml == null) {
    return ['helværksanalyse og aktuel XML mangler'];
  }
  const errors = [];
  if (analysis.source_xml_sha256 !== sha256(workXml)) {
    errors.push('helværksanalysen hører ikke til den aktuelle XML');
  }
  if (!Array.isArray(analysis.poems)) {
    return [...errors, 'helværksanalysen mangler digtlisten'];
  }
  const baseline = analyzeWholeWork(workXml);
  const expectedPoems = new Map(baseline.poems.map(poem => [
    `${poem.text_id}:${poem.block_index}`,
    poem,
  ]));
  if (analysis.poems.length !== baseline.poems.length) {
    errors.push('helværksanalysen dækker ikke alle digte i XML');
  }
  if (analysis.candidate_inventory_sha256 !== sha256(JSON.stringify(
    analysis.poems.map(poem => [poem.text_id, poem.block_index, poem.candidates])
  ))) {
    errors.push('helværksanalysens kandidatliste stemmer ikke med dens hash');
  }
  if (analysis.poems.length > 0 &&
      analysis.geometry_summary?.poetry_block_count !== analysis.poems.length) {
    errors.push('helværksanalysen mangler OCR-geometri for digtene');
  }
  const candidateIds = new Set();
  analysis.poems.forEach(poem => {
    const poemKey = `${poem.text_id}:${poem.block_index}`;
    const expected = expectedPoems.get(poemKey);
    expectedPoems.delete(poemKey);
    if (expected == null ||
        JSON.stringify(poem.stanza) !== JSON.stringify(expected.stanza) ||
        JSON.stringify(poem.page_breaks) !== JSON.stringify(expected.page_breaks)) {
      errors.push(`digtet ${poem.text_id ?? '?'} svarer ikke til aktuel XML`);
    }
    if (poem.geometry == null) {
      errors.push(`digtet ${poem.text_id ?? '?'} mangler OCR-geometri`);
    }
    if (!Array.isArray(poem.candidates)) {
      errors.push(`digtet ${poem.text_id ?? '?'} mangler kandidatlisten`);
      return;
    }
    const coreSources = new Set(['stanza', 'indentation', 'wrapper']);
    const actualCore = poem.candidates
      .filter(candidate => coreSources.has(candidate.source))
      .map(({ candidate_id, ...candidate }) => candidate);
    const expectedCore = expected?.candidates.filter(candidate =>
      coreSources.has(candidate.source)
    ).map(({ candidate_id, ...candidate }) => candidate) ?? [];
    if (JSON.stringify(actualCore) !== JSON.stringify(expectedCore)) {
      errors.push(`digtet ${poem.text_id ?? '?'} mangler strukturelle kandidater fra aktuel XML`);
    }
    poem.candidates.forEach((candidate, index) => {
      const id = candidate.candidate_id;
      if (typeof id !== 'string' || id === '') {
        errors.push(`kandidat i ${poem.text_id ?? '?'} mangler candidate_id`);
        return;
      }
      const { candidate_id, ...candidateContent } = candidate;
      if (id !== sha256(JSON.stringify([
        poem.text_id,
        poem.block_index,
        index,
        candidateContent,
      ]))) {
        errors.push(`kandidat ${poem.text_id}:${candidate.type} har ugyldigt candidate_id`);
      }
      if (candidateIds.has(id)) errors.push(`duplikeret candidate_id: ${id}`);
      candidateIds.add(id);
      const matches = findings.filter(finding => finding.candidate_id === id);
      if (matches.length !== 1) {
        errors.push(`kandidat ${poem.text_id}:${candidate.type} (${id}) har ${matches.length} dispositioner`);
      } else if (!['verified', 'rejected', 'withdrawn'].includes(matches[0].status)) {
        errors.push(`kandidat ${poem.text_id}:${candidate.type} (${id}) er ikke afsluttet`);
      }
    });
  });
  if (expectedPoems.size > 0) errors.push('helværksanalysen mangler digte fra aktuel XML');
  return errors;
};

const validateVisualStructureReviews = ({ analysis, reviews, producer }) => {
  if (!Array.isArray(analysis?.poems)) return [];
  const errors = [];
  const expectedKeys = new Set(analysis.poems.map(poem =>
    `${poem.text_id}:${poem.block_index}`
  ));
  analysis.poems.forEach(poem => {
    const matches = reviews.filter(review =>
      review.text_id === poem.text_id &&
      review.block_index === poem.block_index
    );
    if (matches.length !== 1) {
      errors.push(`digtet ${poem.text_id}, blok ${poem.block_index}, har ${matches.length} visuelle strofekontroller`);
      return;
    }
    const review = matches[0];
    if (review.status !== 'reviewed' ||
        review.reviewer == null || review.reviewer === '' ||
        review.reviewer === producer) {
      errors.push(`digtet ${poem.text_id}, blok ${poem.block_index}, mangler uafhængig visuel kontrol`);
    }
    if (JSON.stringify(review.visual_stanza_lengths) !==
        JSON.stringify(poem.stanza.observed_stanza_lengths)) {
      errors.push(`digtet ${poem.text_id}, blok ${poem.block_index}, har strofelængder som ikke stemmer med facsimilekontrollen`);
    }
    if (!Array.isArray(review.facsimiles) || review.facsimiles.length === 0 ||
        review.facsimiles.some(facsimile => !Number.isFinite(facsimileNumber(facsimile)))) {
      errors.push(`digtet ${poem.text_id}, blok ${poem.block_index}, mangler facsimilesider i kontrollen`);
    } else {
      const expectedFacsimiles = (poem.geometry?.selected_variants ?? [])
        .map(variant => variant.facsimile)
        .sort();
      if (expectedFacsimiles.length > 0 &&
          JSON.stringify([...review.facsimiles].sort()) !== JSON.stringify(expectedFacsimiles)) {
        errors.push(`digtet ${poem.text_id}, blok ${poem.block_index}, har ikke kontrolleret alle facsimilesider`);
      }
    }
    if (typeof review.disposition !== 'string' || review.disposition.trim() === '') {
      errors.push(`digtet ${poem.text_id}, blok ${poem.block_index}, mangler visuel disposition`);
    }
  });
  reviews.forEach(review => {
    if (!expectedKeys.has(`${review.text_id}:${review.block_index}`)) {
      errors.push(`visuel strofekontrol peger på ukendt digt ${review.text_id}:${review.block_index}`);
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
  visualStructureReviews = [],
  analysis = null,
  workXml = null,
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
    ...validateWholeWorkCandidates({ analysis, workXml, findings }),
    ...validateVisualStructureReviews({ analysis, reviews: visualStructureReviews, producer }),
    ...validateErrataInventory(inventory, workXml),
    ...unresolved.map(finding => `uverificeret finding: ${finding.id}`),
    ...findings.filter(finding => finding.reviewer === producer).map(finding => `finding er registreret af producenten: ${finding.id}`),
    ...findings.filter(finding => finding.verified_by === producer).map(finding => `finding er verificeret af producenten: ${finding.id}`),
    ...uncovered.map(page => `ikke gennemgået side: ${page.text_id}:${page.printed_page}`),
    ...inventory.filter(page => page.reviewer === producer).map(page => `side er gennemgået af producenten: ${page.text_id}:${page.printed_page}`),
    ...inventory.filter(page => page.disposition == null || page.disposition === '').map(page => `side mangler disposition: ${page.text_id}:${page.printed_page}`),
    ...inventory.filter(page => page.typography_status !== 'reviewed').map(page => `sidens typografi er ikke gennemgået: ${page.text_id}:${page.printed_page}`),
    ...inventory.filter(page => page.typography_disposition == null || page.typography_disposition === '').map(page => `side mangler typografidisposition: ${page.text_id}:${page.printed_page}`),
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
    visual_structure_reviews: visualStructureReviews,
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
  const [command, checkpointFile, findingsFile, inventoryFile, reviewFile, workFile, analysisFile] = process.argv.slice(2);
  const root = process.cwd();
  try {
    if (command === 'create') {
      if (!checkpointFile || !findingsFile || !inventoryFile || !reviewFile || !workFile || !analysisFile) throw new Error('Brug: review-checkpoint.js create CHECKPOINT.json FINDINGS.jsonl INVENTORY.jsonl REVIEW.json WORK.xml ANALYSIS.json');
      const review = JSON.parse(fs.readFileSync(reviewFile, 'utf8'));
      const checkpoint = createCheckpoint({
        root,
        findings: readJsonLines(findingsFile),
        inventory: readJsonLines(inventoryFile),
        tests: review.tests ?? [],
        reviewerRanges: review.reviewer_ranges ?? [],
        producer: review.producer ?? null,
        candidateReviews: review.candidate_reviews ?? [],
        visualStructureReviews: review.visual_structure_reviews ?? [],
        analysis: JSON.parse(fs.readFileSync(analysisFile, 'utf8')),
        workXml: fs.readFileSync(workFile, 'utf8'),
        artifactFiles: {
          findings: findingsFile,
          inventory: inventoryFile,
          review: reviewFile,
          work: workFile,
          analysis: analysisFile,
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

export { createCheckpoint, currentReviewState, validateErrataInventory, validateReviewerRanges, validateVisualStructureReviews, validateWholeWorkCandidates, verifyCheckpoint };
