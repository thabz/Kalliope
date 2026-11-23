import CommonData from '../common/commondata.js';
import { sourceLinkLabel } from '../common/source-link.js';
import Tooltip from './tooltip.js';

const SourceIcon = ({ href, lang }) => {
  const label = sourceLinkLabel(href, lang);
  return (
    <>
      <Tooltip text={label}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="source-link">
          ↬
        </a>
      </Tooltip>
      <style jsx>{`
        .source-link {
          color: ${CommonData.linkColor};
          display: inline-block;
          font-size: 1.3em;
          font-weight: 100;
          opacity: 0.7;
          line-height: 0.95;
          text-decoration: none;
          position: relative;
          vertical-align: -0.05em;
        }
      `}</style>
    </>
  );
};

export default SourceIcon;
