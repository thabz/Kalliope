const Tabs = props => {
  const { items, selectedIndex } = props;

  const itemsRendered = items.map((item, i) => {
    const className = i === selectedIndex ? 'tab selected' : 'tab';
    return (
      <div className={className} key={i}>
        <a href={item.url}><h2>{item.title}</h2></a>
      </div>
    );
  });

  return <div className="tabs">{itemsRendered}</div>;
};

export default Tabs;
