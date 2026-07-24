import { fileExists } from '../libs/helpers.js';
import {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
  force_reload as globalForceReload,
  markFileDirty,
} from '../libs/caching.js';
import {
  loadXMLDoc,
  getChildByTagName,
  getElementsByTagNames,
  safeGetAttr,
  safeGetOuterXML,
} from './xml.js';
import { sourceWorkFilename } from './anthologies.js';

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

const collectTextRefs = refsByFile => {
  const textrefs = new Map();
  refsByFile.forEach(refs => {
    refs.forEach(({ fromId, toId, type }) => {
      const destinationRefs = textrefs.get(toId) || {
        mention: [],
        translation: [],
      };
      if (destinationRefs[type].indexOf(fromId) === -1) {
        destinationRefs[type].push(fromId);
      }
      textrefs.set(toId, destinationRefs);
    });
  });
  return textrefs;
};

const refsEqual = (left, right) =>
  JSON.stringify(left || { mention: [], translation: [] }) ===
  JSON.stringify(right || { mention: [], translation: [] });

const markChangedTextRefDestinationsDirty = (
  previousTextrefs,
  textrefs,
  collected
) => {
  const destinationWorkfiles = new Set();
  const allIds = new Set([...previousTextrefs.keys(), ...textrefs.keys()]);
  allIds.forEach(toId => {
    if (refsEqual(previousTextrefs.get(toId), textrefs.get(toId))) {
      return;
    }
    const text = collected.texts.get(toId);
    if (text != null) {
      destinationWorkfiles.add(sourceWorkFilename(text));
    }
  });
  markFileDirty(...destinationWorkfiles);
};

const build_textrefs = collected => {
  const cachedTextrefs = loadCachedJSON('collected.textrefs') || [];
  const previousTextrefs = new Map(cachedTextrefs);
  const codeModified = isFileModified('tools/build-static/textrefs.js');
  let refsByFile =
    globalForceReload || codeModified
      ? new Map()
      : new Map(loadCachedJSON('collected.textrefs_by_file') || []);
  const force_reload = refsByFile.size === 0;

  let found_changes = false;
  const knownFiles = new Set();
  collected.poets.forEach((poet, poetId) => {
    collected.workids.get(poetId).forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!fileExists(filename)) {
        return;
      }
      knownFiles.add(filename);
      if (!force_reload && !isFileModified(filename)) {
        return;
      } else {
        found_changes = true;
      }
      const fileRefs = [];
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
            extractTextRefs(safeGetOuterXML(note)).forEach(ref => {
              const fromId = safeGetAttr(text, 'id');
              fileRefs.push({
                fromId,
                toId: ref.toId,
                type: ref.type,
              });
            });
          });
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
  const textrefs = collectTextRefs(refsByFile);
  if (found_changes) {
    writeCachedJSON('collected.textrefs', Array.from(textrefs));
    writeCachedJSON('collected.textrefs_by_file', Array.from(refsByFile));
    markChangedTextRefDestinationsDirty(
      previousTextrefs,
      textrefs,
      collected
    );
  }
  return textrefs;
};

const mark_ref_destinations_dirty = collected => {
  // build_textrefs compares the cached and current per-file references later
  // in the build, before any outputs that depend on destination backlinks.
};

export {
  build_textrefs,
  collectTextRefs,
  extractTextRefs,
  markChangedTextRefDestinationsDirty,
  mark_ref_destinations_dirty,
};
