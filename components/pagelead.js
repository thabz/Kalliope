const PageLead = (props) => {
  const { children } = props;
  return (
    <div className="page-lead">
      {children}
      <style jsx>{`
        .page-lead {
          max-width: 760px;
          margin: -10px 0 30px 0;
          color: #555;
          font-size: 20px;
          line-height: 1.45;
        }

        @media (max-width: 480px) {
          .page-lead {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
};

export default PageLead;
