import fs from 'fs';
import { safeMkdir, htmlToXml, writeJSON } from '../libs/helpers.js';
import {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
} from '../libs/caching.js';
import { poetName } from './formatting.js';
import { get_pictures } from './parsing.js';
import {
  loadXMLDoc,
  safeGetInnerXML,
  safeGetText,
  safeGetAttr,
  getChildByTagName,
  getChildrenByTagName,
} from './xml.js';
import { mapLimit } from './concurrency.js';
import { canonicalKeywordId } from './keyword-taxonomy.js';

const taxonomyPath = 'content/keyword-taxonomy.json';

const loadKeywordTaxonomy = () =>
  JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));

const referenceIdsForKeyword = (keywordId, keywords) => {
  const keyword = keywords.get(canonicalKeywordId(keywordId, keywords));
  return [keyword.id, ...(keyword.aliases ?? [])];
};

const referencedTextsForKeyword = (keywordId, collected, keywords) => {
  const textIds = new Set();
  referenceIdsForKeyword(keywordId, keywords).forEach(referenceId => {
    const refs = collected.person_or_keyword_refs.get(referenceId);
    (refs?.mention ?? []).forEach(textId => {
      const text = collected.texts.get(textId);
      if (text != null && text.indexable !== false) {
        textIds.add(textId);
      }
    });
  });
  return Array.from(textIds);
};

const danishTextCountForKeyword = (keywordId, collected, keywords = null) => {
  const keywordMap = keywords ?? collected.keywords;
  if (keywordMap == null) {
    const refs = collected.person_or_keyword_refs.get(keywordId);
    if (refs == null) {
      return 0;
    }
    return new Set(
      refs.mention.filter(textId => {
        const text = collected.texts.get(textId);
        return (
          text != null &&
          text.indexable !== false &&
          collected.poets.get(text.poetId)?.country === 'dk'
        );
      })
    ).size;
  }
  return referencedTextsForKeyword(keywordId, collected, keywordMap).filter(
    textId => {
      const text = collected.texts.get(textId);
      return collected.poets.get(text.poetId)?.country === 'dk';
    }
  ).length;
};

const examplesForKeyword = (keywordId, collected, keywords) =>
  referencedTextsForKeyword(keywordId, collected, keywords)
    .map(textId => {
      const text = collected.texts.get(textId);
      const poet = collected.poets.get(text.poetId);
      return {
        id: textId,
        title: text.title,
        poet: poetName(poet),
        country: poet.country,
        lang: poet.lang,
      };
    })
    .sort((a, b) => {
      const countryComparison =
        Number(b.country === 'dk') - Number(a.country === 'dk');
      if (countryComparison !== 0) {
        return countryComparison;
      }
      return a.id.localeCompare(b.id);
    })
    .slice(0, 3)
    .map(({ id, title, poet }) => ({ id, title, poet }));

const validateAndApplyTaxonomy = (keywords, taxonomy) => {
  const aliasesByCanonicalId = new Map();
  Object.entries(taxonomy.aliases).forEach(([aliasId, canonicalId]) => {
    if (keywords.has(aliasId) === false) {
      throw new Error(`${taxonomyPath}: Ukendt alias ${aliasId}`);
    }
    if (keywords.has(canonicalId) === false) {
      throw new Error(`${taxonomyPath}: Ukendt kanonisk nøgleord ${canonicalId}`);
    }
    if (taxonomy.aliases[canonicalId] != null) {
      throw new Error(`${taxonomyPath}: Aliaskæder er ikke tilladt (${aliasId})`);
    }
    const aliases = aliasesByCanonicalId.get(canonicalId) ?? [];
    aliases.push(aliasId);
    aliasesByCanonicalId.set(canonicalId, aliases);
    keywords.get(aliasId).canonicalId = canonicalId;
  });

  const categoriesByKeywordId = new Map();
  const defaultCategories = taxonomy.categories.filter(
    category => category.default === true
  );
  if (defaultCategories.length !== 1) {
    throw new Error(`${taxonomyPath}: Der skal være præcis én standardkategori`);
  }
  taxonomy.categories.forEach(category => {
    category.members.forEach(keywordId => {
      if (keywords.has(keywordId) === false) {
        throw new Error(
          `${taxonomyPath}: Ukendt nøgleord ${keywordId} i ${category.id}`
        );
      }
      if (taxonomy.aliases[keywordId] != null) {
        throw new Error(
          `${taxonomyPath}: Kategorien ${category.id} bruger aliaset ${keywordId}`
        );
      }
      const categories = categoriesByKeywordId.get(keywordId) ?? [];
      categories.push({ id: category.id, title: category.title });
      categoriesByKeywordId.set(keywordId, categories);
    });
  });

  keywords.forEach((keyword, keywordId) => {
    if (keyword.canonicalId != null) {
      return;
    }
    keyword.aliases = (aliasesByCanonicalId.get(keywordId) ?? []).sort();
    keyword.categories =
      categoriesByKeywordId.get(keywordId) ??
      defaultCategories.map(category => ({
        id: category.id,
        title: category.title,
      }));
  });
};

const buildRelatedKeywordMap = (parsedKeywords, keywords, categoryIds) => {
  const relatedByKeywordId = new Map();
  keywords.forEach((keyword, keywordId) => {
    if (keyword.canonicalId == null) {
      relatedByKeywordId.set(keywordId, new Set());
    }
  });
  parsedKeywords.forEach(({ head, id, path }) => {
    const fromId = canonicalKeywordId(id, keywords);
    if (categoryIds.has(fromId)) {
      return;
    }
    getChildrenByTagName(head, 'related').forEach(element => {
      const rawRelatedId = safeGetText(element).trim();
      if (keywords.has(rawRelatedId) === false) {
        throw new Error(`${path}: Ukendt relateret nøgleord ${rawRelatedId}`);
      }
      const relatedId = canonicalKeywordId(rawRelatedId, keywords);
      if (categoryIds.has(relatedId) || fromId === relatedId) {
        return;
      }
      relatedByKeywordId.get(fromId).add(relatedId);
      relatedByKeywordId.get(relatedId).add(fromId);
    });
  });
  return relatedByKeywordId;
};

const referenceSourcesModified = collected => {
  for (const [poetId, workIds] of collected.workids) {
    if (isFileModified(`fdirs/${poetId}/info.xml`)) {
      return true;
    }
    for (const workId of workIds) {
      if (isFileModified(`fdirs/${poetId}/${workId}.xml`)) {
        return true;
      }
    }
  }
  return false;
};

const build_keywords = async collected => {
  const outputFolder = 'public/api/keywords';
  safeMkdir(outputFolder);
  let collectedKeywords = new Map(loadCachedJSON('collected.keywords') ?? []);
  const folder = 'content/keywords';
  const filenames = fs
    .readdirSync(folder)
    .filter(filename => filename.endsWith('.xml'))
    .map(filename => `${folder}/${filename}`);
  if (
    collectedKeywords.size === 0 ||
    isFileModified(
      'tools/build-static/keywords.js',
      'tools/build-static/keyword-taxonomy.js',
      taxonomyPath,
      ...filenames
    ) ||
    referenceSourcesModified(collected)
  ) {
    collectedKeywords = new Map();
    const taxonomy = loadKeywordTaxonomy();
    const parsedKeywords = filenames.map(path => {
      const doc = loadXMLDoc(path);
      const keyword = getChildByTagName(doc, 'keyword');
      const head = getChildByTagName(keyword, 'head');
      return {
        path,
        keyword,
        head,
        body: getChildByTagName(keyword, 'body'),
        id: safeGetAttr(keyword, 'id'),
        isDraft: safeGetAttr(keyword, 'draft') === 'true',
        title: safeGetText(head, 'title'),
        redirectURL: safeGetAttr(keyword, 'redirect-url'),
      };
    });
    parsedKeywords.forEach(({ id, title, redirectURL, isDraft, path }) => {
      collectedKeywords.set(id, {
        id,
        title,
        redirectURL,
        isDraft,
        sourceFile: path,
      });
    });
    validateAndApplyTaxonomy(collectedKeywords, taxonomy);
    const categoryIds = new Set(taxonomy.category_keywords);
    categoryIds.forEach(categoryId => {
      if (collectedKeywords.has(categoryId) === false) {
        throw new Error(`${taxonomyPath}: Ukendt kategorinøgleord ${categoryId}`);
      }
    });
    const relatedByKeywordId = buildRelatedKeywordMap(
      parsedKeywords,
      collectedKeywords,
      categoryIds
    );

    const keywordsToc = [];
    const outputFilenames = new Set();
    await mapLimit(
      parsedKeywords,
      async ({ path, head, body, id, isDraft, title, redirectURL }) => {
        const metadata = collectedKeywords.get(id);
        let data = { id, title };
        if (metadata.canonicalId != null) {
          data.redirectURL = '/${lang}/keyword/' + metadata.canonicalId;
          data.canonical_id = metadata.canonicalId;
        } else if (redirectURL != null) {
          data.redirectURL = redirectURL;
        } else {
          const pictures = await get_pictures(
            head,
            '/images/keywords',
            path,
            collected
          );
          const author = safeGetText(head, 'author');
          const rawBody = safeGetInnerXML(body) ?? '';
          const contentHtml = htmlToXml(rawBody, collected);
          const sources = (getChildrenByTagName(head, 'source') ?? []).map(
            source => ({
              content_html: htmlToXml(safeGetInnerXML(source), collected),
              href: safeGetAttr(source, 'href'),
            })
          );
          const hasFootnotes =
            rawBody.indexOf('<footnote') !== -1 ||
            rawBody.indexOf('<note') !== -1;
          const related = Array.from(relatedByKeywordId.get(id))
            .map(relatedId => ({
              id: relatedId,
              title: collectedKeywords.get(relatedId).title,
            }))
            .sort((a, b) => a.title.localeCompare(b.title, 'da'));
          data = {
            ...data,
            is_draft: isDraft,
            author,
            sources,
            pictures,
            has_footnotes: hasFootnotes,
            danish_text_count: danishTextCountForKeyword(
              id,
              collected,
              collectedKeywords
            ),
            examples: examplesForKeyword(id, collected, collectedKeywords),
            aliases: metadata.aliases.map(aliasId => ({
              id: aliasId,
              title: collectedKeywords.get(aliasId).title,
            })),
            categories: metadata.categories,
            related,
            content_lang: 'da',
            content_html: contentHtml,
          };
        }

        if (metadata.canonicalId == null) {
          keywordsToc.push({
            id,
            title,
            redirectURL,
            is_draft: isDraft,
            categories: metadata.categories,
          });
        }
        const outFilename = `${outputFolder}/${id}.json`;
        outputFilenames.add(`${id}.json`);
        writeJSON(outFilename, data);
      }
    );
    for (const filename of fs.readdirSync(outputFolder)) {
      if (filename.endsWith('.json') && outputFilenames.has(filename) === false) {
        fs.unlinkSync(`${outputFolder}/${filename}`);
      }
    }
    writeCachedJSON('collected.keywords', Array.from(collectedKeywords));
    writeJSON('public/api/keywords.json', keywordsToc);
    writeJSON(
      'public/api/keyword-categories.json',
      taxonomy.categories.map(({ id, title }) => ({ id, title }))
    );
  }
  return collectedKeywords;
};

export {
  build_keywords,
  canonicalKeywordId,
  danishTextCountForKeyword,
  validateAndApplyTaxonomy,
};
