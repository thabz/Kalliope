import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import {
  findVariantCandidates,
  formatVariantReport,
} from '../tools/find-variant-candidates.js';

const filename = 'fdirs/collection/test.xml';
const firstline = 'Moders Navn er en himmelsk Lyd';
const xmlText = (id, line, attributes = '') =>
  `<text id="${id}" ${attributes}><head><title>Titel</title>${
    line == null ? '' : `<firstline>${line}</firstline>`
  }</head><body><poetry>Indhold</poetry></body></text>`;
const xmlWork = (content, author = 'poet') =>
  `<kalliopework author="${author}" id="test"><workbody>${content}</workbody></kalliopework>`;
const corpusText = (id, poetId = 'poet', line = firstline, extra = {}) => ({
  id, poet_id: poetId, type: 'text', canonical_text_id: id,
  firstline: line, title: `Titel ${id}`, work_id: `${poetId}/old`,
  poet_name: `Navn ${poetId}`,
  canonical_url: `https://kalliope.org/da/text/${id}`,
  api_url: `https://kalliope.org/api/texts/fixture/${id}.json`,
  ...extra,
});

describe('work-scoped variant candidates', () => {
  let rootDirectory;
  const write = (relativePath, data) => {
    const target = path.join(rootDirectory, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
  };
  const setup = (xml, records = []) => {
    write(filename, xml);
    write('public/api/v1/manifest.json', JSON.stringify({ built_at: '2026-10-09T12:00:00Z' }));
    write('public/api/v1/texts.jsonl.gz', gzipSync(
      records.map(record => JSON.stringify(record)).join('\n') + '\n',
    ));
    records.forEach(record => write(
      `public/api/texts/fixture/${record.id}.json`,
      JSON.stringify({ text: { id: record.id, variants: [] } }),
    ));
  };
  const apiVariants = (id, variantIds) => write(
    `public/api/texts/fixture/${id}.json`,
    JSON.stringify({ text: { id, variants: variantIds.map(variantId => ({ id: variantId })) } }),
  );
  const run = () => findVariantCandidates({ filename, rootDirectory });
  const pairs = report => report.authors.flatMap(author => author.candidates)
    .map(pair => [pair.left.id, pair.right.id]);

  beforeEach(() => {
    rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-variants-'));
  });
  afterEach(() => {
    fs.rmSync(rootDirectory, { recursive: true, force: true });
  });

  it('finds normalized matches only involving the work and the same poet', async () => {
    setup(xmlWork(xmlText('new', 'MODERS Navn, er en himmelsk Lyd!')), [
      corpusText('old'), corpusText('new'), corpusText('otherPoet', 'someoneElse'),
      corpusText('unrelated1', 'poet', 'En anden begyndelse end den nye'),
      corpusText('unrelated2', 'poet', 'En anden begyndelse end den nye'),
    ]);
    // Unrelated APIs must not be read as part of a global audit.
    fs.unlinkSync(path.join(rootDirectory, 'public/api/texts/fixture/unrelated1.json'));
    const report = await run();
    expect(pairs(report)).toEqual([['new', 'old']]);
    expect(report.authors).toHaveLength(1);
    expect(report.authors[0].candidates[0].reasons).toContain('same-firstline');
    expect(report.authors[0].candidates[0].left.firstline).toBe('MODERS Navn, er en himmelsk Lyd!');
    expect(report.warnings).toEqual([]);
    expect(report.corpusBuiltAt).toBe('2026-10-09T12:00:00Z');
  });

  it('inherits nested section authors and honors text overrides and the work author', async () => {
    setup(xmlWork(`
      <section author="alpha"><content><section><content>
        ${xmlText('legacyWithoutAuthorPrefix', firstline)}
        ${xmlText('override', firstline, 'author="beta"')}
      </content></section></content></section>
      ${xmlText('fallback', firstline)}
    `, 'gamma'), [
      corpusText('a', 'alpha'), corpusText('b', 'beta'), corpusText('c', 'gamma'),
      corpusText('irrelevant', 'delta'),
    ]);
    const report = await run();
    expect(pairs(report)).toEqual([
      ['legacyWithoutAuthorPrefix', 'a'], ['override', 'b'], ['fallback', 'c'],
    ]);
    expect(report.authors.map(author => author.poetId)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('deduplicates publication placements and excludes the input occurrence itself', async () => {
    setup(xmlWork(xmlText('new', firstline)), [
      corpusText('old'), corpusText('oldPlacement', 'poet', firstline, { canonical_text_id: 'old' }),
      corpusText('newPlacement', 'poet', firstline, { canonical_text_id: 'new' }),
      corpusText('new'),
    ]);
    const report = await run();
    expect(pairs(report)).toEqual([['new', 'old']]);
    expect(report.authors[0].existingTexts).toBe(1);
    expect(report.warnings).toEqual([]);
  });

  it('finds internal matches before a build and counts skipped and missing first lines', async () => {
    setup(xmlWork(
      xmlText('new1', firstline) + xmlText('new2', firstline) +
      xmlText('preface', firstline, 'skip-index="true"') + xmlText('missing', null),
    ));
    const report = await run();
    expect(pairs(report)).toEqual([['new1', 'new2']]);
    expect(report.inputCounts).toEqual({ texts: 4, searchable: 2, skipped: 1, missingFirstline: 1 });
    expect(report.warnings).toEqual([]);
  });

  it('uses current XML first lines rather than stale generated input metadata', async () => {
    setup(xmlWork(xmlText('new', 'En helt ny begyndelse her i værket')), [
      corpusText('new'), corpusText('old'),
      corpusText('matching', 'poet', 'En helt ny begyndelse her i værket'),
    ]);
    expect(pairs(await run())).toEqual([['new', 'matching']]);
  });

  it('finds changed openings and nearby historical spellings without equating short lines', async () => {
    setup(xmlWork(
      xmlText('opening', 'Den signede Dag med Fryd vi seer') +
      xmlText('spelling', 'Hvad Solskin er for det sorte Muld') +
      xmlText('short', 'Sol og sky'),
    ), [
      corpusText('oldOpening', 'poet', 'Den signede Dag som vi nu seer'),
      corpusText('oldSpelling', 'poet', 'Hvad Solskin er for den sorte Muld'),
      corpusText('oldShort', 'poet', 'Sol og sne'),
    ]);
    const report = await run();
    expect(pairs(report)).toEqual([['opening', 'oldOpening'], ['spelling', 'oldSpelling']]);
    const candidates = report.authors[0].candidates;
    expect(candidates[0].reasons).toContain('same-opening');
    expect(candidates[1].reasons).toContain('similar-firstline');
  });

  it('does not let repeated identical lines crowd spelling variants out of the neighbor window', async () => {
    setup(xmlWork(xmlText('new', 'Hvad Solskin er for det sorte Muld')), [
      ...Array.from({ length: 8 }, (_, i) => corpusText(`repeated${i}`, 'poet', 'Hvad Solskin er for den sorte Muld')),
    ]);
    const report = await run();
    expect(pairs(report)).toHaveLength(8);
    expect(report.authors[0].candidates.every(pair => pair.reasons.includes('similar-firstline'))).toBe(true);
  });

  it('suppresses direct XML relations and indirect relations through existing APIs', async () => {
    setup(xmlWork(xmlText('new', firstline, 'variant="middle"')), [
      corpusText('middle', 'poet', 'En anderledes førstelinje hos mellemleddet'), corpusText('old'),
    ]);
    apiVariants('old', ['middle']);
    const report = await run();
    expect(pairs(report)).toEqual([]);
    expect(report.authors[0].alreadyLinkedCount).toBe(1);
    expect(report.warnings).toEqual([]);
  });

  it('combines fresh internal XML chains before reporting candidates', async () => {
    setup(xmlWork(
      xmlText('new1', firstline, 'variant="new2"') +
      xmlText('new2', firstline, 'variant="new3"') + xmlText('new3', firstline),
    ));
    const report = await run();
    expect(pairs(report)).toEqual([]);
    expect(report.authors[0].alreadyLinkedCount).toBe(3);
  });

  it('leaves unresolved candidates visible and reports missing APIs and broken references', async () => {
    setup(xmlWork(xmlText('new', firstline, 'variant="nonexistent"')), [corpusText('old')]);
    fs.unlinkSync(path.join(rootDirectory, 'public/api/texts/fixture/old.json'));
    const report = await run();
    expect(pairs(report)).toEqual([['new', 'old']]);
    expect(report.warnings).toHaveLength(2);
    expect(report.warnings.join('\n')).toContain('nonexistent');
    expect(report.warnings.join('\n')).toContain('old');
    expect(formatVariantReport(report)).toContain('Uafklarede dataproblemer:');
  });

  it('reports incomplete API data instead of assuming there are no variants', async () => {
    setup(xmlWork(xmlText('new', firstline)), [corpusText('old')]);
    write('public/api/texts/fixture/old.json', JSON.stringify({ text: { id: 'old' } }));
    const report = await run();
    expect(pairs(report)).toEqual([['new', 'old']]);
    expect(report.warnings[0]).toContain('mangler variants');
  });

  it('fails clearly on invalid XML, invalid JSONL and truncated gzip data', async () => {
    setup('<kalliopework><text></kalliopework>');
    await expect(run()).rejects.toThrow();
    setup(xmlWork(xmlText('new', firstline)));
    write('public/api/v1/texts.jsonl.gz', gzipSync('not JSON\n'));
    await expect(run()).rejects.toThrow('texts.jsonl.gz:1:');
    const truncated = gzipSync(JSON.stringify(corpusText('old')) + '\n').subarray(0, 20);
    write('public/api/v1/texts.jsonl.gz', truncated);
    await expect(run()).rejects.toThrow();
  });

  it('requires a work file and produces JSON without logging build output', () => {
    setup(xmlWork(xmlText('new', firstline)), [corpusText('old')]);
    const tool = path.resolve('tools/find-variant-candidates.js');
    expect(() => execFileSync(process.execPath, [tool], { cwd: rootDirectory, stdio: 'pipe' }))
      .toThrow();
    const report = JSON.parse(execFileSync(process.execPath, [tool, filename, '--json'], {
      cwd: rootDirectory, encoding: 'utf8',
    }));
    expect(pairs(report)).toEqual([['new', 'old']]);
    expect(formatVariantReport(report)).toContain('Moders Navn er en himmelsk Lyd');
  });
});
