const Heading = props => {
  const { title, subtitle } = props;
  return (
    <div className="heading">
      <h1>{title}</h1>
    </div>
  );
};

export default Heading;
