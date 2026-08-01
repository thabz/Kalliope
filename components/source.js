import _ from '../common/translations.js';
import CommonData from '../common/commondata.js';
import { ExternalLinkSVG } from './icons.js';
import { TextInline } from './textcontent.js';
import Tooltip from './tooltip.js';

const Source = ({ contentHtml, href, lang }) => {
  const label = _('Digital kilde', lang);
  return (
    <div className="source">
      <TextInline contentHtml={contentHtml} />
      {href == null ? null : (
        <>
          {' '}
          <Tooltip text={label}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="source-link">
              <ExternalLinkSVG />
            </a>
          </Tooltip>
        </>
      )}
      <style jsx>{`
        .source {
          display: block;
        }
        .source-link {
          color: ${CommonData.linkColor};
          display: inline-block;
          font-size: 0.68em;
          font-weight: 900;
          line-height: 1;
          text-decoration: none;
          position: relative;
          vertical-align: -0.16em;
        }
      `}</style>
    </div>
  );
};

export default Source;
