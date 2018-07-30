// @flow

import React from 'react';
import Picture from '../components/picture.js';
import type {
  Lang,
  Poet,
  Work,
  PictureItem,
  Error,
} from '../pages/helpers/types.js';

type ArtworkListProps = {
  lang: Lang,
  poet?: Poet,
  artwork: Array<PictureItem>,
};
export default class PicturesGrid extends React.Component<ArtworkListProps> {
  render() {
    const { lang, poet, artwork } = this.props;

    const sortArtworks = artwork => {
      return artwork.sort((a, b) => {
        const aKey = a.year + a.src;
        const bKey = b.year + b.src;
        return aKey > bKey ? 1 : -1;
      });
    };

    const rowWidth = items => {
      let width = 0;
      items.forEach(item => {
        width += item.width;
      });
      return width;
    };

    const rowHeight = items => {
      let height = 0;
      items.forEach(item => {
        if (item.picture != null) {
          height =
            (item.picture.size.height / item.picture.size.width) * item.width;
        }
      });
      return height;
    };

    const sortedArtworks = sortArtworks(artwork);

    const renderWithMaxHeight = maxHeight => {
      const gutterWidth = maxHeight / 10;
      const viewportWidth = 100; // Max width (percentage)
      const rows = [];
      let row = [];
      let currentWidth = 0;
      sortedArtworks.forEach((picture, i) => {
        if (row.length > 0) {
          row.push({ width: gutterWidth });
          currentWidth += gutterWidth;
        }
        const width = (maxHeight / picture.size.height) * picture.size.width;
        row.push({ picture, width });
        currentWidth += width;
        if (currentWidth >= viewportWidth) {
          // Scale widths in row down, so that the sum is 100.
          const overflow = (currentWidth - viewportWidth) / row.length;
          const factor = viewportWidth / currentWidth;
          row.forEach(item => {
            item.width *= factor;
          });
          rows.push({
            items: row,
            width: rowWidth(row),
            height: rowHeight(row),
          });
          row = [];
          currentWidth = 0;
        }
      });
      row.length &&
        rows.push({ items: row, width: rowWidth(row), height: rowHeight(row) });

      // Sidste række er præcis 33 høj hvis den ikke er fyldt ud. Juster dens widths
      // så højden matcher gennemsnittet af de andre rækker - af æstetiske hensyn.
      if (rows.length > 1 && rows[rows.length - 1].width < 99) {
        let avgHeight = 0;
        let num = 0;
        rows.forEach((row, i) => {
          if (i < rows.length - 1) {
            avgHeight += row.height;
            num += 1;
          }
        });
        avgHeight /= num;
        const factor = avgHeight / maxHeight;
        const lastRow = rows[rows.length - 1];
        lastRow.items.forEach(item => {
          item.width *= factor;
        });
        lastRow.height = rowHeight(lastRow.items);
      }

      const renderedRows = rows.map((row, j) => {
        const renderedList = row.items.map((item, i) => {
          const picture = item.picture;
          const width = item.width;
          let pictureRendered = null;
          if (picture != null) {
            pictureRendered = (
              <Picture
                key={'picture-' + picture.src}
                pictures={[picture]}
                contentLang={picture.content_lang || 'da'}
                lang={lang}
              />
            );
          }
          return (
            <div key={'container-' + i} style={{ flexBasis: width + '%' }}>
              {pictureRendered}
            </div>
          );
        });
        const className = 'artwork-container artwork-container-' + maxHeight;
        return (
          <div key={j + className}>
            <div className={className}>{renderedList}</div>
          </div>
        );
      });
      return renderedRows;
    };

    return (
      <div>
        <div>{renderWithMaxHeight(33)}</div>
        <div>{renderWithMaxHeight(50)}</div>
        <div>{renderWithMaxHeight(75)}</div>
        <style jsx>{`
          :global(.artwork-container) {
            display: flex;
          }
          :global(.artwork-container > div > *) {
            padding-bottom: 40px;
          }
          :global(.artwork-container.artwork-container-33) {
            display: flex;
          }
          :global(.artwork-container.artwork-container-50) {
            display: none;
          }
          :global(.artwork-container.artwork-container-75) {
            display: none;
          }

          @media (max-width: 800px) {
            :global(.artwork-container.artwork-container-33) {
              display: none;
            }
            :global(.artwork-container.artwork-container-50) {
              display: flex;
            }
            :global(.artwork-container.artwork-container-75) {
              display: none;
            }
          }
          @media (max-width: 600px) {
            :global(.artwork-container.artwork-container-33) {
              display: none;
            }
            :global(.artwork-container.artwork-container-50) {
              display: none;
            }
            :global(.artwork-container.artwork-container-75) {
              display: flex;
            }
          }
        `}</style>
      </div>
    );
  }
}
