const entities = require('entities');
const { htmlToXml } = require('../libs/helpers.js');
const { build_museum_link, build_museum_url } = require('./museums.js');
const {
  getChildByTagName,
  getChildrenByTagName,
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
  const element = getChildByTagName(head, type);
  if (element == null) {
    return null;
  }
  let title = safeGetInnerXML(element);
  if (title == null || title.trim().length === 0) {
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

const get_picture = async (pictureNode, srcPrefix, collected, onError) => {
  const primary = safeGetAttr(pictureNode, 'primary') == 'true';
  let src = safeGetAttr(pictureNode, 'src');
  const ref = safeGetAttr(pictureNode, 'ref');
  const year = safeGetAttr(pictureNode, 'year');
  const museumId = safeGetAttr(pictureNode, 'museum');
  const remoteUrl = build_museum_url(pictureNode, collected);
  let description = null;
  let note = null;
  if (getChildByTagName(pictureNode, 'description') != null) {
    description = safeGetInnerXML(
      getChildByTagName(pictureNode, 'description')
    );
    note = safeGetInnerXML(getChildByTagName(pictureNode, 'picture-note'));
  } else {
    description = safeTrim(safeGetInnerXML(pictureNode));
  }
  if (src != null) {
    const lang = safeGetAttr(pictureNode, 'lang') || 'da';
    if (src.charAt(0) !== '/') {
      src = srcPrefix + '/' + src;
    }
    return {
      lang,
      src,
      year,
      size: await imageSizeSync(src.replace(/^\//, '')),
      remoteUrl,
      museum: collected.museums.get(museumId),
      content_lang: 'da',
      content_html: htmlToXml(description, collected),
      note_html: htmlToXml(note, collected),
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
    return {
      artist,
      lang: artwork.lang,
      src: artwork.src,
      year,
      size: await imageSizeSync(artwork.src.replace(/^\//, '')),
      remoteUrl: artwork.remoteUrl,
      museum: artwork.museum,
      content_lang: artwork.content_lang,
      content_html: htmlToXml(artwork.content_raw, collected),
      note_html: htmlToXml(description, collected),
      primary,
    };
  }
};

// context contains keys for any `${var}` that's to be replaced in the note texts.
const get_notes = (head, collected, context = {}) => {
  const notes = getChildByTagName(head, 'notes');
  if (notes == null) {
    return [];
  }
  return getChildrenByTagName(notes, 'note').map(note => {
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
  return Promise.all(
    getElementsByTagName(head, 'picture').map(async p => {
      return await get_picture(p, srcPrefix, collected, onError);
    })
  );
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
