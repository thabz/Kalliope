// @flow
import type {
  Section,
  Poet,
  LinesPair,
  SortReturn,
  Keyword,
  DictItem,
} from './types.js';

const daDK = 'da-DK';

const nvl = <T>(x: ?T, v: T): T => {
  return x == null ? v : x;
};

export const poetsByLastname = (a: Poet, b: Poet): SortReturn => {
  const a1 = nvl(a.name.lastname, 'X');
  const a2 = nvl(a.name.firstname, 'X');
  const b1 = nvl(b.name.lastname, 'X');
  const b2 = nvl(b.name.firstname, 'X');

  if (a1 === b1) {
    if (a2 === b2) {
      return a.id < b.id ? -1 : 1;
    } else {
      return a2.localeCompare(b2, daDK);
    }
  } else {
    return a1.localeCompare(b1, daDK);
  }
};

export const poetsByBirthDate = (a: Poet, b: Poet): SortReturn => {
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

export const linesPairsByLine = (a: LinesPair, b: LinesPair): SortReturn => {
  const a1 = a.sortBy;
  const b1 = b.sortBy;
  return a1.localeCompare(b1, daDK);
};

export const keywordsByTitle = (a: Keyword, b: Keyword): SortReturn => {
  return a.title.localeCompare(b.title, daDK);
};

export const dictItemsByTitle = (a: DictItem, b: DictItem): SortReturn => {
  return a.title.localeCompare(b.title, daDK);
};

export function sectionsByTitle<T>(a: Section<T>, b: Section<T>): SortReturn {
  if (a.title.startsWith('Ukendt')) {
    return 1;
  } else if (b.title.startsWith('Ukendt')) {
    return -1;
  } else {
    return a.title.localeCompare(b.title, daDK);
  }
}
