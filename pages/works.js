// @flow

import React from 'react';
import 'isomorphic-fetch';
import { Link, Router } from '../routes';
import Head from '../components/head';
import Main from '../components/main.js';
import Nav from '../components/nav';
import LangSelect from '../components/langselect';
import { PoetTabs } from '../components/tabs.js';
import Heading from '../components/heading.js';
import PoetName, { poetNameString } from '../components/poetname.js';
import WorkName from '../components/workname.js';
import PicturesGrid from '../components/picturesgrid.js';
import * as Links from '../components/links';
import * as Client from './helpers/client.js';
import ErrorPage from './error.js';
import CommonData from './helpers/commondata.js';
import type { Lang, Poet, Work, PictureItem, Error } from './helpers/types.js';
import _ from '../pages/helpers/translations.js';
import * as OpenGraph from './helpers/opengraph.js';

type WorksListProps = {
  lang: Lang,
  poet: Poet,
  works: Array<Work>,
};
class WorksList extends React.Component<WorksListProps> {
  render() {
    const { lang, poet, works } = this.props;

    const sortWorks = works => {
      if (poet.id === 'bibel') {
        return works;
      } else {
        return works.sort((a, b) => {
          if (a.id === 'andre') {
            return 1;
          } else if (b.id === 'andre') {
            return -1;
          } else {
            const aKey =
              a.year == null || a.year === '?' ? a.title : a.year + a.id;
            const bKey =
              b.year == null || b.year === '?' ? b.title : b.year + b.id;
            return aKey > bKey ? 1 : -1;
          }
        });
      }
    };

    return sortWorks(works).map((work, i) => {
      const workName = <WorkName work={work} lang={lang} />;
      const url = `/${lang}/work/${poet.id}/${work.id}`;
      const name = work.has_content ? (
        <Link route={url}>
          <a title={work.year}>{workName}</a>
        </Link>
      ) : (
        workName
      );
      return (
        <div className="list-section-line" key={i + work.id}>
          {name}
        </div>
      );
    });
  }
}

type ArtworkListProps = {
  lang: Lang,
  poet: Poet,
  artwork: Array<PictureItem>,
};
class ArtworkList extends React.Component<ArtworkListProps> {
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
type WorksProps = {
  lang: Lang,
  poet: Poet,
  works: Array<Work>,
  artwork: Array<PictureItem>,
  error: ?Error,
};
export default class extends React.Component<WorksProps> {
  static async getInitialProps({
    query: { lang, poetId },
  }: {
    query: { lang: Lang, poetId: string },
  }) {
    const json = await Client.works(poetId);

    return {
      lang,
      poet: json.poet,
      works: json.works,
      artwork: json.artwork,
      error: json.error,
    };
  }

  render() {
    const { lang, poet, works, artwork, error } = this.props;

    if (error) {
      return <ErrorPage error={error} lang={lang} message="Ukendt digter" />;
    }
    const requestPath = `/${lang}/works/${poet.id}`;

    const noDataString = null;

    if (works.length === 0 && artwork.length === 0) {
      const bioURL = Links.bioURL(lang, poet.id);
      Router.replaceRoute(bioURL);
      return null;
    }

    const headTitle = poetNameString(poet, false, false) + ' - Kalliope';

    const ogDescription = 'Værker';
    const ogImage = OpenGraph.poetImage(poet);
    const ogTitle = poetNameString(poet, false, false);

    const title = <PoetName poet={poet} includePeriod />;

    return (
      <div>
        <Head
          headTitle={headTitle}
          ogTitle={ogTitle}
          ogImage={ogImage}
          description={ogDescription}
          requestPath={requestPath}
        />
        <Main>
          <Nav lang={lang} poet={poet} title={_('Værker', lang)} />
          <Heading title={title} subtitle={_('Værker', lang)} />
          <PoetTabs lang={lang} poet={poet} selected="works" />
          <div className="two-columns" style={{ lineHeight: 1.7 }}>
            <WorksList lang={lang} poet={poet} works={works} />
            <PicturesGrid
              lang={lang}
              poet={poet}
              artwork={artwork}
              hideArtist={true}
            />
            <style jsx>{`
              :global(.nodata) {
                padding: 30px 0;
                font-weight: lighter;
              }
            `}</style>
          </div>
          <LangSelect lang={lang} path={requestPath} />
        </Main>
      </div>
    );
  }
}
