import { renderXmlString } from './textcontent.js';

const sizes = { small: '0.85em', normal: '1em', large: '1.4em' };

export default function TitleBlock({ parts, lang, heading = 'h2' }) {
  return (
    <div className="title-block" lang={lang}>
      {parts.map((part, i) => {
        const Tag = part.type === 'main' ? heading : 'div';
        return (
          <Tag key={i} style={{ textAlign: part.align, fontSize: sizes[part.size], fontWeight: 'normal', margin: '0 0 1em', lineHeight: 1.6 }}>
            {part.blocks.map((block, j) => {
              const Block = part.type === 'main' ? 'span' : block.type === 'p' ? 'p' : 'div';
              return <Block key={j} style={{ display: 'block', margin: j > 0 && block.type === 'p' ? '1em 0 0' : 0 }}>
                {renderXmlString(block.content.map(line => line[0]).join(' '), lang)}
              </Block>;
            })}
          </Tag>
        );
      })}
      <style jsx>{`.title-block { min-width: 0; max-width: 100%; overflow-wrap: anywhere; margin-bottom: 2em; }`}</style>
    </div>
  );
}
