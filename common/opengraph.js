// @flow

export const trimmedDescription = (content_html) => {
  if (content_html == null) {
    return null;
  }

  let result = content_html
    .map((x) => x[0])
    .join(' ')
    .replace(/<num>[^<]*<\/num>/g, '')
    .replace(/<note>.*?<\/note>/g, '')
    .replace(/^<br\/>/, '')
    .replace(/^\s*/, '')
    .replace(/\s\s/g, ' ');
  result = result.replace(/\n/g, ' ').replace(/<br\/>/g, ' ');
  result = result.replace(/<[^>]*>/g, ''); // Remove remaining tags
  return result.substr(0, 600);
};

export const poetImage = (poet) => {
  if (poet.has_square_portrait) {
    const thumb = poet.square_portrait;
    return `/static/images/${poet.id}/${thumb}`;
  } else {
    return null;
  }
};
