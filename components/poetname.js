export default props => {
  const { poet } = props;
  const { name } = poet;
  const { firstname, lastname } = name;
  if (lastname) {
    return <span>{firstname} {lastname}</span>;
  } else {
    return <span>{firstname}</span>;
  }
};
