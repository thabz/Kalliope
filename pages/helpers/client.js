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
  Keyword,
  PrevNextText,
  LinesPair,
  TocItem,
  NoteItem,
  PictureItem,
  TextLang,
  Error,
  LinesType,
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

type FetchPoetsResult = Promise<{
  poets: Array<Poet>,
  error: ?Error,
}>;
export const poets = async (country: Country): FetchPoetsResult => {
  return fetchJSON(`/static/api/poets-${country}.json`);
};

type FetchAllTextsResult = Promise<{
  lines: Array<any>,
  letters: Array<string>,
  error: ?Error,
}>;
export const allTexts = async (
  country: Country,
  type: LinesType,
  letter: string
): FetchAllTextsResult => {
  return fetchJSON(`/static/api/alltexts/${country}-${type}-${letter}.json`);
};

type FetchDictItemResult = Promise<{
  item: DictItem,
  error: ?Error,
}>;
export const dictItem = async (dictItemId: string): FetchDictItemResult => {
  return fetchJSON(`/static/api/dict/${dictItemId}.json`);
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
  workId: WorkId,
  error: ?Error
): Promise<FetchWorkResult> => {
  const path = `/static/api/${poetId}/${workId}-toc.json`;
  return fetchJSON(path);
};

type FetchWorksResult = Promise<{
  poet: Poet,
  works: Array<Work>,
  artwork: Array<PictureItem>,
  error: ?Error,
}>;
export const works = async (poetId: PoetId): FetchWorksResult => {
  return fetchJSON(`/static/api/${poetId}/works.json`);
};

type FetchBioResult = Promise<{
  poet: Poet,
  portrait?: PictureItem,
  timeline: Array<TimelineItem>,
  content_html: TextContentType,
  content_lang: TextLang,
  error: ?Error,
}>;
export const bio = async (poetId: PoetId): FetchBioResult => {
  return fetchJSON(`/static/api/${poetId}/bio.json`);
};

type FetchMentionsResult = Promise<{
  poet: Poet,
  mentions: Array<TextContentType>,
  translations: Array<TextContentType>,
  primary: Array<TextContentType>,
  secondary: Array<TextContentType>,
  error: ?Error,
}>;
export const mentions = async (poetId: PoetId): FetchMentionsResult => {
  return fetchJSON(`/static/api/${poetId}/mentions.json`);
};

type FetchKeywordResult = Promise<Keyword>;
export const keyword = async (keywordId: string): FetchKeywordResult => {
  return fetchJSON(`/static/api/keywords/${keywordId}.json`);
};

export const about = async (
  keywordId: string,
  lang: Lang
): FetchKeywordResult => {
  return fetchJSON(`/static/api/about/${keywordId}_${lang}.json`);
};

type FetchTextResult = Promise<{
  poet: Poet,
  work: Work,
  prev: PrevNextText,
  next: PrevNextText,
  text: Text,
  section_titles: Array<string>,
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
