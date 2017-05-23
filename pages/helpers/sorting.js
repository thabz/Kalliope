// @flow
import type { Section, Poet, LinesPair, SortReturn } from './types.js';

export const poetsByLastname = (a: Poet, b: Poet): SortReturn => {
  const a1 = a.name.lastname || 'X';
  const a2 = a.name.firstname || 'X';
  const b1 = b.name.lastname || 'X';
  const b2 = b.name.firstname || 'X';
  if (a1 === b1) {
    if (a2 === b2) {
      return a.id < b.id ? -1 : 1;
    } else {
      return a2 < b2 ? -1 : 1;
    }
  } else {
    return a1 < b1 ? -1 : 1;
  }
};

export const poetsByBirthDate = (a: Poet, b: Poet): SortReturn => {
  if (a.period == null || b.period == null) {
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
  if (a1 === b1) {
    return 0;
  } else {
    return a1 < b1 ? -1 : 1;
  }
};

export function sectionsByTitle<T>(a: Section<T>, b: Section<T>): SortReturn {
  if (a.title.startsWith('Ukendt')) {
    return 1;
  } else if (b.title.startsWith('Ukendt')) {
    return -1;
  } else {
    return a.title < b.title ? -1 : 1;
  }
}
