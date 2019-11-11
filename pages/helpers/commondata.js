// @flow
import type { Country } from './types.js';

// All our images should have scaled versions with the following widths
module.exports.availableImageWidths = [
  100,
  150,
  200,
  250,
  300,
  400,
  500,
  600,
  800,
];

// Det er vigtigt at webp kommer før jpg, da Chrome vælger den første source
// den kender.
module.exports.availableImageFormats = ['webp', 'jpg'];

module.exports.fallbackImagePostfix = '-w800.jpg';

const countries: Array<{
  code: Country,
  adjective: { da: string, en: string },
}> = [
  {
    code: 'dk',
    adjective: {
      da: 'danske',
      en: 'Danish',
    },
  },
  {
    code: 'gb',
    adjective: {
      da: 'engelske',
      en: 'English',
    },
  },
  {
    code: 'de',
    adjective: {
      da: 'tyske',
      en: 'German',
    },
  },
  {
    code: 'fr',
    adjective: {
      da: 'franske',
      en: 'French',
    },
  },
  {
    code: 'se',
    adjective: {
      da: 'svenske',
      en: 'Swedish',
    },
  },
  {
    code: 'no',
    adjective: {
      da: 'norske',
      en: 'Norwegian',
    },
  },
  {
    code: 'it',
    adjective: {
      da: 'italienske',
      en: 'Italian',
    },
  },
  {
    code: 'us',
    adjective: {
      da: 'amerikanske',
      en: 'North American',
    },
  },
  {
    code: 'un',
    adjective: {
      da: 'andre',
      en: 'other',
    },
  },
];

module.exports.countries = countries;

module.exports.backgroundLinkColor = 'hsla(353, 20%, 85%, 1)';
module.exports.lightLinkColor = '#9C686C';
module.exports.lightTextColor = '#767676';
module.exports.linkColor = 'hsla(353, 43%, 38%, 1)';
