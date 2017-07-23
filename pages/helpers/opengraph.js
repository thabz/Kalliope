import type { Poet } from './types.js';

export const trimmedDescription = (content_html: string, is_poetry = false) => {
  if (content_html == null) {
    return null;
  }
  let result = content_html
    .replace(/<num>[^<]*<\/num>/g, '')
    .replace(/^<br\/>/, '')
    .replace(/^\s*/, '')
    .replace(/\s\s/g, ' ');
  if (is_poetry) {
    result = result.replace(/\n/g, ' // ').replace(/<br\/>/g, ' // ');
  }
  return result.substr(0, 300);
};

export const poetImage = (poet: Poet) => {
  return poet.has_portraits ? `/static/images/${poet.id}/p1-w600.jpg` : null;
};
