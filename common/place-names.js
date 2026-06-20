const placeReplacementsByLang = {
  en: [
    ['Københavns Slot', 'Copenhagen Castle'],
    ['Kbh.', 'Copenhagen'],
    ['København', 'Copenhagen'],
    ['Skt. Petersborg', 'St. Petersburg'],
    ['Sjælland', 'Zealand'],
    ['Rusland', 'Russia'],
    ['Tyskland', 'Germany'],
    ['Frankrig', 'France'],
    ['Sverige', 'Sweden'],
    ['Norge', 'Norway'],
    ['England', 'England'],
    ['Skotland', 'Scotland'],
    ['Italien', 'Italy'],
    ['Spanien', 'Spain'],
    ['Holland', 'the Netherlands'],
    ['Nederlandene', 'the Netherlands'],
    [' ved ', ' near '],
    ['(nu ', '(now '],
  ],
};

const translatePlace = (place, lang) => {
  return (placeReplacementsByLang[lang] || []).reduce(
    (translated, [from, to]) => translated.replaceAll(from, to),
    place
  );
};

module.exports = {
  translatePlace,
};
