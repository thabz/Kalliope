const SplitWhenSmall = ({ children }) => {
  return (
    <div className="horizontal-on-small">
      {children}
      <style jsx>{`
        .horizontal-on-small {
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 767px) {
          .horizontal-on-small {
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
          }
          .horizontal-on-small > :global(*) {
            flex-basis: 47%; /* Add 6% spacing between */
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SplitWhenSmall;
