import Link from 'next/link';
import { Fragment } from 'react';
import CommonData from '../common/commondata.js';
import _ from '../common/translations.js';
import WorkSorting from '../common/worksort.js';
import { formattedYear } from '../components/formatteddate.js';

const workNameTranslated = (work, lang) => {
  let result = work.toctitle;
  if (work.id == 'andre') {
    return _('Andre digte', lang);
  } else {
    return work.toctitle.title;
  }
};

const WorksList = ({ lang, poet, works }) => {
  if (works.length === 0) {
    return null;
  }

  const anyPrefixes =
    works.filter((work) => work.toctitle.prefix != null).length > 0;

  const rows = WorkSorting.sortWorks(poet, works).map((work, i) => {
    const workName = workNameTranslated(work, lang);

    const year = work.year;
    let yearRendered = null;
    if (year != null && year !== '?') {
      yearRendered = (
        <span key="year" className="lighter">
          {' '}
          ({formattedYear(year)})
        </span>
      );
    }

    const url = `/${lang}/work/${poet.id}/${work.id}`;
    const name = work.has_content ? (
      <Link href={url} title="Vis værk">
        {workName}
        {yearRendered}
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
        :global(table.toc) :global(td.workname.has-content) :global(.lighter) {
          color: ${CommonData.lightLinkColor} !important;
        }
        :global(table.toc) :global(td.workname.no-content) :global(.lighter) {
          color: ${CommonData.lightTextColor} !important;
        }
      `}</style>
    </Fragment>
  );
};

export default WorksList;
