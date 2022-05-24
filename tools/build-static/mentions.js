const {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
  force_reload: globalForceReload,
} = require('../libs/caching.js');
const {
  safeMkdir,
  writeJSON,
  htmlToXml,
  fileExists,
} = require('../libs/helpers.js');
const {
  loadXMLDoc,
  safeGetText,
  safeGetAttr,
  getElementsByTagNames,
  getElementsByTagName,
  getChildrenByTagName,
  getChildByTagName,
  safeGetOuterXML,
  safeGetInnerXML,
} = require('./xml.js');
const { poetName, workLinkName } = require('./formatting.js');
const { primaryTextVariantId } = require('./variants.js');

const person_mentions_dirty = new Set();

const build_person_or_keyword_refs = (collected) => {
  let person_or_keyword_refs = globalForceReload
    ? new Map([])
    : new Map(loadCachedJSON('collected.person_or_keyword_refs') || []);
  const forced_reload = person_or_keyword_refs.size == 0;

  let found_changes = false;
  const regexps = [
    { regexp: /xref ()poem="([^"]*)"/g, type: 'text' },
    { regexp: /a ()poem="([^"]*)"/g, type: 'text' },
    { regexp: /xref type="([^"]*)" poem="([^"]*)"/g, type: 'text' },
    { regexp: /a type="([^"]*)" poem="([^"]*)"/g, type: 'text' },
    { regexp: /xref ()bibel="([^",]*)/g, type: 'text' },
    { regexp: /a ()person="([^"]*)"/g, type: 'person' },
    { regexp: /a ()poet="([^"]*)"/g, type: 'person' },
    {
      regexp: /note ()unknown-original-by="([^",]*)/g,
      type: 'unknown-original',
    },
    { regexp: /picture[^>]*()artist="([^"]*)"/g, type: 'person' },
    { regexp: /picture[^>]*()ref="([^"]*)"/g, type: 'pictureref' },
  ];
  // TODO: Led også efter <a person="">xxx</a> og <a poet="">xxxx</a>
  // toKey is a poet id or a keyword id
  const register = (filename, toKey, fromPoemId, type, toPoemId) => {
    const collection = person_or_keyword_refs.get(toKey) || {
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
        // If this is a translationed poem that were a mention earlier, remove it from mentions.
        collection.mention.splice(mentionIndex, 1);
      }
      if (
        !collection.translation.some((t) => t.translationPoemId === fromPoemId)
      ) {
        collection.translation.push({
          translationPoemId: fromPoemId,
          translatedPoemId: toPoemId,
        });
      }
    } else {
      throw new Error(`${filename} has xref with unknown type ${type}`);
    }
    person_or_keyword_refs.set(toKey, collection);
    person_mentions_dirty.add(toKey);
  };
  collected.workids.forEach((workIds, poetId) => {
    workIds.forEach((workId) => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!fileExists(filename)) {
        return;
      }
      if (!forced_reload && !isFileModified(filename)) {
        return;
      } else {
        found_changes = true;
      }
      let doc = loadXMLDoc(filename);
      getElementsByTagNames(doc, ['text', 'section'])
        .filter((s) => safeGetAttr(s, 'id') != null)
        .forEach((text) => {
          const fromId = safeGetAttr(text, 'id');
          const head = getChildByTagName(text, 'head');
          const body = getChildByTagName(text, 'body');
          const notes = [
            ...getElementsByTagNames(head, ['note', 'picture']),
            ...getElementsByTagNames(body, ['note', 'footnote']),
          ];
          notes.forEach((note) => {
            regexps.forEach((rule) => {
              while (
                (match = rule.regexp.exec(safeGetOuterXML(note))) != null
              ) {
                const refType = match[1] || 'mention';
                if (rule.type === 'text') {
                  const toPoemId = match[2].replace(/,.*$/, '');
                  const toText = collected.texts.get(toPoemId);
                  if (toText != null) {
                    const toPoetId = toText.poetId;
                    if (toPoetId !== poetId) {
                      // Skip self-refs
                      register(filename, toPoetId, fromId, refType, toPoemId);
                    }
                  } else {
                    throw new Error(
                      `${filename} points to unknown text ${toPoemId}`
                    );
                  }
                } else if (rule.type === 'person') {
                  const toPoetId = match[2];
                  register(filename, toPoetId, fromId, 'mention');
                } else if (rule.type === 'unknown-original') {
                  const toPoetId = match[2];
                  register(filename, toPoetId, fromId, 'translation', null);
                } else if (rule.type === 'pictureref') {
                  const pictureRef = match[2];
                  if (!pictureRef.match('/')) {
                    throw new Error(
                      `${filename} points has illegal picture ref ${pictureRef}. 
                      It should be on the form "{artist-id}/{picture-id}" or "kunst/{picture-id}"`
                    );
                  }
                  const picture = collected.artwork.get(pictureRef);
                  if (picture == null) {
                    throw new Error(
                      `${filename} points to unknown picture ${pictureRef}`
                    );
                  }
                  register(filename, picture.artistId, fromId, 'mention');
                }
              }
            });
          });
          const keywords = safeGetText(head, 'keywords') || '';
          if (keywords.trim().length > 0) {
            keywords.split(',').forEach((keyword) => {
              register(filename, keyword, fromId, 'mention');
            });
          }
        });
    });
  });
  if (found_changes) {
    writeCachedJSON(
      'collected.person_or_keyword_refs',
      Array.from(person_or_keyword_refs)
    );
  }
  collected.person_or_keyword_refs = person_or_keyword_refs;
};

const build_mentions_json = (collected) => {
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
    if (!poet.has_mentions) {
      return;
    }
    const biblioFilesAreModifed =
      isFileModified(`fdirs/${poet.id}/bibliography-primary.xml`) ||
      isFileModified(`fdirs/${poet.id}/bibliography-secondary.xml`);
    if (!biblioFilesAreModifed && !person_mentions_dirty.has(poet.id)) {
      return;
    }

    safeMkdir(`static/api/${poet.id}`);
    let data = {
      poet,
      mentions: [],
      translations: [],
      primary: [],
      secondary: [],
    };
    const refs = collected.person_or_keyword_refs.get(poetId);
    if (refs != null) {
      const seenTranslations = new Set();
      data.translations = refs.translation
        .filter((t) => {
          // Fjern oversættelser som ikke er den ældste variant
          const { translationPoemId, _ } = t;
          return (
            primaryTextVariantId(translationPoemId, collected) ===
            translationPoemId
          );
        })
        .map((t) => {
          const { translationPoemId, translatedPoemId } = t;
          const translationPoem = collected.texts.get(translationPoemId);
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
      data.mentions = refs.mention
        .filter((id) => {
          // Hvis en tekst har varianter som også henviser til denne,
          // vil vi kun vise den ældste variant.
          return primaryTextVariantId(id, collected) === id;
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

    const outFilename = `static/api/${poet.id}/mentions.json`;
    console.log(outFilename);
    writeJSON(outFilename, data);
  });
};

module.exports = {
  build_person_or_keyword_refs,
  build_mentions_json,
};
