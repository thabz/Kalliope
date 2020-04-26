const ics = require('ics');
const { poetName } = require('./formatting.js');
const { writeText } = require('../libs/helpers.js');

const build_anniversaries_ical = collected => {
  let events = [];
  let [nowYear, nowMonth, nowDay] = new Date()
    .toISOString()
    .split('T')[0]
    .split('-')
    .map(s => parseInt(s, 10));

  const handleDate = (poet, eventType, date) => {
    var [year, month, day] = date.split('-').map(s => parseInt(s, 10));
    if (month == null || day == null || year == null) {
      // Ignorer datoer som ikke er fulde datoer, såsom "1300?" og "1240 ca."
      return;
    }
    for (let eventYear = nowYear - 1; eventYear < nowYear + 3; eventYear++) {
      let eventDate = new Date();
      eventDate.setDate(day);
      eventDate.setMonth(month - 1);
      eventDate.setYear(eventYear);
      if ((eventYear - year) % 100 === 0 || (eventYear - year) % 250 === 0) {
        const eventTitle = eventType === 'born' ? 'født' : 'død';
        events.push({
          start: [eventYear, month, day],
          duration: { days: 1 },
          title: `${poetName(poet)} ${eventTitle} for ${eventYear -
            year} år siden`,
          description: `${poetName(poet)} ${eventTitle} ${parseInt(
            day,
            10
          )}/${parseInt(month, 10)} ${year}.`,
          url: `https://kalliope.org/da/bio/${poet.id}`,
          uid: `${poet.id}-${eventType}-${eventYear}@kalliope.org`,
        });
      }
    }
  };
  collected.poets.forEach((poet, poetId) => {
    if (
      poet.period != null &&
      poet.period.born != null &&
      poet.period.born.date !== '?'
    ) {
      handleDate(poet, 'born', poet.period.born.date);
    }
    if (
      poet.period != null &&
      poet.period.dead != null &&
      poet.period.dead.date !== '?'
    ) {
      handleDate(poet, 'dead', poet.period.dead.date);
    }
  });
  const { error, value } = ics.createEvents(events);
  if (error != null) {
    throw error;
  }
  writeText('static/Kalliope.ics', value);
};

module.exports = {
  build_anniversaries_ical,
};
