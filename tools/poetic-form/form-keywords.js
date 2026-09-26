const keywordMappings = new Map([
  ['alexandrine', ['alexandriner']],
  ['ballad-stanza', ['balladestrofe', 'firelinjet-strofe']],
  ['blank-verse', ['blankvers']],
  ['distich', ['tolinjet-strofe']],
  ['knittelvers', ['knittelvers']],
  ['ottava-rima', ['ottave-rime']],
  ['quatrain', ['firelinjet-strofe']],
  ['rime-royal', ['rime-royal']],
  ['sonnet', ['sonnet']],
  ['terza-rima', ['terziner']],
]);

export const formKeywords = (analyses, minConfidence = 0.9) => [...new Set(
  analyses
    .filter(analysis => analysis.confidence >= minConfidence)
    .flatMap(analysis => keywordMappings.get(analysis.pattern) ?? []),
)];
