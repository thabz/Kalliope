// @flow
import 'isomorphic-fetch';
import * as Paths from './paths.js';
import type {
  Lang,
  Poet,
  PoetId,
  Work,
  WorkId,
  Text,
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
export const works = async (poetId: string): FetchWorksResult => {
  const res = await fetch(createURL(`/static/api/${poetId}/works.json`));
  return (await res.json(): FetchWorksResult);
};

type FetchTextResult = Promise<{
  poet: Poet,
  work: Work,
  text: Text,
}>;
export const text = async (textId: string): FetchTextResult => {
  const path: string = Paths.textPath(textId);
  const res = await fetch(createURL(`/${path}`));
  return (await res.json(): FetchWorksResult);
};
