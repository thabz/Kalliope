// @flow

import React from 'react';
import 'isomorphic-fetch';
import { Link, Router } from '../routes';
import Page from '../components/page.js';
import SubHeading from '../components/subheading.js';
import { worksCrumbs } from '../components/breadcrumbs.js';
import LangSelect from '../components/langselect';
import { poetMenu } from '../components/menu.js';
import PoetName from '../components/poetname.js';
import { poetNameString } from '../components/poetname-helpers.js';
import PicturesGrid from '../components/picturesgrid.js';
import WorksList from '../components/workslist.js';
import Stack from '../components/stack.js';
import * as Links from '../components/links';
import * as Client from '../common/client.js';
import ErrorPage from './error.js';
import CommonData from '../common/commondata.js';
import _ from '../common/translations.js';
import * as OpenGraph from '../common/opengraph.js';

class ArtworkList extends React.Component {
  render() {
    const { lang, poet, artwork } = this.props;

    if (artwork.length === 0) {
      return null;
    }

    const sortArtworks = (artwork) => {
      return artwork.sort((a, b) => {
        const aKey = (a.year || '') + a.src;
        const bKey = (b.year || '') + b.src;
        return aKey > bKey ? 1 : -1;
      });
    };

    const rowWidth = (items) => {
      let width = 0;
      items.forEach((item) => {
        width += item.width;
      });
      return width;
    };

    const rowHeight = (items) => {
      let height = 0;
      items.forEach((item) => {
        if (item.picture != null && item.picture.size != null) {
          height =
            (item.picture.size.height / item.picture.size.width) * item.width;
        }
      });
      return height;
    };

    const sortedArtworks = sortArtworks(artwork);

    const renderWithMaxHeight = (maxHeight) => {
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
          row.forEach((item) => {
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
        lastRow.items.forEach((item) => {
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

const WorksPage = (props) => {
  const { lang, poet, works, artwork, error } = props;

  if (error) {
    return <ErrorPage error={error} lang={lang} message="Ukendt digter" />;
  }

  if (works.length === 0 && artwork.length === 0) {
    const bioURL = Links.bioURL(lang, poet.id);
    Router.replaceRoute(bioURL);
    return null;
  }

  const worksList = <WorksList lang={lang} poet={poet} works={works} />;
  const artworksList = (
    <PicturesGrid lang={lang} poet={poet} artwork={artwork} hideArtist={true} />
  );
  const worksTitle =
    artwork.length === 0 || works.length === 0 ? null : (
      <h3>{_('Litteratur', lang)}</h3>
    );
  const artworksTitle =
    artwork.length === 0 || works.length === 0 ? null : (
      <h3>{_('Kunst', lang)}</h3>
    );

  const stack = (
    <>
      <Stack spacing="40px">
        {worksTitle}
        {worksList}
        {artworksTitle}
        {artworksList}
      </Stack>
      <style jsx>{`
        h3 {
          font-weight: 300;
          font-size: 22x;
          line-height: 1.6;
          padding-bottom: 1px;
          border-bottom: 1px solid #888;
          margin-bottom: 20px;
        }
      `}</style>
    </>
  );

  return (
    <Page
      headTitle={poetNameString(poet, false, false) + ' - Kalliope'}
      ogTitle={poetNameString(poet, false, false)}
      ogImage={OpenGraph.poetImage(poet)}
      ogDescription={'Værker'}
      requestPath={`/${lang}/works/${poet.id}`}
      crumbs={worksCrumbs(lang, poet)}
      pageTitle={<PoetName poet={poet} includePeriod />}
      pageSubtitle={_('Værker', lang)}
      menuItems={poetMenu(poet)}
      poet={poet}
      selectedMenuItem="works"
    >
      <div className="two-columns">
        {stack}
        <style jsx>{`
          :global(.nodata) {
            padding: 30px 0;
          }
        `}</style>
      </div>
    </Page>
  );
};

WorksPage.getInitialProps = async ({ query: { lang, poetId } }) => {
  const json = await Client.works(poetId);

  return {
    lang,
    poet: json.poet,
    works: json.works,
    artwork: json.artwork,
    error: json.error,
  };
};

export default WorksPage;
