// @flow

import React from 'react';
import WorkName from '../components/workname.js';
import { Link } from '../routes';
import type {
  Lang,
  Poet,
  Work,
  PictureItem,
  Error,
} from '../pages/helpers/types.js';

type WorksListProps = {
  lang: Lang,
  poet: Poet,
  works: Array<Work>,
};
export default class WorksList extends React.Component<WorksListProps> {
  render() {
    const { lang, poet, works } = this.props;

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

    return sortWorks(works).map((work, i) => {
      const workName = <WorkName work={work} lang={lang} useTitle="toctitle" />;
      const url = `/${lang}/work/${poet.id}/${work.id}`;
      const name = work.has_content ? (
        <Link route={url}>
          <a title={work.year}>{workName}</a>
        </Link>
      ) : (
        workName
      );
      return (
        <div
          className="list-section-line"
          key={i + work.id}
          style={{ lineHeight: 1.7 }}>
          {name}
        </div>
      );
    });
  }
}
