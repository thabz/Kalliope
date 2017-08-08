import type { Poet, TextContentType } from './types.js';

export const trimmedDescription = (content_html: TextContentType, is_poetry = false) => {
  if (content_html == null) {
    return null;
  }
  content_html = content_html.map(x => x[0]).join(' ');
  let result = content_html
    .replace(/<num>[^<]*<\/num>/g, '')
    .replace(/^<br\/>/, '')
    .replace(/^\s*/, '')
    .replace(/\s\s/g, ' ');
  if (is_poetry) {
    result = result.replace(/\n/g, ' // ').replace(/<br\/>/g, ' // ');
  } else {
    result = result.replace(/\n/g, ' ').replace(/<br\/>/g, ' ');
  }
  result = result.replace(/<[^>]*>/g, ''); // Remove remaining tags
  return result.substr(0, 600);
};

export const poetImage = (poet: Poet) => {
  return poet.has_portraits ? `/static/images/${poet.id}/p1-w600.jpg` : null;
};
