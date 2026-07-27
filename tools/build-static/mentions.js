import {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
  force_reload as globalForceReload,
} from '../libs/caching.js';
import {
  safeMkdir,
  writeJSON,
  htmlToXml,
  fileExists,
  removeFile,
} from '../libs/helpers.js';
import {
  loadXMLDoc,
  safeGetText,
  safeGetAttr,
  getElementsByTagNames,
  getElementsByTagName,
  getChildrenByTagName,
  getChildByTagName,
  safeGetOuterXML,
  safeGetInnerXML,
} from './xml.js';
import { poetName, workLinkName } from './formatting.js';
import { primaryTextVariantId } from './variants.js';
import { loadExternalIdentifiers } from './external-identifiers.js';
import { createProgressReporter } from './progress.js';
import { findTextInUnlistedWork } from './workfiles.js';

const person_mentions_dirty = new Set();

const refsEqual = (left, right) =>
  JSON.stringify(left || { mention: [], translation: [] }) ===
  JSON.stringify(right || { mention: [], translation: [] });

const collectPersonOrKeywordRefs = refsByFile => {
  const collectedRefs = new Map();
  const register = ({ toKey, fromPoemId, type, toPoemId }) => {
    const collection = collectedRefs.get(toKey) || {
      mention: [],
      translation: [],
    };
    if (type === 'mention') {
      if (
        collection.mention.indexOf(fromPoemId) === -1 &&
        collection.translation.indexOf(fromPoemId) === -1
      ) {
        collection.mention.push(fromPoemId);
      }
    } else if (type === 'translation') {
      const mentionIndex = collection.mention.indexOf(fromPoemId);
      if (mentionIndex > -1) {
        collection.mention.splice(mentionIndex, 1);
      }
      if (
        !collection.translation.some(
          t => t.translationPoemId === fromPoemId
        )
      ) {
        collection.translation.push({
          translationPoemId: fromPoemId,
          translatedPoemId: toPoemId,
        });
      }
    }
    collectedRefs.set(toKey, collection);
  };
  refsByFile.forEach(refs => refs.forEach(register));
  return collectedRefs;
};

const build_person_or_keyword_refs = (collected) => {
  const cachedRefs = new Map(
    loadCachedJSON('collected.person_or_keyword_refs') || []
  );
  let refsByFile = globalForceReload
    ? new Map()
    : new Map(
        loadCachedJSON('collected.person_or_keyword_refs_by_file') || []
      );
  const forced_reload = refsByFile.size === 0;

  let found_changes = false;
  const regexps = [
    { regexp: /xref poem="(?<poem>[^"]*)"/g, type: 'text' },
    { regexp: /a poem="(?<poem>[^"]*)"/g, type: 'text' },
    {
      regexp: /xref type="(?<type>[^"]*)" poem="(?<poem>[^"]*)"/g,
      type: 'text',
    },
    {
      regexp: /xref poem="(?<poem>[^"]*)" type="(?<type>[^"]*)"/g,
      type: 'text',
    },
    { regexp: /a type="(?<type>[^"]*)" poem="(?<poem>[^"]*)"/g, type: 'text' },
    { regexp: /xref bibel="(?<poem>[^",]*)/g, type: 'text' },
    { regexp: /a ()person="([^"]*)"/g, type: 'person' },
    { regexp: /a ()poet="([^"]*)"/g, type: 'person' },
    {
      regexp: /note ()unknown-original-by="([^",]*)/g,
      type: 'unknown-original',
    },
    { regexp: /picture[^>]*()artist="([^"]*)"/g, type: 'person' },
    {
      regexp: /picture[^>]*(?:artwork|ref)="([^"]*)"/g,
      type: 'pictureref',
    },
  ];

  const knownFiles = new Set();
  collected.workids.forEach((workIds, poetId) => {
    workIds.forEach((workId) => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!fileExists(filename)) {
        return;
      }
      knownFiles.add(filename);
      if (!forced_reload && !isFileModified(filename)) {
        return;
      } else {
        found_changes = true;
      }
      const fileRefs = [];
      const register = (toKey, fromPoemId, type, toPoemId) => {
        if (type !== 'mention' && type !== 'translation') {
          throw new Error(
            `${filename} ${fromPoemId}: has xref with unknown type ${type}`
          );
        }
        fileRefs.push({ toKey, fromPoemId, type, toPoemId });
      };
      let doc = loadXMLDoc(filename);
      getElementsByTagNames(doc, ['text', 'section'])
        .filter((s) => safeGetAttr(s, 'id') != null)
        .forEach((text) => {
          const fromId = safeGetAttr(text, 'id');
          const fromText = collected.texts.get(fromId);
          const fromPoetId = fromText == null ? poetId : fromText.poetId;
          const head = getChildByTagName(text, 'head');
          const body = getChildByTagName(text, 'body');
          const linkedPoetIds = new Set();
          const notes = [
            ...getElementsByTagNames(head, ['note', 'picture']),
            ...getElementsByTagNames(body, ['note', 'footnote']),
          ];
          notes.forEach((note) => {
            regexps.forEach((rule) => {
              let match;
              while (
                (match = rule.regexp.exec(safeGetOuterXML(note))) != null
              ) {
                if (rule.type === 'text') {
                  const refType = match.groups.type || 'mention';
                  const toPoemId = match.groups.poem.replace(/,.*$/, '');
                  const toText = collected.texts.get(toPoemId);
                  if (toText != null) {
                    const toPoetId = toText.poetId;
                    if (toPoetId !== fromPoetId) {
                      // Skip self-refs
                      linkedPoetIds.add(toPoetId);
                      register(toPoetId, fromId, refType, toPoemId);
                    }
                  } else {
                    const unlistedWork = findTextInUnlistedWork(
                      toPoemId,
                      collected.unlistedWorkFiles || [],
                    );
                    if (unlistedWork != null) {
                      throw new Error(
                        `${filename} ${fromId}: points to unknown text ${toPoemId}. ` +
                        `The text is in ${unlistedWork.filename}, but that work ` +
                        `is not listed in <works> in ${unlistedWork.infoFilename}.`,
                      );
                    }
                    throw new Error(
                      `${filename} ${fromId}: points to unknown text ${toPoemId}`
                    );
                  }
                } else if (rule.type === 'person') {
                  const toPoetId = match[2];
                  register(toPoetId, fromId, 'mention');
                } else if (rule.type === 'unknown-original') {
                  const toPoetId = match[2];
                  register(toPoetId, fromId, 'translation', null);
                } else if (rule.type === 'pictureref') {
                  const pictureRef = match[1];
                  if (!pictureRef.match('/')) {
                    throw new Error(
                      `${filename} ${fromId}: points has illegal picture ref ${pictureRef}.
                      It should be on the form "{artist-id}/{picture-id}" or "kunst/{picture-id}"`
                    );
                  }
                  const picture = collected.artwork.get(pictureRef);
                  if (picture == null) {
                    throw new Error(
                      `${filename} ${fromId}: points to unknown picture ${pictureRef}`
                    );
                  }
                  register(picture.artistId, fromId, 'mention');
                }
              }
            });
          });
          const keywords = safeGetText(head, 'keywords') || '';
          if (keywords.trim().length > 0) {
            keywords.split(',').forEach((keyword) => {
              const keywordId = keyword.trim();
              if (keywordId.length === 0) {
                return;
              }
              if (linkedPoetIds.has(keywordId)) {
                throw new Error(
                  `${filename} ${fromId}: Overflødig keyword-reference ${keywordId}`
                );
              }
              register(keywordId, fromId, 'mention');
            });
          }
        });
      refsByFile.set(filename, fileRefs);
    });
  });
  Array.from(refsByFile.keys()).forEach(filename => {
    if (!knownFiles.has(filename)) {
      refsByFile.delete(filename);
      found_changes = true;
    }
  });
  const person_or_keyword_refs = collectPersonOrKeywordRefs(refsByFile);
  if (found_changes) {
    const allKeys = new Set([
      ...cachedRefs.keys(),
      ...person_or_keyword_refs.keys(),
    ]);
    allKeys.forEach(key => {
      if (!refsEqual(cachedRefs.get(key), person_or_keyword_refs.get(key))) {
        person_mentions_dirty.add(key);
      }
    });
    writeCachedJSON(
      'collected.person_or_keyword_refs',
      Array.from(person_or_keyword_refs)
    );
    writeCachedJSON(
      'collected.person_or_keyword_refs_by_file',
      Array.from(refsByFile)
    );
  }
  collected.person_or_keyword_refs = person_or_keyword_refs;
};

const build_mentions_data = (
  poet,
  poetId,
  collected,
  build_html,
  identifiers = {},
) => {
  let data = {
    poet,
    identifiers,
    mentions: [],
    translations: [],
    primary: [],
    secondary: [],
  };
  const refs = collected.person_or_keyword_refs.get(poetId);
  if (refs != null) {
    const seenTranslations = new Set();
    const seenTranslationKeys = new Set();
    data.translations = refs.translation
      .map((t) => {
        const translationPoemId = primaryTextVariantId(
          t.translationPoemId,
          collected
        );
        const translatedPoemId =
          t.translatedPoemId == null
            ? null
            : primaryTextVariantId(t.translatedPoemId, collected);
        return {
          translationPoemId,
          translatedPoemId,
        };
      })
      .filter((t) => {
        const key = `${t.translationPoemId}:${t.translatedPoemId || ''}`;
        if (seenTranslationKeys.has(key)) {
          return false;
        }
        seenTranslationKeys.add(key);
        return true;
      })
      .map((t) => {
        const { translationPoemId, translatedPoemId } = t;
        const translationPoem = collected.texts.get(translationPoemId);
        if (translationPoem == null) {
          throw new Error(
            `${poetId}: translation text ${translationPoemId} (from ${t.translationPoemId}) not found in texts.`
          );
        }
        let translatedPoem = null;
        if (translatedPoemId != null) {
          translatedPoem = collected.texts.get(translatedPoemId);
          if (translatedPoem == null) {
            throw `${translatedPoemId} not found in texts.`;
          }
          seenTranslations.add(translationPoemId);
        }
        const result = {
          translation: {
            poem: translationPoem,
            work: collected.works.get(
              `${translationPoem.poetId}/${translationPoem.workId}`
            ),
            poet: collected.poets.get(translationPoem.poetId),
          },
        };
        if (translatedPoem != null) {
          result.translated = {
            poem: translatedPoem,
            work: collected.works.get(
              `${translatedPoem.poetId}/${translatedPoem.workId}`
            ),
          };
        }
        return result;
      });
    const seenMentionIds = new Set();
    data.mentions = refs.mention
      .map((id) => {
        // Hvis en tekst har varianter som også henviser til denne,
        // vil vi kun vise den ældste variant.
        return primaryTextVariantId(id, collected);
      })
      .filter((id) => {
        if (seenMentionIds.has(id)) {
          return false;
        }
        seenMentionIds.add(id);
        return true;
      })
      .filter((id) => {
        const isAlsoTranslation = seenTranslations.has(id);
        if (isAlsoTranslation) {
          console.log(`Translation ${id} has superfluous mention.`);
        }
        return !isAlsoTranslation;
      })
      .map(build_html);
  }

  ['primary', 'secondary'].forEach((filename) => {
    const biblioXmlPath = `fdirs/${poet.id}/bibliography-${filename}.xml`;
    const doc = loadXMLDoc(biblioXmlPath);
    if (doc != null) {
      data[filename] = getElementsByTagName(doc, 'item').map((line) => {
        return htmlToXml(safeGetInnerXML(line), collected);
      });
    } else {
      data[filename] = [];
    }
  });

  return data;
};

const build_mentions_json = (collected) => {
  const progress = createProgressReporter('Skrev mentions.json-filer', 100);
  const build_html = (poemId) => {
    const meta = collected.texts.get(poemId);
    if (meta == null) {
      throw `Unknown poem ${poemId}`;
    }
    const poetObj = collected.poets.get(meta.poetId);
    if (poetObj == null) {
      throw `Unknown poet ${meta.poetId}`;
    }
    const poet = poetName(poetObj);
    const work = collected.works.get(meta.poetId + '/' + meta.workId);
    if (work == null) {
      throw `${poemId} references unknown work ${
        meta.poetId + '/' + meta.workId
      }`;
    }
    const workNameFormattet =
      work.id === 'andre' ? '' : ` - ${workLinkName(work)}`;
    return [
      [
        `${poet}: <a poem="${poemId}">»${meta.title}«</a>${workNameFormattet}`,
        { html: true },
      ],
    ];
  };

  collected.poets.forEach((poet, poetId) => {
    const outFilename = `public/api/${poet.id}/mentions.json`;
    if (!poet.has_mentions) {
      removeFile(outFilename);
      return;
    }
    const biblioFilesAreModifed =
      isFileModified(`fdirs/${poet.id}/bibliography-primary.xml`) ||
      isFileModified(`fdirs/${poet.id}/bibliography-secondary.xml`);
    const externalIdentifiersModified = isFileModified(
      `fdirs/${poet.id}/info.xml`,
      'common/external-identifiers.js',
      'tools/build-static/external-identifiers.js',
    );
    const shouldRebuild =
      biblioFilesAreModifed ||
      externalIdentifiersModified ||
      person_mentions_dirty.has(poet.id) ||
      collected.poetMetadataDirty?.has(poet.id) ||
      !fileExists(outFilename);
    if (!shouldRebuild) {
      return;
    }

    safeMkdir(`public/api/${poet.id}`);
    let data = build_mentions_data(
      poet,
      poetId,
      collected,
      build_html,
      loadExternalIdentifiers(poetId),
    );

    writeJSON(outFilename, data);
    progress.increment();
  });
  progress.finish();
};

export {
  build_person_or_keyword_refs,
  build_mentions_data,
  build_mentions_json,
  collectPersonOrKeywordRefs,
};
