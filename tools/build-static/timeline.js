import { safeMkdir, writeJSON, htmlToXml } from '../libs/helpers.js';
import { isFileModified } from '../libs/caching.js';
import {
  compareNormalizedDate,
  normalizeTimelineDate,
} from '../../common/dates.js';
import {
  safeGetAttr,
  safeGetInnerXML,
  getChildByTagName,
  loadXMLDoc,
  getElementsByTagName,
} from './xml.js';
import { get_picture } from './parsing.js';
import { mapLimit } from './concurrency.js';

const sortedTimeline = (timeline) => {
  return timeline.sort((a, b) =>
    compareNormalizedDate(a.normalized_date, b.normalized_date)
  );
};

const loadTimeline = async (filename, collected) => {
  let doc = loadXMLDoc(filename);
  if (doc == null) {
    return [];
  }
  return mapLimit(
    getElementsByTagName(doc, 'entry'),
    async (event) => {
      const type = safeGetAttr(event, 'type');
      const date = safeGetAttr(event, 'date');
      let data = {
        date,
        type,
        is_history_item: true,
      };
      if (type === 'image') {
        const onError = (message) => {
          throw `${filename}: ${message}`;
        };
        const pictureNode = getChildByTagName(event, 'picture');
        if (pictureNode == null) {
          onError('indeholder event med type image uden <picture>');
        }
        const picture = await get_picture(
          pictureNode,
          '',
          collected,
          onError
        );
        data.src = picture.src;
        data.content_lang = picture.content_lang;
        data.lang = picture.lang;
        data.content_html = picture.content_html;
      } else {
        data.content_lang = 'da';
        data.lang = 'da';
        const html = getChildByTagName(event, 'html');
        data.content_html = htmlToXml(safeGetInnerXML(html).trim(), collected);
      }
      return data;
    }
  );
};

const coverPicture = async (poetId, workId, collected) => {
  const filename = `fdirs/${poetId}/${workId}.xml`;
  const doc = loadXMLDoc(filename);
  if (doc == null) {
    return null;
  }

  const work = getChildByTagName(doc, 'kalliopework');
  const head = getChildByTagName(work, 'workhead');
  const pictures = getElementsByTagName(head, 'picture');
  const pictureNode =
    pictures.find((picture) => safeGetAttr(picture, 'type') === 'frontpage') ||
    pictures.find((picture) => safeGetAttr(picture, 'type') === 'titlepage') ||
    pictures[0];

  if (pictureNode == null) {
    return null;
  }

  const onError = (message) => {
    throw `${filename}: ${message}`;
  };
  return get_picture(pictureNode, `/images/${poetId}`, collected, onError);
};

const buildGlobalTimeline = async (collected) => {
  return loadTimeline('content/events.xml', collected);
};

const buildPoetTimelineJson = async (poet, collected) => {
  const inonToString = (inon, lang) => {
    const translations = {
      'da*in': 'i',
      'da*on': 'på',
      'da*by': 'ved',
      'en*in': 'in',
      'en*on': 'on',
      'en*by': 'by',
    };
    return translations[lang + '*' + inon];
  };

  let items = [];
  if (poet.type !== 'collection') {
    const timelineWorkIds = collected.workids.get(poet.id).filter((workId) => {
      // Vi vil ikke have underværkerne i tidslinjen
      const work = collected.works.get(`${poet.id}/${workId}`);
      return work.parent == null;
    });
    const workItems = await mapLimit(timelineWorkIds, async (workId) => {
      const work = collected.works.get(`${poet.id}/${workId}`);
      if (work.year != null) {
        const workName = work.has_content
          ? `<a work="${poet.id}/${workId}">${work.title}</a>`
          : work.title;
        const coverPictureData = await coverPicture(poet.id, workId, collected);
        const contentHtml = [
          [`${poet.name.lastname}: ${workName}.`, { html: true }],
        ];
        const textItem = {
          date: work.published,
          normalized_date: normalizeTimelineDate(work.published),
          type: 'text',
          content_lang: 'da',
          is_history_item: false,
          content_html: contentHtml,
        };
        if (coverPictureData == null) {
          return [textItem];
        }
        return [
          {
            date: work.published,
            normalized_date: normalizeTimelineDate(work.published),
            type: 'image',
            is_history_item: false,
            src: coverPictureData.src,
            content_lang: coverPictureData.content_lang,
            lang: coverPictureData.lang,
            content_html: coverPictureData.content_html,
            miniature_content_html: contentHtml,
          },
        ];
      }
      return [];
    });
    items = items.concat([].concat(...workItems));
    if (poet.period.born.date !== '?') {
      const place = (
        poet.period.born.place != null
          ? '  ' +
            inonToString(poet.period.born.inon, 'da') +
            ' ' +
            poet.period.born.place +
            ''
          : ''
      ).replace(/\.*$/, '.'); // Kbh. giver ekstra punktum.
      items.push({
        date: poet.period.born.date,
        normalized_date: normalizeTimelineDate(poet.period.born.date),
        type: 'text',
        is_history_item: false,
        content_lang: 'da',
        content_html: [
          [`${poet.name.lastname || poet.name.firstname} født${place}`],
        ],
      });
    }
    if (poet.period.dead.date !== '?') {
      const place = (
        poet.period.dead.place != null
          ? ' ' +
            inonToString(poet.period.dead.inon, 'da') +
            ' ' +
            poet.period.dead.place
          : ''
      ).replace(/\.*$/, '.'); // Kbh. giver ekstra punktum.;
      items.push({
        date: poet.period.dead.date,
        normalized_date: normalizeTimelineDate(poet.period.dead.date),
        type: 'text',
        is_history_item: false,
        content_lang: 'da',
        content_html: [
          [`${poet.name.lastname || poet.name.firstname} død${place}`],
        ],
      });
    }
    let poetEvents = (
      await loadTimeline(`fdirs/${poet.id}/events.xml`, collected)
    ).map((e) => {
      e.is_history_item = false;
      e.normalized_date = normalizeTimelineDate(e.date);
      return e;
    });
    items = [...items, ...poetEvents];
    items = sortedTimeline(items);
  }
  if (items.length >= 2) {
    const startDate = items[0].normalized_date;
    let endDate = items[items.length - 1].normalized_date;
    if (poet.period.dead.date !== '?') {
      endDate = normalizeTimelineDate(poet.period.dead.date);
    }
    let globalItems = collected.timeline
      .map((e) => {
        e.normalized_date = normalizeTimelineDate(e.date);
        return e;
      })
      .filter((e) => {
        return (
          compareNormalizedDate(e.normalized_date, startDate) === 1 &&
          compareNormalizedDate(e.normalized_date, endDate) === -1
        );
      });
    items = [...globalItems, ...items];
    items = sortedTimeline(items);
  }
  if (items.length == 1) {
    // We only have a single born or dead event. Not an interesting timeline,
    // so ignore it.
    items = [];
  }
  return items;
};

export {
  buildGlobalTimeline,
  buildPoetTimelineJson,
  normalizeTimelineDate,
  compareNormalizedDate,
  sortedTimeline,
};
