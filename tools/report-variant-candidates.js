import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMParser } from '@xmldom/xmldom';

const decisionsFilename = 'tools/variant-candidate-decisions.json';
const minimumTitleSimilarity = 0.5;
const minimumBodySimilarity = 0.8;
const minimumBroadComparisonWords = 8;

const normalizeText = value =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zæøå0-9]/g, '');

const words = value =>
  new Set(
    value
      .toLowerCase()
      .replace(/[^a-zæøå0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
  );

const jaccardSimilarity = (wordsA, wordsB) => {
  if (wordsA.size === 0 || wordsB.size === 0) {
    return 0;
  }
  let intersectionSize = 0;
  wordsA.forEach(word => {
    if (wordsB.has(word)) {
      intersectionSize++;
    }
  });
  return intersectionSize / (wordsA.size + wordsB.size - intersectionSize);
};

const textContent = (parent, tagName) =>
  parent
    ?.getElementsByTagName(tagName)[0]
    ?.textContent.trim()
    .replace(/\s+/g, ' ') ?? '';

const loadPoetIds = rootDir => {
  const fdirs = path.join(rootDir, 'fdirs');
  return fs
    .readdirSync(fdirs)
    .filter(poetId => {
      const infoFilename = path.join(fdirs, poetId, 'info.xml');
      if (!fs.existsSync(infoFilename)) {
        return false;
      }
      const doc = new DOMParser().parseFromString(
        fs.readFileSync(infoFilename, 'utf8'),
        'text/xml'
      );
      return doc.documentElement?.getAttribute('type') === 'poet';
    })
    .sort();
};

const variantNotePattern =
  /\b(?:variant|variation|fassung|version|omarbejd)\b/iu;

const poemReferences = text =>
  Array.from(text.getElementsByTagName('note'))
    .filter(note => variantNotePattern.test(note.textContent))
    .flatMap(note => Array.from(note.getElementsByTagName('*')))
    .map(element => element.getAttribute('poem'))
    .filter(poemId => poemId != null)
    .flatMap(poemIds => poemIds.split(',').slice(0, 1))
    .map(poemId => poemId.trim())
    .filter(poemId => poemId.length > 0);

const loadTexts = (rootDir, poetIds = loadPoetIds(rootDir)) => {
  const result = [];
  poetIds.forEach(poetId => {
    const poetDir = path.join(rootDir, 'fdirs', poetId);
    fs.readdirSync(poetDir)
      .filter(filename => filename.endsWith('.xml'))
      .sort()
      .forEach(filename => {
        const relativeFilename = `fdirs/${poetId}/${filename}`;
        const xml = fs.readFileSync(path.join(rootDir, relativeFilename), 'utf8');
        if (!xml.includes('<kalliopework')) {
          return;
        }
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const work = doc.documentElement;
        const workAuthor = work.getAttribute('author') ?? poetId;
        const workYear = textContent(
          work.getElementsByTagName('workhead')[0],
          'year'
        );
        Array.from(work.getElementsByTagName('text')).forEach(text => {
          const id = text.getAttribute('id');
          const head = text.getElementsByTagName('head')[0];
          const body = text.getElementsByTagName('body')[0];
          if (id == null || head == null || body == null) {
            return;
          }
          const bodyText = body.textContent.trim().replace(/\s+/g, ' ');
          result.push({
            id,
            author: text.getAttribute('author') ?? workAuthor,
            poetId,
            file: relativeFilename,
            workYear,
            title: textContent(head, 'title'),
            firstline: textContent(head, 'firstline'),
            body: bodyText,
            normalizedTitle: normalizeText(textContent(head, 'title')),
            normalizedFirstline: normalizeText(textContent(head, 'firstline')),
            normalizedBody: normalizeText(bodyText),
            words: words(bodyText),
            variant: text.getAttribute('variant'),
            poemReferences: poemReferences(text),
          });
        });
      });
  });
  return result;
};

class VariantComponents {
  constructor(texts) {
    this.parents = new Map(texts.map(text => [text.id, text.id]));
    texts.forEach(text => {
      if (text.variant != null) {
        this.union(text.id, text.variant);
      }
    });
  }

  find(textId) {
    const parent = this.parents.get(textId);
    if (parent == null || parent === textId) {
      return parent;
    }
    const root = this.find(parent);
    this.parents.set(textId, root);
    return root;
  }

  union(textIdA, textIdB) {
    if (!this.parents.has(textIdA) || !this.parents.has(textIdB)) {
      return;
    }
    this.parents.set(this.find(textIdA), this.find(textIdB));
  }

  connected(textIdA, textIdB) {
    const rootA = this.find(textIdA);
    const rootB = this.find(textIdB);
    return rootA != null && rootA === rootB;
  }
}

const pairKey = (textIdA, textIdB) =>
  [textIdA, textIdB].sort().join('\u0000');

const addCandidate = (candidates, components, textA, textB, signal) => {
  if (
    textA.id === textB.id ||
    textA.author !== textB.author ||
    components.connected(textA.id, textB.id)
  ) {
    return;
  }
  const key = pairKey(textA.id, textB.id);
  let candidate = candidates.get(key);
  if (candidate == null) {
    const [first, second] = [textA, textB].sort((a, b) =>
      a.id.localeCompare(b.id)
    );
    candidate = {
      key,
      author: first.author,
      texts: [first, second],
      similarity: jaccardSimilarity(first.words, second.words),
      signals: new Set(),
    };
    candidates.set(key, candidate);
  }
  candidate.signals.add(signal);
};

const addGroupedCandidates = (
  candidates,
  components,
  texts,
  keyForText,
  signal,
  acceptPair = () => true
) => {
  const groups = new Map();
  texts.forEach(text => {
    const key = keyForText(text);
    if (key.length === 0) {
      return;
    }
    const groupKey = `${text.author}\u0000${key}`;
    const group = groups.get(groupKey) ?? [];
    group.push(text);
    groups.set(groupKey, group);
  });
  groups.forEach(group => {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (acceptPair(group[i], group[j])) {
          addCandidate(
            candidates,
            components,
            group[i],
            group[j],
            signal
          );
        }
      }
    }
  });
};

const addBroadSimilarityCandidates = (candidates, components, texts) => {
  const textsByAuthor = new Map();
  texts.forEach(text => {
    if (text.words.size < minimumBroadComparisonWords) {
      return;
    }
    const authorTexts = textsByAuthor.get(text.author) ?? [];
    authorTexts.push(text);
    textsByAuthor.set(text.author, authorTexts);
  });
  textsByAuthor.forEach(authorTexts => {
    for (let i = 0; i < authorTexts.length; i++) {
      for (let j = i + 1; j < authorTexts.length; j++) {
        const textA = authorTexts[i];
        const textB = authorTexts[j];
        const sizeRatio =
          Math.min(textA.words.size, textB.words.size) /
          Math.max(textA.words.size, textB.words.size);
        if (sizeRatio < minimumBodySimilarity) {
          continue;
        }
        const similarity = jaccardSimilarity(textA.words, textB.words);
        if (similarity >= minimumBodySimilarity) {
          addCandidate(
            candidates,
            components,
            textA,
            textB,
            'body-similarity'
          );
        }
      }
    }
  });
};

const addReferenceCandidates = (candidates, components, texts) => {
  const textsById = new Map(texts.map(text => [text.id, text]));
  texts.forEach(text => {
    text.poemReferences.forEach(referencedId => {
      const referencedText = textsById.get(referencedId);
      if (referencedText != null) {
        addCandidate(
          candidates,
          components,
          text,
          referencedText,
          'note-reference'
        );
      }
    });
  });
};

const loadDecisions = rootDir => {
  const filename = path.join(rootDir, decisionsFilename);
  if (!fs.existsSync(filename)) {
    return { rejected: [], deferred: [] };
  }
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
};

const reviewedDecisions = decisions =>
  new Map(
    ['rejected', 'deferred'].flatMap(status =>
      (decisions[status] ?? []).map(decision => [
        pairKey(decision.texts[0], decision.texts[1]),
        { ...decision, status },
      ])
    )
  );

const compareCandidates = (candidateA, candidateB) => {
  return (
    Number(candidateB.signals.includes('exact-body')) -
      Number(candidateA.signals.includes('exact-body')) ||
    candidateB.similarity - candidateA.similarity ||
    candidateA.author.localeCompare(candidateB.author) ||
    candidateA.texts[0].id.localeCompare(candidateB.texts[0].id) ||
    candidateA.texts[1].id.localeCompare(candidateB.texts[1].id)
  );
};

const findVariantCandidates = ({
  rootDir = process.cwd(),
  includeReviewed = false,
  poetIds = null,
} = {}) => {
  const texts = loadTexts(rootDir, poetIds ?? loadPoetIds(rootDir));
  const components = new VariantComponents(texts);
  const candidates = new Map();

  addGroupedCandidates(
    candidates,
    components,
    texts,
    text => text.normalizedFirstline,
    'same-firstline'
  );
  addGroupedCandidates(
    candidates,
    components,
    texts,
    text => text.normalizedBody,
    'exact-body'
  );
  addGroupedCandidates(
    candidates,
    components,
    texts,
    text => text.normalizedTitle,
    'same-title',
    (textA, textB) =>
      jaccardSimilarity(textA.words, textB.words) >= minimumTitleSimilarity
  );
  addBroadSimilarityCandidates(candidates, components, texts);
  addReferenceCandidates(candidates, components, texts);

  const decisions = reviewedDecisions(loadDecisions(rootDir));
  return Array.from(candidates.values())
    .map(candidate => {
      const decision = decisions.get(candidate.key) ?? null;
      return {
        ...candidate,
        signals: Array.from(candidate.signals).sort(),
        decision,
      };
    })
    .filter(candidate => includeReviewed || candidate.decision == null)
    .sort(compareCandidates);
};

const formatCandidate = candidate => {
  const [textA, textB] = candidate.texts;
  return [
    candidate.decision?.status ?? 'unreviewed',
    candidate.similarity.toFixed(3),
    candidate.signals.join(','),
    candidate.author,
    `${textA.id} (${textA.file}, ${textA.workYear || '?'}, ${textA.title || textA.firstline})`,
    `${textB.id} (${textB.file}, ${textB.workYear || '?'}, ${textB.title || textB.firstline})`,
    candidate.decision?.reason ?? '',
  ].join('\t');
};

const usage = () => {
  console.error(
    'Brug: node tools/report-variant-candidates.js [--include-reviewed] [--json]'
  );
};

const main = () => {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    usage();
    return;
  }
  const knownArgs = new Set(['--include-reviewed', '--json']);
  const unknownArgs = args.filter(arg => !knownArgs.has(arg));
  if (unknownArgs.length > 0) {
    usage();
    process.exitCode = 1;
    return;
  }
  const candidates = findVariantCandidates({
    includeReviewed: args.includes('--include-reviewed'),
  });
  if (args.includes('--json')) {
    console.log(
      JSON.stringify(
        candidates.map(candidate => ({
          author: candidate.author,
          similarity: candidate.similarity,
          signals: candidate.signals,
          texts: candidate.texts.map(text => ({
            id: text.id,
            file: text.file,
            year: text.workYear,
            title: text.title,
            firstline: text.firstline,
          })),
          decision: candidate.decision,
        })),
        null,
        2
      )
    );
  } else {
    candidates.forEach(candidate => {
      console.log(formatCandidate(candidate));
    });
    console.error(`${candidates.length} kandidat(er) fundet.`);
  }
};

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}

export {
  findVariantCandidates,
  formatCandidate,
  jaccardSimilarity,
  normalizeText,
  pairKey,
};
