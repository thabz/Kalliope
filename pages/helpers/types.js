// @flow

export type DateWithPlace = {
  date: string, // Kan være '?'
  place: ?string,
};

export type Lang = 'da' | 'en';
export type Country = 'dk' | 'gb' | 'de' | 'fr' | 'se' | 'no' | 'it' | 'us';

export type PoetId = string;
export type WorkId = string;

export type Error = { statusCode: number };

type TextContentLine = Array<string>; // TODO: Make this more precise

export type TextContentType = Array<TextContentLine>;

export type TextContentOptions = {
  isBible?: boolean,
  highlightBibleVerses?: ?{ from: number, to: number },
  isPoetry?: boolean,
};

export type Poet = {
  id: PoetId,
  type: 'poet' | 'person' | 'collection',
  lang: Lang,
  country: Country,
  name: {
    lastname?: string,
    firstname: string,
    fullname?: string,
    pseudonym?: string,
    christened?: string,
    realname?: string,
  },
  period: ?{ born?: DateWithPlace, dead?: DateWithPlace },
  has_bibliography: boolean,
  has_biography: boolean,
  has_works: boolean,
  has_texts: boolean,
  has_poems: boolean,
  has_prose: boolean,
  has_portraits: boolean,
};

export type Work = {
  id: WorkId,
  title: string,
  year?: string,
  has_content: boolean,
};

export type SortReturn = number; //1 | 0 | -1;

export type Section<T> = {
  title: string,
  items: Array<T>,
};

export type PrevNextText = {
  id: string,
  title: string,
};

export type LinesPair = {
  id: string,
  title: string,
  firstline: string,
  non_unique_indextitle?: boolean,
  non_unique_firstline?: boolean,
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
  content_html: TextContentType,
};

export type PictureItem = {
  lang: Lang,
  content_html?: TextContentType,
  src: string,
};

export type Text = {
  id: string,
  title: string,
  subtitles?: Array<TextContentType>,
  notes: Array<NoteItem>,
  refs: Array<TextContentType>,
  pictures: Array<PictureItem>,
  content_html: TextContentType,
  has_footnotes: boolean,
  is_prose: boolean,
};

export type Keyword = {
  id: string,
  title: string,
  author?: string,
  pictures: Array<PictureItem>,
  content_html: TextContentType,
  has_footnotes: boolean,
};

export type DictItem = {
  id: string,
  title: string,
  variants?: Array<string>,
  phrase?: string,
  content_html: TextContentType,
  has_footnotes: boolean,
};

export type NewsItem = {
  date: string,
  content_html: TextContentType,
};

export type TimelineItem = {
  date: string,
  lang: Lang,
  type: 'text' | 'image',
  is_history_item: boolean,
  content_html: TextContentType,
  src?: string, // When type is 'image'
};
