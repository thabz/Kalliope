const { safeMkdir, writeJSON, htmlToXml } = require('../libs/helpers.js');
const { isFileModified } = require('../libs/caching.js');
const {
  compareNormalizedDate,
  normalizeTimelineDate,
} = require('../../common/dates.js');
const {
  safeGetAttr,
  safeGetInnerXML,
  getChildByTagName,
  loadXMLDoc,
  getElementsByTagName,
} = require('./xml.js');
const { get_picture } = require('./parsing.js');

const normalize_timeline_date = normalizeTimelineDate;
const compare_normalized_date = compareNormalizedDate;

const sorted_timeline = (timeline) => {
  return timeline.sort((a, b) =>
    compare_normalized_date(a.normalized_date, b.normalized_date)
  );
};

const load_timeline = async (filename, collected) => {
  let doc = loadXMLDoc(filename);
  if (doc == null) {
    return [];
  }
  return Promise.all(
    getElementsByTagName(doc, 'entry').map(async (event) => {
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
    })
  );
};

const cover_picture = async (poetId, workId, collected) => {
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

const build_global_timeline = async (collected) => {
  return load_timeline('data/events.xml', collected);
};

const build_poet_timeline_json = async (poet, collected) => {
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
    const workItems = await Promise.all(
      collected.workids
        .get(poet.id)
        .filter((workId) => {
          // Vi vil ikke have underværkerne i tidslinjen
          const work = collected.works.get(`${poet.id}/${workId}`);
          return work.parent == null;
        })
        .map(async (workId) => {
          const work = collected.works.get(`${poet.id}/${workId}`);
          if (work.year != '?') {
            const workName = work.has_content
              ? `<a work="${poet.id}/${workId}">${work.title}</a>`
              : work.title;
            const coverPicture = await cover_picture(
              poet.id,
              workId,
              collected
            );
            const contentHtml = [
              [`${poet.name.lastname}: ${workName}.`, { html: true }],
            ];
            const textItem = {
              date: work.published,
              normalized_date: normalize_timeline_date(work.published),
              type: 'text',
              content_lang: 'da',
              is_history_item: false,
              content_html: contentHtml,
            };
            if (coverPicture == null) {
              return [textItem];
            }
            return [
              {
                date: work.published,
                normalized_date: normalize_timeline_date(work.published),
                type: 'image',
                is_history_item: false,
                src: coverPicture.src,
                content_lang: coverPicture.content_lang,
                lang: coverPicture.lang,
                content_html: coverPicture.content_html,
                miniature_content_html: contentHtml,
              },
            ];
          }
          return [];
        })
    );
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
        normalized_date: normalize_timeline_date(poet.period.born.date),
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
        normalized_date: normalize_timeline_date(poet.period.dead.date),
        type: 'text',
        is_history_item: false,
        content_lang: 'da',
        content_html: [
          [`${poet.name.lastname || poet.name.firstname} død${place}`],
        ],
      });
    }
    let poet_events = (
      await load_timeline(`fdirs/${poet.id}/events.xml`, collected)
    ).map((e) => {
      e.is_history_item = false;
      e.normalized_date = normalize_timeline_date(e.date);
      return e;
    });
    items = [...items, ...poet_events];
    items = sorted_timeline(items);
  }
  if (items.length >= 2) {
    const start_date = items[0].normalized_date;
    let end_date = items[items.length - 1].normalized_date;
    if (poet.period.dead.date !== '?') {
      end_date = normalize_timeline_date(poet.period.dead.date);
    }
    let globalItems = collected.timeline
      .map((e) => {
        e.normalized_date = normalize_timeline_date(e.date);
        return e;
      })
      .filter((e) => {
        return (
          compare_normalized_date(e.normalized_date, start_date) === 1 &&
          compare_normalized_date(e.normalized_date, end_date) === -1
        );
      });
    items = [...globalItems, ...items];
    items = sorted_timeline(items);
  }
  if (items.length == 1) {
    // We only have a single born or dead event. Not an interesting timeline,
    // so ignore it.
    items = [];
  }
  return items;
};

module.exports = {
  build_global_timeline,
  build_poet_timeline_json,
  normalize_timeline_date,
  compare_normalized_date,
  sorted_timeline,
};
