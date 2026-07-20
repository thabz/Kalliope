import { loadCachedJSON } from './libs/caching.js';

const counts = new Map();
let poemsWithNoDate = 0;
const collect = () => {
  let texts = new Map(loadCachedJSON('collected.texts') || []);
  const regexp = /[a-z]+(\d{6})/;
  texts.forEach((meta, textId) => {
    if (meta.indexable === false) {
      return;
    }
    const m = textId.match(regexp);
    if (m) {
      counts[m[1]] = (counts[m[1]] || 0) + 1;
    } else {
      poemsWithNoDate += 1;
    }
  });

  const nowYear = new Date().getFullYear();
  const nowMonth = new Date().getMonth() + 1;

  let sum = poemsWithNoDate;
  for (let y = 1999; y <= nowYear; y++) {
    for (let m = 1; m <= 12; m++) {
      if (!(y === nowYear && m > nowMonth)) {
        const k = `${y}${m < 10 ? '0' + m : m}`;
        if (counts[k]) {
          sum += counts[k];
        }
        const data = {
          sum,
          year: y,
          month: m,
          added: counts[k] || 0,
        };
        console.log(k, data);
      }
    }
  }
};

collect();
