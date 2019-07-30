const { isFileModified } = require('../libs/caching.js');
const { safeMkdir, writeJSON } = require('../libs/helpers.js');
const { poetName } = require('./formatting.js');
const { build_portraits_json } = require('./portraits.js');

const build_todays_events_json = collected => {
  const portrait_descriptions = Array.from(collected.poets.values()).map(
    poet => {
      return `fdirs/${poet.id}/portraits.xml`;
    }
  );
  const poet_info_files = Array.from(collected.poets.values()).map(poet => {
    return `fdirs/${poet.id}/info.xml`;
  });
  if (!isFileModified(...poet_info_files, ...portrait_descriptions)) {
    return;
  }

  const langs = ['da', 'en'];

  safeMkdir('static/api/today');
  langs.forEach(lang => {
    safeMkdir(`static/api/today/${lang}`);
  });

  const collected_events = new Map();

  const add_event = (lang, monthAndDay, event) => {
    const key = `${lang}-${monthAndDay}`;
    let items = collected_events.get(key) || [];
    items.push(event);
    collected_events.set(key, items);
  };

  collected.poets.forEach((poet, poetId) => {
    if (poet.period != null) {
      const born = poet.period.born;
      const dead = poet.period.dead;
      if (born != null && born.date != null) {
        const m = born.date.match(/(\d\d\d\d)-(\d\d-\d\d)/);
        if (m != null) {
          const year = m[1];
          const monthAndDay = m[2];
          langs.forEach(lang => {
            content_html = `<a poet="${poetId}">${poetName(poet)}</a>`;
            content_html += lang === 'da' ? ' født' : ' born';
            if (born.place != null) {
              content_html += `, ${born.place}.`;
            } else {
              content_html += '.';
            }
            content_html = content_html.replace(/\.+$/, '.');
            add_event(lang, monthAndDay, {
              type: 'text',
              content_html: [[content_html, { html: true }]],
              content_lang: lang,
              date: born.date,
              context: { event_type: 'born', year, poet },
            });
          });
        }
      }
      if (dead != null && dead.date != null) {
        const m = dead.date.match(/(\d\d\d\d)-(\d\d-\d\d)/);
        if (m != null) {
          const year = m[1];
          const monthAndDay = m[2];
          langs.forEach(lang => {
            content_html = `<a poet="${poetId}">${poetName(poet)}</a>`;
            content_html += lang === 'da' ? ' død' : ' dead';
            if (dead.place != null) {
              content_html += `, ${dead.place}.`;
            } else {
              content_html += '.';
            }
            content_html = content_html.replace(/\.+$/, '.');
            add_event(lang, monthAndDay, {
              type: 'text',
              content_html: [[content_html, { html: true }]],
              date: dead.date,
              content_lang: lang,
              context: { event_type: 'dead', year, poet },
            });
          });
        }
      }
    }
  });

  langs.forEach(lang => {
    const preferredCountries =
      lang === 'da' ? ['se', 'de', 'dk'] : ['us', 'gb']; // Større index er større vægt
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? '0' + d : d;
        const mm = m < 10 ? '0' + m : m;
        const events = collected_events.get(`${lang}-${mm}-${dd}`) || [];
        if (events.filter(e => e.type === 'image').length === 0) {
          // There are no images from events in today.xml. Find the most relevant poet portrait.
          const weighted = events
            .filter(e => e.context.poet.has_portraits)
            .map(event => {
              const poet = event.context.poet;
              let weight = 0;
              weight += poet.has_portraits ? 12 : 6; // TODO: Find the one with a portrait description
              weight += poet.has_texts ? 10 : 5;
              weight += poet.has_works ? 6 : 3;
              weight += preferredCountries.indexOf(poet.country);
              weight += event.context.event_type === 'born' ? 3 : 0; // Foretræk fødselsdage
              return {
                weight,
                event,
              };
            })
            .sort((a, b) => (a.weight < b.weight ? 1 : -1));
          if (weighted.length > 0) {
            const event = weighted[0].event;
            const poet = event.context.poet;
            let content_html = null;
            const primary_portrait = build_portraits_json(
              poet,
              collected
            ).filter(p => p.primary)[0];
            if (
              primary_portrait != null &&
              primary_portrait.content_html[0][0].length > 0
            ) {
              content_html = primary_portrait.content_html;
            } else {
              content_html = [[poetName(poet)]];
            }
            if (primary_portrait != null) {
              const data = {
                type: 'image',
                src: primary_portrait.src,
                content_html,
                content_lang: lang,
                date: event.date,
              };
              add_event(lang, `${mm}-${dd}`, data);
            }
          }
        }
      }
    }
  });

  langs.forEach(lang => {
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 31; d++) {
        const dd = d < 10 ? '0' + d : d;
        const mm = m < 10 ? '0' + m : m;
        const events = collected_events.get(`${lang}-${mm}-${dd}`) || [];
        const path = `static/api/today/${lang}/${mm}-${dd}.json`;
        console.log(path);
        writeJSON(path, events);
      }
    }
  });
};

module.exports = {
  build_todays_events_json,
};
