import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const dataDir = join(root, 'tools/data/indsamling/dbl');
const rawDir = join(dataDir, 'raw');
const parsedDir = join(root, 'docs/indsamling/dbl');
const baseUrl = 'https://biografiskleksikon.lex.dk';
const categories = [
  { id: 'digtere', url: `${baseUrl}/.taxonomy/2817` },
  { id: 'forfattere', url: `${baseUrl}/.taxonomy/2818` }
];
const generatedAt = new Date().toISOString();
const shouldFetch = process.argv.includes('--fetch');
let previousManifest = null;
try {
  previousManifest = JSON.parse(await readFile(join(parsedDir, 'manifest.json'), 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const decodeHtml = value => value
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
  .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');
const stripTags = value => decodeHtml(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
const metaContent = (html, name) => {
  const match = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i'));
  return match == null ? null : decodeHtml(match[1]);
};
const canonicalUrl = (html, fallback) => {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
  return match == null ? fallback : decodeHtml(match[1]);
};
const readOrFetch = async (path, url) => {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT' || shouldFetch !== true) throw error;
    const response = await fetch(url);
    if (response.ok !== true) throw new Error(`${response.status} ${response.statusText}: ${url}`);
    const body = await response.text();
    await writeFile(path, body);
    return body;
  }
};
const sha256 = value => createHash('sha256').update(value).digest('hex');
const safeFileName = url => `${encodeURIComponent(new URL(url).pathname.slice(1))}.html`;
const normalizeDate = value => value.replaceAll('.', '-').split('-').reverse().join('-');

await mkdir(join(rawDir, 'articles'), { recursive: true });
await mkdir(parsedDir, { recursive: true });
await readOrFetch(join(rawDir, 'robots.txt'), `${baseUrl}/robots.txt`);

const categoryRecords = [];
for (const category of categories) {
  const html = await readOrFetch(join(rawDir, `${category.id}.html`), category.url);
  const links = [...html.matchAll(/<a\s+href="(https:\/\/biografiskleksikon\.lex\.dk\/[^"#]+)"\s+class="link-list__link">([\s\S]*?)<\/a>/gi)];
  for (const [, url, label] of links) categoryRecords.push({ category: category.id, categoryUrl: category.url, sourceUrl: url, sourceName: stripTags(label) });
}

const uniqueUrls = [...new Set(categoryRecords.map(record => record.sourceUrl))];
const pages = new Map();
for (const url of uniqueUrls) pages.set(url, await readOrFetch(join(rawDir, 'articles', safeFileName(url)), url));

const observations = categoryRecords.map((record, index) => {
  const html = pages.get(record.sourceUrl);
  const titleMatch = html.match(/<h1 class="page-title">([\s\S]*?)<\/h1>/i);
  const sourceUrl = canonicalUrl(html, record.sourceUrl);
  const description = metaContent(html, 'description');
  const dateMatch = description?.match(/(\d{1,2}[./]\d{1,2}[./]\d{4})\s*[–-]\s*(\d{1,2}[./]\d{1,2}[./]\d{4}|\?)/u);
  return {
    observationId: `dbl:${record.category}:${String(index + 1).padStart(4, '0')}`,
    source: 'dansk-biografisk-leksikon',
    sourceId: new URL(sourceUrl).pathname.slice(1),
    sourceUrl,
    category: record.category,
    categoryUrl: record.categoryUrl,
    original: { name: record.sourceName, articleTitle: titleMatch == null ? null : stripTags(titleMatch[1]), description, lifeDates: dateMatch == null ? null : dateMatch[0] },
    normalized: { name: record.sourceName.normalize('NFKC').trim(), birthDate: dateMatch == null ? null : normalizeDate(dateMatch[1]), deathDate: dateMatch == null || dateMatch[2] === '?' ? null : normalizeDate(dateMatch[2]) },
    evidence: { poetrySignal: record.category === 'digtere' ? 'taxonomy-digtere' : null, languageSignal: null, identityStatus: 'unmatched' },
    parserStatus: description == null || titleMatch == null ? 'missing-fields' : 'parsed',
    errors: description == null || titleMatch == null ? ['missing-description-or-title'] : [],
    rawFile: relative(root, join(rawDir, 'articles', safeFileName(record.sourceUrl)))
  };
});

const manifest = {
  source: 'dansk-biografisk-leksikon', status: 'snapshot', generatedAt,
  fetchedAt: shouldFetch === true ? generatedAt : previousManifest?.fetchedAt ?? generatedAt,
  method: 'Bounded fetch of the DBL Digtere and Forfattere taxonomy indexes and their linked article pages; parser runs offline from cached HTML unless --fetch is supplied.',
  baseUrl,
  access: { robotsUrl: `${baseUrl}/robots.txt`, robotsObserved: 'Public category and article URLs are allowed for the default user-agent; robots.txt disallows selected administrative/search paths and states that reuse of content requires permission.', reuseTerms: 'DBL articles are marked Begrænset anvendelse; this snapshot stores source observations and short metadata/description fields, not a redistributable full-text corpus.' },
  indexes: categories.map(category => ({ ...category, rawFile: relative(root, join(rawDir, `${category.id}.html`)) })),
  rawCache: [relative(root, join(rawDir, 'robots.txt')), ...categories.map(category => relative(root, join(rawDir, `${category.id}.html`))), relative(root, join(rawDir, 'articles'))],
  parsedSnapshot: 'docs/indsamling/dbl/observations.json',
  records: { observations: observations.length, uniqueArticles: uniqueUrls.length, byCategory: Object.fromEntries(categories.map(category => [category.id, categoryRecords.filter(record => record.category === category.id).length])), parserErrors: observations.filter(record => record.parserStatus !== 'parsed').length },
  parser: 'tools/collect-dbl.js',
  checksums: { indexes: Object.fromEntries(categories.map(category => [category.id, sha256(categoryRecords.filter(record => record.category === category.id).map(record => `${record.sourceUrl}\n${record.sourceName}`).join(''))])) }
};

await writeFile(join(parsedDir, 'observations.json'), `${JSON.stringify({ generatedAt, observations }, null, 2)}\n`);
await writeFile(join(parsedDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest.records));
