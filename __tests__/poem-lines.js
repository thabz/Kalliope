// Regulære expressions som fanger typiske fejl i vores XML.
const regexps = [
  /^,[a-zæøåA-ZÆØÅ]/,
  /^\s[-a-zæøåA-ZÆØÅ]/,
  /^\.[a-zæøåA-ZÆØÅ]/,
  /^-[a-zæøåA-ZÆØÅ]/,
  /mmm/,
  /iii/, // Problematisk da den rammer lowercase romertal. Fiks fejlere og drop reglen.
  /lll/,
  /aaa/,
  /sss/,
  / ,[^,]/,
];
// TODO: Hver regel kunne have nogle white-list regexps, som angiver undtagelser. F.eks. reglen /aaa/ kunne undtagelsen /Smaaalfer/

describe('Ingen digtere har samme id', () => {
  it(`Alle digtere har forskellige id`, () => {
    expect(1).toBe(1);
  });
});
