// @flow

export type DateWithPlace = {
  date: string, // Kan være '?'
  place: ?string,
};

export type Lang = 'da' | 'en';
export type TextLang = 'da' | 'en' | 'de' | 'fr' | 'sv' | 'no' | 'it';
export type Country = 'dk' | 'gb' | 'de' | 'fr' | 'se' | 'no' | 'it' | 'us';

export type PoetId = string;
export type WorkId = string;

export type Error = { statusCode: number };

export type URLString = string;

type TextContentLine = Array<string>; // TODO: Make this more precise

export type TextContentType = Array<TextContentLine>;

export type TextContentOptions = {
  isBible?: boolean,
  isFolkevise?: boolean,
  highlightBibleVerses?: ?{ from: number, to: number },
  isPoetry?: boolean,
};

export type Poet = {
  id: PoetId,
  type: 'poet' | 'person' | 'collection',
  lang: Lang,
  country: Country,
  portrait: string,
  name: {
    lastname?: string,
    firstname: string,
    fullname?: string,
    pseudonym?: string,
    christened?: string,
    realname?: string,
  },
  period: ?{
    born?: DateWithPlace,
    dead?: DateWithPlace,
    coronation?: DateWithPlace,
  },
  has_bibliography: boolean,
  has_biography: boolean,
  has_mentions: boolean,
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

export type KeywordRef = {
  id: string,
  type: 'keyword' | 'poet' | 'subject',
  title: string,
};

export type TocItem = {
  id?: string,
  title: string,
  prefix?: string,
  type: 'section' | 'text',
  content?: Array<TocItem>,
};

export type NoteItem = {
  lang: Lang,
  type: null | 'credits' | 'source',
  content_html: TextContentType,
  content_lang: TextLang,
};

export type PictureItem = {
  content_lang?: TextLang,
  content_html?: TextContentType,
  src: string,
};

export type Text = {
  id: string,
  title: string,
  linktitle: string,
  subtitles?: Array<TextContentType>,
  notes: Array<NoteItem>,
  refs: Array<TextContentType>,
  pictures: Array<PictureItem>,
  content_html: TextContentType,
  content_lang: TextLang,
  keywords: Array<KeywordRef>,
  has_footnotes: boolean,
  is_prose: boolean,
};

export type Keyword = {
  id: string,
  title: string,
  is_draft: boolean,
  author?: string,
  notes?: Array<NoteItem>,
  pictures: Array<PictureItem>,
  content_html: TextContentType,
  content_lang: TextLang,
  has_footnotes: boolean,
};

export type AboutItem = {
  id: string,
  title: string,
  is_draft: boolean,
  author?: string,
  notes: Array<NoteItem>,
  pictures: Array<PictureItem>,
  content_html: TextContentType,
  content_lang: TextLang,
  has_footnotes: boolean,
};

export type DictItem = {
  id: string,
  title: string,
  variants?: Array<string>,
  phrase?: string,
  content_html: TextContentType,
  content_lang: TextLang,
  has_footnotes: boolean,
};

export type NewsItem = {
  date: string,
  title: ?string,
  content_html: TextContentType,
  content_lang: TextLang,
};

export type TimelineItem = {
  date: string,
  type: 'text' | 'image',
  is_history_item: boolean,
  content_html: TextContentType,
  content_lang: TextLang,
  src?: string, // When type is 'image',
  // context is set for today-items
  context?: {
    poet: Poet,
    event_type: 'born' | 'dead',
    year: string,
  },
};
