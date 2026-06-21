import 'isomorphic-fetch';
import * as Paths from './paths.js';

export const createURL = (path) => {
  try {
    let l = eval('document.location');
    // We're running in the browser
    return `${l.protocol}//${l.host}${path}`;
  } catch (error) {
    // We're running in node.js on the server
    return `http://localhost:3000${path}`;
  }
};

const fetchJSON = async (path) => {
  const res = await fetch(createURL(path));
  if (res.status > 200) {
    return Promise.resolve({ error: { statusCode: res.status } });
  } else {
    return await res.json();
  }
};

export const poet = async (poetId) => {
  if (poetId == null) {
    return Promise.resolve(null);
  } else {
    return fetchJSON(`/api/${poetId}.json`);
  }
};

export const poets = async (country) => {
  // flow-disable-next-line
  return fetchJSON(`/api/poets-${country}.json`);
};

export const allTexts = async (country, type, letter) => {
  return fetchJSON(`/api/alltexts/${country}-${type}-${letter}.json`);
};

export const dictItem = async (dictItemId) => {
  return fetchJSON(`/api/dict/${dictItemId}.json`);
};

export const museums = async () => {
  return fetchJSON(`/api/museums.json`);
};

export const work = async (poetId, workId) => {
  const path = `/api/${poetId}/${workId}-toc.json`;
  return fetchJSON(path);
};

export const museum = async (museumId) => {
  const path = `/api/museums/${museumId}.json`;
  return fetchJSON(path);
};

export const works = async (poetId) => {
  return fetchJSON(`/api/${poetId}/works.json`);
};

export const bio = async (poetId) => {
  return fetchJSON(`/api/${poetId}/bio.json`);
};

export const mentions = async (poetId) => {
  return fetchJSON(`/api/${poetId}/mentions.json`);
};

export const keyword = async (keywordId) => {
  return fetchJSON(`/api/keywords/${keywordId}.json`);
};

export const about = async (keywordId, lang) => {
  return fetchJSON(`/api/about/${keywordId}_${lang}.json`);
};

export const text = async (textId) => {
  const path = Paths.textPath(textId).replace(/^public\//, '');
  const json = fetchJSON(`/${path}`);
  return json;
};

export const search = async (poetId, country, query, page = 0) => {
  let URL = `/search?country=${country}&query=${query}&page=${page}`;
  if (poetId != null) {
    URL += `&poetId=${poetId}`;
  }
  const res = await fetch(createURL(URL));
  return await res.json();
};

export const texts = async (poetId) => {
  return fetchJSON(`/api/${poetId}/texts.json`);
};
