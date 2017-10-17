// @flow

import type { Poet, TextContentType } from './types.js';

export const trimmedDescription = (
  content_html: ?TextContentType,
  is_poetry: boolean = false
): ?string => {
  if (content_html == null) {
    return null;
  }

  let result = content_html
    .map(x => x[0])
    .join(' ')
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

export const poetImage = (poet: Poet): ?string => {
  if (poet.has_square_portrait) {
    const thumb = poet.square_portrait
      .replace(/.jpg$/, '-w600.jpg')
      .replace(/\/([^\/]+)$/, '/t/$1');
    return `/static/images/${poet.id}/t/${thumb}`;
  } else {
    return null;
  }
};
