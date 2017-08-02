// @flow
import 'isomorphic-fetch';
import * as Paths from './paths.js';
import type {
  Lang,
  Country,
  Poet,
  PoetId,
  Work,
  WorkId,
  Text,
  PrevNextText,
  LinesPair,
  TocItem,
  NoteItem,
  PictureItem,
} from './types.js';

export const createURL = (path: string): string => {
  try {
    let l = eval('document.location');
    // We're running in the browser
    return `${l.protocol}//${l.host}${path}`;
  } catch (error) {
    // We're running in node.js on the server
    return `http://localhost:3000${path}`;
  }
};

export const poet = async (poetId: ?PoetId): Promise<?Poet> => {
  if (poetId == null) {
    return Promise.resolve(null);
  } else {
    const res = await fetch(createURL(`/static/api/${poetId}.json`));
    const json = (await res.json(): Promise<Poet>);
    return json;
  }
};

export type FetchWorkResult = {
  poet: Poet,
  work: Work,
  toc: Array<TocItem>,
  notes: Array<NoteItem>,
  pictures: Array<PictureItem>,
};
export const work = async (
  poetId: PoetId,
  workId: WorkId
): Promise<FetchWorkResult> => {
  const res = await fetch(
    createURL(`/static/api/${poetId}/${workId}-toc.json`)
  );
  const json = (await res.json(): Promise<FetchWorkResult>);
  return json;
};

type FetchWorksResult = Promise<{
  poet: Poet,
  works: Array<Work>,
}>;
export const works = async (poetId: PoetId): FetchWorksResult => {
  const res = await fetch(createURL(`/static/api/${poetId}/works.json`));
  return (await res.json(): FetchWorksResult);
};

type FetchTextResult = Promise<{
  poet: Poet,
  work: Work,
  prev: PrevNextText,
  next: PrevNextText,
  text: Text,
}>;
export const text = async (textId: string): FetchTextResult => {
  const path: string = Paths.textPath(textId);
  const res = await fetch(createURL(`/${path}`));
  return (await res.json(): FetchTextResult);
};

type FetchSearchResult = Promise<{
  hits: any,
}>;
export const search = async (
  poetId: string = '',
  country: Country,
  query: string,
  page: number = 0
): FetchSearchResult => {
  let URL = `/search?country=${country}&query=${query}&page=${page}`;
  if (poetId != null) {
    URL += `&poetId=${poetId}`;
  }
  const res = await fetch(createURL(URL));
  return (await res.json(): FetchSearchResult);
};
