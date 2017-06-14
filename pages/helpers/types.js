// @flow

export type DateWithPlace = {
  date: string, // Kan være '?'
  place?: string,
};

export type Poet = {
  id: string,
  type: 'poet' | 'person' | 'collection',
  name: {
    lastname?: string,
    firstname: string,
    fullname?: string,
    pseudonym?: string,
    christened?: string,
    realname?: string,
  },
  period?: { born?: DateWithPlace, dead?: DateWithPlace },
};

export type Work = {
  id: string,
  title: string,
  year?: string,
};

export type SortReturn = number; //1 | 0 | -1;

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

// Used for SectionedList
export type SectionForRendering = Section<{
  id: string,
  url: string,
  html: any,
}>;

export type TocItem = {
  id?: string,
  title: string,
  prefix?: string,
  type: 'section' | 'text',
  content?: Array<TocItem>,
};

export type NoteItem = {
  lang: Lang,
  content_html: string,
};

export type PictureItem = {
  lang: Lang,
  content_html: string,
  src: string,
};

export type Text = {
  id: string,
  title: string,
  subtitles?: Array<string>,
  notes: Array<NoteItem>,
  pictures: Array<PictureItem>,
  content_html: string,
};

export type Keyword = {
  id: string,
  title: string,
  author?: string,
  content_html: string,
};

export type DictItem = {
  id: string,
  title: string,
  variants?: Array<string>,
  phrase?: string,
  content_html: string,
};

export type NewsItem = {
  date: string,
  content_html: string,
};

export type TextContentOptions = {
  isBibleVerses?: boolean,
  highlightBibleVerses?: Array<number>,
};
