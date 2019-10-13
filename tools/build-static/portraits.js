const { loadXMLDoc } = require('../libs/helpers.js');
const { get_picture } = require('./parsing.js');

const build_portraits_json = (poet, collected) => {
  let result = [];
  if (!poet.has_portraits) {
    return result;
  }
  const doc = loadXMLDoc(`fdirs/${poet.id}/portraits.xml`);
  if (doc != null) {
    onError = message => {
      throw `fdirs/${poet.id}/portraits.xml: ${message}`;
    };
    result = doc.find('//pictures/picture').map(picture => {
      picture = get_picture(
        picture,
        `/static/images/${poet.id}`,
        collected,
        onError
      );
      if (picture == null) {
        onError('har et billede uden src- eller ref-attribut.');
      }
      return picture;
    });
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

module.exports = {
  build_portraits_json,
};
