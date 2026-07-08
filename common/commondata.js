// All our images should have scaled versions with the following widths
export const availableImageWidths = [
  100, 150, 200, 250, 300, 400, 500, 600, 800,
];

// Det er vigtigt at webp kommer før jpg, da Chrome vælger den første source
// den kender.
export const availableImageFormats = ['jpg'];

export const fallbackImagePostfix = '-w800.jpg';

export const countries = [
  //const countries: Array<{
  //  code: Country,
  //  adjective: { da: string, en: string },
  //}> = [
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

export const backgroundLinkColor = 'hsla(353, 20%, 85%, 1)';
export const lightLinkColor = '#9C686C';
export const lightTextColor = '#767676';
export const linkColor = 'hsla(353, 43%, 38%, 1)';

export default {
  availableImageWidths,
  availableImageFormats,
  fallbackImagePostfix,
  countries,
  backgroundLinkColor,
  lightLinkColor,
  lightTextColor,
  linkColor,
};
