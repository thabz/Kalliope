const {
  safeMkdir,
  writeJSON,
  loadXMLDoc,
  htmlToXml,
} = require('../libs/helpers.js');
const { isFileModified } = require('../libs/caching.js');
const { safeGetAttr } = require('./xml.js');
const { get_picture } = require('./parsing.js');

// Accepterer YYYY, YYYY-MM, YYYY-MM-DD og returnerer altid YYYY-MM-DD
const normalize_timeline_date = date => {
  if (date.length === 4 + 1 + 2 + 1 + 2) {
    return date;
  } else {
    const parts = date.split('-');
    if (parts.length === 1) {
      parts.push('01');
    }
    if (parts.length === 2) {
      parts.push('01');
    }
    return `${parts[0]}-${parts[1]}-${parts[2]}`;
  }
};

const sorted_timeline = timeline => {
  return timeline.sort((a, b) => {
    let date_a = normalize_timeline_date(a.date);
    let date_b = normalize_timeline_date(b.date);
    return date_b === date_a ? 0 : date_a < date_b ? -1 : 1;
  });
};

const load_timeline = (filename, collected) => {
  let doc = loadXMLDoc(filename);
  if (doc == null) {
    return [];
  }
  return doc.find('//events/entry').map(event => {
    const type = event.attr('type').value();
    const date = event.attr('date').value();
    let data = {
      date,
      type,
      is_history_item: true,
    };
    if (type === 'image') {
      const onError = message => {
        throw `${filename}: ${message}`;
      };
      const pictureNode = event.get('picture');
      if (pictureNode == null) {
        onError('indeholder event med type image uden <picture>');
      }
      const picture = get_picture(pictureNode, '/static', collected, onError);
      data.src = picture.src;
      data.content_lang = picture.content_lang;
      data.lang = picture.lang;
      data.content_html = picture.content_html;
    } else {
      data.content_lang = 'da';
      data.lang = 'da';
      const html = event.get('html');
      data.content_html = htmlToXml(
        html
          .toString()
          .replace('<html>', '')
          .replace('</html>', '')
          .trim(),
        collected
      );
    }
    return data;
  });
};

const build_global_timeline = collected => {
  return load_timeline('data/events.xml', collected);
};

const build_poet_timeline_json = (poet, collected) => {
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
      .filter(workId => {
        // Vi vil ikke have underværkerne i tidslinjen
        const work = collected.works.get(`${poet.id}/${workId}`);
        return work.parent == null;
      })
      .forEach(workId => {
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
      const place = (poet.period.born.place != null
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
      const place = (poet.period.dead.place != null
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
    let poet_events = load_timeline(
      `fdirs/${poet.id}/events.xml`,
      collected
    ).map(e => {
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
    let globalItems = collected.timeline.filter(item => {
      const d = normalize_timeline_date(item.date);
      return d > start_date && d < end_date;
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
