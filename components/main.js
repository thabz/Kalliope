const Main = ({ children }) => {
  return (
    <main>
      {children}
      <style jsx>{`
        main {
          max-width: 880px;
          margin: 0px auto;
          padding: 0 20px;
        }
      `}</style>
    </main>
  );
};

export default Main;
