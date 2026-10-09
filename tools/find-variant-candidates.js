import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { StringDecoder } from 'node:string_decoder';
import { fileURLToPath } from 'node:url';
import { createGunzip } from 'node:zlib';
import { DOMParser, onWarningStopParsing } from '@xmldom/xmldom';
import { resolveAuthorId } from './build-static/anthologies.js';

const usage = 'Brug: node tools/find-variant-candidates.js VÆRKFIL [--json]';
const collator = new Intl.Collator('da-DK', { ignorePunctuation: true });
const normalizeLine = line =>
  (line.normalize('NFKC').toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? []).join(' ');
const letterCount = line => (line.match(/\p{L}/gu) ?? []).length;
const directChild = (node, name) => Array.from(node?.childNodes ?? [])
  .find(child => child.nodeType === 1 && child.nodeName === name);
const plainText = node => {
  if (node == null || node.nodeName === 'footnote' || node.nodeName === 'num') {
    return '';
  }
  if (node.nodeType === 3 || node.nodeType === 4) {
    return node.nodeValue;
  }
  return Array.from(node.childNodes ?? []).map(plainText).join('');
};

const parseWork = filename => {
  const document = new DOMParser({ onError: onWarningStopParsing })
    .parseFromString(fs.readFileSync(filename, 'utf8'), 'text/xml');
  const work = document.documentElement;
  if (work?.nodeName !== 'kalliopework') {
    throw new Error(`${filename}: forventede <kalliopework>.`);
  }
  const workAuthor = work.getAttribute('author') ?? '';
  const workId = work.getAttribute('id') ?? '';
  if (workAuthor.length === 0 || workId.length === 0) {
    throw new Error(`${filename}: værket mangler author eller id.`);
  }
  const texts = [];
  const ids = new Set();
  const edges = [];
  const counts = { texts: 0, searchable: 0, skipped: 0, missingFirstline: 0 };
  for (const element of Array.from(work.getElementsByTagName('*'))) {
    if (element.nodeName !== 'text' && element.nodeName !== 'section') {
      continue;
    }
    const id = element.getAttribute('id') ?? '';
    if (id.length > 0) {
      if (ids.has(id) === true) {
        throw new Error(`${filename}: gentaget tekst-id ${id}.`);
      }
      ids.add(id);
      const variant = element.getAttribute('variant') ?? '';
      if (variant.length > 0) {
        edges.push([id, variant]);
      }
    }
    if (element.nodeName !== 'text') {
      continue;
    }
    counts.texts += 1;
    if (element.hasAttribute('skip-index') === true) {
      counts.skipped += 1;
      continue;
    }
    const head = directChild(element, 'head');
    const firstline = plainText(directChild(head, 'firstline')).trim();
    if (normalizeLine(firstline).length === 0) {
      counts.missingFirstline += 1;
      continue;
    }
    if (id.length === 0) {
      throw new Error(`${filename}: en tekst med førstelinje mangler id.`);
    }
    const poetId = resolveAuthorId(element, workAuthor);
    const title = plainText(directChild(head, 'title')).trim();
    texts.push({
      id, poetId, firstline, title, workId: `${workAuthor}/${workId}`,
      canonicalUrl: `https://kalliope.org/da/text/${encodeURIComponent(id)}`,
      input: true,
    });
    counts.searchable += 1;
  }
  return { texts, ids, edges, counts };
};

// Consume the gzip through a pipeline so corrupt/truncated input rejects too.
const streamCorpus = async (filename, consume) => {
  await pipeline(fs.createReadStream(filename), createGunzip(), async source => {
    const decoder = new StringDecoder('utf8');
    let pending = '';
    let lineNumber = 0;
    const consumeLine = line => {
      lineNumber += 1;
      if (line.trim().length === 0) {
        return;
      }
      try {
        consume(JSON.parse(line));
      } catch (error) {
        throw new Error(`${filename}:${lineNumber}: ${error.message}`);
      }
    };
    for await (const chunk of source) {
      const lines = (pending + decoder.write(chunk)).split('\n');
      pending = lines.pop();
      lines.forEach(consumeLine);
    }
    pending += decoder.end();
    if (pending.length > 0) {
      consumeLine(pending);
    }
  });
};

const lineSimilarity = (left, right) => {
  const a = Array.from(left);
  const b = Array.from(right);
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1, previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return 1 - previous[b.length] / Math.max(a.length, b.length);
};

const candidatePairs = texts => {
  const byLine = new Map();
  const byPrefix = new Map();
  const pairs = new Map();
  const addPair = (a, b, reason) => {
    if (a.id === b.id || (a.input !== true && b.input !== true)) {
      return;
    }
    // Put the input occurrence first; use ids to order internal pairs.
    const swap = a.input !== true || (b.input === true && a.id > b.id);
    const left = swap === true ? b : a;
    const right = swap === true ? a : b;
    const key = [a.id, b.id].sort().join('\0');
    const pair = pairs.get(key) ?? { left, right, reasons: [] };
    if (pair.reasons.includes(reason) === false) {
      pair.reasons.push(reason);
    }
    pairs.set(key, pair);
  };
  // Only emit pairs touching the input work, even in large repeated-line groups.
  const matchGroup = (group, reason) => {
    for (const input of group.filter(text => text.input === true)) {
      for (const other of group) {
        addPair(input, other, reason);
      }
    }
  };
  for (const text of texts) {
    const line = normalizeLine(text.firstline);
    const group = byLine.get(line) ?? [];
    group.push(text);
    byLine.set(line, group);
    const words = line.split(' ');
    const prefix = words.slice(0, 3).join(' ');
    if (words.length >= 3 && letterCount(prefix) >= 12) {
      const prefixGroup = byPrefix.get(prefix) ?? [];
      prefixGroup.push(text);
      byPrefix.set(prefix, prefixGroup);
    }
  }
  byLine.forEach(group => matchGroup(group, 'same-firstline'));
  byPrefix.forEach(group => matchGroup(group, 'same-opening'));
  // Group equal lines before sorting, so repeated placements cannot crowd out
  // a nearby spelling variant. No comparison of all corpus text pairs.
  const sorted = Array.from(byLine.entries()).sort(([a], [b]) => {
    const order = collator.compare(a, b);
    return order !== 0 ? order : a.localeCompare(b);
  });
  for (let index = 0; index < sorted.length; index += 1) {
    const [line, group] = sorted[index];
    for (let offset = 1; offset <= 2 && index + offset < sorted.length; offset += 1) {
      const [nextLine, nextGroup] = sorted[index + offset];
      if (group.some(text => text.input === true) === false &&
          nextGroup.some(text => text.input === true) === false) {
        continue;
      }
      if (letterCount(line) < 15 || letterCount(nextLine) < 15 ||
          lineSimilarity(line, nextLine) < 0.85) {
        continue;
      }
      for (const a of group.filter(text => text.input === true)) {
        for (const b of nextGroup) {
          addPair(a, b, 'similar-firstline');
        }
      }
      for (const b of nextGroup.filter(text => text.input === true)) {
        for (const a of group) {
          addPair(a, b, 'similar-firstline');
        }
      }
    }
  }
  return Array.from(pairs.values()).sort((a, b) => {
    const lineOrder = collator.compare(a.left.firstline, b.left.firstline);
    if (lineOrder !== 0) {
      return lineOrder;
    }
    const idOrder = a.left.id.localeCompare(b.left.id);
    return idOrder !== 0 ? idOrder : a.right.id.localeCompare(b.right.id);
  });
};

const variantGraph = () => {
  const parents = new Map();
  const find = id => {
    if (parents.has(id) === false) {
      parents.set(id, id);
    }
    let root = id;
    while (parents.get(root) !== root) {
      root = parents.get(root);
    }
    let current = id;
    while (current !== root) {
      const next = parents.get(current);
      parents.set(current, root);
      current = next;
    }
    return root;
  };
  return {
    connect: (a, b) => parents.set(find(a), find(b)),
    connected: (a, b) => find(a) === find(b),
  };
};

const localApiPath = (apiUrl, rootDirectory) => {
  const pathname = decodeURIComponent(new URL(apiUrl).pathname);
  if (pathname.startsWith('/api/texts/') !== true || pathname.endsWith('.json') !== true) {
    throw new Error(`Ugyldig tekst-API-URL: ${apiUrl}`);
  }
  const publicDirectory = path.resolve(rootDirectory, 'public');
  const filename = path.resolve(publicDirectory, `.${pathname}`);
  if (filename.startsWith(`${publicDirectory}${path.sep}`) !== true) {
    throw new Error(`API-URL ligger uden for public: ${apiUrl}`);
  }
  return filename;
};

export const findVariantCandidates = async ({ filename, rootDirectory = process.cwd() }) => {
  const workFile = path.resolve(rootDirectory, filename);
  const work = parseWork(workFile);
  const poetIds = new Set(work.texts.map(text => text.poetId));
  const records = new Map();
  const corpusIds = new Set();
  const warnings = new Set();
  const datasetDirectory = path.join(rootDirectory, 'public/api/v1');
  let corpusBuiltAt = null;
  try {
    corpusBuiltAt = JSON.parse(fs.readFileSync(path.join(datasetDirectory, 'manifest.json'), 'utf8')).built_at;
    if (typeof corpusBuiltAt !== 'string') {
      throw new Error('manifestet mangler built_at');
    }
  } catch (error) {
    warnings.add(`Korpusets buildtid kunne ikke læses: ${error.message}`);
    corpusBuiltAt = null;
  }
  await streamCorpus(path.join(datasetDirectory, 'texts.jsonl.gz'), record => {
    if (typeof record.id !== 'string' || typeof record.poet_id !== 'string') {
      throw new Error('Tekstposten mangler id eller poet_id.');
    }
    corpusIds.add(record.id);
    if (poetIds.has(record.poet_id) === true) {
      records.set(record.id, record);
    }
  });
  const byPoet = new Map(Array.from(poetIds).map(id => [id, new Map()]));
  for (const record of records.values()) {
    const canonicalId = record.canonical_text_id ?? record.id;
    if (work.ids.has(record.id) === true || work.ids.has(canonicalId) === true ||
        record.type !== 'text' || typeof record.firstline !== 'string' ||
        normalizeLine(record.firstline).length === 0) {
      continue;
    }
    const texts = byPoet.get(record.poet_id);
    // Prefer the canonical placement when both placements are present.
    if (texts.has(canonicalId) === false || record.id === canonicalId) {
      texts.set(canonicalId, {
        id: canonicalId, poetId: record.poet_id, firstline: record.firstline,
        title: record.title ?? '', workId: record.work_id,
        canonicalUrl: record.canonical_url, input: false,
        recordId: record.id,
      });
    }
  }
  for (const text of work.texts) {
    byPoet.get(text.poetId).set(text.id, text);
  }
  const graph = variantGraph();
  const connect = (a, b) => {
    graph.connect(a, b);
    if (corpusIds.has(b) === false && work.ids.has(b) === false) {
      warnings.add(`${a}: variantreferencen ${b} findes ikke i inputværket eller korpusdatasættet.`);
    }
  };
  work.edges.forEach(([a, b]) => connect(a, b));
  const authors = Array.from(byPoet.entries()).sort(([a], [b]) => collator.compare(a, b))
    .map(([poetId, texts]) => ({
      poetId,
      poetName: Array.from(records.values()).find(record => record.poet_id === poetId)?.poet_name ?? poetId,
      inputTexts: Array.from(texts.values()).filter(text => text.input === true).length,
      existingTexts: Array.from(texts.values()).filter(text => text.input !== true).length,
      candidates: candidatePairs(Array.from(texts.values())),
      alreadyLinkedCount: 0,
    }));
  const candidateTexts = new Map();
  authors.forEach(author => author.candidates.forEach(pair => {
    [pair.left, pair.right].forEach(text => candidateTexts.set(text.id, text));
  }));
  // Read only candidate APIs. Their variants arrays already contain the full
  // connected component; union these with fresh relations from the input XML.
  for (const text of candidateTexts.values()) {
    const record = records.get(text.recordId ?? text.id);
    if (record == null) {
      continue; // An unbuilt input occurrence has no generated API yet.
    }
    try {
      const data = JSON.parse(fs.readFileSync(localApiPath(record.api_url, rootDirectory), 'utf8'));
      if (data.text?.id !== record.id || Array.isArray(data.text?.variants) !== true) {
        throw new Error('tekst-JSON har forkert id eller mangler variants');
      }
      for (const variant of data.text.variants) {
        if (typeof variant.id !== 'string' || variant.id.length === 0) {
          throw new Error('variantposten mangler id');
        }
        connect(text.id, variant.id);
      }
    } catch (error) {
      warnings.add(`${text.id}: eksisterende variantforbindelser kunne ikke kontrolleres: ${error.message}`);
    }
  }
  for (const author of authors) {
    author.candidates = author.candidates.filter(pair => {
      if (graph.connected(pair.left.id, pair.right.id) === true) {
        author.alreadyLinkedCount += 1;
        return false;
      }
      // Internal bookkeeping is not part of the report interface.
      delete pair.left.recordId;
      delete pair.right.recordId;
      return true;
    });
  }
  return {
    workFile: path.relative(rootDirectory, workFile), corpusBuiltAt,
    inputCounts: work.counts, authors, warnings: Array.from(warnings).sort(),
  };
};

const reasonLabels = {
  'same-firstline': 'ens førstelinje efter normalisering',
  'same-opening': 'samme tre indledende ord',
  'similar-firstline': 'næsten ens førstelinjer blandt sorterede naboer (mindst 85 %)',
};

export const formatVariantReport = report => {
  const counts = report.inputCounts;
  const lines = [
    `Variantkandidater: ${report.workFile}`,
    `Korpus bygget: ${report.corpusBuiltAt ?? 'ukendt'}`,
    `${counts.texts} tekster: ${counts.searchable} med førstelinje, ${counts.skipped} med skip-index, ${counts.missingFirstline} uden førstelinje.`,
    'Søgegrundlag: eksisterende genereret korpus. Kandidater kræver tekstlig vurdering; stærkt omskrevne begyndelser kan overses.',
  ];
  for (const author of report.authors) {
    lines.push('', `${author.poetName} (${author.poetId}): ${author.candidates.length} kandidatpar, ${author.alreadyLinkedCount} allerede forbundne; ${author.inputTexts} inputtekster og ${author.existingTexts} eksisterende tekster.`);
    for (const pair of author.candidates) {
      lines.push(`  ${pair.reasons.map(reason => reasonLabels[reason]).join('; ')}`);
      for (const text of [pair.left, pair.right]) {
        lines.push(`    ${text.input === true ? 'Værket' : 'Korpus'}: ${text.firstline}`,
          `      ${text.title.length > 0 ? text.title : '(uden titel)'} — ${text.workId} — ${text.id}`,
          `      ${text.canonicalUrl}`);
      }
    }
  }
  if (report.warnings.length > 0) {
    lines.push('', 'Uafklarede dataproblemer:');
    report.warnings.forEach(warning => lines.push(`  ${warning}`));
  }
  return lines.join('\n');
};

const runCli = async () => {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log(usage);
  } else {
    const filenames = args.filter(argument => argument.startsWith('--') !== true);
    if (filenames.length !== 1 || args.some(argument =>
      argument.startsWith('--') === true && argument !== '--json') === true) {
      throw new Error(usage);
    }
    const report = await findVariantCandidates({ filename: filenames[0] });
    console.log(args.includes('--json') === true
      ? JSON.stringify(report, null, 2) : formatVariantReport(report));
  }
};

if (process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
