const canonicalKeywordId = (keywordId, keywords) =>
  keywords.get(keywordId)?.canonicalId ?? keywordId;

export { canonicalKeywordId };
