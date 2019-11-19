// @flow
import React, { useContext } from 'react';
import type { Work, Lang } from '../common/types.js';
import CommonData from '../common/commondata.js';
import _ from '../common/translations.js';
import LangContext from '../common/LangContext.js';

type WorkNameProps = {
  work: Work,
  cursive?: boolean,
  useTitle: 'title' | 'toctitle' | 'linktitle' | 'breadcrumbtitle',
};

const WorkName = ({
  work,
  cursive = false,
  useTitle = 'title',
}: WorkNameProps) => {
  const { year } = work;
  var titleTranslated: string = work[useTitle];
  const lang = useContext(LangContext);

  if (work.id == 'andre') {
    titleTranslated = _('Andre digte', lang);
  }
  let titlePart = <span>{titleTranslated}</span>;
  let yearPart = null;
  if (year != null && year !== '?') {
    yearPart = <span>({year})</span>;
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

export function workTitleString(work: Work): string {
  const { title, year } = work;
  let yearPart = '';
  if (year != null && year !== '?') {
    yearPart = ` (${year})`;
  }
  return title + yearPart;
}
