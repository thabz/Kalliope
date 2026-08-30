import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultPoetsFile = path.join(
  rootDir,
  'tools',
  'data',
  'indsamling',
  'register',
  'digtere.jsonl'
);
const defaultWorksFile = path.join(
  rootDir,
  'tools',
  'data',
  'indsamling',
  'register',
  'vaerker.jsonl'
);
const defaultRawDir = path.join(rootDir, 'tools', 'data', 'indsamling', 'dfl', 'raw');
const dflBaseUrl = 'https://danskforfatterleksikon.dk/1850/';
const dflIndexUrl = `${dflBaseUrl}sk1850forf.htm`;
const dflTitleIndexUrl = `${dflBaseUrl}sk1850titel.htm`;

const reservations = new Map([
  ['REdithRode', { status: 'in-progress', kalliope: { id: 'rodee', issue: 1065, availableFromYear: 2027 } }],
  ['LPaullaCour', { status: 'in-progress', kalliope: { id: 'lacour', issue: 1066, availableFromYear: 2027 } }],
  ['JJohannesJoergensen', { status: 'in-progress', kalliope: { id: 'joergensenj', issue: 1002, availableFromYear: 2027 } }],
]);

const htmlEntities = new Map(Object.entries({
  Aacute: 'Á', Eacute: 'É', Oacute: 'Ó', THORN: 'Þ',
  aacute: 'á', acirc: 'â', agrave: 'à', auml: 'ä', ccedil: 'ç',
  eacute: 'é', egrave: 'è', eth: 'ð', euml: 'ë', iacute: 'í',
  laquo: '«', oacute: 'ó', ouml: 'ö', raquo: '»', szlig: 'ß',
  uacute: 'ú', uuml: 'ü', yacute: 'ý',
}));

const decodeHtml = value => value
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&aelig;/gi, 'æ')
  .replace(/&oslash;/gi, 'ø')
  .replace(/&aring;/gi, 'å')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
  .replace(/&#x([0-9a-f]+);/gi, (_, number) => String.fromCodePoint(Number.parseInt(number, 16)))
  .replace(/&([a-z]+);/gi, (entity, name) => htmlEntities.get(name) ?? entity);

const normalizeText = value => String(value ?? '')
  .normalize('NFKC')
  .replace(/\s+/g, ' ')
  .trim();

const slugify = value => normalizeText(value)
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('da-DK')
  .replaceAll('æ', 'ae')
  .replaceAll('ø', 'oe')
  .replaceAll('å', 'aa')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const shortHash = value => crypto.createHash('sha256').update(value).digest('hex').slice(0, 6);
const isPlaceholderName = value => /^(?:anonym|ukendt|uidentificeret|pseudonym)|oversat af|redigeret af/i.test(normalizeText(value));

const decodeRecord = value => {
  if (Array.isArray(value)) return value.map(decodeRecord);
  if (value == null || typeof value !== 'object') {
    return typeof value === 'string' ? decodeHtml(value) : value;
  }
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, decodeRecord(child)]));
};

const readJsonl = file => {
  if (fs.existsSync(file) === false) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/)
    .filter(line => line.trim() !== '')
    .flatMap(line => {
      try {
        return [decodeRecord(JSON.parse(line))];
      } catch (error) {
        console.warn(`${file}: ignorerer ugyldig JSONL-linje: ${error.message}`);
        return [];
      }
    });
};

const stableObject = value => {
  if (Array.isArray(value)) return value.map(stableObject);
  if (value == null || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map(key => [key, stableObject(value[key])])
  );
};

const jsonl = records => records
  .slice()
  .sort((a, b) => a.id.localeCompare(b.id, 'en'))
  .map(record => JSON.stringify(stableObject(compact(record))))
  .join('\n') + '\n';

const atomicWrite = (file, contents) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, contents);
  fs.renameSync(temporary, file);
};

const htmlToLines = html => {
  const withLinks = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<a\s+[^>]*id="titelnr(\d+)"[^>]*>\s*<\/a>\s*/gi, ' {{title-id:$1}} ')
    .replace(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => ` [[${href}|${label.replace(/<[^>]+>/g, ' ')}]] `)
    .replace(/<(?:br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decodeHtml(withLinks).split(/\r?\n/)
    .map(line => normalizeText(line))
    .filter(line => line !== '');
};

const linkValue = value => {
  const match = value.match(/\[\[([^|]+)\|([^\]]+)\]\]/);
  return match == null ? null : { href: match[1], label: normalizeText(match[2]) };
};

const dflSourceId = href => path.basename(new URL(href, dflTitleIndexUrl).pathname, '.htm');

const parseDflTitles = (html, sourceUrl) => {
  const records = [];
  let current = null;
  const pushCurrent = () => {
    if (current != null) records.push(current);
  };
  htmlToLines(html).forEach(line => {
    const titleNumber = line.match(/\{\{title-id:(\d+)\}\}/)?.[1];
    const cleanLine = normalizeText(line.replace(/\{\{title-id:\d+\}\}/g, ''));
    const titleMatch = cleanLine.match(/^(?:\[\d{4}\]\s*)?(.+?)\s*,\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)(?:\s+.*)?$/);
    if (titleMatch != null) {
      pushCurrent();
      const [, title, year, type, language] = titleMatch;
      current = {
        legacySourceId: `${path.basename(new URL(sourceUrl).pathname, '.htm')}:${records.length + 1}`,
        sourceId: titleNumber == null
          ? `${path.basename(new URL(sourceUrl).pathname, '.htm')}:${shortHash(cleanLine)}`
          : `titelnr${titleNumber}`,
        sourceUrl,
        title: normalizeText(title.replace(/^\[[^\]]+\]\s*/, '')),
        year: normalizeText(year),
        type: normalizeText(type).toLocaleLowerCase('da-DK'),
        language: normalizeText(language).toLocaleLowerCase('da-DK'),
        authors: [],
        originalValue: cleanLine,
      };
      return;
    }
    if (current == null) return;
    const authorMatch = line.match(/^(?:af|digte af|oversat af)\s+(.+)$/i);
    if (authorMatch == null) return;
    const link = linkValue(authorMatch[1]);
    const lower = line.toLocaleLowerCase('da-DK');
    current.authors.push({
      role: lower.startsWith('digte af')
        ? 'poet'
        : lower.startsWith('oversat af')
        ? 'translator'
        : 'author',
      name: link?.label ?? normalizeText(authorMatch[1]),
      sourceId: link == null ? null : dflSourceId(link.href),
      sourceUrl: link == null ? null : new URL(link.href, sourceUrl).href,
    });
  });
  pushCurrent();
  return records;
};

const selectPoetryRelations = works => works
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

const titleFiles = rawDir => {
  const directory = path.join(rawDir, 'titles');
  if (fs.existsSync(directory) === false) return [];
  return fs.readdirSync(directory)
    .filter(file => file.endsWith('.htm') || file.endsWith('.html'))
    .sort()
    .map(file => ({
      file: path.join(directory, file),
      url: new URL(file, dflBaseUrl).href,
    }));
};

const parseCachedWorks = rawDir => selectPoetryRelations(
  titleFiles(rawDir).flatMap(({ file, url }) => parseDflTitles(fs.readFileSync(file, 'utf8'), url))
);

const danishAuthorIds = rawDir => {
  const directory = path.join(rawDir, 'author-index');
  if (fs.existsSync(directory) === false) return new Set();
  return new Set(fs.readdirSync(directory).flatMap(file => {
    const html = fs.readFileSync(path.join(directory, file), 'utf8');
    return [...html.matchAll(
      /<div\s+class="authorelement">[\s\S]*?<a\s+href="([^"]+\.htm)"/gi
    )].map(match => dflSourceId(match[1]));
  }));
};

const parseDflAuthorPage = (rawDir, dflId) => {
  const file = path.join(rawDir, 'authors', `${dflId}.html`);
  if (fs.existsSync(file) === false) return null;
  const html = fs.readFileSync(file, 'utf8');
  const heading = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .map(match => normalizeText(decodeHtml(match[1].replace(/<[^>]+>/g, ' '))))
    .find(value => /\(\d{4}-\d{4}\)/.test(value));
  if (heading == null) return { pageStatus: 'no-life-dates-found' };
  const match = heading.match(/(.{2,160}?)\s*\((\d{4})-(\d{4})\)/);
  if (match == null) return { pageStatus: 'no-life-dates-found' };
  const preferredName = normalizeText(match[1]);
  const placeholder = isPlaceholderName(preferredName);
  return placeholder
    ? { pageStatus: 'non-person-placeholder' }
    : {
        pageStatus: 'life-dates-found',
        preferredName,
        birthDate: match[2],
        deathDate: match[3],
      };
};

const sourceForDfl = dflId => ({
  source: 'danskforfatterleksikon',
  id: dflId,
  url: `${dflBaseUrl.replace('/1850/', dflId.startsWith('u') ? '/1850u/' : '/1850bib/')}${dflId}.htm`,
});

const compact = value => {
  if (Array.isArray(value)) return value.map(compact);
  if (value == null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([, child]) => child != null && child !== '')
    .map(([key, child]) => [key, compact(child)])
    .filter(([, child]) => {
      if (Array.isArray(child)) return child.length > 0;
      if (typeof child === 'object') return Object.keys(child).length > 0;
      return true;
    }));
};

const allocateCandidateId = (name, birthDate, dflId, usedIds) => {
  const base = slugify(name) || 'ukendt-digter';
  const birthYear = String(birthDate ?? '').match(/^\d{4}/)?.[0];
  const candidates = [base, birthYear == null ? null : `${base}-${birthYear}`, `${base}-${shortHash(dflId)}`]
    .filter(value => value != null);
  const id = candidates.find(candidate => usedIds.has(candidate) === false)
    ?? `${base}-${shortHash(`${dflId}:${usedIds.size}`)}`;
  usedIds.add(id);
  return id;
};

const mergeUnique = (left, right, key) => {
  const merged = new Map();
  [...(left ?? []), ...(right ?? [])].forEach(value => merged.set(key(value), value));
  return [...merged.values()].sort((a, b) => key(a).localeCompare(key(b), 'en'));
};

const mergeNonEmpty = (existing, incoming) => {
  if (existing == null || existing === '') return incoming;
  if (incoming == null || incoming === '') return existing;
  if (Array.isArray(existing) && Array.isArray(incoming)) {
    return [...new Set([...existing, ...incoming])];
  }
  if (typeof existing === 'object' && typeof incoming === 'object') {
    const result = { ...existing };
    Object.entries(incoming).forEach(([key, value]) => {
      result[key] = mergeNonEmpty(existing[key], value);
    });
    return result;
  }
  return existing;
};

const workId = (work, usedIds) => {
  const year = String(work.year ?? '').match(/\d{4}/)?.[0] ?? 'uden-aar';
  const base = `${slugify(work.title) || 'vaerk'}-${year}`;
  const id = usedIds.has(base) ? `${base}-${shortHash(work.sourceId)}` : base;
  usedIds.add(id);
  return id;
};

const workObservationKey = (url, value) => `${url ?? ''}:${normalizeText(decodeHtml(value ?? ''))}`;

const normalizedWorkTitle = value => normalizeText(decodeHtml(String(value ?? '').replace(/<[^>]+>/g, ' ')))
  .toLocaleLowerCase('da-DK')
  .replace(/[.,:;!?]+$/g, '');

const normalizedWorkYear = value => String(value ?? '').match(/\d{4}/)?.[0] ?? null;

const existingKalliope = root => {
  const poetsByDflId = new Map();
  const worksByPoetId = new Map();
  fs.readdirSync(path.join(root, 'fdirs'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .forEach(entry => {
      const file = path.join(root, 'fdirs', entry.name, 'info.xml');
      if (fs.existsSync(file) === false) return;
      const xml = fs.readFileSync(file, 'utf8');
      const dflId = xml.match(/<danskforfatterleksikon-dk>([^<]+)<\/danskforfatterleksikon-dk>/)?.[1];
      if (dflId == null) return;
      poetsByDflId.set(dflId, { id: entry.name });
      const works = fs.readdirSync(path.join(root, 'fdirs', entry.name))
        .filter(workFile => workFile.endsWith('.xml') && workFile !== 'info.xml')
        .flatMap(workFile => {
          const workXml = fs.readFileSync(path.join(root, 'fdirs', entry.name, workFile), 'utf8');
          if (/<kalliopework\b/.test(workXml) === false) return [];
          const workId = workXml.match(/<kalliopework\b[^>]*\bid="([^"]+)"/)?.[1];
          const title = workXml.match(/<workhead>[\s\S]*?<title>([\s\S]*?)<\/title>/)?.[1];
          const year = workXml.match(/<workhead>[\s\S]*?<year>([^<]+)<\/year>/)?.[1];
          return workId == null || title == null || year == null ? [] : [{
            poetId: entry.name,
            workId,
            title: normalizedWorkTitle(title),
            year: normalizedWorkYear(year),
          }];
        });
      worksByPoetId.set(entry.name, works);
    });
  return { poetsByDflId, worksByPoetId };
};

const uniqueKalliopeWorkMatch = ({ work, poetIds, poets, worksByPoetId }) => {
  if (poetIds.length !== 1) return null;
  const poet = poets.find(candidate => candidate.id === poetIds[0]);
  const kalliopePoetId = poet?.kalliope?.id;
  if (kalliopePoetId == null) return null;
  const title = normalizedWorkTitle(work.title);
  const year = normalizedWorkYear(work.year);
  if (title === '' || year == null) return null;
  const matches = (worksByPoetId.get(kalliopePoetId) ?? [])
    .filter(candidate => candidate.title === title && candidate.year === year);
  return matches.length === 1
    ? { poet_id: kalliopePoetId, work_id: matches[0].workId }
    : null;
};

const buildRecords = ({ existingPoets, existingWorks, dflWorks, root, rawDir }) => {
  const existingByDflId = new Map(existingPoets.flatMap(record => {
    const id = record.identifiers?.['danskforfatterleksikon-dk'];
    return id == null ? [] : [[id, record]];
  }));
  const existingWorkByDflId = new Map(existingWorks.flatMap(record =>
    (record.sources ?? []).filter(source => source.source === 'danskforfatterleksikon' && source.id != null)
      .map(source => [source.id, record])
  ));
  const existingWorkByObservation = new Map(existingWorks.flatMap(record =>
    (record.sources ?? []).filter(source => source.source === 'danskforfatterleksikon')
      .map(source => [workObservationKey(source.url, source.original_value), record])
  ));
  const namesByDflId = new Map();
  const rolesByDflId = new Map();
  dflWorks.forEach(work => work.authors.forEach(author => {
    if (author.sourceId == null) return;
    const names = namesByDflId.get(author.sourceId) ?? new Set();
    names.add(normalizeText(author.name));
    namesByDflId.set(author.sourceId, names);
    const roles = rolesByDflId.get(author.sourceId) ?? new Set();
    roles.add(author.role);
    rolesByDflId.set(author.sourceId, roles);
  }));
  const kalliope = existingKalliope(root);
  const candidateDflIds = new Set(existingByDflId.keys());
  const originalDanishAuthors = danishAuthorIds(rawDir);
  namesByDflId.forEach((names, dflId) => {
    const roles = rolesByDflId.get(dflId) ?? new Set();
    const eligible = roles.has('translator') ||
      (originalDanishAuthors.has(dflId) && (roles.has('author') || roles.has('poet')));
    const page = parseDflAuthorPage(rawDir, dflId);
    const placeholder = [...names].some(isPlaceholderName) || page?.pageStatus === 'non-person-placeholder';
    if (
      names.size > 0 &&
      eligible &&
      placeholder === false
    ) {
      candidateDflIds.add(dflId);
    }
  });
  const usedPoetIds = new Set(existingPoets.map(record => record.id));
  const poetsByDflId = new Map();
  [...candidateDflIds].sort().forEach(dflId => {
    const existing = existingByDflId.get(dflId);
    const existingKalliopePoet = kalliope.poetsByDflId.get(dflId);
    const dflPage = parseDflAuthorPage(rawDir, dflId);
    const names = [...(namesByDflId.get(dflId) ?? [])];
    const preferred = decodeHtml(existing?.name?.preferred ?? dflPage?.preferredName ?? names[0] ?? dflId);
    const life = compact({ born: { date: dflPage?.birthDate }, dead: { date: dflPage?.deathDate } });
    const preservedId = existing?.id ?? existingKalliopePoet?.id;
    if (preservedId != null) usedPoetIds.add(preservedId);
    const generated = compact({
      id: preservedId ?? allocateCandidateId(preferred, life.born?.date, dflId, usedPoetIds),
      status: 'candidate',
      name: {
        preferred,
        alternatives: names.filter(name => name !== preferred),
      },
      life,
      identifiers: { 'danskforfatterleksikon-dk': dflId },
      sources: [sourceForDfl(dflId)],
    });
    const reserved = reservations.get(dflId) ?? {};
    const merged = mergeNonEmpty(existing, { ...generated, ...reserved });
    delete merged.work_ids;
    if (existingKalliopePoet != null) {
      merged.kalliope = mergeNonEmpty(existing?.kalliope, existingKalliopePoet);
      merged.status = 'included';
    } else {
      merged.status = existing?.status ?? reserved.status ?? generated.status;
    }
    merged.sources = mergeUnique(
      existing?.sources,
      generated.sources,
      source => `${source.source}:${source.id ?? source.url}`
    );
    if (reserved.kalliope != null) merged.kalliope = mergeNonEmpty(existing?.kalliope, reserved.kalliope);
    poetsByDflId.set(dflId, merged);
  });

  const usedWorkIds = new Set(existingWorks.map(record => record.id));
  const works = new Map(existingWorks.map(record => [record.id, record]));
  dflWorks.forEach(work => {
    const poetIds = [...new Set(work.authors.flatMap(author => {
      const poet = poetsByDflId.get(author.sourceId);
      return poet == null ? [] : [poet.id];
    }))].sort();
    if (poetIds.length === 0) return;
    const existing = existingWorkByDflId.get(work.sourceId)
      ?? existingWorkByDflId.get(work.legacySourceId)
      ?? existingWorkByObservation.get(workObservationKey(work.sourceUrl, work.originalValue));
    const id = existing?.id ?? workId(work, usedWorkIds);
    const generated = compact({
      id,
      poet_ids: poetIds,
      title: work.title,
      year: work.year,
      type: 'poetry',
      language: work.language === 'dansk' ? 'da' : work.language,
      sources: [{
        source: 'danskforfatterleksikon',
        id: work.sourceId,
        url: work.sourceUrl,
        original_value: work.originalValue,
      }],
    });
    const merged = mergeNonEmpty(existing, generated);
    merged.poet_ids = [...new Set([...(existing?.poet_ids ?? []), ...poetIds])].sort();
    merged.sources = mergeUnique(
      (existing?.sources ?? []).filter(source => source.source !== 'danskforfatterleksikon'),
      generated.sources,
      source => `${source.source}:${source.id ?? source.url}`
    );
    const automaticKalliopeMatch = uniqueKalliopeWorkMatch({
      work,
      poetIds,
      poets: [...poetsByDflId.values()],
      worksByPoetId: kalliope.worksByPoetId,
    });
    const kalliopeWork = existing?.kalliope ?? automaticKalliopeMatch;
    merged.status = kalliopeWork == null ? existing?.status ?? 'candidate' : 'included';
    if (kalliopeWork != null) merged.kalliope = kalliopeWork;
    works.set(id, merged);
  });
  const currentPoetIds = new Set([...poetsByDflId.values()].map(poet => poet.id));
  works.forEach(work => {
    work.poet_ids = work.poet_ids.filter(poetId => currentPoetIds.has(poetId));
  });
  return { poets: [...poetsByDflId.values()], works: [...works.values()] };
};

const fetchToCache = async (url, file) => {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Kalliope upcoming poets sync' } });
    if (response.ok === false) throw new Error(`HTTP ${response.status}`);
    atomicWrite(file, await response.text());
    return null;
  } catch (error) {
    console.warn(`${url}: ${error.message}; bevarer eksisterende cache`);
    return error;
  }
};

const hrefs = (html, pattern, baseUrl) => [...html.matchAll(pattern)]
  .map(match => new URL(match[1], baseUrl).href)
  .filter((url, index, urls) => urls.indexOf(url) === index);

const fetchMany = async (items, concurrency = 8) => {
  let nextIndex = 0;
  let errors = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      if (await fetchToCache(item.url, item.file) != null) errors += 1;
    }
  });
  await Promise.all(workers);
  return errors;
};

const refreshDflCache = async rawDir => {
  const errors = [];
  const indexFile = path.join(rawDir, 'dfl-index.html');
  const titleIndexFile = path.join(rawDir, 'dfl-title-index.html');
  const indexError = await fetchToCache(dflIndexUrl, indexFile);
  const titleIndexError = await fetchToCache(dflTitleIndexUrl, titleIndexFile);
  if (indexError != null) errors.push(indexError);
  if (titleIndexError != null) errors.push(titleIndexError);
  if (fs.existsSync(indexFile)) {
    const urls = hrefs(fs.readFileSync(indexFile, 'utf8'), /href="([^"]*sk1850forf[^"#]*\.htm)"/gi, dflIndexUrl);
    const count = await fetchMany(urls.map(url => ({
      url,
      file: path.join(rawDir, 'author-index', path.basename(new URL(url).pathname)),
    })));
    errors.push(...Array(count).fill(null));
  }
  if (fs.existsSync(titleIndexFile)) {
    const urls = hrefs(fs.readFileSync(titleIndexFile, 'utf8'), /href="([^"]*sk1850tit[^"#]*\.htm)"/gi, dflTitleIndexUrl);
    const count = await fetchMany(urls.map(url => ({
      url,
      file: path.join(rawDir, 'titles', path.basename(new URL(url).pathname)),
    })));
    errors.push(...Array(count).fill(null));
  }
  if (fs.existsSync(path.join(rawDir, 'titles'))) {
    const authorUrls = parseCachedWorks(rawDir).flatMap(work => work.authors)
      .flatMap(author => author.sourceId == null || author.sourceUrl == null ? [] : [{
        url: author.sourceUrl,
        file: path.join(rawDir, 'authors', `${author.sourceId}.html`),
      }]);
    const unique = [...new Map(authorUrls.map(item => [item.url, item])).values()];
    const count = await fetchMany(unique);
    errors.push(...Array(count).fill(null));
  }
  return errors.length;
};

const syncLiteraryRegisters = async ({
  root = rootDir,
  poetsFile = defaultPoetsFile,
  worksFile = defaultWorksFile,
  rawDir = defaultRawDir,
  fetchSources = false,
} = {}) => {
  const fetchErrors = fetchSources ? await refreshDflCache(rawDir) : 0;
  const existingPoets = readJsonl(poetsFile);
  const existingWorks = readJsonl(worksFile);
  const dflWorks = parseCachedWorks(rawDir);
  const result = buildRecords({ existingPoets, existingWorks, dflWorks, root, rawDir });
  const oldPoets = new Map(existingPoets.map(record => [record.id, JSON.stringify(stableObject(record))]));
  const oldWorks = new Map(existingWorks.map(record => [record.id, JSON.stringify(stableObject(record))]));
  const changedPoets = result.poets.filter(record => oldPoets.get(record.id) !== JSON.stringify(stableObject(record))).length;
  const changedWorks = result.works.filter(record => oldWorks.get(record.id) !== JSON.stringify(stableObject(record))).length;
  atomicWrite(poetsFile, jsonl(result.poets));
  atomicWrite(worksFile, jsonl(result.works));
  return {
    poets: result.poets.length,
    newPoets: result.poets.filter(record => oldPoets.has(record.id) === false).length,
    changedPoets,
    works: result.works.length,
    newWorks: result.works.filter(record => oldWorks.has(record.id) === false).length,
    changedWorks,
    fetchErrors,
  };
};

const isMainModule = process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  syncLiteraryRegisters({ fetchSources: process.argv.includes('--fetch') })
    .then(result => {
      console.log(`Digtere: ${result.poets} (${result.newPoets} nye, ${result.changedPoets} ændret); værker: ${result.works} (${result.newWorks} nye, ${result.changedWorks} ændret); kildefejl: ${result.fetchErrors}`);
    })
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
}

export {
  allocateCandidateId,
  buildRecords,
  jsonl,
  mergeNonEmpty,
  parseDflTitles,
  readJsonl,
  selectPoetryRelations,
  slugify,
  syncLiteraryRegisters,
};
