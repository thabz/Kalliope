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

const fetchJSON = async (path: string): Promise<*> => {
  const res = await fetch(createURL(path));
  if (res.status > 200) {
    return Promise.resolve({ error: { statusCode: res.status } });
  } else {
    return await res.json();
  }
};

export const poet = async (poetId: ?PoetId): Promise<?Poet> => {
  if (poetId == null) {
    return Promise.resolve(null);
  } else {
    return fetchJSON(`/static/api/${poetId}.json`);
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
  error: ?Error,
}>;
export const text = async (textId: string): FetchTextResult => {
  const path: string = Paths.textPath(textId);
  const json: FetchTextResult = fetchJSON(`/${path}`);
  return json;
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
