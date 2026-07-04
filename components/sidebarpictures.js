import Picture from './picture.js';

const pictureKey = (picture, index) => {
  if (picture.key != null) {
    return picture.key;
  }
  const firstPicture =
    picture.pictures != null
      ? picture.pictures[picture.startIndex || 0]
      : picture;
  return firstPicture.id || firstPicture.src || index;
};

const pictureProps = (picture, defaultProps) => {
  if (picture.pictures != null) {
    const { key, ...props } = picture;
    return { ...defaultProps, ...props };
  }
  return {
    ...defaultProps,
    pictures: [picture],
    contentLang: picture.content_lang || 'da',
  };
};

const SidebarPictures = ({ children, pictures = [], lang, ...defaultProps }) => {
  const renderedPictures = pictures.map((picture, index) => {
    return (
      <Picture
        key={pictureKey(picture, index)}
        lang={lang}
        {...pictureProps(picture, defaultProps)}
      />
    );
  });

  return (
    <div className="sidebar-pictures">
      {renderedPictures}
      {children}
      <style jsx>{`
        div.sidebar-pictures {
          display: flex;
          flex-direction: column;
        }
        @media print {
          div.sidebar-pictures {
            display: none;
          }
        }
        @media (max-width: 760px) {
          div.sidebar-pictures {
            flex-direction: row;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: start;
          }
          div.sidebar-pictures > :global(*) {
            flex-basis: 47%;
            flex-grow: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SidebarPictures;
