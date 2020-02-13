const entities = require('entities');
const { htmlToXml } = require('../libs/helpers.js');
const {
  build_museum_link,
  build_museum_url,
  get_museum_json,
} = require('./museums.js');
const {
  getElementByTagName,
  getElementsByTagName,
  safeGetText,
  safeGetAttr,
  safeGetInnerXML,
  safeTrim,
} = require('./xml.js');
const { poetName } = require('./formatting.js');
const { imageSizeSync } = require('./image.js');

// Returns raw {title: string, prefix?: string}
// Both can be converted to xml using htmlToXml(...)
const extractTitle = (head, type) => {
  const element = getElementByTagName(head, type);
  if (element == null) {
    return null;
  }
  let title = safeGetText(element);
  title = entities
    .decodeHTML(title)
    .replace('<' + type + '>', '')
    .replace('<' + type + ' force-index="true">', '')
    .replace('</' + type + '>', '')
    .replace('<' + type + '/>', '');
  if (title.length == 0) {
    return null;
  }
  const parts = title.match(/<num>([^<]*)<\/num>(.*)$/);
  if (parts != null) {
    return {
      prefix: parts[1],
      title: parts[2],
    };
  } else {
    return { title: title };
  }
};

const extractSubtitles = (head, tag = 'subtitle', collected) => {
  let subtitles = null;
  const subtitle = getElementByTagName(head, tag);
  if (subtitle && getElementsByTagName(subtitle, 'line').length > 0) {
    subtitles = getElementsByTagName(subtitle, 'line').map(s => {
      return htmlToXml(safeGetText(s), collected, true);
    });
  } else if (subtitle) {
    const subtitleString = safeGetText(subtitle);
    subtitles = [htmlToXml(subtitleString, collected, true)];
  }
  return subtitles;
};

const get_picture = (pictureNode, srcPrefix, collected, onError) => {
  const primary = safeGetAttr(pictureNode, 'primary') == 'true';
  let src = safeGetAttr(pictureNode, 'src');
  const ref = safeGetAttr(pictureNode, 'ref');
  const year = safeGetAttr(pictureNode, 'year');
  const museumId = safeGetAttr(pictureNode, 'museum');
  const remoteUrl = build_museum_url(pictureNode);
  const museumLink = build_museum_link(pictureNode) || '';
  if (src != null) {
    const lang = safeGetAttr(pictureNode, 'lang') || 'da';
    if (src.charAt(0) !== '/') {
      src = srcPrefix + '/' + src;
    }
    return {
      lang,
      src,
      year,
      size: imageSizeSync(src.replace(/^\//, '')),
      remoteUrl,
      museum: get_museum_json(museumId),
      content_lang: 'da',
      content_html: htmlToXml(
        safeTrim(safeGetInnerXML(pictureNode)) + museumLink,
        collected
      ),
      primary,
    };
  } else if (ref != null) {
    if (ref.indexOf('/') === -1) {
      onError(`fandt en ulovlig ref "${ref}" uden mappe-angivelse`);
    }
    const artwork = collected.artwork.get(ref);
    if (artwork == null) {
      onError(`fandt en ref "${ref}" som ikke matcher noget kendt billede.`);
    }
    const artist = collected.poets.get(artwork.artistId);
    const museumId = safeGetAttr(pictureNode, 'museum');
    const remoteUrl = build_museum_url(pictureNode);
    let description = `<a poet="${artist.id}">${poetName(artist)}</a>: ${
      artwork.content_raw
    }`;
    const extraDescription = safeTrim(safeGetInnerXML(pictureNode));
    if (extraDescription.length > 0) {
      description = extraDescription + '\n\n' + description;
    }
    return {
      artist,
      lang: artwork.lang,
      src: artwork.src,
      year,
      size: imageSizeSync(artwork.src.replace(/^\//, '')),
      remoteUrl,
      museum: get_museum_json(museumId),
      content_lang: artwork.content_lang,
      content_html: htmlToXml(description, collected),
      primary,
    };
  }
};

// context contains keys for any `${var}` that's to be replaced in the note texts.
const get_notes = (head, collected, context = {}) => {
  return findChildNodes(head, 'notes > note').map(note => {
    const lang = safeGetAttr(note, 'lang') || 'da';
    const type = safeGetAttr(note, 'type');
    const unknownOriginalByPoetId = safeGetAttr(note, 'unknown-original-by');
    const replaceContextPlaceholders = s => {
      return s.replace(/\$\{(.*?)\}/g, (_, p1) => {
        return context[p1];
      });
    };
    const result = {
      type,
      content_lang: lang,
      content_html: htmlToXml(
        replaceContextPlaceholders(safeGetInnerXML(note)),
        collected
      ),
    };
    if (unknownOriginalByPoetId != null) {
      result.type = 'unknown-original';
      result.unknownOriginalBy = collected.poets.get(unknownOriginalByPoetId);
    }
    return result;
  });
};

const get_pictures = (head, srcPrefix, xmlFilename, collected) => {
  const onError = message => {
    throw `${xmlFilename}: ${message}`;
  };
  return getElementsByTagName(head, 'picture').map(p => {
    return get_picture(p, srcPrefix, collected, onError);
  });
};

const extractDates = head => {
  const dates = getElementByTagName(head, 'dates');
  const result = {};
  if (dates != null) {
    result.published = safeGetText(dates, 'published');
    result.event = safeGetText(dates, 'event');
    result.written = safeGetText(dates, 'written');
  }
  return result;
};

module.exports = {
  extractTitle,
  extractSubtitles,
  extractDates,
  get_notes,
  get_pictures,
  get_picture,
};
