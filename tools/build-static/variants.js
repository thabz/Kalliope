const resolve_variants_cache = {};
const resolve_variants = (poemId, collected) => {
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
        `The unknown text ${a} is listed as a variant of ${poemId}.`
      );
    }
    if (metaB == null) {
      throw new Error(
        `The unknown text ${b} is listed as a variant ${poemId}.`
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
  const variants = resolve_variants(textId, collected);
  if (variants != null && variants.length > 0) {
    return variants[0];
  } else {
    return textId;
  }
};

module.exports = {
  resolve_variants,
  primaryTextVariantId,
};
