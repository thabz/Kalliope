const { safeMkdir, writeJSON } = require('../libs/helpers.js');
const {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
  force_reload,
} = require('../libs/caching.js');
const {
  safeGetAttr,
  safeGetText,
  getElementsByTagName,
  loadXMLDoc,
} = require('./xml.js');

// Read /data/museums.xml and produce collected.museums to to used later.
const build_museums = () => {
  const xmlFilename = `data/museums.xml`;
  let collected_museums = new Map(loadCachedJSON('collected.museums') || []);
  if (
    !isFileModified(xmlFilename) &&
    !force_reload &&
    collected_museums.size !== 0
  ) {
    return collected_museums;
  }

  const doc = loadXMLDoc(xmlFilename);

  getElementsByTagName(doc, 'museum').map(museum => {
    const id = safeGetAttr(museum, 'id');
    const name = safeGetText(museum, 'name');
    const deepLink = safeGetText(museum, 'deep-link');
    const data = {
      id,
      name,
      deepLink,
    };
    collected_museums.set(id, data);
  });
  writeCachedJSON('collected.museums', Array.from(collected_museums));
  return collected_museums;
};

const build_museum_url = (picture, collected) => {
  if (picture == null) {
    return null;
  }
  const invNr = safeGetAttr(picture, 'invnr');
  const objId = safeGetAttr(picture, 'objid');
  const museumId = safeGetAttr(picture, 'museum');
  if (museumId != null && (invNr != null || objId != null)) {
    const museum = collected.museums.get(museumId);
    if (museum != null && museum.deepLink != null) {
      return museum.deepLink
        .replace('${invNr}', invNr)
        .replace('${objId}', objId);
    }
  }
  return null;
};

const build_museum_link = (picture, collected) => {
  const url = build_museum_url(picture, collected);
  return url == null ? null : ` <a href="${url}">⌘</a>`;
};

const build_museum_pages = collected => {
  safeMkdir('static/api/museums');

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
    found_changes |= isFileModified('data/museums.xml');
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

    const artwork = allArtwork
      .filter(a => a.museum != null && a.museum.id === museumId)
      .map(picture => {
        return {
          artist: picture.artist,
          lang: picture.lang,
          src: picture.src,
          size: picture.size,
          remoteUrl: picture.remoteUrl,
          content_lang: picture.content_lang,
          content_html: picture.content_html,
          subjects: picture.subjects,
          year: picture.year,
        };
      });

    const json = {
      museum: {
        id: museumId,
        name: museum.name,
      },
      artwork,
    };
    const path = `static/api/museums/${museumId}.json`;
    console.log(path);
    writeJSON(path, json);
  });
};

module.exports = {
  build_museum_url,
  build_museum_link,
  build_museums,
  build_museum_pages,
};
