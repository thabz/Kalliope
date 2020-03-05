const { safeMkdir, writeJSON } = require('../libs/helpers.js');
const { isFileModified, force_reload } = require('../libs/caching.js');
const { safeGetAttr, loadXMLDoc } = require('./xml.js');

const build_portraits_json = async (poet, collected) => {
  let result = [];
  if (!poet.has_portraits) {
    return result;
  }
  const doc = loadXMLDoc(`fdirs/${poet.id}/portraits.xml`);
  if (doc != null) {
    onError = message => {
      throw `fdirs/${poet.id}/portraits.xml: ${message}`;
    };
    result = await Promise.all(
      getElementsByTagName(doc, 'picture').map(async picture => {
        picture = await get_picture(
          picture,
          `/static/images/${poet.id}`,
          collected,
          onError
        );
        if (picture == null) {
          onError('har et billede uden src- eller ref-attribut.');
        }
        return picture;
      })
    );
    const primaries = result.filter(p => p.primary);
    if (primaries.length > 1) {
      onError('har flere primary');
    }
    if (primaries.length == 0) {
      onError('mangler primary');
    }
  }
  return result;
};

// Read /data/museums.xml and produce collected.museums to to used later.
const build_museums_ = () => {
  const xmlFile = `data/museums.xml`;
  if (!isFileModified(xmlFile) && !force_reload) {
    return;
  }
  const doc = loadXMLDoc(xmlDoc);
  if (doc != null) {
  }
};

const get_museum_json = museumId => {
  if (museumId != null && museums[museumId] != null) {
    return {
      id: museumId,
      name: museums[museumId].name,
    };
  } else {
    return null;
  }
};

const build_museum_url = picture => {
  if (picture == null) {
    return null;
  }
  const invNr = safeGetAttr(picture, 'invnr');
  const objId = safeGetAttr(picture, 'objid');
  const museum = safeGetAttr(picture, 'museum');
  if (museum != null && (invNr != null || objId != null)) {
    const museumObject = museums[museum];
    if (museumObject != null && museumObject.url != null) {
      return museumObject.url({ invNr, objId });
    }
  }
  return null;
};

const build_museum_link = picture => {
  const url = build_museum_url(picture);
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
  Object.keys(museums).forEach(museumId => {
    const museum = museums[museumId];
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
  get_museum_json,
  build_museum_url,
  build_museum_link,
  build_museums,
};
