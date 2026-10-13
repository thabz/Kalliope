import Link from 'next/link';

export const sectionColumnSplitIndex = (sections) => {
  if (sections.length < 2) return sections.length;

  // Include space for each heading when balancing whole sections.
  const totalWeight = sections.reduce(
    (weight, section) => weight + section.items.length + 2,
    0
  );
  let leftWeight = 0;
  let splitIndex = 1;
  let bestDifference = Infinity;
  for (let index = 1; index < sections.length; index += 1) {
    leftWeight += sections[index - 1].items.length + 2;
    const difference = Math.abs(totalWeight - leftWeight * 2);
    if (difference < bestDifference) {
      splitIndex = index;
      bestDifference = difference;
    }
  }
  return splitIndex;
};

const SectionedList = ({ sections }) => {
  let renderedGroups = sections.map((group, i) => {
    const { title, items, headingId } = group;
    const list = items.map((item) => {
      const content =
        item.url != null ? <Link href={item.url}>{item.html}</Link> : item.html;
      return <div key={item.id}>{content}</div>;
    });
    return (
      <div className="list-section" key={i + title}>
        <h3 id={headingId}>{title}</h3>
        {list}
      </div>
    );
  });
  const splitIndex = sectionColumnSplitIndex(sections);
  return (
    <div className="sectioned-list">
      <div className="list-column">{renderedGroups.slice(0, splitIndex)}</div>
      <div className="list-column">{renderedGroups.slice(splitIndex)}</div>
      <style jsx>{`
        .sectioned-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          column-gap: 30px;
          align-items: start;
        }
        .list-column :global(a) {
          text-decoration: none;
        }
        @media (max-width: 480px) {
          .sectioned-list {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        :global(.list-section) {
          break-inside: avoid;
        }
        :global(.list-section),
        :global(.list-section-line) {
          line-height: 1.6;
        } /* Fix vertical aligment layout problem in Safari and Chrome */
        :global(.list-section:before) {
          content: '';
          display: block;
          height: 1px;
        }
        :global(.list-section) :global(h3) {
          font-weight: 300;
          font-size: 22px;
          border-bottom: 1px solid #888;
          margin-bottom: 12px;
        }
      `}</style>
    </div>
  );
};

export default SectionedList;
