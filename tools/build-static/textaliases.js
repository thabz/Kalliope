import { supportedLanguages } from '../../common/languages.js';

const parseAliases = (value) => {
  if (value == null) {
    return [];
  }
  return value
    .split(',')
    .map((alias) => alias.trim())
    .filter((alias) => alias.length > 0);
};

const buildTextAliasRedirects = (redirects, texts) => {
  const textIds = new Set(texts.keys());
  const aliases = new Map();

  texts.forEach((text) => {
    (text.aliases ?? []).forEach((alias) => {
      if (alias === text.id || textIds.has(alias)) {
        throw new Error(
          `Text alias "${alias}" conflicts with an existing text id.`
        );
      }
      if (aliases.has(alias)) {
        throw new Error(
          `Text alias "${alias}" is used by both ${aliases.get(alias)} and ${
            text.id
          }.`
        );
      }
      aliases.set(alias, text.id);
      supportedLanguages.forEach((lang) => {
        redirects[`/${lang}/text/${alias}`] = `/${lang}/text/${text.id}`;
      });
    });
  });
};

export { parseAliases, buildTextAliasRedirects };
