// @flow

import type { Node } from 'react';

export type DateWithPlace = {
  date: string, // Kan være '?'
  place: ?string,
};

export type Lang = 'da' | 'en';
export type TextLang = 'da' | 'en' | 'de' | 'fr' | 'sv' | 'no' | 'it';
export type Country =
  | 'dk'
  | 'gb'
  | 'de'
  | 'fr'
  | 'se'
  | 'no'
  | 'it'
  | 'us'
  | 'un';

export type PoetId = string;
export type WorkId = string;
export type TextId = string;
export type MuseumId = string;

export type Error = { statusCode: number };

export type URLString = string;

type TextContentLine = Array<string>; // TODO: Make this more precise

export type TextContentType = Array<TextContentLine>;

export type TextContentOptions = {
  highlightBibleVerses?: ?{ from: number, to: number },
  highlight?: { from: number, to: number },
  marginLeft?: string,
  marginRight?: string,
  fontSize?: string,
};

export type Poet = {
  id: PoetId,
  type: 'poet' | 'person' | 'collection',
  lang: Lang,
  country: Country,
  portrait: string,
  square_portrait: string,
  name: {
    lastname?: string,
    firstname: string,
    fullname?: string,
    pseudonym?: string,
    christened?: string,
    realname?: string,
    sortname?: string,
  },
  period: ?{
    born?: DateWithPlace,
    dead?: DateWithPlace,
    coronation?: DateWithPlace,
  },
  has_artwork: boolean,
  has_bibliography: boolean,
  has_biography: boolean,
  has_mentions: boolean,
  has_works: boolean,
  has_texts: boolean,
  has_poems: boolean,
  has_prose: boolean,
  has_portraits: boolean,
  has_square_portrait: boolean,
};

export type Museum = {
  id: MuseumId,
  name: ?string,
  sortName: ?string,
  deepLink: ?string,
};

export type Work = {
  id: WorkId,
  title: string,
  toctitle: { title: string, prefix?: string },
  linktitle: string,
  breadcrumbtitle: string,
  subtitles: ?TextContentType,
  year?: string,
  has_content: boolean,
  status: 'complete' | 'incomplete',
  parent: ?Work,
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

export type LinesType = 'first' | 'titles';

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
  html: Node,
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
  level?: number,
  content?: Array<TocItem>,
};
export type NoteType = null | 'credits' | 'source' | 'unknown-original';

export type NoteItem = {
  lang: Lang,
  type: NoteType,
  unknownOriginalBy?: Poet,
  content_html: TextContentType,
  content_lang: TextLang,
};

export type PictureItem = {
  artist?: Poet,
  museum?: Museum,
  remoteUrl?: string,
  clipPath?: string,
  content_lang?: TextLang,
  content_html?: TextContentType,
  note_html?: TextContentType,
  primary?: boolean,
  size?: { width: number, height: number },
  year?: string,
  src: string,
};

export type TextSource = {
  pages: string,
  source: string,
  facsimile: string,
  facsimilePages: Array<number>,
  facsimilePageCount: number,
};

export type Text = {
  id: string,
  title: string,
  title_prefix?: string,
  linktitle: string,
  text_type: 'text' | 'section',
  toc?: Array<TocItem>,
  subtitles?: Array<TextContentType>,
  suptitles?: Array<TextContentType>,
  notes: Array<NoteItem>,
  refs: Array<TextContentType>,
  variants: Array<TextContentType>,
  pictures: Array<PictureItem>,
  blocks: [
    {
      lines: TextContentType,
      type: 'poetry' | 'prose' | 'quote',
      options: {
        marginLeft?: string,
        marginRight?: string,
        fontSize?: string,
      },
    }
  ],
  content_lang: TextLang,
  keywords: Array<KeywordRef>,
  has_footnotes: boolean,
  source?: TextSource,
  unknown_original?: {
    poetId: PoetId,
    note?: Text,
  },
};

export type Keyword = {
  id: string,
  title: string,
  redirectURL?: string,
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
