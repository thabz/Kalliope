// @flow

import React, { Fragment } from 'react';
import WorkName from '../components/workname.js';
import { Link } from '../routes';
import CommonData from '../common/commondata.js';
import _ from '../common/translations.js';
import type { Lang, Poet, Work, PictureItem, Error } from '../common/types.js';

type WorksListProps = {
  lang: Lang,
  poet: Poet,
  works: Array<Work>,
};

const workNameTranslated = (work, lang): string => {
  let result = work.toctitle;
  if (work.id == 'andre') {
    return _('Andre digte', lang);
  } else {
    return work.toctitle.title;
  }
};

export default class WorksList extends React.Component<WorksListProps> {
  render() {
    const { lang, poet, works } = this.props;

    if (works.length === 0) {
      return null;
    }

    const sortWorks = works => {
      if (poet.id === 'bibel') {
        return works;
      } else {
        return works.sort((a, b) => {
          if (a.id === 'andre') {
            return 1;
          } else if (b.id === 'andre') {
            return -1;
          } else {
            const aKey =
              a.year == null || a.year === '?' ? a.title : a.year + a.id;
            const bKey =
              b.year == null || b.year === '?' ? b.title : b.year + b.id;
            return aKey > bKey ? 1 : -1;
          }
        });
      }
    };

    const anyPrefixes =
      works.filter(work => work.toctitle.prefix != null).length > 0;

    const rows = sortWorks(works).map((work, i) => {
      const workName = workNameTranslated(work, lang);

      const year = work.year;
      let yearRendered = null;
      if (year != null && year !== '?') {
        yearRendered = (
          <span key="year" className="lighter">
            {' '}
            ({year})
          </span>
        );
      }

      const url = `/${lang}/work/${poet.id}/${work.id}`;
      const name = work.has_content ? (
        <Link route={url}>
          <a title="Vis værk">
            {workName}
            {yearRendered}
          </a>
        </Link>
      ) : (
        [workName, yearRendered]
      );

      let numTd = null;
      if (anyPrefixes) {
        numTd = <td className="num">{work.toctitle.prefix}</td>;
      }

      const className =
        'workname ' + (work.has_content ? ' has-content' : ' no-content');
      return (
        <tr key={i + work.id}>
          {numTd}
          <td className={className}>{name}</td>
        </tr>
      );
    });
    const className = 'toc';
    return (
      <Fragment>
        <table className={className}>
          <tbody>{rows}</tbody>
        </table>
        <style jsx>{`
          :global(table.toc) {
            margin-left: 0;
            margin-bottom: 10px;
            cell-spacing: 0;
            cell-padding: 0;
            border-collapse: collapse;
          }
          :global(.toc) :global(td.num) {
            text-align: left;
            color: ${CommonData.lightLinkColor};
            white-space: nowrap;
            padding-right: 5px;
            vertical-align: top;
          }
          :global(.toc) :global(td) {
            line-height: 1.7;
            padding: 0;
          }
          :global(table.toc)
            :global(td.workname.has-content)
            :global(.lighter) {
            color: ${CommonData.lightLinkColor} !important;
          }
          :global(table.toc) :global(td.workname.no-content) :global(.lighter) {
            color: ${CommonData.lightTextColor} !important;
          }
        `}</style>
      </Fragment>
    );
  }
}
