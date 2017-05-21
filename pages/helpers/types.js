// @flow

export type Poet = {
  id: string,
  type: 'poet' | 'person' | 'collection',
  name: { lastname?: string, firstname: string },
  period?: { born: { date: string }, dead: { date: string } },
};

export type Work = {
  id: string,
  title: string,
  year?: string,
};

export type SortReturn = 1 | 0 | -1;

export type Section<T> = {
  title: string,
  items: Array<T>,
};

export type Lang = 'da' | 'en';

export type LinesPair = {
  id: string,
  title: string,
  firstline: string,
  sortBy: string,
};
