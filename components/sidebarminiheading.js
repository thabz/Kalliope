const SidebarMiniHeading = ({ children }) => {
  return (
    <div className="sidebar-mini-heading">
      {children}
      <style jsx>{`
        .sidebar-mini-heading {
          margin: 0 0 7px;
          color: #777;
          font-size: 0.75em;
          font-weight: 600;
          letter-spacing: 0.06em;
          line-height: 1.2;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
};

export default SidebarMiniHeading;
