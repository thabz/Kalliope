const { htmlToXml } = require('../libs/helpers.js');
const {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
  markFileDirty,
} = require('../libs/caching.js');
const { imageSizeSync } = require('./image.js');
const {
  loadXMLDoc,
  safeGetAttr,
  safeGetInnerXML,
  getElementsByTagName,
} = require('./xml.js');
const { get_picture } = require('./parsing.js');
const {
  build_museum_link,
  build_museum_url,
  get_museum_json,
} = require('./museums.js');

const build_artwork = collected => {
  let collected_artwork = new Map(loadCachedJSON('collected.artwork') || []);
  const force_reload = collected_artwork.size == 0;

  collected.poets.forEach(person => {
    const personId = person.id;
    const personType = person.type;
    const artworkFilename = `fdirs/${personId}/artwork.xml`;
    const portraitsFile = `fdirs/${personId}/portraits.xml`;

    if (
      personType === 'artist' &&
      (force_reload || isFileModified(artworkFilename))
    ) {
      // Fjern eksisterende fra cache (i tilfælde af id er slettet)
      Array.from(collected_artwork.keys())
        .filter(k => k.indexOf(`${personId}/`) === 0)
        .forEach(k => {
          collected_artwork.delete(k);
        });

      const artworksDoc = loadXMLDoc(artworkFilename);
      if (artworksDoc != null) {
        getElementsByTagName(artworksDoc, 'picture').forEach(async picture => {
          const pictureId = safeGetAttr(picture, 'id');
          const subjectAttr = safeGetAttr(picture, 'subject');
          let subjects = subjectAttr != null ? subjectAttr.split(',') : [];
          const year = safeGetAttr(picture, 'year');
          if (pictureId == null) {
            throw `fdirs/${personId}/artwork.xml har et billede uden id-attribut.`;
          }
          subjects.forEach(subjectId => {
            // Make sure we rebuild the affected bio page.
            markFileDirty(`fdirs/${subjectId}/portraits.xml`);
          });

          const src = `/static/images/${personId}/${pictureId}.jpg`;
          const size = await imageSizeSync(src.replace(/^\//, ''));
          const remoteUrl = build_museum_url(picture);
          const museumLink = build_museum_link(picture) || '';
          const museumId = safeGetAttr(picture, 'museum');
          const artworkId = `${personId}/${pictureId}`;
          const artist = collected.poets.get(personId);
          const content_raw = safeGetInnerXML(picture).trim() + museumLink;
          const artworkJson = {
            id: `${personId}/${pictureId}`,
            artistId: personId,
            artist,
            museum: get_museum_json(museumId),
            remoteUrl,
            lang: person.lang,
            src,
            size,
            content_lang: 'da',
            subjects,
            year,
            content_raw,
            content_html: htmlToXml(content_raw, collected),
          };
          collected_artwork.set(artworkId, artworkJson);
        });
      }
    }
    if (force_reload || isFileModified(portraitsFile)) {
      // Fjern eksisterende portraits fra cache (i tilfælde af id er slettet)
      Array.from(collected_artwork.keys())
        .filter(k => k.indexOf(`portrait/${personId}/`) === 0)
        .forEach(k => {
          collected_artwork.delete(k);
        });

      // From portraits.xml
      const doc = loadXMLDoc(`fdirs/${personId}/portraits.xml`);
      if (doc != null) {
        onError = message => {
          throw `fdirs/${personId}/portraits.xml: ${message}`;
        };
        Promise.all(
          getElementsByTagName(doc, 'picture')
            .filter(picture => {
              return safeGetAttr(picture, 'ref') == null;
            })
            .map(async pictureNode => {
              const src = safeGetAttr(pictureNode, 'src');
              const picture = await get_picture(
                pictureNode,
                `/static/images/${personId}`,
                collected,
                onError
              );
              if (picture == null) {
                onError('har et billede uden src- eller ref-attribut.');
              }
              const key = `portrait/${personId}/${src}`;
              return { key, picture };
            })
        ).forEach(p => {
          const { key, picture } = p;
          collected_artwork.set(key, picture);
        });
      }
    }

    // From works
    collected.workids.get(personId).forEach(workId => {
      const workFilename = `fdirs/${personId}/${workId}.xml`;
      if (force_reload || isFileModified(workFilename)) {
        // Fjern eksisterende work pictures fra cache
        Array.from(collected_artwork.keys())
          .filter(k => k.indexOf(`work/${personId}/${workId}`) === 0)
          .forEach(k => {
            collected_artwork.delete(k);
          });

        const doc = loadXMLDoc(workFilename);
        if (doc != null) {
          onError = message => {
            throw `${workFilename}: ${message}`;
          };
          Promise.all(
            getElementsByTagName(doc, 'picture')
              .filter(picture => {
                return safeGetAttr(picture, 'ref') == null;
              })
              .map(async pictureNode => {
                const src = safeGetAttr(pictureNode, 'src');
                const picture = await get_picture(
                  pictureNode,
                  `/static/images/${personId}`,
                  collected,
                  onError
                );
                if (picture == null) {
                  onError('har et billede uden src- eller ref-attribut.');
                }
                const key = `work/${personId}/${workId}/${src}`;
                return { key, picture };
              })
          ).forEach(p => {
            const { key, picture } = p;
            collected_artwork.set(key, picture);
          });
        }
      }
    });
  });
  writeCachedJSON('collected.artwork', Array.from(collected_artwork));
  return collected_artwork;
};

module.exports = {
  build_artwork,
};
