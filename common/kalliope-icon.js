const DEFAULT_ICON_SRC = '/images/about/poet.jpg';
const ICON_DIRECTORY = '/images/about/kalliope-days';

const iconByDate = Object.fromEntries(
  [
    '02-14',
    '03-08',
    '04-02',
    '04-09',
    '05-17',
    '06-28',
    '07-14',
    '09-08',
    '11-14',
    '12-03',
    '12-24',
    '12-31',
  ].map(dateKey => [dateKey, dateKey])
);
iconByDate['12-15'] = '09-08';

const padDatePart = value => String(value).padStart(2, '0');

export const getKalliopeIconDate = (search, currentDate = new Date()) => {
  const dateKey = new URLSearchParams(search).get('date');
  const match = /^(\d{2})-(\d{2})$/.exec(dateKey ?? '');

  if (match == null) {
    return currentDate;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const previewDate = new Date(2000, month - 1, day);
  const isValidDate =
    previewDate.getMonth() === month - 1 && previewDate.getDate() === day;

  return isValidDate ? previewDate : currentDate;
};

export const getKalliopeIconSrc = date => {
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const dateKey = `${month}-${day}`;

  if (iconByDate[dateKey] != null) {
    return `${ICON_DIRECTORY}/${iconByDate[dateKey]}.jpg`;
  }
  if (month === '12' && date.getDate() <= 26) {
    return `${ICON_DIRECTORY}/12-xx.jpg`;
  }
  return DEFAULT_ICON_SRC;
};
