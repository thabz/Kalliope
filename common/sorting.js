const daDK = 'da-DK';

const nvl = (x, v) => {
  return x == null ? v : x;
};

export const poetsByLastname = (a, b) => {
  const ao = nvl(
    a.name.sortname,
    nvl(a.name.lastname, '') + nvl(a.name.firstname, '')
  );
  const bo = nvl(
    b.name.sortname,
    nvl(b.name.lastname, '') + nvl(b.name.firstname, '')
  );
  return ao.localeCompare(bo, daDK);
};

export const poetsByBirthDate = (a, b) => {
  if (a.period == null || b.period == null) {
    return poetsByLastname(a, b);
  } else if (a.period.born == null || b.period.born == null) {
    return poetsByLastname(a, b);
  } else {
    const a1 = a.period.born.date;
    const b1 = b.period.born.date;
    if (a1 === b1) {
      return poetsByLastname(a, b);
    } else {
      return a1 < b1 ? -1 : 1;
    }
  }
};

export const linesPairsByLine = (a, b) => {
  const a1 = a.sortBy;
  const b1 = b.sortBy;
  return a1.localeCompare(b1, daDK);
};

export const keywordsByTitle = (a, b) => {
  return a.title.localeCompare(b.title, daDK);
};

export const dictItemsByTitle = (a, b) => {
  return a.title.localeCompare(b.title, daDK);
};

export function sectionsByTitle(a, b) {
  if (a.title.startsWith('Ukendt') || a.title.startsWith('Unknown')) {
    return 1;
  } else if (b.title.startsWith('Ukendt') || b.title.startsWith('Unknown')) {
    return -1;
  } else {
    return a.title.localeCompare(b.title, daDK);
  }
}
