import entities from 'entities';
import { htmlToXml } from '../libs/helpers.js';
import { build_museum_link, build_museum_url } from './museums.js';
import {
  getChildByTagName,
  getChildrenByTagName,
  getElementByTagName,
  getElementsByTagName,
  safeGetText,
  safeGetAttr,
  safeGetInnerXML,
  safeTrim,
} from './xml.js';
import { poetName } from './formatting.js';
import { imageSizeSync } from './image.js';
import { mapLimit } from './concurrency.js';

const publicPathFromSrc = src => `public${src}`;

const knownPictureAttrs = new Set([
  // Reference to a shared artwork entry, e.g. "cranach/luther".
  'artwork',
  // Optional CSS clip-path used to crop the displayed image.
  'clip-path',
  // Local image id, primarily in artwork and portrait registries.
  'id',
  // Museum inventory number.
  'invnr',
  // Language for image text or description content.
  'lang',
  // Museum id used for remote collection links.
  'museum',
  // Museum object id used for remote collection links.
  'objid',
  // Reference to a shared portrait entry, e.g. "hugo/p1".
  'portrait',
  // Marks the preferred image when several pictures are available.
  'primary',
  // Legacy generic picture reference.
  'ref',
  // Alternative source used when a square crop is needed.
  'square-src',
  // Direct image source path.
  'src',
  // Artwork subject id, primarily in artwork registries.
  'subject',
  // Local picture type/classification.
  'type',
  // Wikidata entity id for external lookup.
  'wikidata',
  // Artwork or portrait year.
  'year',
]);

const validate_picture_attrs = (pictureNode, onError) => {
  for (let i = 0; i < pictureNode.attributes.length; i++) {
    const attrName = pictureNode.attributes.item(i).name;
    if (!knownPictureAttrs.has(attrName)) {
      onError(`fandt ukendt picture-attribut "${attrName}"`);
    }
  }
};

const get_local_picture_content = (pictureNode) => {
  if (getChildByTagName(pictureNode, 'description') != null) {
    return {
      description: safeGetInnerXML(
        getChildByTagName(pictureNode, 'description')
      ),
      note: safeGetInnerXML(getChildByTagName(pictureNode, 'picture-note')),
    };
  }
  return {
    description: safeTrim(safeGetInnerXML(pictureNode)),
    note: null,
  };
};

const get_artwork_picture = async (
  pictureNode,
  artworkRef,
  collected,
  onError
) => {
  if (artworkRef.indexOf('/') === -1) {
    onError(`fandt en ulovlig artwork "${artworkRef}" uden mappe-angivelse`);
  }
  const artwork = collected.artwork.get(artworkRef);
  if (artwork == null) {
    onError(
      `fandt en artwork "${artworkRef}" som ikke matcher noget kendt billede.`
    );
  }
  const primary = safeGetAttr(pictureNode, 'primary') == 'true';
  const year = safeGetAttr(pictureNode, 'year');
  const clipPath = safeGetAttr(pictureNode, 'clip-path');
  const artist = collected.poets.get(artwork.artistId);
  return {
    artist,
    lang: artwork.lang,
    src: artwork.src,
    year,
    clipPath,
    size: await imageSizeSync(publicPathFromSrc(artwork.src)),
    remoteUrl: artwork.remoteUrl,
    museum: artwork.museum,
    content_lang: artwork.content_lang,
    content_html: artwork.content_html,
    note_html: artwork.note_html,
    primary,
  };
};

const get_portrait_picture = async (
  pictureNode,
  portraitRef,
  collected,
  onError
) => {
  if (portraitRef.indexOf('/') === -1) {
    onError(`fandt en ulovlig portrait "${portraitRef}" uden mappe-angivelse`);
  }
  const [poetId, portraitId] = portraitRef.split('/');
  const portrait =
    collected.artwork.get(`portrait/${poetId}/${portraitId}`) ||
    collected.artwork.get(`portrait/${poetId}/${portraitId}.jpg`);
  if (portrait == null) {
    onError(
      `fandt en portrait "${portraitRef}" som ikke matcher noget kendt portræt.`
    );
  }
  const primary = safeGetAttr(pictureNode, 'primary') == 'true';
  return {
    ...portrait,
    primary: primary || portrait.primary,
  };
};

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
  validate_picture_attrs(pictureNode, onError);

  const primary = safeGetAttr(pictureNode, 'primary') == 'true';
  let src = safeGetAttr(pictureNode, 'src');
  const artworkRef =
    safeGetAttr(pictureNode, 'artwork') || safeGetAttr(pictureNode, 'ref');
  const portraitRef = safeGetAttr(pictureNode, 'portrait');
  const year = safeGetAttr(pictureNode, 'year');
  const museumId = safeGetAttr(pictureNode, 'museum');
  const clipPath = safeGetAttr(pictureNode, 'clip-path');
  const remoteUrl = build_museum_url(pictureNode, collected);
  if (src != null) {
    const { description, note } = get_local_picture_content(pictureNode);
    const lang = safeGetAttr(pictureNode, 'lang') || 'da';
    if (src.charAt(0) !== '/') {
      src = srcPrefix + '/' + src;
    }
    return {
      lang,
      src,
      year,
      clipPath,
      size: await imageSizeSync(publicPathFromSrc(src)),
      remoteUrl,
      museum: collected.museums.get(museumId),
      content_lang: 'da',
      content_html: htmlToXml(description, collected),
      note_html: htmlToXml(note, collected),
      primary,
    };
  } else if (artworkRef != null) {
    return await get_artwork_picture(
      pictureNode,
      artworkRef,
      collected,
      onError
    );
  } else if (portraitRef != null) {
    return await get_portrait_picture(
      pictureNode,
      portraitRef,
      collected,
      onError
    );
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
  return mapLimit(
    getElementsByTagName(head, 'picture'),
    async p => {
      return await get_picture(p, srcPrefix, collected, onError);
    }
  );
};

const extractDates = head => {
  const dates = getElementByTagName(head, 'dates');
  const result = {};
  if (dates != null) {
    result.published = safeGetText(dates, 'published');
    result.event = safeGetText(dates, 'event');
    result.performed = safeGetText(dates, 'performed');
    result.written = safeGetText(dates, 'written');
  }
  return result;
};

export {
  extractTitle,
  extractSubtitles,
  extractDates,
  get_notes,
  get_pictures,
  get_picture,
  validate_picture_attrs,
};
