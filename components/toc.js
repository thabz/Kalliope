// @flow

import React from 'react';
import { Link } from '../routes';
import TextContent from './textcontent.js';
import * as Links from './links';
import CommonData from '../pages/helpers/commondata.js';

import type {
  Lang,
  Poet,
  PoetId,
  WorkId,
  Work,
  TocItem,
  NoteItem,
  PictureItem,
  Error,
} from '../pages/helpers/types.js';

type TocProps = {
  toc: Array<TocItem>,
  lang: Lang,
};
export default class extends React.Component<TocProps> {
  render() {
    const renderItems = (items: Array<TocItem>, indent: number = 0) => {
      const rows = items.map((item, i) => {
        const { id, title, type, prefix, level } = item;
        if (type === 'section') {
          const renderedTitle = <TextContent contentHtml={title} lang={lang} />;
          let shownTitle = null;
          if (id == null) {
            shownTitle = renderedTitle;
          } else {
            const url = Links.textURL(lang, id);
            shownTitle = (
              <Link route={url}>
                <a>{renderedTitle}</a>
              </Link>
            );
          }
          const className = `level-${item.level == null ? 1 : item.level}`;
          return (
            <tr key={i}>
              <td />
              <td>
                <h3 className={className}>{shownTitle}</h3>
                {renderItems(item.content, indent + 1)}
              </td>
            </tr>
          );
        } else if (type === 'text' && id != null) {
          const url = Links.textURL(lang, id);
          const linkedTitle = (
            <Link route={url}>
              <a>
                <TextContent contentHtml={title} lang={lang} />
              </a>
            </Link>
          );
          return (
            <tr key={id}>
              <td className="num">{prefix}</td>
              <td>{linkedTitle}</td>
            </tr>
          );
        }
      });
      const className = `toc ${indent === 0 ? 'outer' : ''}`;
      return (
        <table className={className}>
          <tbody>{rows}</tbody>
        </table>
      );
    };

    const { toc, lang } = this.props;
    if (toc == null || toc.length === 0) {
      return null;
    } else {
      return (
        <div>
          {renderItems(toc)}
          <style jsx>{`
            :global(table.toc) {
              margin-left: 30px;
              margin-bottom: 10px;
              cell-spacing: 0;
              cell-padding: 0;
              border-collapse: collapse;
            }
            :global(table.toc.outer) {
              margin-left: 0;
            }
            :global(.toc) :global(h3.level-1) {
              font-weight: lighter;
              font-size: 18px;
              padding: 0;
              margin: 0;
              margin-top: 10px;
            }
            :global(.toc) :global(h3.level-2) {
              font-weight: lighter;
              font-size: 16px;
              padding: 0;
              margin: 0;
              margin-top: 0px;
            }
            :global(.toc) :global(h3.level-3) {
              font-weight: lighter;
              font-size: 14px;
              padding: 0;
              margin: 0;
              margin-top: 0px;
            }
            :global(.toc) :global(td.num) {
              text-align: right;
              color: ${CommonData.lightLinkColor};
              white-space: nowrap;
              padding-right: 5px;
              vertical-align: top;
            }
            :global(.toc) :global(td) {
              line-height: 1.7;
              padding: 0;
            }
            :global(.nodata) {
              padding: 30px 0;
              font-weight: lighter;
            }
          `}</style>
        </div>
      );
    }
  }
}
