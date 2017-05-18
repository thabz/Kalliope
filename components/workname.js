export default props => {
  const { work } = props;
  const { title, year } = work;
  let titlePart = <span>{title}</span>;
  let yearPart = null;
  if (year !== '?') {
    yearPart = <span>({year})</span>;
  }

  const parts = [titlePart, yearPart].map((p, i) => {
    const className = i === 0 ? 'title' : 'year';
    return p ? <span className={className}>{p} </span> : null;
  });
  return <span className="workname">{parts}</span>;
};
