const { fileExists, htmlToXml } = require('../libs/helpers.js');
const {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
  markFileDirty,
  force_reload: globalForceReload,
} = require('../libs/caching.js');
const { imageSizeSync } = require('./image.js');
const {
  loadXMLDoc,
  safeGetAttr,
  safeGetInnerXML,
  getElementsByTagName,
  getChildByTagName,
  safeTrim,
} = require('./xml.js');
const { get_picture, validate_picture_attrs } = require('./parsing.js');
const { build_museum_url } = require('./museums.js');
const { mapLimit } = require('./concurrency.js');

const readArtworkFile = async (personId, artworkFilename, collected) => {
  const artworksDoc = loadXMLDoc(artworkFilename);
  const onError = (message) => {
    throw `${artworkFilename}: ${message}`;
  };
  return await mapLimit(
    getElementsByTagName(artworksDoc, 'picture'),
    async (picture) => {
      validate_picture_attrs(picture, onError);

      const pictureId = safeGetAttr(picture, 'id');
      const subjectAttr = safeGetAttr(picture, 'subject');
      let subjects = subjectAttr != null ? subjectAttr.split(',') : [];
      const year = safeGetAttr(picture, 'year');
      if (pictureId == null) {
        throw `fdirs/${personId}/artwork.xml har et billede uden id-attribut.`;
      }
      subjects.forEach((subjectId) => {
        // Make sure we rebuild the affected bio page.
        markFileDirty(`fdirs/${subjectId}/portraits.xml`);
      });
      let description = null;
      let note = null;
      if (getChildByTagName(picture, 'description') != null) {
        description = safeGetInnerXML(
          getChildByTagName(picture, 'description')
        );
        note = safeGetInnerXML(getChildByTagName(picture, 'picture-note'));
      } else {
        description = safeTrim(safeGetInnerXML(picture));
      }

      const src = `/images/${personId}/${pictureId}.jpg`;
      const size = await imageSizeSync(`public${src}`);
      const remoteUrl = build_museum_url(picture, collected);
      const museumId = safeGetAttr(picture, 'museum');
      const clipPath = safeGetAttr(picture, 'clip-path');
      const content_raw = safeGetInnerXML(picture).trim();
      const result = {
        id: `${personId}/${pictureId}`,
        remoteUrl,
        src,
        size,
        clipPath,
        content_lang: 'da',
        subjects,
        year,
        content_raw,
        content_html: htmlToXml(description, collected),
        note_html: htmlToXml(note, collected),
      };
      if (personId != 'kunst') {
        result.artist = collected.poets.get(personId);
        result.artistId = personId;
      }
      if (museumId != null) {
        result.museum = collected.museums.get(museumId);
      }
      if (clipPath != null) {
        result.clipPath = clipPath;
      }
      return result;
    }
  );
};

const build_artwork = async (collected) => {
  let collected_artwork = globalForceReload
    ? new Map()
    : new Map(loadCachedJSON('collected.artwork') || []);
  const force_reload = collected_artwork.size == 0;
  let found_changes = false;

  await mapLimit(
    Array.from(collected.poets.values()),
    async (person) => {
      const personId = person.id;
      const artworkFilename = `fdirs/${personId}/artwork.xml`;
      const portraitsFile = `fdirs/${personId}/portraits.xml`;
      const artworkFileChanged =
        force_reload || isFileModified(artworkFilename);

      if (artworkFileChanged) {
        found_changes = true;
        // Fjern eksisterende fra cache (i tilfælde af id er slettet)
        Array.from(collected_artwork.keys())
          .filter((k) => k.indexOf(`${personId}/`) === 0)
          .forEach((k) => {
            collected_artwork.delete(k);
          });

        if (fileExists(artworkFilename)) {
          (await readArtworkFile(personId, artworkFilename, collected)).forEach(
            (artwork) => {
              collected_artwork.set(artwork.id, artwork);
            }
          );
        }
      }
      if (force_reload || isFileModified(portraitsFile)) {
        found_changes = true;
        // Fjern eksisterende portraits fra cache (i tilfælde af id er slettet)
        Array.from(collected_artwork.keys())
          .filter((k) => k.indexOf(`portrait/${personId}/`) === 0)
          .forEach((k) => {
            collected_artwork.delete(k);
          });

        // From portraits.xml
        const doc = loadXMLDoc(`fdirs/${personId}/portraits.xml`);
        if (doc != null) {
          const onError = (message) => {
            throw `fdirs/${personId}/portraits.xml: ${message}`;
          };

          await mapLimit(
            getElementsByTagName(doc, 'picture').filter((picture) => {
              return (
                safeGetAttr(picture, 'artwork') == null &&
                safeGetAttr(picture, 'portrait') == null &&
                safeGetAttr(picture, 'ref') == null
              );
            }),
            async (pictureNode) => {
              const src = safeGetAttr(pictureNode, 'src');
              const picture = await get_picture(
                pictureNode,
                `/images/${personId}`,
                collected,
                onError
              );
              if (picture == null) {
                onError(
                  'har et billede uden src-, artwork-, portrait- eller ref-attribut.'
                );
              }
              const key = `portrait/${personId}/${src}`;
              return { key, picture };
            }
          ).then((a) => {
            a.forEach((p) => {
              const { key, picture } = p;
              collected_artwork.set(key, picture);
            });
          });
        }
      }

      // From works
      await mapLimit(
        collected.workids.get(personId),
        async (workId) => {
          const workFilename = `fdirs/${personId}/${workId}.xml`;
          if (force_reload || isFileModified(workFilename)) {
            found_changes = true;
            // Fjern eksisterende work pictures fra cache
            Array.from(collected_artwork.keys())
              .filter((k) => k.indexOf(`work/${personId}/${workId}`) === 0)
              .forEach((k) => {
                collected_artwork.delete(k);
              });

            const doc = loadXMLDoc(workFilename);
            if (doc != null) {
              const onError = (message) => {
                throw `${workFilename}: ${message}`;
              };
              await mapLimit(
                getElementsByTagName(doc, 'picture').filter((picture) => {
                  return (
                    safeGetAttr(picture, 'artwork') == null &&
                    safeGetAttr(picture, 'portrait') == null &&
                    safeGetAttr(picture, 'ref') == null
                  );
                }),
                async (pictureNode) => {
                  const src = safeGetAttr(pictureNode, 'src');
                  const picture = await get_picture(
                    pictureNode,
                    `/images/${personId}`,
                    collected,
                    onError
                  );
                  if (picture == null) {
                    onError(
                      'har et billede uden src-, artwork-, portrait- eller ref-attribut.'
                    );
                  }
                  const key = `work/${personId}/${workId}/${src}`;
                  return { key, picture };
                }
              ).then((a) => {
                a.forEach((p) => {
                  const { key, picture } = p;
                  collected_artwork.set(key, picture);
                });
              });
            }
          }
        }
      );
    }
  );

  if (force_reload || isFileModified('data/artwork.xml')) {
    found_changes = true;
    Array.from(collected_artwork.keys())
      .filter((k) => k.indexOf('kunst/') === 0)
      .forEach((k) => {
        collected_artwork.delete(k);
      });

    (await readArtworkFile('kunst', 'data/artwork.xml', collected)).forEach(
      (artwork) => {
        collected_artwork.set(artwork.id, artwork);
      }
    );
  }

  if (found_changes) {
    writeCachedJSON('collected.artwork', Array.from(collected_artwork));
  }
  return collected_artwork;
};

module.exports = {
  build_artwork,
};
