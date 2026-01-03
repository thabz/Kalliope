const { safeMkdir, writeJSON, htmlToXml } = require('../libs/helpers.js');
const { isFileModified } = require('../libs/caching.js');
const {
  safeGetAttr,
  safeGetInnerXML,
  getChildByTagName,
  loadXMLDoc,
  getElementsByTagName,
} = require('./xml.js');
const { get_picture } = require('./parsing.js');

// Accepterer sYYYY, sYYYY-MM, sYYYY-MM-DD og returnerer altid sYYYY-MM-DD
const normalize_timeline_date = (date) => {
  // Tjek for negativt år
  const isNegative = date.startsWith('-');
  const cleanDate = isNegative ? date.slice(1) : date;
  const parts = cleanDate.split('-');
  if (parts.length === 1) {
    parts.push('01', '01');
  } else if (parts.length === 2) {
    parts.push('01');
  }

  const normalized = `${parts[0]}-${parts[1]}-${parts[2]}`;
  return isNegative ? `-${normalized}` : normalized;
};

function compare_normalized_date(a, b) {
  function parse(s) {
    // s = "YYYY-MM-DD" eller "-YYYY-MM-DD"
    const sign = s[0] === '-' ? -1 : 1;
    const offset = sign === -1 ? 1 : 0;

    const year = sign * Number(s.slice(offset, offset + 4));
    const month = Number(s.slice(offset + 5, offset + 7));
    const day = Number(s.slice(offset + 8, offset + 10));

    return { year, month, day };
  }

  const pa = parse(a);
  const pb = parse(b);

  if (pa.year !== pb.year) {
    return pa.year < pb.year ? -1 : 1;
  }
  if (pa.month !== pb.month) {
    return pa.month < pb.month ? -1 : 1;
  }
  if (pa.day !== pb.day) {
    return pa.day < pb.day ? -1 : 1;
  }
  return 0;
}

const sorted_timeline = (timeline) => {
  return timeline.sort((a, b) => compare_normalized_date(a.date, b.date));
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
          '/static',
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
    collected.workids
      .get(poet.id)
      .filter((workId) => {
        // Vi vil ikke have underværkerne i tidslinjen
        const work = collected.works.get(`${poet.id}/${workId}`);
        return work.parent == null;
      })
      .forEach((workId) => {
        const work = collected.works.get(`${poet.id}/${workId}`);
        if (work.year != '?') {
          // TODO: Hvis der er et titel-blad, så output type image.
          const workName = work.has_content
            ? `<a work="${poet.id}/${workId}">${work.title}</a>`
            : work.title;
          items.push({
            date: work.published,
            type: 'text',
            content_lang: 'da',
            is_history_item: false,
            content_html: [
              [`${poet.name.lastname}: ${workName}.`, { html: true }],
            ],
          });
        }
      });
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
        type: 'text',
        is_history_item: false,
        content_lang: 'da',
        content_html: [
          [`${poet.name.lastname || poet.name.firstname} født${place}`],
        ],
      });
    }
    let dead_date = null;
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
      return e;
    });
    items = [...items, ...poet_events];
    items = sorted_timeline(items);
  }
  if (items.length >= 2) {
    const start_date = normalize_timeline_date(items[0].date);
    let end_date = normalize_timeline_date(items[items.length - 1].date);
    if (poet.period.dead.date !== '?') {
      end_date = normalize_timeline_date(poet.period.dead.date);
    }
    let globalItems = collected.timeline.filter((item) => {
      return (
        compare_normalized_date(item.date, start_date) === 1 &&
        compare_normalized_date(item.date, end_date) === -1
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
};
