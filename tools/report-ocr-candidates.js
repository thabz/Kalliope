import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const wordChars = 'A-Za-zÆØÅæøåÀ-ÖØ-öø-ÿ';
const wordRegexp = new RegExp(
  `(?<![${wordChars}])([${wordChars}]+)(?![${wordChars}])`,
  'gu'
);
const defaultPatterns = ['fdirs/*/*.xml', 'data/*.xml'];
const deferredWordformWords = new Set(['fåtted']);
const allowedInternalUppercaseWords = new Set(['DgF']);
const allowedRepeatedWords = new Set([
  'av',
  'duidu',
  'ej',
  'ei',
  'etc',
  'faar',
  'ha',
  'haa',
  'halli',
  'hej',
  'hi',
  'ho',
  'hu',
  'hurra',
  'hys',
  'ja',
  'jo',
  'kuk',
  'naa',
  'nej',
  'ney',
  'nø',
  'sa',
  'saa',
  'se',
  'tys',
  'vov',
]);
const suspiciousWordformSuggestions = new Map([
  ['fåst', 'fast'],
  ['grâl', 'gral'],
  ['håndled', 'handled'],
  ['måned', 'maned'],
  ['måttet', 'mattet'],
  ['skål', 'skal'],
  ['tâlte', 'talte'],
  ['tåled', 'taaled'],
]);
const repeatedWordRegexp = new RegExp(
  `(?<![${wordChars}'’-])([${wordChars}]{2,})\\s+\\1(?![${wordChars}'’-])`,
  'giu'
);
const mojibakeTokenRegexp = new RegExp(
  `[${wordChars}’']*(?:Ã[\\u0080-\\u00BF]|â€.|Â(?:ngst|skan))[${wordChars}’']*`,
  'gu'
);

const priorityOrder = new Map([
  ['høj', 0],
  ['middel', 1],
  ['lav', 2],
]);

const preserveLineBreaks = text =>
  text.replace(/[^\n]/g, match => (match === '\r' ? '\r' : ' '));

const removeIgnoredXml = text =>
  text
    .replace(/<!--[\s\S]*?-->/g, preserveLineBreaks)
    .replace(
      /<text\b(?=[^>]*\bskip-index="true")[\s\S]*?<\/text>/g,
      preserveLineBreaks
    )
    .replace(/<note\b[\s\S]*?<\/note>/g, preserveLineBreaks)
    .replace(/<picture\b[\s\S]*?<\/picture>/g, preserveLineBreaks);

const removeXmlMarkup = text =>
  text
    .replace(/<!--[\s\S]*?-->/g, preserveLineBreaks)
    .replace(/<[^>]+>/g, preserveLineBreaks);

const stripXml = text =>
  text
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<note\b[\s\S]*?<\/note>/g, ' ')
    .replace(/<picture\b[\s\S]*?<\/picture>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:amp|apos|gt|lt|quot);/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getAttr = (tag, attrName) =>
  tag.match(new RegExp(`\\s${attrName}="([^"]*)"`))?.[1] ?? null;

const ignoredTests = tag =>
  (getAttr(tag, 'ignore-tests') ?? '')
    .split(',')
    .map(testName => testName.trim())
    .filter(testName => testName.length > 0);

const mergeIgnoredTests = (...testLists) => [...new Set(testLists.flat())];

const workIgnoredTests = text => {
  const openingTag = text.match(/<kalliopework\b[^>]*>/)?.[0] ?? '';
  return ignoredTests(openingTag);
};

const lineNumberAt = (text, index) => text.slice(0, index).split('\n').length;

const textBlocks = text =>
  Array.from(text.matchAll(/<text\b[^>]*>[\s\S]*?<\/text>/g), match => {
    const block = match[0];
    const openingTag = block.match(/<text\b[^>]*>/)?.[0] ?? '';
    const startLine = lineNumberAt(text, match.index);
    return {
      id: getAttr(openingTag, 'id') ?? '',
      lang: getAttr(openingTag, 'lang'),
      ignoredTests: ignoredTests(openingTag),
      skipIndex: getAttr(openingTag, 'skip-index') === 'true',
      startLine,
      endLine: startLine + block.split('\n').length - 1,
      text: block,
    };
  });

const wordsInContext = context =>
  Array.from(context.matchAll(wordRegexp), match => match[1]);

const wordHasAaRingMix = word => /(?:[aA][åÅ]|[åÅ][aAåÅ])/.test(word);

const wordHasAaCircumflexMix = word => /(?:[aA][âÂ]|[âÂ][aA]|aa[âÂ])/u.test(word);

const wordHasInternalUppercaseCircumflex = word =>
  new RegExp(`[${wordChars}][ÂÊÎÔÛ][${wordChars}]`, 'u').test(word);

const wordHasInternalUppercase = word =>
  !allowedInternalUppercaseWords.has(word) && /\p{Ll}\p{Lu}/u.test(word);

const wordHasAaRing = word => /[åÅ]/u.test(word);

const wordHasCircumflexA = word => /[âÂ]/u.test(word);

const shouldDeferWordformAnalysis = word =>
  deferredWordformWords.has(word.toLowerCase());

const suggestedWordform = word => {
  const suggestion = suspiciousWordformSuggestions.get(word.toLowerCase());
  if (suggestion == null) {
    return null;
  }
  if (word[0] === word[0].toUpperCase()) {
    return suggestion[0].toUpperCase() + suggestion.slice(1);
  }
  return suggestion;
};

const repeatedWordsInContext = context =>
  Array.from(context.matchAll(repeatedWordRegexp))
    .filter(match => !allowedRepeatedWords.has(match[1].toLowerCase()))
    .map(match => match[0]);

const compareCandidates = (a, b) => {
  return (
    (priorityOrder.get(a.priority) ?? 99) -
      (priorityOrder.get(b.priority) ?? 99) ||
    a.file.localeCompare(b.file) ||
    a.line - b.line ||
    a.word.localeCompare(b.word)
  );
};

const loadPoetLangs = rootDir => {
  const langs = new Map();
  const fdirs = path.join(rootDir, 'fdirs');
  if (!fs.existsSync(fdirs)) {
    return langs;
  }

  for (const poetId of fs.readdirSync(fdirs)) {
    const infoFilename = path.join(fdirs, poetId, 'info.xml');
    if (!fs.existsSync(infoFilename)) {
      continue;
    }
    const infoText = fs.readFileSync(infoFilename, 'utf8');
    const lang = infoText.match(/<person\b[^>]*\slang="([^"]+)"/)?.[1];
    if (lang != null) {
      langs.set(poetId, lang);
    }
  }

  return langs;
};

const trackedFiles = (rootDir, patterns = defaultPatterns) =>
  execFileSync('git', ['ls-files', ...patterns], {
    cwd: rootDir,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean)
    .filter(filename => fs.existsSync(path.join(rootDir, filename)));

const langForFile = (filename, poetLangs) => {
  const parts = filename.split('/');
  if (parts[0] !== 'fdirs' || parts.length < 3) {
    return null;
  }
  return poetLangs.get(parts[1]) ?? null;
};

const candidateKey = candidate =>
  [candidate.file, candidate.line, candidate.textId, candidate.word].join('\t');

const addCandidate = (candidates, seenCandidates, candidate) => {
  if (candidate.ignoredTests.includes(candidate.rule)) {
    return;
  }

  const key = candidateKey(candidate);
  const existingIndex = seenCandidates.get(key);

  if (existingIndex == null) {
    seenCandidates.set(key, candidates.length);
    candidates.push(candidate);
    return;
  }

  const existing = candidates[existingIndex];
  if (
    (priorityOrder.get(candidate.priority) ?? 99) <
    (priorityOrder.get(existing.priority) ?? 99)
  ) {
    candidates[existingIndex] = candidate;
  }
};

const findTextBlockCandidates = ({
  filename,
  block,
  lang = 'da',
  reportSingleAaRing = true,
}) => {
  const candidates = [];
  const seenCandidates = new Map();
  const searchableText = removeIgnoredXml(block.text);
  const lines = searchableText.split('\n');
  const aaRingHits = [];
  const circumflexAHits = [];
  const suspiciousWordformHits = [];

  lines.forEach((lineText, index) => {
    const context = stripXml(lineText);
    if (context === '') {
      return;
    }

    for (const word of wordsInContext(context)) {
      const hit = {
        file: filename,
        line: block.startLine + index,
        textId: block.id,
        word,
        context,
      };

      if (wordHasInternalUppercaseCircumflex(word)) {
        addCandidate(candidates, seenCandidates, {
          ...hit,
          ignoredTests: block.ignoredTests,
          priority: 'høj',
          rule: 'internal-uppercase-circumflex',
          reason: 'stort circumflex-tegn midt i ord',
        });
      } else if (wordHasInternalUppercase(word)) {
        addCandidate(candidates, seenCandidates, {
          ...hit,
          ignoredTests: block.ignoredTests,
          priority: 'høj',
          rule: 'internal-uppercase',
          reason: 'stort bogstav eller manglende mellemrum midt i ord',
        });
      }

      if (lang !== 'da' || shouldDeferWordformAnalysis(word)) {
        continue;
      }

      if (wordHasAaRing(word)) {
        aaRingHits.push(hit);
      }
      if (wordHasCircumflexA(word)) {
        circumflexAHits.push(hit);
      }

      const suggestion = suggestedWordform(word);
      if (suggestion != null) {
        suspiciousWordformHits.push({ ...hit, suggestion });
      }

      if (wordHasAaRingMix(word)) {
        addCandidate(candidates, seenCandidates, {
          ...hit,
          ignoredTests: block.ignoredTests,
          priority: 'høj',
          rule: 'mixed-aa-ring',
          reason: 'blandet a/å-form i samme ord',
        });
      } else if (wordHasAaCircumflexMix(word)) {
        addCandidate(candidates, seenCandidates, {
          ...hit,
          ignoredTests: block.ignoredTests,
          priority: 'høj',
          rule: 'mixed-aa-circumflex',
          reason: 'blandet a/â-form i samme ord',
        });
      }
    }

    if (lang === 'da') {
      for (const repetition of repeatedWordsInContext(context)) {
        addCandidate(candidates, seenCandidates, {
          file: filename,
          line: block.startLine + index,
          textId: block.id,
          word: repetition,
          context,
          ignoredTests: block.ignoredTests,
          priority: 'lav',
          rule: 'repeated-adjacent-word',
          reason: 'samme ord står to gange i træk',
        });
      }
    }
  });

  for (const hit of suspiciousWordformHits) {
    const localDeviationCount = wordHasAaRing(hit.word)
      ? aaRingHits.length
      : circumflexAHits.length;
    if (localDeviationCount !== 1) {
      continue;
    }
    addCandidate(candidates, seenCandidates, {
      ...hit,
      ignoredTests: block.ignoredTests,
      priority: 'middel',
      rule: 'suspicious-wordform',
      reason: `mistænkelig ordform; mulig rettelse: ${hit.suggestion}`,
    });
  }

  if (reportSingleAaRing && aaRingHits.length === 1) {
    addCandidate(candidates, seenCandidates, {
      ...aaRingHits[0],
      ignoredTests: block.ignoredTests,
      priority: 'middel',
      rule: 'single-a-ring-in-text',
      reason: 'eneste å/Å-forekomst i dansk tekst',
    });
  }

  if (circumflexAHits.length === 1) {
    addCandidate(candidates, seenCandidates, {
      ...circumflexAHits[0],
      ignoredTests: block.ignoredTests,
      priority: 'middel',
      rule: 'single-circumflex-a-in-text',
      reason: 'eneste â/Â-forekomst i dansk tekst',
    });
  }

  return candidates;
};

const findMojibakeCandidatesInFile = ({ filename, text }) => {
  const candidates = [];
  const seenCandidates = new Map();
  const blocks = textBlocks(text);
  const ignoredForWork = workIgnoredTests(text);
  const lines = removeXmlMarkup(text).split('\n');

  lines.forEach((lineText, index) => {
    const line = index + 1;
    const block = blocks.find(
      candidateBlock =>
        line >= candidateBlock.startLine && line <= candidateBlock.endLine
    );
    if (block?.skipIndex) {
      return;
    }

    const context = lineText.replace(/\s+/g, ' ').trim();
    if (context === '') {
      return;
    }

    for (const match of context.matchAll(mojibakeTokenRegexp)) {
      addCandidate(candidates, seenCandidates, {
        file: filename,
        line,
        textId: block?.id ?? '',
        word: match[0],
        context,
        ignoredTests: mergeIgnoredTests(
          ignoredForWork,
          block?.ignoredTests ?? []
        ),
        priority: 'høj',
        rule: 'mojibake',
        reason: 'tegnfølge tyder på forkert tegnkodning',
      });
    }
  });

  return candidates;
};

const findOcrCandidatesInFile = ({ filename, text, lang }) => {
  const ignoredForWork = workIgnoredTests(text);
  const mojibakeCandidates = findMojibakeCandidatesInFile({ filename, text });
  const blocks = textBlocks(text);
  const aaRingCount = blocks.reduce((count, block) => {
    const activeLang = block.lang ?? lang;
    if (block.skipIndex || activeLang !== 'da') {
      return count;
    }
    const searchableText = stripXml(removeIgnoredXml(block.text));
    return count + (searchableText.match(/[åÅ]/gu)?.length ?? 0);
  }, 0);
  const blockCandidates = blocks.flatMap(block => {
    const activeLang = block.lang ?? lang;
    if (block.skipIndex) {
      return [];
    }

    return findTextBlockCandidates({
      filename,
      block: {
        ...block,
        ignoredTests: mergeIgnoredTests(ignoredForWork, block.ignoredTests),
      },
      lang: activeLang,
      reportSingleAaRing: aaRingCount < 10,
    });
  });

  return [...mojibakeCandidates, ...blockCandidates];
};

const findOcrCandidates = ({ rootDir = process.cwd(), files = null } = {}) => {
  const poetLangs = loadPoetLangs(rootDir);
  const filenames = files ?? trackedFiles(rootDir);
  const candidates = filenames.flatMap(filename => {
    const fullFilename = path.join(rootDir, filename);
    return findOcrCandidatesInFile({
      filename,
      text: fs.readFileSync(fullFilename, 'utf8'),
      lang: langForFile(filename, poetLangs),
    });
  });

  return candidates.sort(compareCandidates);
};

const formatCandidate = candidate =>
  [
    candidate.priority,
    `${candidate.file}:${candidate.line}`,
    candidate.textId,
    candidate.word,
    candidate.rule,
    candidate.reason,
    candidate.context,
  ].join('\t');

const usage = () => {
  console.error('Brug: node tools/report-ocr-candidates.js [fil ...]');
};

const printFooter = candidateCount => {
  console.error(`${candidateCount} kandidat(er) fundet.`);
  console.error(
    'Legitime forekomster kan undtages pr. regel med fx ignore-tests="regelnavn" på det relevante <text>- eller <kalliopework>-element.'
  );
};

const main = () => {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    usage();
    return;
  }

  const files = args.length > 0 ? args : null;
  const candidates = findOcrCandidates({ files });
  candidates.forEach(candidate => {
    console.log(formatCandidate(candidate));
  });
  printFooter(candidates.length);
};

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}

export {
  findOcrCandidates,
  findOcrCandidatesInFile,
  findMojibakeCandidatesInFile,
  findTextBlockCandidates,
  formatCandidate,
  removeIgnoredXml,
  removeXmlMarkup,
  repeatedWordsInContext,
  stripXml,
  suggestedWordform,
  textBlocks,
  wordHasAaCircumflexMix,
  wordHasAaRingMix,
  wordHasInternalUppercase,
  wordHasInternalUppercaseCircumflex,
};
