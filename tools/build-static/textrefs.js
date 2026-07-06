const { fileExists } = require('../libs/helpers.js');
const {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
  force_reload: globalForceReload,
  markFileDirty,
} = require('../libs/caching.js');
const {
  loadXMLDoc,
  getChildByTagName,
  getElementsByTagNames,
  safeGetAttr,
  safeGetOuterXML,
} = require('./xml.js');

const textRefTagRegexp = /<(?:xref|a)\b[^>]*(?:\bpoem|\bbibel)="[^"]*"[^>]*>/g;

const getAttr = (tag, attrName) => {
  const match = tag.match(new RegExp(`\\b${attrName}="([^"]*)"`));
  return match == null ? null : match[1];
};

const extractTextRefs = xml => {
  return Array.from(xml.matchAll(textRefTagRegexp)).map(match => {
    const tag = match[0];
    const target = getAttr(tag, 'poem') || getAttr(tag, 'bibel');
    return {
      toId: target.replace(/,.*$/, ''),
      type: getAttr(tag, 'type') === 'translation' ? 'translation' : 'mention',
    };
  });
};

const markTextRefDestinationsDirty = (textrefs, collected) => {
  const destinationWorkfiles = [];
  textrefs.forEach((refs, toId) => {
    const text = collected.texts.get(toId);
    if (text != null) {
      destinationWorkfiles.push(`fdirs/${text.poetId}/${text.workId}.xml`);
    }
  });
  markFileDirty(...destinationWorkfiles);
};

const removeTextRefSources = (textrefs, fromIds) => {
  const ids = new Set(fromIds);
  textrefs.forEach((refs, toId) => {
    refs.mention = refs.mention.filter(fromId => !ids.has(fromId));
    refs.translation = refs.translation.filter(fromId => !ids.has(fromId));
    if (refs.mention.length === 0 && refs.translation.length === 0) {
      textrefs.delete(toId);
    } else {
      textrefs.set(toId, refs);
    }
  });
};

const build_textrefs = collected => {
  const cachedTextrefs = loadCachedJSON('collected.textrefs') || [];
  const hasLegacyTextrefs = cachedTextrefs.some(([, refs]) =>
    Array.isArray(refs)
  );
  const codeModified = isFileModified('tools/build-static/textrefs.js');
  let textrefs =
    globalForceReload || hasLegacyTextrefs || codeModified
      ? new Map()
      : new Map(cachedTextrefs);
  const force_reload = textrefs.size == 0;

  let found_changes = false;
  collected.poets.forEach((poet, poetId) => {
    collected.workids.get(poetId).forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!fileExists(filename)) {
        return;
      }
      if (!force_reload && !isFileModified(filename)) {
        return;
      } else {
        found_changes = true;
      }
      let doc = loadXMLDoc(filename);
      const texts = getElementsByTagNames(doc, ['text', 'section']).filter(
        e => safeGetAttr(e, 'id') != null
      );
      removeTextRefSources(
        textrefs,
        texts.map(text => safeGetAttr(text, 'id'))
      );
      texts.forEach(text => {
        const head = getChildByTagName(text, 'head');
        const body = getChildByTagName(text, 'body');
        const notes = [
          ...getElementsByTagNames(head, ['note']),
          ...getElementsByTagNames(body, ['note', 'footnote']),
        ];
        notes.forEach(note => {
          extractTextRefs(safeGetOuterXML(note)).forEach(ref => {
            const fromId = safeGetAttr(text, 'id');
            const refs = textrefs.get(ref.toId) || {
              mention: [],
              translation: [],
            };
            if (refs[ref.type].indexOf(fromId) === -1) {
              refs[ref.type].push(fromId);
            }
            textrefs.set(ref.toId, refs);
          });
        });
      });
    });
  });
  if (found_changes) {
    writeCachedJSON('collected.textrefs', Array.from(textrefs));
    markTextRefDestinationsDirty(new Map(cachedTextrefs), collected);
    markTextRefDestinationsDirty(textrefs, collected);
  }
  return textrefs;
};

const mark_ref_destinations_dirty = collected => {
  if (globalForceReload) {
    // All destination files are marked dirty already
    return;
  }

  let destination_workfiles = [];
  collected.poets.forEach((poet, poetId) => {
    collected.workids.get(poetId).forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!fileExists(filename)) {
        return;
      }
      if (!isFileModified(filename)) {
        return;
      }
      let doc = loadXMLDoc(filename);

      getElementsByTagNames(doc, ['text', 'section'])
        .filter(e => safeGetAttr(e, 'id') != null)
        .forEach(text => {
          const head = getChildByTagName(text, 'head');
          const body = getChildByTagName(text, 'body');
          const notes = [
            ...getElementsByTagNames(head, ['note']),
            ...getElementsByTagNames(body, ['note', 'footnote']),
          ];
          notes.forEach(note => {
            extractTextRefs(safeGetOuterXML(note)).forEach(ref => {
              const t = collected.texts.get(ref.toId);
              if (t != null) {
                const filename = `fdirs/${t.poetId}/${t.workId}.xml`;
                destination_workfiles.push(filename);
              }
            });
          });
        });
    });
  });
  //console.log('Dirty files are: ', destination_workfiles);
  markFileDirty(...destination_workfiles);
};

module.exports = {
  build_textrefs,
  extractTextRefs,
  mark_ref_destinations_dirty,
  removeTextRefSources,
};
