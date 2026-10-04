const newsDateKey = date => {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(date);
  if (match == null) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return year * 10000 + month * 100 + day;
};

const copenhagenDateParts = date => {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = type => Number(parts.find(part => part.type === type)?.value);
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
  };
};

const copenhagenDateKey = date => {
  const { year, month, day } = copenhagenDateParts(date);
  return year * 10000 + month * 100 + day;
};

const previewDateKey = (dayAndMonth, currentDate) => {
  const current = copenhagenDateParts(currentDate);
  const match = /^(\d{2})-(\d{2})$/.exec(dayAndMonth ?? '');
  if (match == null) return copenhagenDateKey(currentDate);

  const month = Number(match[1]);
  const day = Number(match[2]);
  const parsed = new Date(Date.UTC(current.year, month - 1, day));
  if (parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    return copenhagenDateKey(currentDate);
  }
  return current.year * 10000 + month * 100 + day;
};

const latestNewsForDate = (
  news,
  dayAndMonth,
  currentDate = new Date(),
  limit = 5
) => {
  const date = previewDateKey(dayAndMonth, currentDate);
  return news
    .filter(item => {
      const itemDate = newsDateKey(item.date);
      return itemDate == null || itemDate <= date;
    })
    .slice(0, limit);
};

export {
  copenhagenDateKey,
  latestNewsForDate,
  newsDateKey,
  previewDateKey,
};
