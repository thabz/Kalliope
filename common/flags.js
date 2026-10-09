export const flagMap = Object.freeze(Object.assign(Object.create(null), {
  dk: '🇩🇰',
  se: '🇸🇪',
  no: '🇳🇴',
  gb: '🇬🇧',
  de: '🇩🇪',
  fr: '🇫🇷',
  us: '🇺🇸',
  it: '🇮🇹',
  es: '🇪🇸',
  nl: '🇳🇱',
  gr: '🇬🇷',
  ir: '🇮🇷',
  fi: '🇫🇮',
  ch: '🇨🇭',
  at: '🇦🇹',
  pt: '🇵🇹',
}));

export const poetFlag = poet => {
  const countryCode = poet.nationality ?? poet.country;
  const flag = flagMap[countryCode];
  if (flag == null) {
    throw new Error(`${poet.id} har ingen flag-emoji for landekoden: ${countryCode}`);
  }
  return flag;
};
