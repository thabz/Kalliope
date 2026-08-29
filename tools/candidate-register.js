import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadXMLDoc, getChildByTagName, safeGetAttr, safeGetText } from './build-static/xml.js';
import { auditWorks, renderWorkAudit } from './dfl-work-audit.js';
import { auditAuthors, parseDflAuthorPage, renderAuthorAudit } from './dfl-author-audit.js';
import { renderResolution, resolveDflAuthors } from './dfl-author-resolution.js';
import { buildReviewQueue, renderReviewQueue } from './dfl-review-queue.js';
import { mapLimit } from './build-static/concurrency.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const collectionDir = path.join(rootDir, 'tools', 'data', 'indsamling');
const outputDir = path.join(collectionDir, 'register');
const reportFile = path.join(rootDir, 'docs', 'indsamling', 'rapporter', 'danish-poet-candidates.md');
const dflIndexUrl = 'https://danskforfatterleksikon.dk/1850/sk1850forf.htm';
const dflTitleIndexUrl = 'https://danskforfatterleksikon.dk/1850/sk1850titel.htm';
const wikidataEndpoint = 'https://query.wikidata.org/sparql';

const normalizeName = value =>
  (value ?? '')
    .normalize('NFKC')
    .replace(/[’'.,;:!?()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('da-DK');

const yearFromDate = value => {
  const match = String(value ?? '').match(/(\d{4})/);
  return match == null ? null : match[1];
};

const parseName = person => {
  const name = getChildByTagName(person, 'name');
  const firstname = safeGetText(name, 'firstname');
  const lastname = safeGetText(name, 'lastname');
  const fullname = safeGetText(name, 'fullname') ?? [firstname, lastname].filter(Boolean).join(' ');
  return {
    preferred: fullname,
    firstname,
    lastname,
    fullname,
    alternatives: [safeGetText(name, 'pseudonym'), safeGetText(name, 'realname')].filter(Boolean),
  };
};

const parseKalliope = () => {
  const records = [];
  fs.readdirSync(path.join(rootDir, 'fdirs'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .forEach(entry => {
      const id = entry.name;
      const sourceFile = `fdirs/${id}/info.xml`;
      const doc = loadXMLDoc(path.join(rootDir, sourceFile));
      const person = getChildByTagName(doc, 'person');
      if (person == null || safeGetAttr(person, 'type') !== 'poet') return;
      const name = parseName(person);
      const period = getChildByTagName(person, 'period');
      const born = getChildByTagName(getChildByTagName(period, 'born'), 'date');
      const dead = getChildByTagName(getChildByTagName(period, 'dead'), 'date');
      const identifiersNode = getChildByTagName(person, 'identifiers');
      const identifiers = {};
      if (identifiersNode != null) {
        for (let i = 0; i < identifiersNode.childNodes.length; i += 1) {
          const child = identifiersNode.childNodes[i];
          if (child.nodeType === 1 && child.textContent.trim() !== '') identifiers[child.tagName] = child.textContent.trim();
        }
      }
      const works = (safeGetText(person, 'works') ?? '').split(',').map(value => value.trim()).filter(Boolean);
      records.push({
        source: 'kalliope', sourceId: id, sourceUrl: sourceFile, sourceFile,
        name, normalizedName: normalizeName(name.preferred),
        birthDate: safeGetText(born), deathDate: safeGetText(dead),
        birthYear: yearFromDate(safeGetText(born)), deathYear: yearFromDate(safeGetText(dead)),
        language: safeGetAttr(person, 'lang'), country: safeGetAttr(person, 'country'),
        identifiers, works,
        evidence: { poetry: fs.existsSync(path.join(rootDir, 'fdirs', id, 'bibliography-primary.xml')) || works.length > 0, language: safeGetAttr(person, 'lang') === 'da' },
      });
    });
  return records;
};

const fetchText = async (url, headers = {}) => {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${url} svarede HTTP ${response.status}`);
  return response.text();
};

const parseDfl = html => {
  const records = [];
  const linkPattern = /<a\s+href="([^"]+\.htm)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkPattern.exec(html)) != null) {
    const label = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (label === '' || /^(se|tilbage|forside)$/i.test(label)) continue;
    const sourceUrl = new URL(match[1], dflIndexUrl).href;
    const dateMatch = label.match(/\((?:f\.\s*)?(\d{4})(?:-(\d{4}))?\)/);
    const preferred = label.replace(/\s*\((?:f\.\s*)?\d{4}(?:-\d{4})?\)\s*$/, '').replace(/^.*?\sse:\s*/i, '').trim();
    records.push({
      source: 'danskforfatterleksikon', sourceId: path.basename(new URL(sourceUrl).pathname, '.htm'), sourceUrl,
      name: { preferred, firstname: null, lastname: null, fullname: preferred, alternatives: [] },
      normalizedName: normalizeName(preferred), birthDate: null, deathDate: null,
      birthYear: dateMatch?.[1] ?? null, deathYear: dateMatch?.[2] ?? null,
      language: 'da', country: 'dk', identifiers: {}, works: [],
      evidence: { poetry: true, language: true, note: 'DFL forfatter/bidragsyder til skønlitteratur og/eller dramatik' },
    });
  }
  return records;
};

const decodeHtml = value => value
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>');

const htmlToLines = html => {
  const withLinks = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => ` [[${href}|${label.replace(/<[^>]+>/g, ' ')}]] `)
    .replace(/<(?:br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decodeHtml(withLinks).split(/\r?\n/)
    .map(line => line.replace(/\s+/g, ' ').trim()).filter(line => line !== '');
};

const linkValue = value => {
  const match = value.match(/\[\[([^|]+)\|([^\]]+)\]\]/);
  return match == null ? null : { href: match[1], label: match[2].trim() };
};

const dflSourceId = href => path.basename(new URL(href, dflTitleIndexUrl).pathname, '.htm');

const parseDflTitles = (html, sourceUrl) => {
  const records = [];
  let current = null;
  const pushCurrent = () => { if (current != null) records.push(current); };
  htmlToLines(html).forEach(line => {
    const titleMatch = line.match(/^(?:\[\d{4}\]\s*)?(.+?)\s*,\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)(?:\s+.*)?$/);
    if (titleMatch != null) {
      pushCurrent();
      const [, title, year, type, language] = titleMatch;
      current = {
        source: 'danskforfatterleksikon', sourceUrl,
        sourceId: `${path.basename(sourceUrl, '.htm')}:${records.length + 1}`,
        title: title.replace(/^\[[^\]]+\]\s*/, '').trim(), year: year.trim(),
        type: type.trim().toLocaleLowerCase('da-DK'), language: language.trim().toLocaleLowerCase('da-DK'),
        authors: [], originalValue: line,
      };
      return;
    }
    if (current == null) return;
    const authorMatch = line.match(/^(af|digte af|oversat af)\s+(.+)$/i);
    if (authorMatch != null) {
      const roleLabel = authorMatch[1].toLocaleLowerCase('da-DK');
      const link = linkValue(authorMatch[2]);
      const label = link?.label ?? authorMatch[2].trim();
      current.authors.push({
        role: roleLabel === 'oversat af'
          ? 'translator'
          : roleLabel === 'digte af'
            ? 'poet'
            : 'author',
        name: label, sourceId: link == null ? null : dflSourceId(link.href),
        sourceUrl: link == null ? null : new URL(link.href, sourceUrl).href,
      });
    }
  });
  pushCurrent();
  return records;
};

const extractDflTitleUrls = html => [...html.matchAll(/href="([^"]*sk1850tit[^"#]*\.htm)"/gi)]
  .map(match => new URL(match[1], dflTitleIndexUrl).href)
  .filter((url, index, urls) => urls.indexOf(url) === index);

const extractDflAuthorIndexUrls = html => [...html.matchAll(/href="([^"]*sk1850forf[^"#]*\.htm)"/gi)]
  .map(match => new URL(match[1], dflIndexUrl).href)
  .filter((url, index, urls) => urls.indexOf(url) === index);

const parseDanishAuthorIds = html => [...html.matchAll(
  /<div\s+class="authorelement">[\s\S]*?<a\s+href="([^"]+\.htm)"/gi
)].map(match => dflSourceId(match[1]));

const matchWorkAuthors = (works, kalliope) => works.map(work => ({
  ...work,
  authors: work.authors.map(author => {
    const exactId = kalliope.filter(candidate => candidate.identifiers?.['danskforfatterleksikon-dk'] === author.sourceId);
    const nameMatches = kalliope.filter(candidate => [candidate.normalizedName, ...(candidate.name?.alternatives ?? []).map(normalizeName)].includes(normalizeName(author.name)));
    const matches = exactId.length > 0 ? exactId : nameMatches;
    const match = exactId.length === 1 ? { status: 'already-in-kalliope', confidence: 'certain', reason: 'dfl-id', kalliopeId: exactId[0].sourceId } : matches.length === 1 ? { status: 'needs-review', confidence: 'possible', reason: 'name-or-alternative-name', candidates: matches.map(candidate => candidate.sourceId) } : matches.length > 1 ? { status: 'needs-review', confidence: 'possible', reason: 'ambiguous-name', candidates: matches.map(candidate => candidate.sourceId) } : { status: 'unmatched', confidence: 'none', reason: 'no-id-or-name-match' };
    return { ...author, match };
  }),
}));

const selectDflPoetryRelations = works => works
  .filter(work => work.type === 'digte')
  .map(work => ({
    ...work,
    authors: work.authors.filter(author =>
      work.language === 'dansk'
        ? author.role === 'author' || author.role === 'poet'
        : author.role === 'translator'
    ),
  }))
  .filter(work => work.authors.length > 0);

const wikidataQuery = `SELECT ?person ?personLabel ?alias ?birth ?death ?language ?dflId ?viaf WHERE {
  ?person wdt:P31 wd:Q5;
    wdt:P106/wdt:P279* wd:Q49757.
  OPTIONAL { ?person wdt:P1412 ?language. }
  OPTIONAL { ?person wdt:P569 ?birth. }
  OPTIONAL { ?person wdt:P570 ?death. }
  OPTIONAL { ?person wdt:P12386 ?dflId. }
  OPTIONAL { ?person wdt:P214 ?viaf. }
  OPTIONAL { ?person skos:altLabel ?alias. FILTER(LANG(?alias) = "da") }
  FILTER(!BOUND(?language) || ?language = wd:Q9035)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "da,en". }
} LIMIT 500`;

const parseWikidata = json => (json.results?.bindings ?? []).map(binding => {
  const preferred = binding.personLabel?.value ?? '';
  const sourceId = binding.person.value.split('/').pop();
  return {
    source: 'wikidata', sourceId, sourceUrl: binding.person.value,
    name: { preferred, firstname: null, lastname: null, fullname: preferred, alternatives: binding.alias?.value ? [binding.alias.value] : [] },
    normalizedName: normalizeName(preferred),
    birthDate: binding.birth?.value?.slice(0, 10) ?? null, deathDate: binding.death?.value?.slice(0, 10) ?? null,
    birthYear: yearFromDate(binding.birth?.value), deathYear: yearFromDate(binding.death?.value),
    language: 'da', country: null, identifiers: { wikidata: sourceId, ...(binding.dflId?.value == null ? {} : { 'danskforfatterleksikon-dk': binding.dflId.value }), ...(binding.viaf?.value == null ? {} : { viaf: binding.viaf.value }) }, works: [],
    evidence: { poetry: true, language: true, note: 'occupation poet or subclass' },
  };
});

const matchRecord = (record, kalliope) => {
  const byExternalId = kalliope.filter(candidate => Object.entries(record.identifiers ?? {}).some(([key, value]) => value != null && candidate.identifiers[key] === value));
  if (byExternalId.length === 1) return { status: 'already-in-kalliope', confidence: 'certain', kalliopeId: byExternalId[0].sourceId };
  const byNameAndDates = kalliope.filter(candidate => candidate.normalizedName === record.normalizedName && record.birthYear != null && record.deathYear != null && candidate.birthYear === record.birthYear && candidate.deathYear === record.deathYear);
  if (byNameAndDates.length === 1) return { status: 'already-in-kalliope', confidence: 'likely', kalliopeId: byNameAndDates[0].sourceId };
  const byName = kalliope.filter(candidate => candidate.normalizedName === record.normalizedName);
  if (byName.length > 0) return { status: 'needs-review', confidence: 'possible', candidates: byName.map(candidate => candidate.sourceId) };
  return { status: record.evidence.poetry && record.evidence.language ? 'likely-eligible' : 'needs-review', confidence: 'none' };
};

const mergeCandidates = (records, kalliope) => records.map(record => ({ ...record, match: matchRecord(record, kalliope), decision: record.source === 'kalliope' ? 'already-in-kalliope' : 'needs-review' }));

const countBy = (items, key) => Object.fromEntries([...new Set(items.map(item => item[key]))].map(value => [value, items.filter(item => item[key] === value).length]));

const renderReport = ({ records, works, kalliope, fetchedAt, sources }) => {
  const newRecords = records.filter(record => record.match.status !== 'already-in-kalliope');
  const reviewRecords = records.filter(record => record.match.status === 'needs-review');
  return `# Kandidatregister: første bølge\n\nGenereret: ${fetchedAt}\n\n## Kørsel\n\nKilder: ${sources.join(', ')}. Dette er et genereret arbejdsregister; ingen poster er importeret til Kalliope.\n\n## Tal\n\n- Kalliope-personer: ${kalliope.length}\n- Kildeposter i registeret: ${records.length}\n- Poster efter kilde: ${JSON.stringify(countBy(records, 'source'))}\n- DFL-værkposter: ${works.length}\n- DFL-værkposter klassificeret som dansk digtning: ${works.filter(work => work.type === 'digte' && work.language === 'dansk').length}\n- Nye eller ikke matchede poster: ${newRecords.length}\n- Manuel vurdering: ${reviewRecords.length}\n- Poster med ukendt dødsår: ${records.filter(record => record.deathYear == null).length}\n- Sikkert eksisterende Kalliope-match: ${records.filter(record => record.match.confidence === 'certain').length}\n\n## Manuel vurderingskø\n\n| Kilde | Navn | Kilde-id | Matchstatus | Begrundelse |\n| --- | --- | --- | --- | --- |\n${reviewRecords.slice(0, 200).map(record => `| ${record.source} | ${record.name.preferred.replaceAll('|', '\\|')} | ${record.sourceId} | ${record.match.status} | ${record.evidence.note ?? 'navn/datoer kræver redaktionel vurdering'} |`).join('\n')}\n\n## Begrænsninger\n\n- Wikidata-resultatet er et øjebliksbillede fra Query Service og kræver snapshot/versionering for dækningsmålinger.\n- DFL-værkregisteret dækker bibliografiske poster, ikke digitaliserede tekster.\n- DFL-forfatterlisten dokumenterer litteraturbidrag, men ikke automatisk, at hver person har skrevet et dansk digt.\n- Navn alene fusionerer aldrig poster.\n- Værker og forfatterrelationer er arbejdsdata; de skal redaktionelt vurderes før import.\n`;
};

const run = async ({ offline = false, limit = 500, authorPageLimit = 100 } = {}) => {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.dirname(reportFile), { recursive: true });
  const kalliope = parseKalliope();
  const dflRawDir = path.join(collectionDir, 'dfl', 'raw');
  const dflCache = path.join(dflRawDir, 'dfl-index.html');
  const dflTitleIndexCache = path.join(dflRawDir, 'dfl-title-index.html');
  const dflTitleDir = path.join(dflRawDir, 'titles');
  const dflAuthorIndexDir = path.join(dflRawDir, 'author-index');
  const wikidataRawDir = path.join(collectionDir, 'wikidata', 'raw');
  const wikidataCache = path.join(wikidataRawDir, 'wikidata.json');
  fs.mkdirSync(dflRawDir, { recursive: true });
  fs.mkdirSync(wikidataRawDir, { recursive: true });
  let dflHtml;
  let dflTitleIndexHtml;
  let dflTitleUrls;
  let dflAuthorIndexUrls;
  let wikidataJson;
  if (offline) {
    dflHtml = fs.readFileSync(dflCache, 'utf8');
    dflTitleIndexHtml = fs.readFileSync(dflTitleIndexCache, 'utf8');
    dflTitleUrls = extractDflTitleUrls(dflTitleIndexHtml);
    dflAuthorIndexUrls = extractDflAuthorIndexUrls(dflHtml);
    wikidataJson = JSON.parse(fs.readFileSync(wikidataCache, 'utf8'));
  } else {
    dflHtml = await fetchText(dflIndexUrl, { 'User-Agent': 'Kalliope candidate register (issue 1450)' });
    dflTitleIndexHtml = await fetchText(dflTitleIndexUrl, { 'User-Agent': 'Kalliope candidate register (issue 1450)' });
    dflTitleUrls = extractDflTitleUrls(dflTitleIndexHtml);
    dflAuthorIndexUrls = extractDflAuthorIndexUrls(dflHtml);
    if (dflTitleUrls.length === 0) throw new Error('DFL titelindekset indeholder ingen alfabetfiler');
    const response = await fetch(`${wikidataEndpoint}?query=${encodeURIComponent(wikidataQuery.replace('LIMIT 500', `LIMIT ${limit}`))}&format=json`, { headers: { Accept: 'application/sparql-results+json', 'User-Agent': 'Kalliope candidate register (issue 1450)' } });
    if (!response.ok) throw new Error(`Wikidata svarede HTTP ${response.status}`);
    wikidataJson = await response.json();
    fs.writeFileSync(dflCache, dflHtml);
    fs.writeFileSync(dflTitleIndexCache, dflTitleIndexHtml);
    fs.writeFileSync(wikidataCache, JSON.stringify(wikidataJson, null, 2) + '\n');
  }
  const dfl = parseDfl(dflHtml);
  fs.mkdirSync(dflTitleDir, { recursive: true });
  fs.mkdirSync(dflAuthorIndexDir, { recursive: true });
  const dflAuthorIndexPages = await mapLimit(dflAuthorIndexUrls, async url => {
    const cacheFile = path.join(dflAuthorIndexDir, path.basename(new URL(url).pathname));
    if (offline) {
      return fs.readFileSync(cacheFile, 'utf8');
    }
    const html = await fetchText(url, {
      'User-Agent': 'Kalliope candidate register (Danish author-language audit)',
    });
    fs.writeFileSync(cacheFile, html);
    return html;
  });
  const danishAuthorIds = new Set(
    dflAuthorIndexPages.flatMap(parseDanishAuthorIds)
  );
  const dflWorks = [];
  for (const url of dflTitleUrls) {
    const cacheFile = path.join(dflTitleDir, path.basename(new URL(url).pathname));
    const html = offline ? fs.readFileSync(cacheFile, 'utf8') : await fetchText(url, { 'User-Agent': 'Kalliope candidate register (issue 1450)' });
    if (!offline) fs.writeFileSync(cacheFile, html);
    dflWorks.push(...parseDflTitles(html, url));
  }
  const wikidata = parseWikidata(wikidataJson);
  const records = mergeCandidates([...kalliope, ...dfl, ...wikidata], kalliope);
  const works = selectDflPoetryRelations(
    matchWorkAuthors(dflWorks, kalliope)
  );
  const workAudit = auditWorks(works);
  const authorAudit = auditAuthors(works);
  const authorPageDir = path.join(dflRawDir, 'authors');
  fs.mkdirSync(authorPageDir, { recursive: true });
  const authorsToAudit = authorAudit.records
    .filter(
      record =>
        record.status === 'unmatched' && record.sourceUrls.length > 0
    )
    .slice(0, authorPageLimit);
  const authorPageAudit = await mapLimit(authorsToAudit, async author => {
    const sourceUrl = author.sourceUrls[0].replace(
      '/1850/',
      author.sourceId?.startsWith('u') === true ? '/1850u/' : '/1850bib/'
    );
    const cacheFile = path.join(authorPageDir, `${author.sourceId}.html`);
    try {
      let html;
      if (fs.existsSync(cacheFile)) {
        html = fs.readFileSync(cacheFile, 'utf8');
      } else if (offline) {
        throw new Error('ikke cachet');
      } else {
        await new Promise(resolve => setTimeout(resolve, 120));
        html = await fetchText(sourceUrl, { 'User-Agent': 'Kalliope candidate register (issue 1452)' });
        fs.writeFileSync(cacheFile, html);
      }
      return {
        key: author.key,
        sourceId: author.sourceId,
        workCount: author.workCount,
        ...parseDflAuthorPage(html, sourceUrl),
      };
    } catch (error) {
      return {
        key: author.key,
        sourceId: author.sourceId,
        workCount: author.workCount,
        sourceUrl,
        pageStatus: offline ? 'not-cached' : 'fetch-error',
        error: error.message,
      };
    }
  });
  const authorResolution = resolveDflAuthors({
    authorAudit,
    authorPageAudit,
    kalliope,
    wikidata: parseWikidata(wikidataJson),
    danishAuthorIds,
  });
  const decisionFile = path.join(outputDir, 'manual-decisions.json');
  const decisions = JSON.parse(fs.readFileSync(decisionFile, 'utf8')).decisions;
  const reviewQueue = buildReviewQueue(authorResolution, decisions, 100);
  const result = { generatedAt: new Date().toISOString(), sources: ['kalliope', 'danskforfatterleksikon', 'wikidata'], records, works };
  fs.writeFileSync(path.join(outputDir, 'candidates.json'), JSON.stringify(result, null, 2) + '\n');
  fs.writeFileSync(path.join(outputDir, 'works.json'), JSON.stringify({ generatedAt: result.generatedAt, works }, null, 2) + '\n');
  fs.writeFileSync(path.join(outputDir, 'work-audit.json'), JSON.stringify({ generatedAt: result.generatedAt, ...workAudit }, null, 2) + '\n');
  fs.writeFileSync(path.join(outputDir, 'author-audit.json'), JSON.stringify({ generatedAt: result.generatedAt, ...authorAudit }, null, 2) + '\n');
  fs.writeFileSync(path.join(outputDir, 'author-page-audit.json'), JSON.stringify({ generatedAt: result.generatedAt, limit: authorPageLimit, records: authorPageAudit }, null, 2) + '\n');
  fs.writeFileSync(path.join(outputDir, 'author-resolution.json'), JSON.stringify({ generatedAt: result.generatedAt, ...authorResolution }, null, 2) + '\n');
  fs.writeFileSync(path.join(outputDir, 'review-queue.json'), JSON.stringify({ generatedAt: result.generatedAt, ...reviewQueue }, null, 2) + '\n');
  fs.writeFileSync(path.join(rootDir, 'docs', 'indsamling', 'dfl', 'rapporter', 'work-audit.md'), renderWorkAudit(workAudit));
  fs.writeFileSync(path.join(rootDir, 'docs', 'indsamling', 'dfl', 'rapporter', 'author-audit.md'), `${renderAuthorAudit(authorAudit)}\n\n## Personopslagsberigelse\n\n- Berigede umatchede kandidater: ${authorPageAudit.length}\n- Opslag med fødsels-/dødsår: ${authorPageAudit.filter(record => record.pageStatus === 'life-dates-found').length}\n- Placeholder-/rolleposter: ${authorPageAudit.filter(record => record.pageStatus === 'non-person-placeholder').length}\n- Opslag uden fundne livsdata: ${authorPageAudit.filter(record => record.pageStatus === 'no-life-dates-found').length}\n- Ikke cachet eller utilgængeligt: ${authorPageAudit.filter(record => record.pageStatus === 'not-cached' || record.pageStatus === 'fetch-error').length}\n`);
  fs.writeFileSync(path.join(rootDir, 'docs', 'indsamling', 'dfl', 'rapporter', 'author-resolution.md'), renderResolution(authorResolution));
  fs.writeFileSync(path.join(rootDir, 'docs', 'indsamling', 'dfl', 'rapporter', 'manual-review-queue.md'), renderReviewQueue(reviewQueue));
  fs.writeFileSync(reportFile, renderReport({ records, works, kalliope, fetchedAt: result.generatedAt, sources: result.sources }));
  console.log(`Kalliope: ${kalliope.length}; DFL persons: ${dfl.length}; DFL title files: ${dflTitleUrls.length}; DFL relevant poetry works: ${works.length}; Wikidata: ${wikidata.length}; register: ${records.length}; matched authors: ${workAudit.counts.matchedAuthors}; unmatched authors: ${workAudit.counts.unmatchedAuthors}; review: ${workAudit.counts.manualReview}; possible duplicates: ${workAudit.counts.possibleDuplicates}; unique DFL authors: ${authorAudit.counts.uniqueAuthors}; author matched: ${authorAudit.counts.matched}; author possible: ${authorAudit.counts.possible}; author unmatched: ${authorAudit.counts.unmatched}`);
  return result;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fetchSources = process.argv.includes('--fetch');
  const offline = fetchSources !== true;
  run({ offline, authorPageLimit: process.argv.includes('--all-author-pages') ? Number.POSITIVE_INFINITY : 100 }).catch(error => { console.error(error.message); process.exitCode = 1; });
}

export {
  extractDflAuthorIndexUrls,
  extractDflTitleUrls,
  matchRecord,
  mergeCandidates,
  normalizeName,
  parseDanishAuthorIds,
  parseDfl,
  parseDflTitles,
  parseWikidata,
  selectDflPoetryRelations,
  yearFromDate,
};
