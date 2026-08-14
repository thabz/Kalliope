import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import * as Paths from '../../common/paths.js';
import { loadExternalIdentifiers } from './external-identifiers.js';
import { poetName } from './formatting.js';

const DATASET_VERSION = 'v1';
const SCHEMA_VERSION = '1.1.0';
const SITE_URL = 'https://kalliope.org';
const OUTPUT_DIRECTORY = `public/api/${DATASET_VERSION}`;
const LEGACY_SQLITE_FILES = [
  'public/api/kalliope.sqlite',
  `${OUTPUT_DIRECTORY}/kalliope.sqlite`,
];

const sortById = (records) => records.sort((left, right) =>
  left.id.localeCompare(right.id, 'en')
);

const compactObject = (record) => Object.fromEntries(
  Object.entries(record).filter(([, value]) => value != null)
);

const normalizeLine = (line) => {
  if (typeof line === 'string') {
    return line;
  }
  if (line != null && typeof line.source === 'string') {
    return line.source;
  }
  return '';
};

const normalizedFullText = (text) => {
  const parts = [text.title, text.firstline]
    .filter(value => value != null)
    .map(value => String(value).replace(/\s+/g, ' ').trim())
    .filter(value => value.length > 0);
  (text.blocks ?? []).forEach((block) => {
    (block.lines ?? []).forEach((line) => {
      const value = normalizeLine(line).replace(/\s+/g, ' ').trim();
      if (value.length > 0) {
        parts.push(value);
      }
    });
  });
  return parts.join('\n');
};

const jsonLines = (records) => `${records.map(record => JSON.stringify(record)).join('\n')}\n`;

const writeGzipJsonLines = (filename, records) => {
  const content = jsonLines(records);
  const compressed = deterministicGzip(content);
  fs.writeFileSync(filename, compressed);
};

const deterministicGzip = (content) => zlib.gzipSync(content, {
  level: 9,
  mtime: 0,
});

const checksum = (filename) => crypto
  .createHash('sha256')
  .update(fs.readFileSync(filename))
  .digest('hex');

const fileDescriptor = (filename, recordType = null) => {
  const absolutePath = path.join(OUTPUT_DIRECTORY, filename);
  return compactObject({
    name: filename,
    url: `${SITE_URL}/api/${DATASET_VERSION}/${filename}`,
    media_type: filename.endsWith('.gz')
      ? 'application/x-ndjson+gzip'
      : filename.endsWith('.md')
        ? 'text/markdown'
        : 'application/json',
    bytes: fs.statSync(absolutePath).size,
    sha256: checksum(absolutePath),
    record_type: recordType,
  });
};

const schema = {
  '$schema': 'https://json-schema.org/draft/2020-12/schema',
  '$id': `${SITE_URL}/api/v1/schema.json`,
  title: 'Kalliope corpus dataset v1',
  type: 'object',
  '$defs': {
    poet: {
      type: 'object',
      required: ['id', 'name', 'country', 'lang', 'type', 'canonical_url'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        country: { type: 'string' },
        lang: { type: 'string' },
        type: { type: 'string' },
        born: { type: ['object', 'null'] },
        dead: { type: ['object', 'null'] },
        canonical_url: { type: 'string', format: 'uri' },
        identifiers: { type: 'object' },
      },
      additionalProperties: true,
    },
    work: {
      type: 'object',
      required: ['id', 'local_id', 'poet_id', 'title', 'canonical_url'],
      properties: {
        id: { type: 'string' },
        local_id: { type: 'string' },
        poet_id: { type: 'string' },
        title: { type: 'string' },
        canonical_url: { type: 'string', format: 'uri' },
      },
      additionalProperties: true,
    },
    text: {
      type: 'object',
      required: ['id', 'poet_id', 'work_id', 'canonical_url', 'api_url', 'full_text'],
      properties: {
        id: { type: 'string' },
        poet_id: { type: 'string' },
        work_id: { type: 'string' },
        canonical_url: { type: 'string', format: 'uri' },
        api_url: { type: 'string', format: 'uri' },
        full_text: { type: 'string' },
        firstline: { type: 'string' },
        events: {
          type: 'array',
          items: {
            type: 'object',
            required: ['type', 'date'],
            properties: {
              type: { enum: ['written', 'performed', 'event'] },
              date: { type: 'string' },
            },
            additionalProperties: false,
          },
        },
        has_footnotes: { type: 'boolean' },
        footnotes_count: { type: 'integer', minimum: 0 },
        source_pages: { type: 'string' },
      },
      additionalProperties: true,
    },
  },
  oneOf: [
    { '$ref': '#/$defs/poet' },
    { '$ref': '#/$defs/work' },
    { '$ref': '#/$defs/text' },
  ],
};

const readme = `# Kalliope corpus dataset v1

This directory is the stable, versioned download interface for Kalliope's
published corpus. Start with \`manifest.json\`; \`/api/manifest.json\` discovers
the current dataset version.

## Stable identifiers and relations

\`poets.jsonl.gz\` has one poet record per line, keyed by \`id\`.
\`works.jsonl.gz\` has one work record per line, keyed by the global \`id\`
(\`poet_id/local_id\`). \`texts.jsonl.gz\` has one indexable text per line,
keyed by \`id\`. A text's \`poet_id\` and \`work_id\` reference those files.
These IDs, relation fields, canonical URLs, and direct API URLs are the v1
public contract. Other fields may be added compatibly.

## Existing JSON resources

The bulk files complement the existing static JSON API:

- \`/api/{poet_id}.json\` contains poet metadata.
- \`/api/{poet_id}/works.json\` contains the poet and their works.
- \`/api/{poet_id}/{local_id}-toc.json\` contains a work's table of contents.
- \`/api/{poet_id}/texts.json\` contains title and first-line registers.
- \`/api/texts/{hash-prefix}/{id}.json\` contains a complete rendered text,
  source metadata, references, variants, notes, and relations. The public
  \`api_url\` field supplies this URL, so the hash path is not a client contract.
- \`/api/{poet_id}/mentions.json\` contains references and translations
  associated with a poet.

Except for the versioned dataset contract described here, these resources are
existing application endpoints and may gain or change presentation fields.

The canonical pages are \`https://kalliope.org/da/works/{poet_id}\`,
\`https://kalliope.org/da/work/{poet_id}/{local_id}\`, and
\`https://kalliope.org/da/text/{id}\`. Each text record's \`api_url\` points to
its complete existing JSON representation; clients must use the supplied URL
instead of reproducing Kalliope's internal hash function.

## Examples

Join one text to its work and poet by ID:

\`\`\`sh
gzip -dc texts.jsonl.gz | jq -c 'select(.id == "aarestrup1838010201")'
gzip -dc works.jsonl.gz | jq -c 'select(.id == "aarestrup/1838")'
gzip -dc poets.jsonl.gz | jq -c 'select(.id == "aarestrup")'
\`\`\`

Stream all text records without unpacking the file first:

\`\`\`sh
gzip -dc texts.jsonl.gz | while IFS= read -r record; do printf '%s\\n' "$record"; done
\`\`\`

Search normalized full text while streaming the compressed file:

\`\`\`sh
gzip -dc texts.jsonl.gz | jq -c 'select(.full_text | contains("hav"))'
\`\`\`

## Versioning, selection, and reuse

The major URL version changes for incompatible schema changes. Additive fields
may appear within v1. Records are sorted by ID and gzip output is deterministic
for identical source data; \`built_at\` is explicit build metadata. Texts are
the indexable canonical placements in Kalliope. Publication-only placements are
available through their existing API representation but are excluded from the
bulk text selection. Some metadata can be absent because the source XML does
not provide it.

Kalliope's software is GPL-2.0. The corpus consists mainly of public-domain
texts, but source, editorial, image, and third-party rights can vary. Preserve
attribution and source information, and assess reuse rights for each use. The
dataset is provided without warranty.
`;

const buildPoetRecords = (collected) => sortById(
  Array.from(collected.poets.values()).map(poet => compactObject({
    id: poet.id,
    name: poetName(poet),
    country: poet.country,
    lang: poet.lang,
    type: poet.type,
    born: poet.period?.born ?? null,
    dead: poet.period?.dead ?? null,
    canonical_url: `${SITE_URL}/da/works/${poet.id}`,
    identifiers: loadExternalIdentifiers(poet.id),
  }))
);

const buildWorkRecords = (collected) => sortById(
  Array.from(collected.works.entries()).map(([id, work]) => {
    const poetId = id.split('/')[0];
    return compactObject({
      id,
      local_id: work.id,
      poet_id: poetId,
      title: work.title,
      type: work.type,
      status: work.status,
      published: work.published,
      year: work.year,
      parent_work_id: work.parent == null ? null : `${poetId}/${work.parent.id}`,
      virtual_type: work.virtualType,
      canonical_url: `${SITE_URL}/da/work/${poetId}/${work.id}`,
    });
  })
);

const buildTextAuditFields = (textMeta, textData, source) => ({
  firstline: textMeta.firstline,
  events: ['written', 'performed', 'event'].flatMap((type) => {
    const date = textMeta.dates?.[type];
    if (typeof date !== 'string' || date.trim().length === 0) {
      return [];
    }
    return [{ type, date: date.trim() }];
  }),
  has_footnotes:
    textData.text?.has_footnotes === true ||
    textData.text?.has_footnotes === 1,
  footnotes_count: textData.text?.footnotes_count ?? 0,
  source_pages: source.pages,
});

const buildTextRecords = (collected) => sortById(
  Array.from(collected.texts.values())
    .filter(text => text.indexable !== false)
    .map(textMeta => {
      const textPath = Paths.textPath(textMeta.id);
      const textData = JSON.parse(fs.readFileSync(textPath, 'utf8'));
      const workId = `${textMeta.poetId}/${textMeta.workId}`;
      const work = collected.works.get(workId);
      const poet = collected.poets.get(textMeta.poetId);
      const source = textData.text?.source ?? {};
      return compactObject({
        id: textMeta.id,
        title: textMeta.title,
        lang: textData.text?.content_lang ?? poet.lang,
        type: textMeta.type,
        poet_id: textMeta.poetId,
        work_id: workId,
        poet_name: poetName(poet),
        work_title: work.title,
        canonical_url: `${SITE_URL}/da/text/${textMeta.id}`,
        api_url: `${SITE_URL}/${textPath.replace(/^public\//, '')}`,
        full_text: normalizedFullText(textData.text ?? {}),
        keywords: textData.text?.keywords ?? [],
        source,
        ...buildTextAuditFields(textMeta, textData, source),
        canonical_text_id: textMeta.canonicalTextId ?? textMeta.id,
        source_poet_id: textMeta.sourcePoetId,
        source_work_id: textMeta.sourceWorkId,
        source_text_id: textMeta.sourceTextId,
        placement: textMeta.placement ?? 'canonical',
      });
    })
);

const validateRelations = (poets, works, texts) => {
  const poetIds = new Set(poets.map(poet => poet.id));
  const workIds = new Set(works.map(work => work.id));
  works.forEach((work) => {
    if (poetIds.has(work.poet_id) === false) {
      throw new Error(`Korpusværket ${work.id} henviser til ukendt digter ${work.poet_id}.`);
    }
  });
  texts.forEach((text) => {
    if (poetIds.has(text.poet_id) === false || workIds.has(text.work_id) === false) {
      throw new Error(`Korpusteksten ${text.id} har en ugyldig digter- eller værkreference.`);
    }
  });
};

const validateRecordShapes = (poets, works, texts) => {
  const requirements = [
    ['poet', poets, schema.$defs.poet.required],
    ['work', works, schema.$defs.work.required],
    ['text', texts, schema.$defs.text.required],
  ];
  requirements.forEach(([recordType, records, requiredFields]) => {
    records.forEach((record) => {
      requiredFields.forEach((field) => {
        if (record[field] == null) {
          throw new Error(`${recordType}-posten ${record.id ?? '?'} mangler feltet ${field}.`);
        }
      });
    });
  });
};

const buildCorpusDataset = (collected, { builtAt = new Date().toISOString() } = {}) => {
  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  LEGACY_SQLITE_FILES.forEach((filename) => {
    fs.rmSync(filename, { force: true });
  });

  const poets = buildPoetRecords(collected);
  const works = buildWorkRecords(collected);
  const texts = buildTextRecords(collected);
  validateRelations(poets, works, texts);
  validateRecordShapes(poets, works, texts);

  writeGzipJsonLines(`${OUTPUT_DIRECTORY}/poets.jsonl.gz`, poets);
  writeGzipJsonLines(`${OUTPUT_DIRECTORY}/works.jsonl.gz`, works);
  writeGzipJsonLines(`${OUTPUT_DIRECTORY}/texts.jsonl.gz`, texts);
  fs.writeFileSync(`${OUTPUT_DIRECTORY}/schema.json`, `${JSON.stringify(schema, null, 2)}\n`);
  fs.writeFileSync(`${OUTPUT_DIRECTORY}/README.md`, readme);

  const files = [
    fileDescriptor('poets.jsonl.gz', 'poet'),
    fileDescriptor('works.jsonl.gz', 'work'),
    fileDescriptor('texts.jsonl.gz', 'text'),
    fileDescriptor('schema.json'),
    fileDescriptor('README.md'),
  ];
  const manifest = {
    dataset: 'kalliope-corpus',
    dataset_version: DATASET_VERSION,
    schema_version: SCHEMA_VERSION,
    built_at: builtAt,
    counts: { poets: poets.length, works: works.length, texts: texts.length },
    relations: {
      'work.poet_id': 'poet.id',
      'text.poet_id': 'poet.id',
      'text.work_id': 'work.id',
      'text.canonical_text_id': 'text.id when the canonical placement is published',
    },
    license: {
      software: 'GPL-2.0',
      corpus: 'Rights vary; see README.md and each record\'s source metadata.',
    },
    files,
  };
  fs.writeFileSync(`${OUTPUT_DIRECTORY}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync('public/api/manifest.json', `${JSON.stringify({
    current_version: DATASET_VERSION,
    manifest_url: `${SITE_URL}/api/${DATASET_VERSION}/manifest.json`,
  }, null, 2)}\n`);
  return manifest;
};

export {
  buildCorpusDataset,
  buildPoetRecords,
  buildTextAuditFields,
  buildTextRecords,
  buildWorkRecords,
  deterministicGzip,
  jsonLines,
  normalizedFullText,
  validateRelations,
  validateRecordShapes,
};
