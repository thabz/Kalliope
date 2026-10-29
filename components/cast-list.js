import { useId } from 'react';

const elements = node => Array.from(node.childNodes).filter(child => child.nodeType === 1);
const rendClass = node => node.getAttribute('rend')?.split(/\s+/).includes('smallcaps') === true
  ? ' small-caps' : '';

export const CastList = ({ node, renderNode }) => {
  const titleId = useId();
  const heading = elements(node).find(child => child.nodeName === 'head');
  return (
    <section className={`cast-list${rendClass(node)}`}
      aria-labelledby={heading != null ? titleId : undefined}>
      {elements(node).map((child, index) => child === heading
        ? <h2 id={titleId} key={index}>{Array.from(child.childNodes).map(renderNode)}</h2>
        : renderNode(child))}
      <style jsx global>{`
        .cast-list { margin-block: 1.5em; }
        .cast-list h2 { text-align: center; font-size: 1em; margin-block: 0 1.5em; }
        .cast-item, .cast-group { line-height: 1.5; }
        .cast-list, .cast-group, .cast-group__roles, .cast-role-desc {
          min-width: 0;
          overflow-wrap: anywhere;
        }
        .cast-group--braced {
          display: grid;
          grid-template-columns: minmax(0, max-content) 1.2em minmax(0, 1fr);
          column-gap: 0.6em;
          align-items: center;
          width: fit-content;
          max-width: 100%;
        }
        .cast-group__roles { grid-column: 1; grid-row: 1; }
        .cast-group__brace {
          grid-column: 2;
          grid-row: 1;
          align-self: stretch;
          position: relative;
          min-height: 1.5em;
        }
        .cast-group__brace svg { position: absolute; width: 100%; height: 100%; inset: 0; }
        .cast-group__description { grid-column: 3; grid-row: 1; min-width: 0; }
        .cast-group__head { grid-column: 1 / -1; }
        .cast-setting { margin-block: 1em; }
        .cast-setting--center { text-align: center; }
        .cast-setting p { margin-block: 0.5em; }
        @media (max-width: 480px) {
          .cast-group--braced { grid-template-columns: minmax(0, 1fr) 0.8em minmax(0, 1fr); column-gap: 0.3em; }
        }
        @media print {
          .cast-group--braced { break-inside: avoid; }
        }
      `}</style>
    </section>
  );
};

export const CastGroup = ({ node, renderNode }) => {
  const descriptionId = useId();
  const children = elements(node);
  const descriptions = children.filter(child => child.nodeName === 'roleDesc');
  const braced = node.getAttribute('rend')?.split(/\s+/).includes('braced') === true &&
    descriptions.length > 0;
  if (braced === false) {
    return <div className={`cast-group${rendClass(node)}`} role="group">
      {children.map(renderNode)}
    </div>;
  }
  const roleCount = children.filter(child => ['castItem', 'castGroup'].includes(child.nodeName)).length;
  const headingCount = children.filter(child => child.nodeName === 'head').length;
  const roleSpan = descriptions.length;
  const descriptionSpan = Math.max(1, roleCount);
  const contentRows = `${headingCount + 1} / span ${descriptionSpan * roleSpan}`;
  const descriptionIds = descriptions.map((_, index) => `${descriptionId}-${index}`);
  let roleRow = headingCount;
  let descriptionIndex = 0;
  let headingRow = 0;
  return <div className={`cast-group cast-group--braced${rendClass(node)}`}
    role="group" aria-describedby={descriptionIds.join(' ')}>
    {children.map((child, index) => {
      if (['castItem', 'castGroup'].includes(child.nodeName)) {
        const rows = `${roleRow + 1} / span ${roleSpan}`;
        roleRow += roleSpan;
        return <div className="cast-group__roles" style={{ gridRow: rows }} key={index}>
          {renderNode(child)}
        </div>;
      }
      if (child.nodeName === 'roleDesc') {
        const id = descriptionIds[descriptionIndex];
        const rows = `${headingCount + descriptionIndex * descriptionSpan + 1} / span ${descriptionSpan}`;
        descriptionIndex += 1;
        return <div className="cast-group__description" style={{ gridRow: rows }} id={id} key={index}>
          {renderNode(child)}
        </div>;
      }
      if (child.nodeName === 'head') {
        headingRow += 1;
        return <div className="cast-group__head" style={{ gridRow: headingRow }} key={index}>
          {Array.from(child.childNodes).map(renderNode)}
        </div>;
      }
      return renderNode(child);
    })}
    <div className="cast-group__brace" style={{ gridRow: contentRows }} aria-hidden="true">
      <svg viewBox="0 0 24 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M 2 1 C 14 1 14 4 14 14 L 14 39 C 14 47 18 48 23 50 C 18 52 14 53 14 61 L 14 86 C 14 96 14 99 2 99"
          fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  </div>;
};
