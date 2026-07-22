import { useContext } from 'react';
import CommonData from '../common/commondata.js';
import Dates from '../common/dates.js';
import LangContext from '../common/LangContext.js';
import _ from '../common/translations.js';
import { formattedYear } from '../components/formatteddate.js';

const WorkName = ({ work, cursive = false, useTitle = 'title' }) => {
  const { year } = work;
  var titleTranslated = work[useTitle];
  const lang = useContext(LangContext);

  if (work.id == 'andre') {
    titleTranslated = _('Andre digte', lang);
  } else if (work.virtualType === 'anthology' || work.id === 'antologier') {
    titleTranslated = _('Tekster i andre udgivelser', lang);
  }
  let titlePart = <span>{titleTranslated}</span>;
  let yearPart = null;
  if (year != null) {
    yearPart = <span>({formattedYear(year, lang)})</span>;
  }

  const parts = [titlePart, yearPart].map((p, i) => {
    let className = i === 0 ? 'title' : 'lighter';
    if (cursive === true && i === 0) {
      className += ' cursive';
    }
    return p ? (
      <span key={i} className={className}>
        {p}{' '}
      </span>
    ) : null;
  });
  return (
    <span className="workname">
      {parts}
      <style jsx>{`
        .workname :global(.title.cursive) {
          font-style: italic;
        }

        :global(.workname) :global(.lighter) {
          color: ${CommonData.lightTextColor} !important;
        }

        :global(a) :global(.workname) :global(.lighter) {
          color: ${CommonData.lightLinkColor} !important;
        }
      `}</style>
    </span>
  );
};

export default WorkName;

export function workTitleString(work, lang = 'da') {
  const { year } = work;
  const title =
    work.virtualType === 'anthology' || work.id === 'antologier'
      ? _('Tekster i andre udgivelser', lang)
      : work.title;
  return Dates.formatTitleAndYear(title, year, lang);
}
