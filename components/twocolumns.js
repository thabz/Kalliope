const TwoColumns = (props) => {
  const className = props.noLinkUnderline
    ? 'two-columns no-link-underline'
    : 'two-columns';

  return (
    <div className={className}>
      {props.children}
      <style jsx>{`
        div.two-columns {
          width: 100%;
          columns: 2;
          column-gap: 30px;
        }

        div.two-columns.no-link-underline :global(a) {
          text-decoration: none;
        }

        @media (max-width: 480px) {
          div.two-columns {
            columns: 1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TwoColumns;
