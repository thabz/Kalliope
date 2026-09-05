import { safeMkdir, writeJSON } from '../libs/helpers.js';
import {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
  force_reload,
} from '../libs/caching.js';
import {
  safeGetAttr,
  safeGetText,
  getElementsByTagName,
  getIdentifiers,
  identifierAllowlist,
  loadXMLDoc,
} from './xml.js';

const validateMuseum = (museum, xmlFilename = 'content/museums.xml') => {
  if (museum.country == null || museum.country.trim() === '') {
    throw new Error(
      `${xmlFilename}: museum ${museum.id ?? '(uden id)'} mangler <country>.`,
    );
  }
};

// Read content/museums.xml and produce collected.museums to be used later.
const build_museums = () => {
  const xmlFilename = `content/museums.xml`;
  const cached_museums = new Map(loadCachedJSON('collected.museums') || []);
  if (
    !isFileModified(xmlFilename) &&
    !force_reload &&
    cached_museums.size !== 0
  ) {
    cached_museums.forEach(museum => validateMuseum(museum, xmlFilename));
    return cached_museums;
  }

  const collected_museums = new Map();
  const doc = loadXMLDoc(xmlFilename);

  getElementsByTagName(doc, 'museum').map(museum => {
    const id = safeGetAttr(museum, 'id');
    const name = safeGetText(museum, 'name');
    const sortName = safeGetText(museum, 'sort-name') || name;
    const country = safeGetText(museum, 'country');
    const deepLink = safeGetText(museum, 'deep-link');
    const identifiers = getIdentifiers(museum, identifierAllowlist.museum);
    const data = {
      id,
      name,
      sortName,
      country,
      deepLink,
      identifiers,
    };
    validateMuseum(data, xmlFilename);
    collected_museums.set(id, data);
  });
  writeCachedJSON('collected.museums', Array.from(collected_museums));

  const path = `public/api/museums.json`;
  console.log(path);
  writeJSON(path, { museums: Array.from(collected_museums.values()) });

  return collected_museums;
};

const build_museum_url = (picture, collected) => {
  if (picture == null) {
    return null;
  }
  const href = safeGetAttr(picture, 'href');
  if (href != null) {
    return href;
  }
  const invNr = safeGetAttr(picture, 'invnr');
  const objId = safeGetAttr(picture, 'objid');
  const museumId = safeGetAttr(picture, 'museum');
  if (museumId != null && (invNr != null || objId != null)) {
    const museum = collected.museums.get(museumId);
    if (museum != null && museum.deepLink != null) {
      if (
        (museum.deepLink.includes('${invNr}') && invNr == null) ||
        (museum.deepLink.includes('${objId}') && objId == null)
      ) {
        return null;
      }
      return museum.deepLink
        .replace('${invNr}', invNr)
        .replace('${objId}', objId);
    }
  }
  return null;
};

const build_museum_pages = collected => {
  safeMkdir('public/api/museums');

  let found_changes = false;

  collected.poets.forEach((poet, poetId) => {
    const portraitsFile = `fdirs/${poet.id}/portraits.xml`;
    if (isFileModified(portraitsFile)) {
      found_changes = true;
    }
    const artworkFile = `fdirs/${poet.id}/artwork.xml`;
    if (poet.has_artwork) {
      found_changes |= isFileModified(artworkFile);
    }
    collected.workids.get(poet.id).forEach(workId => {
      const workFilename = `fdirs/${poetId}/${workId}.xml`;
      found_changes |= isFileModified(workFilename);
    });
    found_changes |= isFileModified('content/museums.xml');
  });
  if (!found_changes) {
    return;
  }

  let allArtwork = Array.from(collected.artwork.values());
  // Find portrætter som ikke har en ref og dermed inkluderet i collected.artwork
  // collected.poets.forEach((poet, poetId) => {
  //   // From works
  //   collected.workids.get(poet.id).forEach(workId => {
  //     const doc = loadXMLDoc(`fdirs/${poetId}/${workId}.xml`);
  //   });
  // });
  collected.museums.forEach((museum, museumId) => {
    if (museum.name == null) {
      // Vi tager kun museer med navne
      return;
    }

    const artwork = allArtwork.filter(
      a => a.museum != null && a.museum.id === museumId
    );
    const json = {
      museum: {
        id: museumId,
        name: museum.name,
      },
      artwork,
    };
    const path = `public/api/museums/${museumId}.json`;
    writeJSON(path, json);
  });
};

export {
  build_museum_url,
  build_museums,
  build_museum_pages,
  validateMuseum,
};
