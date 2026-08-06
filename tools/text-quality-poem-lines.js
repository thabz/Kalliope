import fs from 'fs';
import path from 'path';
import { fileExists, loadText } from './libs/helpers.js';
import {
  filterTextDataByMinDate,
  hasPdfFacsimile,
} from './text-quality-filters.js';

const flatten = array => [].concat(...array);

const lineNumberAt = (text, index) => text.slice(0, index).split('\n').length;

const parseIntOrNull = value => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const firstYear = text => {
  const match = (text || '').match(/\d{3,4}/);
  return match == null ? null : parseIntOrNull(match[0]);
};

const firstMatch = (text, regexp) => {
  const match = text.match(regexp);
  return match == null ? null : match[1];
};

const normalizeFileName = filename =>
  filename.replace(/^\.\//, '').replace(/^fdirs\//, '').replace(/\\/g, '/');

const stripXmlComments = data => data.replace(/<!--[\s\S]*?-->/g, '');

const parsePoetWorkFiles = (rootDir = process.cwd()) => {
  const fdirs = path.join(rootDir, 'fdirs');
  const poetIds = fs.existsSync(fdirs)
    ? fs
        .readdirSync(fdirs)
        .filter((poetId) => poetId.indexOf('.') === -1)
    : [];

  const metadata = [];

  for (const poetId of poetIds) {
    const infoFilename = path.join(rootDir, 'fdirs', poetId, 'info.xml');
    if (!fileExists(infoFilename)) {
      throw new Error(`Missing info.xml in fdirs/${poetId}.`);
    }

    const infoData = loadText(infoFilename);
    if (infoData == null) {
      throw new Error(`Missing info.xml in fdirs/${poetId}.`);
    }

    const person = firstMatch(infoData, /(<person\b[^>]*>)/);
    if (person == null) {
      throw new Error(`fdirs/${poetId}/info.xml is malformed.`);
    }

    const lang = firstMatch(person, /\slang="([^"]+)"/);
    const bornYear = firstYear(firstMatch(infoData, /<born>([\s\S]*?)<\/born>/));
    const workIds = firstMatch(infoData, /<works>([\s\S]*?)<\/works>/);

    const works = workIds
      ? workIds
          .toString()
          .replace('<works>', '')
          .replace('</works>', '')
          .replace('<works/>', '')
          .trim()
          .split(',')
          .filter((workId) => workId.length > 0)
          .map((workId) => workId.trim())
      : [];

    for (const workId of works) {
      const filename = `${poetId}/${workId}.xml`;
      metadata.push({
        filename: normalizeFileName(filename),
        lang,
        bornYear,
        workYear: parseIntOrNull(workId),
      });
    }
  }

  return metadata;
};

const collectTextIds = data =>
  Array.from(stripXmlComments(data).matchAll(/<(?:text|section)\b[^>]*\sid="([^"]+)"/g)).map(
    (match) => ({
      id: match[1],
      line: lineNumberAt(data, match.index),
    })
  );

const collectTextAliases = data =>
  Array.from(stripXmlComments(data).matchAll(/<(?:text|section)\b[^>]*>/g)).flatMap(
    (partMatch) => {
      const part = partMatch[0];
      const idMatch = part.match(/\sid="([^"]+)"/);
      const aliasesMatch = part.match(/\saliases="([^"]*)"/);

      if (idMatch == null || aliasesMatch == null) {
        return [];
      }

      return aliasesMatch[1]
        .split(',')
        .map(alias => alias.trim())
        .filter((alias) => alias.length > 0)
        .map((alias) => ({
          id: idMatch[1],
          alias,
          line: lineNumberAt(data, partMatch.index),
        }));
    }
  );

const checkNotesGroups = (filename, data) => {
  const headRegexp = /<(workhead|head)>[\s\S]*?<\/\1>/g;
  const idRegexp = /<(?:text|section)[^>]*\sid="([^"]+)"/g;
  let currentId = 'workhead';
  const ids = Array.from(data.matchAll(idRegexp));
  let idIndex = 0;
  let headMatch;

  while ((headMatch = headRegexp.exec(data)) != null) {
    while (idIndex < ids.length && ids[idIndex].index < headMatch.index) {
      currentId = ids[idIndex][1];
      idIndex += 1;
    }
    const notesGroups = headMatch[0].match(/<notes>/g) || [];
    if (notesGroups.length > 1) {
      return {
        file: filename,
        line: lineNumberAt(data, headMatch.index),
        rule: 'notes-groups',
        severity: 'high',
        description: `${filename} ${currentId} has ${notesGroups.length} <notes> groups.`,
        excerpt: headMatch[0].slice(0, 120),
      };
    }
  }

  return null;
};

const findMissingModernFrenchSpacing = data => {
  const textData = stripXmlComments(data).replace(
    /<picture\b[\s\S]*?<\/picture>/g,
    ''
  );
  const lines = textData.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const text = lines[i].replace(/<[^>]+>/g, '');
    const match = text.match(/\S([?!;:])/);
    if (match != null) {
      return {
        file: '',
        line: i + 1,
        sign: match[1],
        text: lines[i],
      };
    }
  }

  return null;
};

const ignoredTestsAtLine = data => {
  const partRegexp = /<(?:text|section)\b[^>]*>/g;
  const lineStarts = [0];
  let lineBreakIndex = -1;

  while ((lineBreakIndex = data.indexOf('\n', lineBreakIndex + 1)) !== -1) {
    lineStarts.push(lineBreakIndex + 1);
  }

  const ignoredAtLine = new Map();
  let currentIgnoredTests = [];
  let partIndex = 0;
  const parts = Array.from(data.matchAll(partRegexp));

  lineStarts.forEach((lineStart, lineIndex) => {
    while (partIndex < parts.length && parts[partIndex].index <= lineStart) {
      const ignoreTestsMatch = parts[partIndex][0].match(
        /\signore-tests="([^"]*)"/
      );
      currentIgnoredTests =
        ignoreTestsMatch == null
          ? []
          : ignoreTestsMatch[1]
              .split(',')
              .map((testName) => testName.trim())
              .filter((testName) => testName.length > 0);
      partIndex += 1;
    }
    ignoredAtLine.set(lineIndex, currentIgnoredTests);
  });

  return ignoredAtLine;
};

const regexps = [
  { testName: 'caret', regexp: /\^/ },
  { testName: 'leading-comma', regexp: /^,[a-zæøåA-ZÆØÅ]/m },
  { testName: 'leading-space', regexp: /^\s[-a-zæøåA-ZÆØÅ]/m },
  { testName: 'leading-period', regexp: /^\.[a-zæøåA-ZÆØÅ]/m },
  {
    testName: 'period-space',
    regexp: /[a-zæøå] \.[^\.]/,
    whitelist: [/\. \. \./],
  },
  { testName: 'leading-dash', regexp: /^-[a-zæøåA-ZÆØÅ]/m },
  { testName: 'empty-firstline', regexp: /<firstline><\/firstline>/ },
  { testName: 'missing-source-pages', regexp: /<source pages=""\/>/ },
  { testName: 'dot-followed-by-lowercase', regexp: /^.*[^\.]\.\s*[a-z;]\s*$/ },
  {
    testName: 'loose-letters',
    regexp: / [a-hj-np-z]\s*$/m,
    onlylangs: ['da'],
  },
  {
    testName: 'loose-letters',
    regexp: / [b-z]\s*$/m,
    onlylangs: ['en'],
  },
  {
    testName: 'comma-missing-space',
    regexp: /[a-zæøå],[a-zæøå]/,
    whitelist: [/<keywords>/, /<quality>/, /\signore-tests="[^"]*,/],
  },
  {
    testName: 'm-ellipsis',
    regexp: /mmm/,
    whitelist: [/<note\b[^>]*>.*\]/],
  },
  { testName: 'space-before-comma', regexp: /\s,\s*$/m },
  {
    testName: 'space-before-exclamation',
    regexp: /\s!\s*$/m,
    ignorelangs: ['fr'],
  },
  {
    testName: 'space-before-question',
    regexp: /\s\?\s*$/m,
    ignorelangs: ['fr'],
  },
  {
    testName: 'space-before-semicolon',
    regexp: /\s;\s*$/m,
    ignorelangs: ['fr'],
  },
  { testName: 'lll', regexp: /lll/, whitelist: [/Allliebe/] },
  { testName: 'comma-semicolon', regexp: /,;/ },
  { testName: 'comma-period', regexp: /,\./ },
  {
    testName: 'comma-comma',
    regexp: /;,/,
    whitelist: [/&/],
  },
  {
    testName: 'smaa',
    regexp: /aaa/,
    whitelist: [
      /[Ss]maaalfer/,
      /Smaaarbeider/,
      /<note\b[^>]*>.*\]/,
      /[Uu]paaagtet/,
      /Koleraaar/,
      /Græsstraaarme/,
    ],
  },
  { testName: 'sss', regexp: /sss/ },
  {
    testName: 'space-before-comma-with-markup',
    regexp: / ,[^,]/,
    whitelist: [/<metrik>/],
  },
];

const shouldCheckRule = (rule, lang) => {
  const ignorelangs = rule.ignorelangs || [];
  const onlylangs = rule.onlylangs || [];

  if (ignorelangs.indexOf(lang) > -1) {
    return false;
  }
  if (onlylangs.length > 0 && onlylangs.indexOf(lang) === -1) {
    return false;
  }

  return true;
};

const findPoemLineFindingsInText = ({
  file,
  data,
  lang,
  shouldUseModernFrenchPunctuationSpacing,
}) => {
  const issues = [];
  const ignoredTests = ignoredTestsAtLine(data);
  const lineData = data.split('\n');

  for (const rule of regexps) {
    const regexp = rule.regexp;
    const whitelist = rule.whitelist || [];

    if (!shouldCheckRule(rule, lang)) {
      continue;
    }
    if (!regexp) {
      continue;
    }

    if (regexp.test(data)) {
      lineData.forEach((line, lineIndex) => {
        if (
          regexp.test(line) &&
          (rule.testName == null ||
            ignoredTests.get(lineIndex).indexOf(rule.testName) === -1) &&
          !whitelist.find((w) => w.test(line))
        ) {
          issues.push({
            file,
            line: lineIndex + 1,
            rule: rule.testName ?? `regex:${regexp}`,
            severity: 'medium',
            description: `'${regexp}' found in xml`,
            excerpt: line,
          });
        }
      });
    }
  }

  if (shouldUseModernFrenchPunctuationSpacing) {
    const missingFrenchSpacing = findMissingModernFrenchSpacing(data);
    if (missingFrenchSpacing != null) {
      issues.push({
        file,
        line: missingFrenchSpacing.line,
        rule: 'missing-modern-french-spacing',
        severity: 'medium',
        description: `French spacing missing before '${missingFrenchSpacing.sign}'`,
        excerpt: missingFrenchSpacing.text,
      });
    }
  }

  return issues;
};

const formatPoemLineIssue = issue =>
  `${issue.file}:${issue.line} ${issue.rule}: ${issue.description} [${issue.excerpt}]`;

const collectPoemLineQualityFindings = ({
  rootDir = process.cwd(),
  files = null,
  minDate = null,
  facsimileOnly = false,
} = {}) => {
  const fileMetadata = parsePoetWorkFiles(rootDir);
  const allowedFiles = files == null
    ? null
    : new Set(files.map((filename) => normalizeFileName(filename)));

  const issues = [];
  const fileByFilename = new Map();
  const textIdLocations = new Map();
  const aliasLocations = new Map();

  for (const item of fileMetadata) {
    const relativePath = path.join('fdirs', item.filename);
    const fullpath = path.join(rootDir, relativePath);
    const data = loadText(fullpath);
    if (data == null) {
      throw new Error(`Missing file ${relativePath}.`);
    }
    if (facsimileOnly && !hasPdfFacsimile(data)) {
      continue;
    }
    fileByFilename.set(item.filename, {
      data: filterTextDataByMinDate(data, minDate),
      ...item,
      path: relativePath,
    });
  }

  const textIds = flatten(
    Array.from(fileByFilename.entries()).map(([filename, entry]) =>
      collectTextIds(entry.data).map((textId) => ({ ...textId, file: filename }))
    )
  );

  const aliases = flatten(
    Array.from(fileByFilename.entries()).map(([filename, entry]) =>
      collectTextAliases(entry.data).map((alias) => ({ ...alias, file: filename }))
    )
  );

  textIds.forEach(({ id, line, file }) => {
    const existing = textIdLocations.get(id);
    if (existing != null) {
      issues.push({
        file,
        line,
        rule: 'duplicate-text-id',
        severity: 'high',
        description: `Text id "${id}" is used in both ${existing.file} and ${file}.`,
        excerpt: '',
      });
    } else {
      textIdLocations.set(id, { file, line });
    }
  });

  aliases.forEach(({ alias, id, line, file }) => {
    const existing = aliasLocations.get(alias);
    if (existing != null) {
      issues.push({
        file,
        line,
        rule: 'duplicate-text-alias',
        severity: 'high',
        description: `Text alias "${alias}" is used by both ${existing.file}:${existing.id} and ${file}:${id}.`,
        excerpt: '',
      });
    } else {
      aliasLocations.set(alias, { file, id, line });
    }
  });

  aliasLocations.forEach((aliasInfo, alias) => {
    const textIdLocation = textIdLocations.get(alias);
    if (textIdLocation != null) {
      issues.push({
        file: aliasInfo.file,
        line: aliasInfo.line,
        rule: 'alias-conflicts-with-text-id',
        severity: 'high',
        description: `Text alias "${alias}" in ${aliasInfo.file}:${aliasInfo.id} conflicts with text id in ${textIdLocation.file}.`,
        excerpt: '',
      });
    }
  });

  Array.from(fileByFilename.entries()).forEach(([filename, entry]) => {
    if (allowedFiles != null && !allowedFiles.has(filename)) {
      return;
    }

    const notesIssue = checkNotesGroups(entry.path, entry.data);
    if (notesIssue != null) {
      issues.push({
        ...notesIssue,
        file: entry.path,
      });
    }

    const shouldUseModernFrenchPunctuationSpacing =
      entry.lang === 'fr' &&
      ((entry.bornYear != null && entry.bornYear >= 1800) ||
        (entry.workYear != null && entry.workYear >= 1800));

    issues.push(
      ...findPoemLineFindingsInText({
        file: entry.path,
        data: entry.data,
        lang: entry.lang,
        shouldUseModernFrenchPunctuationSpacing,
      })
    );
  });

  return issues;
};

export {
  collectPoemLineQualityFindings,
  formatPoemLineIssue,
  findPoemLineFindingsInText,
  parsePoetWorkFiles,
};
