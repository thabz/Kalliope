const {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
  markFileDirty,
  force_reload: globalForceReload,
} = require('../libs/caching.js');
const { fileExists } = require('../libs/helpers.js');
const { loadXMLDoc, safeGetAttr, getElementsByTagNames } = require('./xml.js');

const build_variants = collected => {
  let variants_map = globalForceReload
    ? new Map()
    : new Map(loadCachedJSON('collected.variants') || []);
  const force_reload = variants_map.size === 0;

  register_variant = (from, to) => {
    let array = variants_map.get(from) || [];
    if (array.indexOf(to) === -1) {
      array.push(to);
    }
    variants_map.set(from, array);
  };

  collected.poets.forEach((poet, poetId) => {
    collected.workids.get(poetId).forEach(workId => {
      const filename = `fdirs/${poetId}/${workId}.xml`;
      if (!fileExists(filename)) {
        return;
      }
      if (!force_reload && !isFileModified(filename)) {
        return;
      }
      let doc = loadXMLDoc(filename);
      getElementsByTagNames(doc, ['poem', 'prose', 'section'])
        .filter(e => {
          return (
            safeGetAttr(e, 'variant') != null && safeGetAttr(e, 'id') != null
          );
        })
        .forEach(text => {
          const textId = safeGetAttr(text, 'id');
          const variantId = safeGetAttr(text, 'variant');
          if (textId == null || variantId == null) {
            throw new Error(
              `Text in ${poetId}/${workId} ${textId} is listed as a variant of ${variantId}.`
            );
          }
          register_variant(textId, variantId);
          register_variant(variantId, textId);
          // Mark work containing variantId dirty
          const variantData = collected.texts.get(variantId);
          if (variantData != null) {
            markFileDirty(
              `fdirs/${variantData.poetId}/${variantData.workId}.xml`
            );
          }
        });
    });
  });
  writeCachedJSON('collected.variants', Array.from(variants_map));
  return variants_map;
};

const resolve_variants_cache = {};
const resolve_variants = (poemId, collected) => {
  if (poemId == null) {
    throw new Error(`function resolve_variants called with null poemId.`);
  }

  const variantIds = collected.variants.get(poemId);
  if (variantIds == null || variantIds.length == 0) {
    return null;
  }
  let result = resolve_variants_cache[poemId];
  if (result != null) {
    return result;
  }

  // Deep dive through variants-graph
  let seen_variants = new Set();
  const recurse = variantId => {
    if (seen_variants.has(variantId)) {
      return;
    } else {
      seen_variants.add(variantId);
      const variantIds = collected.variants.get(variantId);
      variantIds.forEach(variantId => {
        recurse(variantId);
      });
    }
  };
  recurse(poemId);

  // Cache and return sorted poemIds
  result = Array.from(seen_variants).sort((a, b) => {
    const metaA = collected.texts.get(a);
    const metaB = collected.texts.get(b);
    if (metaA == null) {
      throw new Error(
        `The unknown text "${a}" is listed as a variant of "${poemId}".`
      );
    }
    if (metaB == null) {
      throw new Error(
        `The unknown text "${b}" is listed as a variant of "${poemId}".`
      );
    }
    const workA = collected.works.get(metaA.poetId + '/' + metaA.workId);
    const workB = collected.works.get(metaB.poetId + '/' + metaB.workId);
    return workA.year > workB.year ? 1 : -1;
  });
  resolve_variants_cache[poemId] = result;
  return result;
};

const primaryTextVariantId = (textId, collected) => {
  if (textId == null) {
    throw new Error(
      `function primaryTextVariantId called with textId "${textId}".`
    );
  }
  const variants = resolve_variants(textId, collected);
  if (variants != null && variants.length > 0) {
    return variants[0];
  } else {
    return textId;
  }
};

module.exports = {
  build_variants,
  resolve_variants,
  primaryTextVariantId,
};
