const Heading = props => {
  const { title, subtitle } = props;
  return (
    <div className="heading">
      <h1>{title}</h1>
      <h2>{subtitle}</h2>
    </div>
  );
};

export default Heading;
