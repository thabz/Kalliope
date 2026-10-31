import { TextInline } from './textcontent.js';
import SourceIcon from './source-icon.js';
import { removeBibliographyLinks } from '../common/source-reference.js';

const Source = ({ contentHtml, href, lang }) => {
  const sourceContent = contentHtml?.map(([content, ...options]) => [
    removeBibliographyLinks(content), ...options,
  ]);
  return (
    <div className="source">
      <TextInline contentHtml={sourceContent} />
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
