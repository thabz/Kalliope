import TextContent, { renderXmlString } from './textcontent.js';

export default function TitleBlock({ parts, lang, heading = 'h2' }) {
  return <div className="title-block">{parts.map((part, i) => {
    const Tag = part.type === 'main' ? heading : 'div';
    return <Tag key={i} style={{ textAlign: part.align, fontSize: { small: '0.85em', normal: '1em', large: '1.4em' }[part.size], fontWeight: 'normal', margin: '0 0 1em', lineHeight: 1.6 }}>
      {part.blocks.map((block, j) => part.type === 'main'
        ? <span key={j} lang={lang} style={{ display: 'block' }}>{renderXmlString(block.content.map(line => line[0]).join(' '), lang)}</span>
        : <div key={j} style={{ marginTop: block.type === 'p' && j > 0 ? '1em' : 0 }}><TextContent contentHtml={block.content} contentLang={lang} /></div>)}
    </Tag>;
  })}<style jsx>{`.title-block { overflow-wrap: anywhere; margin-bottom: 2em; }`}</style></div>;
}
