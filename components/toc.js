import React from 'react';
import CommonData from '../common/commondata.js';
import { Link } from '../routes';
import * as Links from './links';
import TextContent from './textcontent.js';

export default class extends React.Component {
  render() {
    const renderItems = (items, indent = 0, level = 1) => {
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
              <td className="num">{prefix}</td>
              <td>
                <h3 className={className}>{shownTitle}</h3>
                {renderItems(
                  item.content,
                  indent + 1,
                  item.level == null ? 1 : item.level
                )}
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
      const className = `toc level-${level} ${indent === 0 ? 'outer' : ''}`;
      return (
        <table className={className}>
          <tbody>{rows}</tbody>
        </table>
      );
    };

    const { toc, lang, indent } = this.props;
    if (toc == null || toc.length === 0) {
      return null;
    } else {
      return (
        <div>
          {renderItems(toc, indent || 0, 1)}
          <style jsx>{`
            :global(table.toc) {
              margin-left: 30px;
              margin-bottom: 10px;
              cell-spacing: 0;
              cell-padding: 0;
              border-collapse: collapse;
            }
            :global(table.toc.level-3) {
              margin-bottom: 0;
            }
            :global(table.toc.outer) {
              margin-left: 0;
            }
            :global(.toc) :global(h3.level-1) {
              font-weight: 300;
              font-size: 22px;
              padding: 0;
              margin: 0;
              margin-top: 10px;
            }
            :global(.toc) :global(h3.level-2) {
              font-weight: 300;
              font-size: 20px;
              padding: 0;
              margin: 0;
            }
            :global(.toc) :global(h3.level-3) {
              font-weight: normal;
              font-size: 18px;
              padding: 0;
              margin: 0;
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
            }
          `}</style>
        </div>
      );
    }
  }
}
