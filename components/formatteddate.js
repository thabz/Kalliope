import Dates from '../common/dates.js';
import _ from '../common/translations.js';

export const parseDate = Dates.parseDate;
export const formattedDate = Dates.formattedDate;
export const extractYear = Dates.extractYear;
export const formatYearInterval = Dates.formatYearInterval;
export const formatYearEra = Dates.formatYearEra;
export const formattedYear = Dates.formattedYear;
export const formattedYearRange = Dates.formattedYearRange;

export function formattedAge(period, lang) {
  return Dates.formattedAge(period, _, lang);
}
