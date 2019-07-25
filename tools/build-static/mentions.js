const {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
} = require('../libs/caching.js');
const {
  safeMkdir,
  writeJSON,
  loadXMLDoc,
  htmlToXml,
} = require('../libs/helpers.js');
const { safeGetText } = require('./xml.js');
const { poetName, workLinkName } = require('./formatting.js');
const { primaryTextVariantId } = require('./variants.js');

const person_mentions_dirty = new Set();

const build_person_or_keyword_refs = collected => {
  let person_or_keyword_refs = new Map(
    loadCachedJSON('collected.person_or_keyword_refs') || []
  );
  const force_reload = person_or_keyword_refs.size == 0;
  let found_changes = false;
  const regexps = [
    { regexp: /xref ()poem="([^"]*)"/g, type: 'text' },
    { regexp: /a ()poem="([^"]*)"/g, type: 'text' },
    { regexp: /xref type="([^"]*)" poem="([^"]*)"/g, type: 'text' },
    { regexp: /a type="([^"]*)" poem="([^"]*)"/g, type: 'text' },
    { regexp: /xref ()bibel="([^",]*)/g, type: 'text' },
    { regexp: /a ()person="([^"]*)"/g, type: 'person' },
    { regexp: /a ()poet="([^"]*)"/g, type: 'person' },
  ];
  // TODO: Led også efter <a person="">xxx</a> og <a poet="">xxxx</a>
  // toKey is a poet id or a keyword id
  const register = (filename, toKey, fromPoemId, type) => {
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
        collection.mention.splice(mentionIndex, 1);
      }
      if (collection.translation.indexOf(fromPoemId) === -1) {
        collection.translation.push(fromPoemId);
      }
    } else {
      throw new Error(`${filename} has xref with unknown type ${type}`);
    }
    person_or_keyword_refs.set(toKey, collection);
    person_mentions_dirty.add(toKey);
  };
  collected.workids.forEach((workIds, poetId) => {
    workIds.forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!force_reload && !isFileModified(filename)) {
        return;
      } else {
        found_changes = true;
      }
      let doc = loadXMLDoc(filename);
      const texts = doc.find('//poem|//prose');
      texts.forEach(text => {
        const fromId = text.attr('id').value();
        const notes = text.find(
          'head/notes/note|head/pictures/picture|body//footnote|body//note|body'
        );
        notes.forEach(note => {
          regexps.forEach(rule => {
            while ((match = rule.regexp.exec(note.toString())) != null) {
              const refType = match[1] || 'mention';
              if (rule.type === 'text') {
                const toPoemId = match[2].replace(/,.*$/, '');
                const toText = collected.texts.get(toPoemId);
                if (toText != null) {
                  const toPoetId = toText.poetId;
                  if (toPoetId !== poetId) {
                    // Skip self-refs
                    register(filename, toPoetId, fromId, refType);
                  }
                } else {
                  throw new Error(
                    `${filename} points to unknown text ${toPoemId}`
                  );
                }
              } else if (rule.type === 'person') {
                const toPoetId = match[2];
                register(filename, toPoetId, fromId, 'mention');
              }
            }
          });
        });
        const head = text.get('head');
        const keywords = safeGetText(head, 'keywords') || '';
        if (keywords.trim().length > 0) {
          keywords.split(',').forEach(keyword => {
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

const build_mentions_json = collected => {
  const build_html = poemId => {
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
      throw `${poemId} references unknown work ${meta.poetId +
        '/' +
        meta.workId}`;
    }
    const workNameFormattet = workLinkName(work);
    return [
      [
        `${poet}: <a poem="${poemId}">»${
          meta.title
        }«</a> – ${workNameFormattet}`,
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
      data.mentions = refs.mention
        .filter(id => {
          // Hvis en tekst har varianter som også henviser til denne,
          // vil vi kun vise den ældste variant.
          return primaryTextVariantId(id, collected) === id;
        })
        .map(build_html);
      data.translations = refs.translation
        .filter(id => {
          // Hvis en tekst har varianter som også henviser til denne,
          // vil vi kun vise den ældste variant.
          return primaryTextVariantId(id, collected) === id;
        })
        .map(build_html);
    }

    ['primary', 'secondary'].forEach(filename => {
      const biblioXmlPath = `fdirs/${poet.id}/bibliography-${filename}.xml`;
      const doc = loadXMLDoc(biblioXmlPath);
      if (doc != null) {
        data[filename] = doc.find('//items/item').map(line => {
          return htmlToXml(
            line
              .toString()
              .replace('<item>', '')
              .replace('</item>', ''),
            collected
          );
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
