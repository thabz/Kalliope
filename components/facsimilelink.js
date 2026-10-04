import { useState } from 'react';
import PictureOverlay from './pictureoverlay.js';

const FacsimileLink = ({ poetId, facsimile, pageCount, firstPage, children }) => {
  const [open, setOpen] = useState(false);
  const prefix = `https://kalliope.org/static/facsimiles/${poetId}/${facsimile}`;
  const pictures = Array.from({ length: pageCount }, (_, index) => ({
    src: `${prefix}/${String(index).padStart(3, '0')}.jpg`,
    content_html: [[`Facsimile, side ${index + 1}`]],
    content_lang: 'da',
  }));
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>{children}</button>
      {open === true ? <PictureOverlay
        pictures={pictures}
        startIndex={firstPage - 1}
        closeCallback={() => setOpen(false)}
      /> : null}
      <style jsx>{`
        button {
          border: 0;
          padding: 0;
          background: none;
          color: inherit;
          font: inherit;
          text-decoration: underline;
          cursor: pointer;
        }
      `}</style>
    </>
  );
};

export default FacsimileLink;
