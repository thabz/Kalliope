import { TextInline } from './textcontent.js';
import SourceIcon from './source-icon.js';

const Source = ({ contentHtml, href, lang }) => {
  return (
    <div className="source">
      <TextInline contentHtml={contentHtml} />
      {href == null ? null : (
        <>
          {' '}
          <SourceIcon href={href} lang={lang} />
        </>
      )}
      <style jsx>{`
        .source {
          display: block;
        }
      `}</style>
    </div>
  );
};

export default Source;
