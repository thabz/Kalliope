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

const build_textrefs = collected => {
  let textrefs = globalForceReload
    ? new Map()
    : new Map(loadCachedJSON('collected.textrefs') || []);
  const force_reload = textrefs.size == 0;

  let found_changes = false;
  const regexps = [
    /xref\s.*?poem="([^",]*)/g,
    /a\s.*?poem="([^",]*)/g,
    /xref bibel="([^",]*)/g,
  ];
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
      const texts = getElementsByTagNames(doc, ['text', 'section'])
        .filter(e => safeGetAttr(e, 'id') != null)
        .forEach(text => {
          const head = getChildByTagName(text, 'head');
          const body = getChildByTagName(text, 'body');
          const notes = [
            ...getElementsByTagNames(head, ['note']),
            ...getElementsByTagNames(body, ['note', 'footnote']),
          ];
          notes.forEach(note => {
            regexps.forEach(regexp => {
              while ((match = regexp.exec(safeGetOuterXML(note))) != null) {
                const fromId = safeGetAttr(text, 'id');
                const toId = match[1];
                const array = textrefs.get(toId) || [];
                if (array.indexOf(fromId) === -1) {
                  array.push(fromId);
                }
                textrefs.set(toId, array);
              }
            });
          });
        });
    });
  });
  if (found_changes) {
    writeCachedJSON('collected.textrefs', Array.from(textrefs));
  }
  return textrefs;
};

const mark_ref_destinations_dirty = collected => {
  if (globalForceReload) {
    // All destination files are marked dirty already
    return;
  }

  let destination_workfiles = [];
  const regexps = [
    /xref\s.*?poem="([^",]*)/g,
    /a\s.*?poem="([^",]*)/g,
    /xref bibel="([^",]*)/g,
  ];
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
            regexps.forEach(regexp => {
              while ((match = regexp.exec(safeGetOuterXML(note))) != null) {
                const toId = match[1];
                const t = collected.texts.get(toId);
                if (t != null) {
                  const filename = `fdirs/${t.poetId}/${t.workId}.xml`;
                  destination_workfiles.push(filename);
                }
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
  mark_ref_destinations_dirty,
};
