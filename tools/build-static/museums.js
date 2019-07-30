const { safeMkdir, writeJSON, loadXMLDoc } = require('../libs/helpers.js');
const { isFileModified } = require('../libs/caching.js');
const { safeGetAttr } = require('./xml.js');

const museums = {
  hirschsprungske: {
    name: 'Den Hirschsprungske Samling',
  },
  skagen: {
    name: 'Skagens Museum',
  },
  thorvaldsens: {
    url: ids => `http://thorvaldsensmuseum.dk/samlingerne/vaerk/${ids.invNr}`,
    name: 'Thorvaldsens Museum',
  },
  nivaagaard: {
    url: ids => `http://www.nivaagaard.dk/samling-da/${ids.objId}`,
    name: 'Nivaagaards Malerisamling',
  },
  kb: {
    url: ids =>
      `http://www.kb.dk/images/billed/2010/okt/billeder/object${ids.objId}/da/`,
    name: 'Det kongelige Bibliotek',
  },
  smk: {
    url: ids => `http://collection.smk.dk/#/detail/${ids.invNr}`,
    name: 'Statens Museum for Kunst',
  },
  gleimhaus: {
    url: ids =>
      `https://www.museum-digital.de/nat/index.php?t=objekt&oges=${ids.objId}`,
    name: 'Gleimhaus, Halberstadt',
  },
  ribe: {
    url: ids => `https://ribekunstmuseum.dk/samling/${ids.invNr}`,
    name: 'Ribe Kunstmuseum',
  },
  smb: {
    url: ids => `http://www.smb-digital.de/eMuseumPlus?objectId=${ids.objId}`,
    name: 'Staatliche Museen zu Berlin',
  },
  md: {
    url: ids =>
      `https://www.museum-digital.de/nat/index.php?t=objekt&oges=${ids.objId}`,
  },
  npg: {
    url: ids =>
      `https://www.npg.org.uk/collections/search/portrait/${ids.objId}`,
    name: 'National Portrait Gallery, London',
  },
  'natmus.se': {
    url: ids =>
      `http://collection.nationalmuseum.se/eMP/eMuseumPlus?service=ExternalInterface&module=collection&objectId=${
        ids.objId
      }&viewType=detailView`,
  },
  'digitalmuseum.no': {
    url: ids => `https://digitaltmuseum.no/${ids.objId}/maleri`,
  },
  'digitalmuseum.se': {
    url: ids => `https://digitaltmuseum.se/${ids.objId}/maleri`,
  },
  fnm: {
    name: 'Frederiksborg Nationalhistorisk Museum',
    url: ids => {
      // invNr må være 'a-841', 'A-841', 'A841', 'A 841'
      const m = ids.invNr.match(/([a-z]+)[- ]*([0-9]+[a-z]*)/i);
      return `https://dnm.dk/kunstvaerk/${m[1].toLowerCase()}-${m[2]}/`;
    },
  },
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

const build_museums = collected => {
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
  collected.poets.forEach((poet, poetId) => {
    // From works
    collected.workids.get(poet.id).forEach(workId => {
      const doc = loadXMLDoc(`fdirs/${poetId}/${workId}.xml`);
    });
  });
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
