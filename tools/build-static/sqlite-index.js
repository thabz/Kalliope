import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import * as Paths from '../../common/paths.js';

const SQLITE_INDEX_SCHEMA = `
BEGIN;
DROP TABLE IF EXISTS text_search_index;
DROP TABLE IF EXISTS text_content;
DROP TABLE IF EXISTS picture;
DROP TABLE IF EXISTS source;
DROP TABLE IF EXISTS event;
DROP TABLE IF EXISTS text;
DROP TABLE IF EXISTS work;
DROP TABLE IF EXISTS poet;
CREATE TABLE poet (
  poet_id TEXT PRIMARY KEY,
  country TEXT,
  lang TEXT,
  type TEXT,
  square_portrait TEXT,
  name_firstname TEXT,
  name_lastname TEXT,
  name_fullname TEXT,
  name_pseudonym TEXT,
  name_sortname TEXT,
  born_date TEXT,
  born_place TEXT,
  dead_date TEXT,
  dead_place TEXT,
  has_poems INTEGER,
  has_prose INTEGER,
  has_works INTEGER,
  created_at INTEGER,
  updated_at INTEGER
);
CREATE TABLE work (
  work_id TEXT PRIMARY KEY,
  poet_id TEXT NOT NULL,
  local_id TEXT,
  title TEXT,
  subtitles_json TEXT,
  toctitle TEXT,
  linktitle TEXT,
  breadcrumbtitle TEXT,
  year TEXT,
  status TEXT,
  type TEXT,
  has_content INTEGER,
  published_date_raw TEXT,
  published_date_iso TEXT,
  parent_work_id TEXT,
  is_virtual INTEGER,
  created_at INTEGER,
  updated_at INTEGER
);
CREATE TABLE text (
  text_id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL,
  poet_id TEXT NOT NULL,
  source_poet_id TEXT,
  source_work_id TEXT,
  source_text_id TEXT,
  placement TEXT,
  canonical_text_id TEXT,
  type TEXT,
  title TEXT,
  indextitle TEXT,
  linktitle TEXT,
  firstline TEXT,
  content_lang TEXT,
  text_lang TEXT,
  has_footnotes INTEGER,
  footnotes_count INTEGER,
  indexable INTEGER,
  source_node_in TEXT,
  page_range_text TEXT,
  digital_url TEXT,
  facsimile TEXT,
  facsimile_pages_json TEXT,
  facsimile_page_count INTEGER,
  created_at INTEGER,
  updated_at INTEGER
);
CREATE TABLE source (
  source_id TEXT PRIMARY KEY,
  scope TEXT,
  work_id TEXT,
  text_id TEXT,
  source_key TEXT,
  source_label TEXT,
  pages_text TEXT,
  digital_url TEXT,
  facsimile TEXT,
  facsimile_pages_offset INTEGER,
  facsimile_page_count INTEGER,
  facsimile_pages_json TEXT,
  created_at INTEGER,
  updated_at INTEGER
);
CREATE TABLE event (
  event_id TEXT PRIMARY KEY,
  event_type TEXT,
  text_id TEXT,
  work_id TEXT,
  poet_id TEXT,
  date_raw TEXT,
  date_iso TEXT,
  source_file TEXT,
  source_file_row_hash TEXT,
  created_at INTEGER,
  updated_at INTEGER
);
CREATE TABLE text_content (
  text_id TEXT PRIMARY KEY,
  normalized_text TEXT,
  rendered_html TEXT,
  raw_blocks_json TEXT,
  notes_json TEXT,
  keywords_json TEXT,
  variant_group TEXT,
  created_at INTEGER,
  updated_at INTEGER
);
CREATE TABLE text_search_index (
  text_id TEXT PRIMARY KEY,
  poet_id TEXT,
  poet_name_fulltext TEXT,
  work_id TEXT,
  work_title TEXT,
  text_title TEXT,
  text_firstline TEXT,
  keywords TEXT,
  raw_text TEXT,
  has_footnotes INTEGER,
  source_pages TEXT,
  written_iso TEXT,
  written_raw TEXT,
  printed_iso TEXT,
  printed_raw TEXT,
  performed_iso TEXT,
  performed_raw TEXT,
  event_iso TEXT,
  event_raw TEXT
);
CREATE TABLE picture (
  picture_id TEXT PRIMARY KEY,
  source_file TEXT NOT NULL,
  scope TEXT,
  text_id TEXT,
  has_href INTEGER,
  has_objid INTEGER,
  created_at INTEGER,
  updated_at INTEGER
);
CREATE INDEX idx_text_work_id ON text(work_id);
CREATE INDEX idx_text_poet_id ON text(poet_id);
CREATE INDEX idx_event_text_id ON event(text_id);
CREATE INDEX idx_event_poet_id ON event(poet_id);
CREATE INDEX idx_picture_text_id ON picture(text_id);
CREATE INDEX idx_picture_source_file ON picture(source_file);
`;

const SQL_SOURCE_STATE_FILE = path.resolve('caches/sqlite-index-sources.json');
const SQLITE_PATH = path.resolve('caches/kalliope.sqlite');
const WORK_METADATA_FILENAMES = new Set([
  'info.xml',
  'bio.xml',
  'events.xml',
  'portraits.xml',
  'artwork.xml',
  'notes.xml',
]);
const SOURCE_FILE_RE = /^fdirs\/([^/]+)\/([^/]+)\.xml$/;

const toSqlValue = (value) => {
  if (value == null) {
    return 'NULL';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  const safeValue = String(value)
    .replaceAll("'", "''")
    .replaceAll('\0', '');
  return `'${safeValue}'`;
};

const toSqlJson = (value) => {
  if (value == null) {
    return 'NULL';
  }
  return toSqlValue(JSON.stringify(value));
};

const toSqlInList = (values) => {
  return Array.from(values)
    .map((value) => toSqlValue(value))
    .join(', ');
};

let cachedPictureSourceFiles = null;

const getPictureSourceFiles = () => {
  if (cachedPictureSourceFiles == null) {
    cachedPictureSourceFiles = collectPictureSourceFiles();
  }
  return cachedPictureSourceFiles;
};

const collectPictureSourceFiles = () => {
  const sourceFiles = new Set();

  const addXmlFilesFromDir = (dirName) => {
    if (!fs.existsSync(dirName) || !fs.lstatSync(dirName).isDirectory()) {
      return;
    }
    for (const name of fs.readdirSync(dirName).filter((entry) => entry.endsWith('.xml'))) {
      sourceFiles.add(`${dirName}/${name}`);
    }
  };

  for (const name of fs.readdirSync('content').filter((name) => name.endsWith('.xml'))) {
    sourceFiles.add(`content/${name}`);
  }

  fs
    .readdirSync('content', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .forEach((dir) => {
      addXmlFilesFromDir(`content/${dir.name}`);
    });

  for (const poetDir of fs.readdirSync('fdirs', { withFileTypes: true })) {
    if (!poetDir.isDirectory()) {
      continue;
    }
    addXmlFilesFromDir(`fdirs/${poetDir.name}`);
  }

  return Array.from(sourceFiles).sort();
};

const collectSourceFileState = () => {
  const fileState = {};
  getPictureSourceFiles().forEach((sourceFile) => {
    if (!fs.existsSync(sourceFile)) {
      return;
    }
    fileState[sourceFile] = fs.statSync(sourceFile).mtimeMs;
  });
  return fileState;
};

const loadSourceFileState = () => {
  if (!fs.existsSync(SQL_SOURCE_STATE_FILE)) {
    return null;
  }
  const content = fs.readFileSync(SQL_SOURCE_STATE_FILE, 'utf8');
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const diffSourceFileState = () => {
  const oldState = loadSourceFileState();
  const currentState = collectSourceFileState();
  if (oldState == null) {
    return {
      changedFiles: Object.keys(currentState).sort(),
      currentState,
      hasCompleteHistory: false,
      oldState: null,
    };
  }

  const changedFiles = [];
  const changedSet = new Set();

  for (const [sourceFile, mtime] of Object.entries(currentState)) {
    if (oldState[sourceFile] === undefined || oldState[sourceFile] !== mtime) {
      changedFiles.push(sourceFile);
      changedSet.add(sourceFile);
    }
  }

  for (const sourceFile of Object.keys(oldState)) {
    if (changedSet.has(sourceFile)) {
      continue;
    }
    if (!currentState[sourceFile]) {
      changedFiles.push(sourceFile);
    }
  }

  return {
    changedFiles: changedFiles.sort(),
    currentState,
    hasCompleteHistory: true,
    oldState,
  };
};

const writeSourceFileState = (currentState) => {
  fs.writeFileSync(SQL_SOURCE_STATE_FILE, JSON.stringify(currentState));
};

const splitTextLineIds = (xmlText) => {
  const textRegex =
    /<text\b[^>]*\bid\s*=\s*(['"])([^"']+)\1[^>]*>([\s\S]*?)<\/text>/gi;
  const textIds = [];
  let textMatch;
  while ((textMatch = textRegex.exec(xmlText)) !== null) {
    const textId = (textMatch[2] || '').trim();
    if (textId.length > 0) {
      textIds.push(textId);
    }
  }

  return textIds;
};

const hasPictureAttribute = (pictureTag, attributeName) => {
  const safeAttribute = attributeName.replace(
    /[-/\\^$*+?.()|[\]{}]/g,
    '\\$&',
  );
  const attributeRegex = new RegExp(
    `\\b${safeAttribute}\\s*=\\s*(?:'[^']*'|"[^"]*")`,
    'i',
  );
  return attributeRegex.test(pictureTag) ? 1 : 0;
};

const sourceFileType = (sourceFile) => {
  if (!sourceFile.endsWith('.xml')) {
    return 'unsupported';
  }

  const sourceName = path.basename(sourceFile);
  if (sourceName === 'artwork.xml' || sourceName === 'portraits.xml') {
    return 'picture-only';
  }

  const workMatch = sourceFile.match(SOURCE_FILE_RE);
  if (workMatch && !WORK_METADATA_FILENAMES.has(sourceName)) {
    return 'work-text';
  }

  return 'unsupported';
};

const fileContainsTextEntries = (sourceFile) => {
  const xmlText = fs.readFileSync(sourceFile, 'utf8');
  return splitTextLineIds(xmlText);
};

const collectPictureRowsFromSourceFiles = (sourceFiles) => {
  const pictureRows = [];

  sourceFiles.forEach((sourceFile) => {
    const xmlText = fs.readFileSync(sourceFile, 'utf8');
    const fileName = path.basename(sourceFile);
    const isWorkTextFile = sourceFile.startsWith('fdirs/') &&
      !WORK_METADATA_FILENAMES.has(fileName);
    const rows = collectPictureRowsFromXml(xmlText, sourceFile, isWorkTextFile);
    pictureRows.push(...rows);
  });

  pictureRows.sort((a, b) => a.pictureId.localeCompare(b.pictureId));
  return pictureRows;
};

const pictureScopeForFile = (sourceFile) => {
  const filename = path.basename(sourceFile);
  if (filename === 'events.xml') {
    return sourceFile.includes('fdirs/') ? 'events' : 'content_events';
  }
  if (filename === 'artwork.xml') {
    return sourceFile.includes('fdirs/') ? 'fdir_artwork' : 'content_artwork';
  }
  if (filename === 'portraits.xml') {
    return 'portraits';
  }
  if (filename === 'keywords.xml') {
    return 'keywords';
  }
  return sourceFile.startsWith('fdirs/') ? 'work' : 'content';
};

const collectPictureRowsFromXml = (xmlText, sourceFile, isWorkTextFile) => {
  const rows = [];
  const textPictureOffsets = new Map();

  if (isWorkTextFile) {
    const textRegex =
      /<text\b[^>]*\bid\s*=\s*(['"])([^"']+)\1[^>]*>([\s\S]*?)<\/text>/gi;
    let textMatch;
    while ((textMatch = textRegex.exec(xmlText)) !== null) {
      const textId = (textMatch[2] || '').trim();
      if (textId.length === 0) {
        continue;
      }
      const openingTagEnd = textMatch[0].indexOf('>');
      const bodyOffset = textMatch.index + openingTagEnd + 1;
      const textBody = textMatch[3] || '';
      const pictureInTextRegex = /<picture\b[^>]*>/gi;
      let pictureMatch;
      while ((pictureMatch = pictureInTextRegex.exec(textBody)) !== null) {
        const pictureTag = pictureMatch[0];
        const absoluteOffset = bodyOffset + pictureMatch.index;
        textPictureOffsets.set(absoluteOffset, textId);
        rows.push({
          pictureId: `${sourceFile}#${absoluteOffset}`,
          sourceFile,
          scope: 'text',
          textId,
          hasHref: hasPictureAttribute(pictureTag, 'href'),
          hasObjid: hasPictureAttribute(pictureTag, 'objid'),
        });
      }
    }
  }

  const pictureRegex = /<picture\b[^>]*>/gi;
  let pictureMatch;
  while ((pictureMatch = pictureRegex.exec(xmlText)) !== null) {
    const pictureTag = pictureMatch[0];
    const absoluteOffset = pictureMatch.index;
    if (textPictureOffsets.has(absoluteOffset)) {
      continue;
    }
    rows.push({
      pictureId: `${sourceFile}#${absoluteOffset}`,
      sourceFile,
      scope: pictureScopeForFile(sourceFile),
      textId: null,
      hasHref: hasPictureAttribute(pictureTag, 'href'),
      hasObjid: hasPictureAttribute(pictureTag, 'objid'),
    });
  }

  return rows;
};

const collectPictureRows = () => {
  const sourceFiles = new Set(getPictureSourceFiles());
  return collectPictureRowsFromSourceFiles(Array.from(sourceFiles));
};

const buildTextNameForSearch = (textMeta) => {
  const line1 = textMeta?.title == null ? null : String(textMeta.title).trim();
  const line2 =
    textMeta?.firstline == null ? null : String(textMeta.firstline).trim();
  return [line1, line2].filter((value) => (value || '').length > 0).join('\n');
};

const normalizeTextLines = (value) => {
  const parts = [];
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    parts.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => {
      const part =
        typeof item === 'string'
          ? item
          : item && typeof item.source === 'string'
            ? item.source
            : '';
      if (part.length > 0) {
        parts.push(part);
      }
    });
  } else if (value.title != null) {
    parts.push(value.title);
  }

  return parts
    .join('\n')
    .replaceAll('\r', '')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeText = (textData) => {
  if (textData?.text == null) {
    return '';
  }

  const blocks = [];
  textData.text.blocks?.forEach((block) => {
    block.lines?.forEach((line) => {
      const normalized = normalizeTextLines(line);
      if (normalized.length > 0) {
        blocks.push(normalized);
      }
    });
  });

  const lines = [
    textData.text.title,
    textData.text.firstline,
    textData.text.linktitle,
    ...(textData.text.subtitles || []).map((subtitle) => subtitle.title || subtitle),
    ...(textData.text.suptitles || []).map((subtitle) => subtitle.title || subtitle),
    ...blocks,
    ...(textData.text.keywords || []).map((item) => item?.title || item?.id || item),
    ...(textData.text.notes || []).map(
      (note) => note?.content_html || note?.content || note?.title || note
    ),
    textData.work?.title,
    textData.poet?.name?.fullname,
    textData.text.source?.source,
  ];
  return lines
    .filter((line) => (line || '').length > 0)
    .map((line) => normalizeTextLines(line))
    .join('\n');
};

const renderTextAsHtml = (textData) => {
  if (textData?.text == null) {
    return '';
  }
  const blocks = [];
  textData.text.blocks?.forEach((block) => {
    if (Array.isArray(block?.lines)) {
      const blockLines = block.lines
        .map((line) => normalizeTextLines(line))
        .filter((line) => line.length > 0);
      if (blockLines.length > 0) {
        blocks.push(`<p>${blockLines.join('</p><p>')}</p>`);
      }
    }
  });
  return blocks.join('\n');
};

const buildDateMapForText = (collected) => {
  const datesByText = new Map();
  if (collected?.dates == null) {
    return datesByText;
  }
  collected.dates.forEach((entries, date) => {
    (entries || []).forEach((entry) => {
      const textId = entry?.id;
      if (textId == null) {
        return;
      }
      const current = datesByText.get(textId) || {};
      current[entry.dateType] = { iso: date, raw: date };
      datesByText.set(textId, current);
    });
  });
  return datesByText;
};

const poetSearchName = (poet = {}) => {
  if (poet == null || Object.keys(poet).length === 0) {
    return '';
  }
  const name = poet?.name || {};
  return [
    name.firstname,
    name.lastname,
    name.fullname,
    name.pseudonym,
    name.christened,
    name.realname,
    name.sortname,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
};

const buildTextInsertStatements = (textMeta, collected, textDateMap, now) => {
  if (textMeta?.indexable === false) {
    return [];
  }

  const textPath = Paths.textPath(textMeta.id);
  if (!fs.existsSync(textPath)) {
    throw new Error(`Manglende text JSON for ${textMeta.id}: ${textPath}`);
  }

  const textData = JSON.parse(fs.readFileSync(textPath, 'utf8'));
  const workId = `${textMeta.poetId ?? ''}/${textMeta.workId ?? ''}`.replace(
    /\/$/,
    '',
  );
  const source = textData.text?.source || {};
  const poetMeta = collected.poets.get(textMeta.poetId);
  const workMeta = collected.works.get(workId);
  const rawText = normalizeText(textData);
  const renderedHtml = renderTextAsHtml(textData);
  const normalizedText = rawText.replace(/\s+/g, ' ').trim();
  const dateData = textDateMap.get(textMeta.id) || {};
  const workTitle = workMeta?.title || textMeta.workId;
  const keywords = (textData.text?.keywords || [])
    .map((item) => item?.title || item?.id || item)
    .filter(Boolean)
    .join(' ');

  return [
    `INSERT INTO text (text_id,work_id,poet_id,source_poet_id,source_work_id,source_text_id,placement,canonical_text_id,type,title,indextitle,linktitle,firstline,content_lang,text_lang,has_footnotes,footnotes_count,indexable,source_node_in,page_range_text,digital_url,facsimile,facsimile_pages_json,facsimile_page_count,created_at,updated_at) VALUES (${toSqlValue(textMeta.id)}, ${toSqlValue(workId)}, ${toSqlValue(textMeta.poetId)}, ${toSqlValue(textMeta.sourcePoetId)}, ${toSqlValue(textMeta.sourceWorkId)}, ${toSqlValue(textMeta.sourceTextId || textMeta.id)}, ${toSqlValue(textMeta.placement || 'canonical')}, ${toSqlValue(textMeta.canonicalTextId)}, ${toSqlValue(textMeta.type)}, ${toSqlValue(textMeta.title)}, ${toSqlValue(textMeta.indexTitle)}, ${toSqlValue(textMeta.linkTitle)}, ${toSqlValue(textMeta.firstline)}, ${toSqlValue(textData.text?.content_lang)}, ${toSqlValue(textMeta.text_lang)}, ${toSqlValue(textData.text?.has_footnotes === true ? 1 : 0)}, ${toSqlValue(textData.text?.footnotes_count || 0)}, ${toSqlValue(textMeta.indexable !== false ? 1 : 0)}, ${toSqlValue(textMeta.source_node_in)}, ${toSqlValue(source.pages)}, ${toSqlValue(source.digitalUrl)}, ${toSqlValue(source.facsimile)}, ${toSqlJson(source.facsimilePages)}, ${toSqlValue(source.facsimilePageCount)}, ${toSqlValue(now)}, ${toSqlValue(now)})`,
    `INSERT INTO source (source_id,scope,work_id,text_id,source_key,source_label,pages_text,digital_url,facsimile,facsimile_pages_offset,facsimile_page_count,facsimile_pages_json,created_at,updated_at) VALUES (${toSqlValue(`text:${textMeta.id}`)}, 'text', ${toSqlValue(workId)}, ${toSqlValue(textMeta.id)}, ${toSqlValue('default')}, ${toSqlValue(source.source)}, ${toSqlValue(source.pages)}, ${toSqlValue(source.digitalUrl)}, ${toSqlValue(source.facsimile)}, ${toSqlValue(source.facsimilePagesOffset)}, ${toSqlValue(source.facsimilePageCount)}, ${toSqlJson(source.facsimilePages)}, ${toSqlValue(now)}, ${toSqlValue(now)})`,
    `INSERT INTO text_content (text_id,normalized_text,rendered_html,raw_blocks_json,notes_json,keywords_json,variant_group,created_at,updated_at) VALUES (${toSqlValue(textMeta.id)}, ${toSqlValue(normalizedText)}, ${toSqlValue(renderedHtml)}, ${toSqlJson(textData.text?.blocks)}, ${toSqlJson(textData.text?.notes)}, ${toSqlJson(textData.text?.keywords)}, ${toSqlValue(textMeta.canonicalTextId || textMeta.id)}, ${toSqlValue(now)}, ${toSqlValue(now)})`,
    `INSERT INTO text_search_index (text_id,poet_id,poet_name_fulltext,work_id,work_title,text_title,text_firstline,keywords,raw_text,has_footnotes,source_pages,written_iso,written_raw,printed_iso,printed_raw,performed_iso,performed_raw,event_iso,event_raw) VALUES (${toSqlValue(textMeta.id)}, ${toSqlValue(textMeta.poetId)}, ${toSqlValue(poetSearchName(poetMeta) || textMeta.poetId)}, ${toSqlValue(workId)}, ${toSqlValue(workTitle)}, ${toSqlValue(textMeta.title)}, ${toSqlValue(textMeta.firstline)}, ${toSqlValue(keywords)}, ${toSqlValue(buildTextNameForSearch(textMeta) + '\\n' + normalizedText)}, ${toSqlValue(textData.text?.has_footnotes === true ? 1 : 0)}, ${toSqlValue(source.pages)}, ${toSqlValue(dateData.written?.iso)}, ${toSqlValue(dateData.written?.raw)}, ${toSqlValue(workMeta?.published)}, ${toSqlValue(workMeta?.published)}, ${toSqlValue(dateData.performed?.iso)}, ${toSqlValue(dateData.performed?.raw)}, ${toSqlValue(dateData.event?.iso)}, ${toSqlValue(dateData.event?.raw)})`,
  ];
};

const buildEventInsertStatementsForTextIds = (textIds, collected, now) => {
  const textIdSet = new Set(textIds);
  const insertStatements = [];

  Array.from(collected.dates?.entries() || [])
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, entries]) => {
      (entries || [])
        .filter((entry) => entry?.id != null && textIdSet.has(entry.id))
        .filter((entry) => entry?.dateType != null)
        .forEach((entry, index) => {
          const textMeta = collected.texts.get(entry.id);
          if (textMeta == null || textMeta.indexable === false) {
            return;
          }
          const workId = `${textMeta.poetId ?? ''}/${textMeta.workId ?? ''}`.replace(
            /\/$/,
            '',
          );
          const sourceFile = (textMeta.sourceFiles || [])[0];
          insertStatements.push(
            `INSERT INTO event (event_id,event_type,text_id,work_id,poet_id,date_raw,date_iso,source_file,source_file_row_hash,created_at,updated_at) VALUES (${toSqlValue(`${entry.id}#${entry.dateType}#${index}`)}, ${toSqlValue(entry.dateType)}, ${toSqlValue(entry.id)}, ${toSqlValue(workId)}, ${toSqlValue(entry.poetId || textMeta.poetId)}, ${toSqlValue(date)}, ${toSqlValue(date)}, ${toSqlValue(sourceFile)}, ${toSqlValue(null)}, ${toSqlValue(now)}, ${toSqlValue(now)})`
          );
        });
    });

  return insertStatements;
};

const buildWorkInsertStatements = (workIds, collected, now) => {
  const ids = Array.from(workIds)
    .filter((id) => id.length > 0)
    .sort();
  if (ids.length === 0) {
    return [];
  }
  const statements = [];
  const inList = toSqlInList(ids);
  statements.push(`DELETE FROM work WHERE work_id IN (${inList});`);
  ids.forEach((workId) => {
    const work = collected.works.get(workId);
    if (work == null) {
      return;
    }
    statements.push(
      `INSERT INTO work (work_id,poet_id,local_id,title,subtitles_json,toctitle,linktitle,breadcrumbtitle,year,status,type,has_content,published_date_raw,published_date_iso,parent_work_id,is_virtual,created_at,updated_at) VALUES (${toSqlValue(workId)}, ${toSqlValue(workId.split('/')[0])}, ${toSqlValue(work.id)}, ${toSqlValue(work.title)}, ${toSqlJson(work.subtitles)}, ${toSqlValue(work.toctitle?.title || work.toctitle)}, ${toSqlValue(work.linktitle)}, ${toSqlValue(work.breadcrumbtitle)}, ${toSqlValue(work.year)}, ${toSqlValue(work.status)}, ${toSqlValue(work.type)}, ${toSqlValue(work.has_content === true ? 1 : 0)}, ${toSqlValue(work.published)}, ${toSqlValue(work.published)}, ${toSqlValue(work.parent?.id)}, ${toSqlValue(work.virtualType ? 1 : 0)}, ${toSqlValue(now)}, ${toSqlValue(now)})`
    );
  });
  return statements;
};

const buildPictureRefreshStatements = (sourceFiles, now) => {
  const sourceSet = new Set(sourceFiles);
  const sourceInList = Array.from(sourceSet).sort();
  if (sourceInList.length === 0) {
    return [];
  }
  const existingSourceFiles = sourceInList.filter((sourceFile) =>
    fs.existsSync(sourceFile),
  );
  const rows = collectPictureRowsFromSourceFiles(existingSourceFiles);
  const statements = [];
  const sourceFileInList = sourceInList.map(toSqlValue).join(', ');
  statements.push(`DELETE FROM picture WHERE source_file IN (${sourceFileInList});`);
  rows.forEach((row) => {
    statements.push(
      `INSERT INTO picture (picture_id,source_file,scope,text_id,has_href,has_objid,created_at,updated_at) VALUES (${toSqlValue(row.pictureId)}, ${toSqlValue(row.sourceFile)}, ${toSqlValue(row.scope)}, ${toSqlValue(row.textId)}, ${toSqlValue(row.hasHref)}, ${toSqlValue(row.hasObjid)}, ${toSqlValue(now)}, ${toSqlValue(now)})`
    );
  });
  return statements;
};

const buildIncrementalSql = (collected, changedFiles) => {
  const now = Date.now();
  if (collected == null) {
    throw new Error(
      'Kan ikke bygge delta-opdatering uden collected-data',
    );
  }

  const statements = ['BEGIN;'];
  const pictureSourceFiles = new Set();
  const workIds = new Set();
  const textIdsForWorkFiles = new Set();
  const unsupportedFiles = [];

  changedFiles.forEach((sourceFile) => {
    const type = sourceFileType(sourceFile);
    if (type === 'unsupported') {
      unsupportedFiles.push(sourceFile);
      return;
    }

    if (type === 'work-text') {
      const workMatch = sourceFile.match(SOURCE_FILE_RE);
      if (workMatch == null) {
        unsupportedFiles.push(sourceFile);
        return;
      }
      const workId = `${workMatch[1]}/${workMatch[2]}`;
      workIds.add(workId);
      pictureSourceFiles.add(sourceFile);
      if (fs.existsSync(sourceFile)) {
        fileContainsTextEntries(sourceFile).forEach((textId) => {
          if (textId.length > 0) {
            textIdsForWorkFiles.add(textId);
          }
        });
      }
      return;
    }

    pictureSourceFiles.add(sourceFile);
  });

  if (unsupportedFiles.length > 0) {
    return { isIncremental: false, reason: 'unsupported-changed-files' };
  }

  if (workIds.size > 0) {
    const workInList = toSqlInList(Array.from(workIds).sort());
    const textIdSubquery = `(SELECT text_id FROM text WHERE work_id IN (${workInList}))`;
    statements.push(`DELETE FROM text_search_index WHERE text_id IN ${textIdSubquery};`);
    statements.push(`DELETE FROM text_content WHERE text_id IN ${textIdSubquery};`);
    statements.push(
      `DELETE FROM source WHERE source_id IN (SELECT 'text:' || text_id FROM text WHERE work_id IN (${workInList}));`
    );
    statements.push(`DELETE FROM event WHERE work_id IN (${workInList});`);
    statements.push(`DELETE FROM text WHERE work_id IN (${workInList});`);
    statements.push(...buildWorkInsertStatements(workIds, collected, now));
  }

  statements.push(...buildPictureRefreshStatements(Array.from(pictureSourceFiles), now));

  if (textIdsForWorkFiles.size > 0) {
    const textDateMap = buildDateMapForText(collected);
    textIdsForWorkFiles.forEach((textId) => {
      const textMeta = collected.texts.get(textId);
      const textStatements = buildTextInsertStatements(textMeta, collected, textDateMap, now);
      statements.push(...textStatements);
    });
  }

  const textIdsForEventsAndFts = Array.from(
    textIdsForWorkFiles.values(),
  ).sort();
  if (textIdsForEventsAndFts.length > 0) {
    statements.push(
      ...buildEventInsertStatementsForTextIds(
        textIdsForEventsAndFts,
        collected,
        now,
      ),
    );
  }

  if (statements.length === 1) {
    statements.push('COMMIT;');
    const normalizedStatements = statements
      .map((statement) => ensureTrailingSemicolon(statement))
      .filter((statement) => statement.length > 0);
    return { sql: normalizedStatements.join('\n'), isIncremental: true };
  }

  statements.push('COMMIT;');
  const normalizedStatements = statements
    .map((statement) => ensureTrailingSemicolon(statement))
    .filter((statement) => statement.length > 0);
  return { sql: normalizedStatements.join('\n'), isIncremental: true };
};

const buildFallbackSql = (collected) => {
  const now = Date.now();
  if (collected == null) {
    throw new Error(
      'Kunne ikke bygge sqlite-index uden collected-data',
    );
  }

  const collectedTexts = Array.from(collected.texts?.values() || []);
  const textDateMap = buildDateMapForText(collected);
  const pictureRows = collectPictureRows();
  const insertRows = [];
  insertRows.push(SQLITE_INDEX_SCHEMA.trim());
  collected.poets?.forEach((poet) => {
    const period = poet.period || {};
    const born = period.born || {};
    const dead = period.dead || {};
    insertRows.push(
      `INSERT INTO poet (poet_id,country,lang,type,square_portrait,name_firstname,name_lastname,name_fullname,name_pseudonym,name_sortname,born_date,born_place,dead_date,dead_place,has_poems,has_prose,has_works,created_at,updated_at) VALUES (${toSqlValue(poet.id)}, ${toSqlValue(poet.country)}, ${toSqlValue(poet.lang)}, ${toSqlValue(poet.type)}, ${toSqlValue(poet.square_portrait)}, ${toSqlValue(poet.name?.firstname)}, ${toSqlValue(poet.name?.lastname)}, ${toSqlValue(poet.name?.fullname)}, ${toSqlValue(poet.name?.pseudonym)}, ${toSqlValue(poet.name?.sortname)}, ${toSqlValue(born.date)}, ${toSqlValue(born.place)}, ${toSqlValue(dead.date)}, ${toSqlValue(dead.place)}, ${toSqlValue(poet.has_poems === true ? 1 : 0)}, ${toSqlValue(poet.has_prose === true ? 1 : 0)}, ${toSqlValue(poet.has_works === true ? 1 : 0)}, ${toSqlValue(now)}, ${toSqlValue(now)})`
    );
  });

  collected.works?.forEach((work, workId) => {
    insertRows.push(
      `INSERT INTO work (work_id,poet_id,local_id,title,subtitles_json,toctitle,linktitle,breadcrumbtitle,year,status,type,has_content,published_date_raw,published_date_iso,parent_work_id,is_virtual,created_at,updated_at) VALUES (${toSqlValue(workId)}, ${toSqlValue(workId.split('/')[0])}, ${toSqlValue(work.id)}, ${toSqlValue(work.title)}, ${toSqlJson(work.subtitles)}, ${toSqlValue(work.toctitle?.title || work.toctitle)}, ${toSqlValue(work.linktitle)}, ${toSqlValue(work.breadcrumbtitle)}, ${toSqlValue(work.year)}, ${toSqlValue(work.status)}, ${toSqlValue(work.type)}, ${toSqlValue(work.has_content === true ? 1 : 0)}, ${toSqlValue(work.published)}, ${toSqlValue(work.published)}, ${toSqlValue(work.parent?.id)}, ${toSqlValue(work.virtualType ? 1 : 0)}, ${toSqlValue(now)}, ${toSqlValue(now)})`
    );
  });

  collectedTexts
    .filter((text) => text.indexable !== false)
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((textMeta) => {
      const textPath = Paths.textPath(textMeta.id);
      if (!fs.existsSync(textPath)) {
        throw new Error(`Manglende text JSON for ${textMeta.id}: ${textPath}`);
      }

      const textData = JSON.parse(fs.readFileSync(textPath, 'utf8'));
      const workId = `${textMeta.poetId ?? ''}/${textMeta.workId ?? ''}`.replace(
        /\/$/,
        '',
      );
      const source = textData.text?.source || {};
      const poetMeta = collected.poets.get(textMeta.poetId);
      const workMeta = collected.works.get(workId);
      const rawText = normalizeText(textData);
      const renderedHtml = renderTextAsHtml(textData);
      const normalizedText = rawText.replace(/\s+/g, ' ').trim();
      const dateData = textDateMap.get(textMeta.id) || {};
      const workTitle = workMeta?.title || textMeta.workId;
      const keywords = (textData.text?.keywords || [])
        .map((item) => item?.title || item?.id || item)
        .filter(Boolean)
        .join(' ');

      insertRows.push(
        `INSERT INTO text (text_id,work_id,poet_id,source_poet_id,source_work_id,source_text_id,placement,canonical_text_id,type,title,indextitle,linktitle,firstline,content_lang,text_lang,has_footnotes,footnotes_count,indexable,source_node_in,page_range_text,digital_url,facsimile,facsimile_pages_json,facsimile_page_count,created_at,updated_at) VALUES (${toSqlValue(textMeta.id)}, ${toSqlValue(workId)}, ${toSqlValue(textMeta.poetId)}, ${toSqlValue(textMeta.sourcePoetId)}, ${toSqlValue(textMeta.sourceWorkId)}, ${toSqlValue(textMeta.sourceTextId || textMeta.id)}, ${toSqlValue(textMeta.placement || 'canonical')}, ${toSqlValue(textMeta.canonicalTextId)}, ${toSqlValue(textMeta.type)}, ${toSqlValue(textMeta.title)}, ${toSqlValue(textMeta.indexTitle)}, ${toSqlValue(textMeta.linkTitle)}, ${toSqlValue(textMeta.firstline)}, ${toSqlValue(textData.text?.content_lang)}, ${toSqlValue(textMeta.text_lang)}, ${toSqlValue(textData.text?.has_footnotes === true ? 1 : 0)}, ${toSqlValue(textData.text?.footnotes_count || 0)}, ${toSqlValue(textMeta.indexable !== false ? 1 : 0)}, ${toSqlValue(textMeta.source_node_in)}, ${toSqlValue(source.pages)}, ${toSqlValue(source.digitalUrl)}, ${toSqlValue(source.facsimile)}, ${toSqlJson(source.facsimilePages)}, ${toSqlValue(source.facsimilePageCount)}, ${toSqlValue(now)}, ${toSqlValue(now)})`
      );

      insertRows.push(
        `INSERT INTO source (source_id,scope,work_id,text_id,source_key,source_label,pages_text,digital_url,facsimile,facsimile_pages_offset,facsimile_page_count,facsimile_pages_json,created_at,updated_at) VALUES (${toSqlValue(`text:${textMeta.id}`)}, 'text', ${toSqlValue(workId)}, ${toSqlValue(textMeta.id)}, ${toSqlValue('default')}, ${toSqlValue(source.source)}, ${toSqlValue(source.pages)}, ${toSqlValue(source.digitalUrl)}, ${toSqlValue(source.facsimile)}, ${toSqlValue(source.facsimilePagesOffset)}, ${toSqlValue(source.facsimilePageCount)}, ${toSqlJson(source.facsimilePages)}, ${toSqlValue(now)}, ${toSqlValue(now)})`
      );

      insertRows.push(
        `INSERT INTO text_content (text_id,normalized_text,rendered_html,raw_blocks_json,notes_json,keywords_json,variant_group,created_at,updated_at) VALUES (${toSqlValue(textMeta.id)}, ${toSqlValue(normalizedText)}, ${toSqlValue(renderedHtml)}, ${toSqlJson(textData.text?.blocks)}, ${toSqlJson(textData.text?.notes)}, ${toSqlJson(textData.text?.keywords)}, ${toSqlValue(textMeta.canonicalTextId || textMeta.id)}, ${toSqlValue(now)}, ${toSqlValue(now)})`
      );

      insertRows.push(
        `INSERT INTO text_search_index (text_id,poet_id,poet_name_fulltext,work_id,work_title,text_title,text_firstline,keywords,raw_text,has_footnotes,source_pages,written_iso,written_raw,printed_iso,printed_raw,performed_iso,performed_raw,event_iso,event_raw) VALUES (${toSqlValue(textMeta.id)}, ${toSqlValue(textMeta.poetId)}, ${toSqlValue(poetSearchName(poetMeta) || textMeta.poetId)}, ${toSqlValue(workId)}, ${toSqlValue(workTitle)}, ${toSqlValue(textMeta.title)}, ${toSqlValue(textMeta.firstline)}, ${toSqlValue(keywords)}, ${toSqlValue(buildTextNameForSearch(textMeta) + '\n' + normalizedText)}, ${toSqlValue(textData.text?.has_footnotes === true ? 1 : 0)}, ${toSqlValue(source.pages)}, ${toSqlValue(dateData.written?.iso)}, ${toSqlValue(dateData.written?.raw)}, ${toSqlValue(workMeta?.published)}, ${toSqlValue(workMeta?.published)}, ${toSqlValue(dateData.performed?.iso)}, ${toSqlValue(dateData.performed?.raw)}, ${toSqlValue(dateData.event?.iso)}, ${toSqlValue(dateData.event?.raw)})`
      );
    });

  // Fill event table from collected dates in a deterministic order to include non-event rows
  Array.from(collected.dates?.entries() || [])
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([date, entries]) => {
      (entries || [])
        .filter((entry) => entry?.dateType != null && entry?.id != null)
        .forEach((entry, index) => {
          const textMeta = collected.texts?.get(entry.id);
          if (textMeta == null || textMeta.indexable === false) {
            return;
          }
          const workId = `${textMeta.poetId ?? ''}/${textMeta.workId ?? ''}`.replace(
            /\/$/,
            '',
          );
          insertRows.push(
            `INSERT INTO event (event_id,event_type,text_id,work_id,poet_id,date_raw,date_iso,source_file,source_file_row_hash,created_at,updated_at) VALUES (${toSqlValue(`${entry.id}#${entry.dateType}#${index}`)}, ${toSqlValue(entry.dateType)}, ${toSqlValue(entry.id)}, ${toSqlValue(workId)}, ${toSqlValue(entry.poetId || textMeta.poetId)}, ${toSqlValue(date)}, ${toSqlValue(date)}, ${toSqlValue((textMeta.sourceFiles || [])[0])}, ${toSqlValue(null)}, ${toSqlValue(now)}, ${toSqlValue(now)})`
          );
        });
    });

  pictureRows.forEach((row) => {
    insertRows.push(
      `INSERT INTO picture (picture_id,source_file,scope,text_id,has_href,has_objid,created_at,updated_at) VALUES (${toSqlValue(row.pictureId)}, ${toSqlValue(row.sourceFile)}, ${toSqlValue(row.scope)}, ${toSqlValue(row.textId)}, ${toSqlValue(row.hasHref)}, ${toSqlValue(row.hasObjid)}, ${toSqlValue(now)}, ${toSqlValue(now)})`
    );
  });

  const statements = insertRows.map((statement) => `${statement};`);
  statements.push('COMMIT;');
  return statements.join('\n');
};

const fixSqlSemicolons = (sql) => {
  return sql
    .replace(/\)\s*(INSERT(?:\s+OR\s+REPLACE)?|COMMIT)/g, ');\n$1');
};

const ensureTrailingSemicolon = (statement) => {
  const trimmed = statement.trim();
  if (trimmed === '') {
    return '';
  }
  return trimmed.endsWith(';') ? trimmed : `${trimmed};`;
};

export const updateSqliteIndex = (collected) => {
  const sourceDiff = diffSourceFileState();
  const hasSourceChange =
    sourceDiff.changedFiles != null && sourceDiff.changedFiles.length > 0;
  const hasSourceHistory = sourceDiff.hasCompleteHistory;
  const canSkipImport = hasSourceHistory && !hasSourceChange;

  if (canSkipImport && fs.existsSync(SQLITE_PATH)) {
    return true;
  }

  const rawSql = (() => {
    if (hasSourceHistory && hasSourceChange) {
      const incremental = buildIncrementalSql(collected, sourceDiff.changedFiles);
      if (incremental.isIncremental) {
        return incremental.sql;
      }
    }

    return buildFallbackSql(collected);
  })();

  const fixedSql = fixSqlSemicolons(rawSql);
  const importSqlite = spawnSync('sqlite3', [SQLITE_PATH], {
    input: fixedSql,
    encoding: 'utf8',
    stdio: ['pipe', process.stdout, process.stderr],
  });

  if (
    importSqlite.error != null &&
    importSqlite.error.code === 'ENOENT'
  ) {
    console.log(
      'Springer opdatering af SQLite-index over: sqlite3 CLI mangler i PATH.',
    );
    return false;
  }

  if (importSqlite.status !== 0) {
    throw new Error(
      `Kunne ikke opdatere SQLite-index: ${importSqlite.stderr || importSqlite.error}`,
    );
  }

  if (sourceDiff.currentState != null) {
    writeSourceFileState(sourceDiff.currentState);
  }

  return true;
};

export { buildIncrementalSql };
