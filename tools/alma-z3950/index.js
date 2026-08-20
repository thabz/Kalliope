import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import readline from 'readline';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { DOMParser } from '@xmldom/xmldom';

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(packageDir, '..', '..');

const DEFAULT_CONTEXT_ID = '1o797oc';
const KB_PERMALINK_PREFIX = 'https://soeg.kb.dk/permalink/45KBDK_KGL';
const DEFAULT_CACHE_DIR = path.join(rootDir, '.cache', 'alma-z3950');
const DEFAULT_POETS_FILE = path.join(rootDir, 'public', 'api', 'v1', 'poets.jsonl.gz');
const DEFAULT_WORKS_FILE = path.join(rootDir, 'public', 'api', 'v1', 'works.jsonl.gz');

const BIB1_ATTRIBUTES = {
  TITLE: 1003,
  AUTHOR: 1004,
  PUBLISHER: 1018,
  YEAR: 31,
  ANY: 1016,
};

const toSurname = fullName => {
  const normalized = normalizeText(fullName ?? '');
  if (normalized === '') {
    return '';
  }
  const firstPart = normalized.split(',')[0];
  const parts = firstPart.split(/\s+/).filter(Boolean);
  return parts.length === 0 ? '' : parts[parts.length - 1];
};

const normalizeText = value =>
  (value ?? '')
    .normalize('NFKC')
    .replace(/[’`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('da-DK');

const stableStringify = value =>
  JSON.stringify(
    value,
    (key, nested) => {
      if (Array.isArray(nested)) {
        return nested;
      }
      if (nested == null || typeof nested !== 'object') {
        return nested;
      }
      return Object.keys(nested)
        .sort()
        .reduce((result, nestedKey) => {
          result[nestedKey] = nested[nestedKey];
          return result;
        }, {});
    },
    0,
  );

const canonicalizeQuery = query => ({
  title: normalizeText(query?.title),
  author: normalizeText(query?.author),
  year: normalizeText(query?.year).slice(0, 4),
  publisher: normalizeText(query?.publisher),
});

const buildQuerySignature = query =>
  crypto
    .createHash('sha1')
    .update(stableStringify(canonicalizeQuery(query)))
    .digest('hex');

const buildBib1Query = ({
  title = '',
  author = '',
  publisher = '',
  year = '',
}) => {
  const digitalClause = `@attr 1=${BIB1_ATTRIBUTES.ANY} "digitalisering"`;
  const titleClause = `@attr 1=${BIB1_ATTRIBUTES.TITLE} "${normalizeText(title).replace(/\"/g, '\\"')}"`;
  const authorClause = normalizeText(author) === '' ? '' : `@attr 1=${BIB1_ATTRIBUTES.AUTHOR} "${normalizeText(author).replace(/\"/g, '\\"')}"`;
  const publisherClause = publisher.trim() === '' ? '' : `@attr 1=${BIB1_ATTRIBUTES.PUBLISHER} "${normalizeText(publisher).replace(/\"/g, '\\"')}"`;
  const yearClause = year.trim() === '' ? '' : `@attr 1=${BIB1_ATTRIBUTES.YEAR} "${normalizeText(year).replace(/\"/g, '\\"')}"`;
  const clauses = [
    digitalClause,
    titleClause,
    authorClause,
    yearClause,
    publisherClause,
  ].filter(Boolean);
  if (clauses.length === 1) {
    return clauses[0];
  }
  return clauses.reduce((acc, clause) => `@and ${acc} ${clause}`);
};

const readJson = filename => {
  if (fs.existsSync(filename) !== true) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
};

const ensureDir = filename => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
};

const getElementsByTagNameLoose = (node, name) => {
  if (node == null || typeof node.getElementsByTagName !== 'function') {
    return [];
  }
  const result = [];
  const all = node.getElementsByTagName('*');
  for (let i = 0; i < all.length; i += 1) {
    if (all[i].localName === name) {
      result.push(all[i]);
    }
  }
  return result;
};

const getAttribute = (node, name) => {
  const value = node?.getAttribute?.(name);
  return value == null ? '' : value.trim();
};

const getSubfields = node => {
  const subfields = [];
  const elements = getElementsByTagNameLoose(node, 'subfield');
  for (const element of elements) {
    subfields.push({
      code: getAttribute(element, 'code'),
      value: (element.textContent ?? '').trim(),
    });
  }
  return subfields;
};

const groupByTag = (recordNode, tag) =>
  getElementsByTagNameLoose(recordNode, 'datafield')
    .filter(field => getAttribute(field, 'tag') === tag);

const firstControlField = (recordNode, tag) => {
  const controlFields = getElementsByTagNameLoose(recordNode, 'controlfield');
  const match = controlFields.find(field => getAttribute(field, 'tag') === tag);
  return match == null ? null : (match.textContent ?? '').trim();
};

const collectFieldText = (field, ...codes) => {
  const values = [];
  const subfields = getSubfields(field);
  const selectedCodes = codes.length === 0 ? subfields.map(s => s.code) : codes;
  for (const subfield of subfields) {
    if (selectedCodes.includes(subfield.code)) {
      values.push(subfield.value);
    }
  }
  return values;
};

const collectDeliveryHints = recordNode => {
  const hints = [];
  const fields = [
    ...groupByTag(recordNode, '949'),
    ...groupByTag(recordNode, '950'),
    ...groupByTag(recordNode, '980'),
    ...groupByTag(recordNode, '999'),
  ];
  for (const field of fields) {
    for (const subfield of getSubfields(field)) {
      hints.push({
        tag: getAttribute(field, 'tag'),
        code: subfield.code,
        value: subfield.value,
      });
    }
  }
  return hints;
};

const collectOnlineLinks = recordNode => {
  const links = [];
  const fields = groupByTag(recordNode, '856');
  for (const field of fields) {
    for (const value of collectFieldText(field, 'u').map(value => value.trim()).filter(Boolean)) {
      if (value !== '') {
        links.push(value);
      }
    }
  }
  return [...new Set(links)];
};

const collectOnlineLinkLabels = recordNode => {
  const labels = [];
  const fields = groupByTag(recordNode, '856');
  for (const field of fields) {
    for (const subfield of getSubfields(field)) {
      if (subfield.code !== 'y' && subfield.code !== 'z') {
        continue;
      }
      const value = subfield.value.trim();
      if (value !== '') {
        labels.push(value);
      }
    }
  }
  return labels;
};

const parseMarcField = recordNode => {
  const titleField = groupByTag(recordNode, '245')[0];
  const publisherField =
    groupByTag(recordNode, '260')[0] ?? groupByTag(recordNode, '264')[0] ?? null;
  const descriptionField = groupByTag(recordNode, '500')[0] ?? null;
  const authorField = groupByTag(recordNode, '100')[0] ?? groupByTag(recordNode, '700')[0] ?? null;
  const control008 = firstControlField(recordNode, '008') ?? '';
  const title = [
    ...(titleField == null ? [] : collectFieldText(titleField, 'a')),
    ...(titleField == null ? [] : collectFieldText(titleField, 'b')),
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const publisher =
    publisherField == null ? '' : collectFieldText(publisherField, 'b').join(' ').trim();
  const publicationYears = [
    ...((publisherField == null ? [] : collectFieldText(publisherField, 'c'))),
  ];
  const publicationYear = publicationYears.join(' ').match(/(\d{4})/)?.[1] ?? '';
  const author = authorField == null ? '' : collectFieldText(authorField, 'a').join(' ').trim();
  const description = descriptionField == null ? '' : collectFieldText(descriptionField, 'a', 'b', 'g').join(' ').trim();
  const leader = (getElementsByTagNameLoose(recordNode, 'leader')[0]?.textContent ?? '').trim();
  const onlineLinks = collectOnlineLinks(recordNode);
  const onlineLinkLabels = collectOnlineLinkLabels(recordNode);
  const hasOnlineSignals =
    onlineLinks.some(link => /\.(pdf|jpg|jpeg|png)($|\?)/i.test(link)) ||
    onlineLinks.some(link => normalizeText(link).includes('elektronisk')) ||
    onlineLinkLabels.some(label => normalizeText(label).includes('elektronisk')) ||
    onlineLinkLabels.some(label => normalizeText(label).includes('vis online'));

  return {
    author,
    title,
    publisher,
    publicationYear,
    description,
    leader,
    control008,
    control001: firstControlField(recordNode, '001') ?? '',
    onlineLinks,
    onlineLinkLabels,
    hasOnlineSignals,
  };
};

const parseMarcXmlRecord = (payload) => {
  const doc = new DOMParser().parseFromString(payload, 'text/xml');
  const record = getElementsByTagNameLoose(doc, 'record')[0];
  if (record == null) {
    throw new Error('MARC-payload indeholder ikke <record>');
  }
  const parsed = parseMarcField(record);
  const deliveryHints = collectDeliveryHints(record);
  const titleField = groupByTag(record, '245')[0] ?? null;
  const publisherField = groupByTag(record, '260')[0] ?? groupByTag(record, '264')[0] ?? null;
  const rawDelivery = deliveryHints
    .map(item => `${item.tag}#${item.code}: ${item.value}`)
    .filter(Boolean);
  const controlSignals = deliveryHints
    .map(item => normalizeText(item.value));
  const isAlmaE = controlSignals.some(value => value.includes('alma-e'));
  const hasAlmaESignal = controlSignals.some(value => value.includes('alma-e'));
  const hasDigitalMarker = controlSignals.some(
    value => value.includes('digital') || value.includes('elektronisk'),
  );
  return {
    ...parsed,
    isAlmaE,
    isAlmaESignal: hasAlmaESignal,
    hasDigitalMarker,
    hasOnlineSignals: parsed.hasOnlineSignals,
    onlineLinks: parsed.onlineLinks,
    onlineLinkLabels: parsed.onlineLinkLabels,
    rawRecordXml: payload,
    rawFields: {
      leader: parsed.leader,
      control001: parsed.control001,
      control008: parsed.control008,
      authorFieldRaw: collectFieldText(
        groupByTag(record, '100')[0] ?? groupByTag(record, '700')[0] ?? {},
        'a',
      ),
      descriptionFieldRaw: collectFieldText(groupByTag(record, '500')[0] ?? {}, 'a', 'b', 'g'),
      deliveryHints,
      rawDelivery,
      onlineLinks: parsed.onlineLinks,
      onlineLinkLabels: parsed.onlineLinkLabels,
      rawQuerySignals: {
        almaE: hasAlmaESignal,
        digitalSignal: hasDigitalMarker,
        onlineLinks: parsed.onlineLinks.slice(0, 8),
        onlineLinkLabels: parsed.onlineLinkLabels.slice(0, 8),
      },
      titleFieldRaw: collectFieldText(titleField || {}, 'a', 'b', 'c'),
      publisherFieldRaw: (publisherField == null ? [] : getSubfields(publisherField))
        .map(field => `${field.code}:${field.value}`),
    },
  };
};

const derivePermalink = (record, contextId = DEFAULT_CONTEXT_ID) => {
  if (record.control001 == null || record.control001 === '') {
    return null;
  }
  const base = record.control001.startsWith('alma')
    ? record.control001
    : `alma${record.control001}`;
  return `${KB_PERMALINK_PREFIX}/${contextId}/${base}`;
};

const evaluateIdentitySignals = (profile, record) => {
  const targetSurname = toSurname(profile?.poetName ?? '');
  const recordSurname = toSurname(record?.author ?? '');
  const hasSurname = targetSurname !== '' && recordSurname !== '';
  const hasSurnameMatch = hasSurname && targetSurname === recordSurname;
  const hasSurnameConflict = targetSurname !== '' && recordSurname !== '' && hasSurnameMatch === false;
  return {
    targetSurname,
    recordSurname,
    hasSurnameMatch,
    hasSurnameConflict,
    hasSurname: hasSurname,
  };
};

const verifyOnlineAccess = (record, contextId = DEFAULT_CONTEXT_ID) => {
  const expectedPermalink = derivePermalink(record, contextId);
  const normalizedLinks = (record.onlineLinks ?? []).map(value => normalizeText(value));
  const hasPermalinkLink = normalizedLinks.some(value =>
    value.includes('soeg.kb.dk/permalink/45kbdk_kgl') && (contextId == null || value.includes(contextId)),
  );
  const hasVisOnlineSignal = (record.onlineLinkLabels ?? [])
    .map(value => normalizeText(value))
    .some(value => value.includes('vis online') || value.includes('elektronisk udgave'));
  if (expectedPermalink == null) {
    return {
      status: 'needs-review',
      reason: 'missing-record-id',
      expectedPermalink: null,
      source: 'marc',
    };
  }
  if (hasPermalinkLink && hasVisOnlineSignal && (record.isAlmaE || record.hasOnlineSignals)) {
    return {
      status: 'verified',
      reason: 'marc-permalink-and-vis-online',
      expectedPermalink,
      source: 'marc',
      pnx: null,
    };
  }
  if (record.isAlmaE || record.hasOnlineSignals || hasPermalinkLink || hasVisOnlineSignal) {
    return {
      status: 'needs-review',
      reason: 'online-evidence-incomplete',
      expectedPermalink,
      source: 'marc',
      pnx: null,
    };
  }
  return {
    status: 'missing',
    reason: 'no-online-evidence',
    expectedPermalink,
    source: 'marc',
    pnx: null,
  };
};

const extractPdfUrls = onlineLinks =>
  [...new Set((onlineLinks ?? []).filter(link => {
    try {
      const url = new URL(link);
      return /\.pdf(?:$|[?#])/i.test(url.href);
    } catch {
      return false;
    }
  }))];

const buildSearchProfile = input => ({
  poetId: input?.poetId ?? '',
  poetName: input?.poetName ?? '',
  workId: input?.workId ?? '',
  workUrl: input?.workUrl ?? '',
  title: input?.title ?? '',
  year: input?.year ?? '',
  publisher: '',
  sourceFile: input?.sourceFile ?? null,
});

const buildSearchContext = profile => ({
  title: profile.title,
  author: profile.poetName,
  year: profile.year,
  publisher: profile.publisher,
  pqf: buildBib1Query({
    title: profile.title,
    author: toSurname(profile.poetName),
    publisher: profile.publisher,
    year: profile.year,
  }),
  hash: buildQuerySignature({
    title: profile.title,
    author: profile.poetName,
    year: profile.year,
    publisher: profile.publisher,
  }),
});

const evaluateMatch = (profile, record) => {
  const identity = evaluateIdentitySignals(profile, record);
  const targetNormalized = normalizeText(profile.title);
  const recordNormalized = normalizeText(record.title);
  const targetHasTitle = targetNormalized !== '';
  const hasTitleMatch =
    targetHasTitle &&
    (recordNormalized.includes(targetNormalized) ||
      targetNormalized.includes(recordNormalized) ||
      targetNormalized.startsWith(recordNormalized) ||
      recordNormalized.startsWith(targetNormalized));
  const hasYearMatch =
    profile.year !== '' &&
    (profile.year === record.publicationYear ||
      normalizeText(record.publicationYear) === normalizeText(profile.year));
  const hasPublisherMatch =
    record.publisher !== '' && profile.publisher !== ''
      ? normalizeText(record.publisher).includes(normalizeText(profile.publisher)) ||
        normalizeText(profile.publisher).includes(normalizeText(record.publisher))
      : false;
  const hasDescMatch =
    record.description !== ''
      ?
        [normalizeText(record.description)].some(value =>
          value.includes(targetNormalized) ||
          (profile.year !== '' && value.includes(normalizeText(profile.year)))
        )
      : false;
  if (targetHasTitle === false) {
    return {
      status: 'no-match',
      confidence: 'none',
      evidence: ['title-missing'],
      notes: 'Automatisk match kræver en kendt titel.',
      identity,
    };
  }

  const hasNameOnly =
    normalizeText(profile.poetName) !== '' &&
    identity.hasSurnameMatch === false &&
    normalizeText(record.author) !== '';
  const hasStrongSignals = hasTitleMatch &&
    (record.isAlmaE || record.hasOnlineSignals) &&
    (hasYearMatch || hasPublisherMatch || hasDescMatch);
  const verification = verifyOnlineAccess(record);

  if (targetHasTitle === false) {
    return {
      status: 'no-match',
      confidence: 'none',
      evidence: ['title-missing'],
      notes: 'Automatisk match kræver en kendt titel.',
      identity,
      verification,
    };
  }

  if (
    hasTitleMatch &&
    identity.hasSurnameMatch &&
    hasStrongSignals &&
    verification.status === 'verified'
  ) {
    return {
      status: 'strong-match',
      confidence: 'high',
      evidence: ['title-match', 'digitized-signals', 'query-context', 'author-surname-match', `online-verification:${verification.status}`],
      notes: 'Titel matcher, forfatternavn og online-verifikation er valideret.',
      identity,
      verification,
    };
  }

  if (hasTitleMatch && (record.isAlmaE || record.hasOnlineSignals)) {
    const evidence = [
      'title-match',
      ...(record.isAlmaE ? ['alma-record-type'] : ['online-link']),
      ...(hasYearMatch ? ['year-match'] : hasPublisherMatch ? ['publisher-match'] : hasDescMatch ? ['description-hint'] : []),
      ...(identity.hasSurnameMatch ? ['author-surname-match'] : []),
      ...(identity.hasSurnameConflict ? ['author-surname-conflict'] : []),
      ...(identity.hasSurname === false ? ['author-surname-missing'] : []),
      `online-verification:${verification.status}`,
      `verification-reason:${verification.reason}`,
    ];
    if (hasNameOnly || identity.hasSurnameConflict) {
      evidence.push('name-only-blocked');
      return {
        status: 'needs-review',
        confidence: 'medium',
        evidence,
        notes: 'Titel stemmer overens, men forfatternavn matcher ikke sikkert.',
        identity,
        verification,
      };
    }
    if (identity.hasSurnameMatch === false) {
      evidence.push('author-surname-missing');
      return {
        status: 'needs-review',
        confidence: 'low',
        evidence,
        notes: 'Titel stemmer overens, men efternavn kan ikke valideres mod posten.',
        identity,
        verification,
      };
    }
    return {
      status: 'needs-review',
      confidence: 'medium',
      evidence,
      notes: 'Titel stemmer overens, men identiteten mangler et af de stærke signaler.',
      identity,
      verification,
    };
  }

  return {
    status: 'no-match',
    confidence: 'low',
    evidence: [
      ...(hasTitleMatch ? ['title-match-only'] : ['title-no-match']),
      ...((record.isAlmaE || record.hasOnlineSignals) ? [] : ['no-alma-or-online-signals']),
    ],
    notes: 'Ingen stærk match med digitaliserings- og indholdsfelter.',
    identity,
    verification,
  };
};

const buildCandidates = (profile, records, contextId = DEFAULT_CONTEXT_ID) =>
  records
    .map(record => {
      const matched = evaluateMatch(profile, record);
      return {
      ...matched,
      title: record.title,
      publicationYear: record.publicationYear,
      publisher: record.publisher,
      description: record.description,
      isAlmaE: record.isAlmaE,
      hasOnlineSignals: record.hasOnlineSignals,
      onlineLinks: record.onlineLinks,
      pdfUrls: extractPdfUrls(record.onlineLinks),
      onlineLinkLabels: record.onlineLinkLabels,
      verification: matched.verification ?? verifyOnlineAccess(record, contextId),
      queryHit: {
        recordId: record.control001,
        facsimileId: record.control001 == null ? null : (record.control001.startsWith('alma') ? record.control001 : `alma${record.control001}`),
        permalink: derivePermalink(record, contextId),
        verification: matched.verification ?? verifyOnlineAccess(record, contextId),
      },
      provenance: {
        source: 'z3950-marc',
        rawFields: record.rawFields,
        rawRecordXml: record.rawRecordXml,
      },
      };
    })
    .sort((left, right) => {
      const score = ({ confidence }) =>
        confidence === 'high' ? 3 : confidence === 'medium' ? 2 : 1;
      const diff = score(right) - score(left);
      if (diff !== 0) {
        return diff;
      }
      if (left.hasOnlineSignals === true && right.hasOnlineSignals === false) {
        return -1;
      }
      if (left.hasOnlineSignals === false && right.hasOnlineSignals === true) {
        return 1;
      }
      return 0;
    });

const readJsonlGzip = async function* (filename) {
  if (fs.existsSync(filename) !== true) {
    throw new Error(`Korpusfilen findes ikke: ${filename}`);
  }
  const input = fs.createReadStream(filename);
  const gzip = zlib.createGunzip();
  const lines = readline.createInterface({ input: input.pipe(gzip), crlfDelay: Infinity });
  for await (const line of lines) {
    if (line.trim() !== '') {
      yield JSON.parse(line);
    }
  }
};

const loadSearchProfiles = async ({
  poetId = null,
  all = false,
  poetsFile = DEFAULT_POETS_FILE,
  worksFile = DEFAULT_WORKS_FILE,
} = {}) => {
  const hasPoetId = poetId != null && poetId !== '';
  if ((hasPoetId && all === true) || (hasPoetId === false && all === false)) {
    throw new Error('Angiv præcis én af --poet-id eller --all.');
  }

  const poets = new Map();
  for await (const poet of readJsonlGzip(poetsFile)) {
    if (poet.type === 'poet' && (all === true || poet.id === poetId)) {
      poets.set(poet.id, poet);
    }
  }
  if (hasPoetId && poets.has(poetId) === false) {
    throw new Error(`Ingen digter med poet-id ${poetId} i korpusdatasættet.`);
  }

  const profiles = [];
  for await (const work of readJsonlGzip(worksFile)) {
    const poet = poets.get(work.poet_id);
    if (poet == null || work.type !== 'poetry' || typeof work.title !== 'string' || work.title.trim() === '') {
      continue;
    }
    profiles.push(buildSearchProfile({
      poetId: poet.id,
      poetName: poet.name,
      workId: work.id,
      workUrl: work.canonical_url,
      title: work.title,
      year: work.year ?? work.published ?? '',
      sourceFile: 'public/api/v1/works.jsonl.gz',
    }));
  }
  if (hasPoetId && profiles.length === 0) {
    throw new Error(`Digteren ${poetId} har ingen søgbare digtværker i korpusdatasættet.`);
  }
  return profiles;
};

const writeCacheFile = async (cacheDir, queryHash, payload) => {
  const filename = path.join(cacheDir, `${queryHash}.json`);
  ensureDir(filename);
  await fs.promises.writeFile(filename, JSON.stringify(payload, null, 2));
};

const loadCacheFile = async (cacheDir, queryHash) => {
  const filename = path.join(cacheDir, `${queryHash}.json`);
  if (fs.existsSync(filename) !== true) {
    return null;
  }
  return JSON.parse(await fs.promises.readFile(filename, 'utf8'));
};

const normalizeHitRecords = payload => {
  const records = payload.records ?? payload.recordsXML ?? payload;
  if (Array.isArray(records) === false) {
    return [];
  }
  return records.filter(value => typeof value === 'string');
};

const isUnavailableSearchError = error =>
  error?.code === 'ETIMEDOUT' ||
  error?.code === 'ECONNREFUSED' ||
  error?.code === 'ENETUNREACH' ||
  `${error?.message ?? ''}`.toLocaleLowerCase('da-DK').includes('timede ud');

const runDiscovery = async ({
  profiles,
  cacheDir = DEFAULT_CACHE_DIR,
  forceReload = false,
  contextId = DEFAULT_CONTEXT_ID,
  z3950Search,
  log = null,
}) => {
  if (typeof z3950Search !== 'function') {
    throw new Error('Kan ikke udføre online søgning: Z39.50-klient mangler.');
  }
  const results = [];
  let upstreamUnavailable = null;

  for (const [index, profile] of profiles.entries()) {
    const query = buildSearchContext(profile);
    let recordsXML = [];

    const writeLog = message => {
      if (typeof log === 'function') {
        log(message);
      }
    };
    writeLog(`Søgning ${index + 1}/${profiles.length}: ${profile.poetName} — ${profile.title} (${profile.year || 'ukendt år'})`);
    writeLog(`PQF: ${query.pqf}`);

    const cacheKey = query.hash;
    const cached = forceReload !== true ? await loadCacheFile(cacheDir, cacheKey) : null;
    if (cached != null) {
      writeLog(`Cache-hit: ${cacheKey}`);
    }
    let payload = cached;
    let error = null;
    if (payload == null) {
      if (upstreamUnavailable != null) {
        error = new Error(`Søgning ikke forsøgt: Alma/Z39.50 er utilgængelig (${upstreamUnavailable.message}).`);
        error.code = 'SKIPPED_UPSTREAM_FAILURE';
        writeLog(`Sprunget over: ${error.message}`);
      } else {
        try {
          payload = await z3950Search(query);
          if (payload == null) {
            throw new Error(`Z39.50-søgning returnerede tom payload for ${query.hash}`);
          }
          await writeCacheFile(cacheDir, cacheKey, payload);
        } catch (caughtError) {
          error = caughtError;
          if (isUnavailableSearchError(caughtError)) {
            upstreamUnavailable = caughtError;
          }
          writeLog(`Fejl: ${caughtError.message}`);
        }
      }
    }
    recordsXML = error == null ? normalizeHitRecords(payload) : [];
    writeLog(`MARC-hits: ${recordsXML.length}`);

    const parsed = recordsXML.map(parseMarcXmlRecord);
    const candidates = buildCandidates(profile, parsed, contextId);
    const best = candidates[0] ?? null;
    results.push({
      profile,
      query,
      candidates,
      best,
      error: error == null ? null : { message: error.message, code: error.code ?? null },
    });
  }

  return {
    profiles: profiles.length,
    discoveries: results,
    summary: {
      totalProfiles: results.length,
      totalCandidates: results.reduce((acc, item) => acc + item.candidates.length, 0),
      strongMatches: results.filter(item => item.best?.status === 'strong-match').length,
      review: results.filter(item => item.best?.status === 'needs-review').length,
      noMatch: results.filter(item => item.best == null || item.best.status === 'no-match').length,
      errors: results.filter(item => item.error != null).length,
    },
    producedAt: new Date().toISOString(),
  };
};

const formatReport = ({ summary, discoveries }) => {
  const lines = [
    '# KB-facsimile discovery via Alma/Z39.50',
    `Genereret: ${new Date().toISOString()}`,
    '',
    '## Samlet',
    `- Undersøgte værker: ${summary.totalProfiles}`,
    `- Kandidathits fundet: ${summary.totalCandidates}`,
    `- Stærke match: ${summary.strongMatches}`,
    `- Manuelle gennemgange: ${summary.review}`,
    `- Ingen match: ${summary.noMatch}`,
    `- Søgefejl: ${summary.errors}`,
    '',
    '## Fund',
    ...discoveries.map(item => {
      const status = item.best?.status ?? 'no-match';
      const matchType = item.best?.confidence ?? 'none';
      const profile = item.profile;
      const permalink = item.best?.queryHit?.permalink ?? 'ikke fundet';
      const pdfUrls = item.best?.pdfUrls ?? [];
      const error = item.error?.message == null ? '' : ` Søgefejl: ${item.error.message}`;
      return [
        `- ${profile.poetName}: *${profile.title}* (${profile.year || 'ukendt år'}) — ${status}/${matchType}. ${permalink}${error}`,
        ...pdfUrls.map(url => `  - PDF: ${url}`),
      ].join('\n');
    }),
    '',
    '## Matchregler',
    '- Ingen automatisk match på forfatternavn alene.',
    '- Stærke signaler kræver Alma-E eller elektroniklink og titeloverensstemmelse.',
    '- Alle kandidater indeholder rå MARC-felter under `provenance.rawFields`.',
  ];
  return lines.join('\n');
};

const writeMachineOutput = async (filename, discoveries) => {
  const payload = discoveries.discoveries.map(discovery => ({
    poetId: discovery.profile.poetId,
    work: {
      id: discovery.profile.workId,
      url: discovery.profile.workUrl,
      title: discovery.profile.title,
      year: discovery.profile.year,
      poetName: discovery.profile.poetName,
      sourceFile: discovery.profile.sourceFile,
    },
    query: discovery.query,
    summary: {
      status: discovery.best?.status ?? 'no-match',
      confidence: discovery.best?.confidence ?? 'none',
      error: discovery.error,
    },
    best: discovery.best?.queryHit ? {
      ...discovery.best,
      provenance: discovery.best.provenance ?? null,
    } : null,
    candidates: discovery.candidates.map(candidate => ({
      title: candidate.title,
      publicationYear: candidate.publicationYear,
      publisher: candidate.publisher,
      status: candidate.status,
      confidence: candidate.confidence,
      verification: candidate.verification ?? null,
      evidence: candidate.evidence,
      isAlmaE: candidate.isAlmaE,
      hasOnlineSignals: candidate.hasOnlineSignals,
      pdfUrls: candidate.pdfUrls,
      queryHit: candidate.queryHit,
      provenance: candidate.provenance ?? null,
    })),
  }));
  ensureDir(filename);
  await fs.promises.writeFile(filename, `${payload.map(item => JSON.stringify(item)).join('\n')}\n`);
};

const loadJsonFile = (filename) => {
  const data = readJson(filename);
  if (data == null) {
    throw new Error(`Kunne ikke indlæse JSON fra ${filename}`);
  }
  return data;
};

export {
  DEFAULT_CONTEXT_ID,
  DEFAULT_CACHE_DIR,
  DEFAULT_POETS_FILE,
  DEFAULT_WORKS_FILE,
  KB_PERMALINK_PREFIX,
  buildBib1Query,
  buildSearchContext,
  buildSearchProfile,
  buildCandidates,
  buildQuerySignature,
  collectOnlineLinks,
  derivePermalink,
  evaluateMatch,
  extractPdfUrls,
  formatReport,
  loadCacheFile,
  loadJsonFile,
  loadSearchProfiles,
  parseMarcXmlRecord,
  runDiscovery,
  writeMachineOutput,
};
