// @flow
import React, { useContext, useState, useEffect } from 'react';
import { Link, Router } from '../routes';
import * as Links from './links.js';
import { poetGenetiveLastName } from './poetname-helpers.js';
import _ from '../common/translations.js';
import type { Lang, Poet, Country } from '../common/types.js';
import CommonData from '../common/commondata.js';
import LangContext from '../common/LangContext.js';
import { LoupeSVG, CrossSVG } from './icons.js';

const transitionDuration = '0.2s';

type TabsProps = {
  items: Array<{ id: string, url: string, title: string, hide?: boolean }>,
  poet?: Poet,
  country: Country,
  lang: Lang,
  query?: ?string,
  selected: string,
};
const Tabs = (props: TabsProps) => {
  let searchField: HTMLInputElement;

  const { items, selected, poet, lang, query } = props;
  let country = props.country;
  if (country == null) {
    country = lang === 'da' ? 'dk' : 'gb';
  }

  const [showSearchField, setShowSearchField] = useState(
    query != null && query.length > 0
  );

  const hideSearchField = () => {
    searchField.value = '';
    if (window) {
      window.removeEventListener('keydown', onKeyDown, false);
    }
    setShowSearchField(false);
  };

  useEffect(() => {
    if (showSearchField) {
      if (window) {
        window.addEventListener('keydown', onKeyDown, false);
      }
      if (document && document.activeElement !== searchField) {
        searchField.focus();
      }
    }
    return () => {
      if (window) {
        window.removeEventListener('keydown', onKeyDown, false);
      }
    };
  }, [showSearchField]);

  const onSubmit = (e: Event) => {
    const q = searchField.value;
    let URL = null;
    if (poet != null && poet.has_texts) {
      URL = Links.searchURL(lang, q, poet.country, poet.id);
    } else {
      URL = Links.searchURL(lang, q, country);
    }
    if (document) {
      searchField.blur();
    }
    Router.pushRoute(URL);
    e.preventDefault();
  };

  const onLoupeClick = (e: Event) => {
    if (showSearchField) {
      const q = searchField.value;
      if (q.length === 0) {
        // When the text input is empty, the loupe
        // should simply toggle seach mode.
        hideSearchField();
      } else {
        onSubmit(e);
      }
    } else {
      setShowSearchField(true);
    }
    e.preventDefault();
  };

  const onCrossClick = (e: MouseEvent) => {
    hideSearchField();
    e.preventDefault();
  };

  const onFocus = () => {
    window && (window.searchFieldHasFocus = true);
  };

  const onBlur = () => {
    window && (window.searchFieldHasFocus = false);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.keyCode === 27) {
      setShowSearchField(false);
      onBlur();
      e.preventDefault();
    }
  };

  let placeholder = null;
  if (poet != null && poet.has_texts) {
    const genetiveLastName = poetGenetiveLastName(poet, lang);
    placeholder = _('Søg i {genetiveLastName} værker', lang, {
      genetiveLastName,
    });
  } else {
    if (country === 'dk') {
      placeholder = _('Søg i Kalliope', lang);
    } else {
      const countryData = CommonData.countries.filter(
        (x) => x.code === country
      );
      if (countryData.length > 0) {
        const adjective = countryData[0].adjective[lang];
        placeholder = _('Søg i Kalliopes {adjective} samling', lang, {
          adjective,
        });
      } else {
        placeholder = _('Søg i Kalliope', lang);
      }
    }
  }
  const searchFieldRendered = (
    <div style={{ display: 'flex' }}>
      <div style={{ flexGrow: 1 }}>
        <form onSubmit={onSubmit}>
          <label htmlFor="search-field-id" style={{ display: 'none' }}>
            Søg
          </label>
          <input
            id="search-field-id"
            ref={(domElement) => {
              if (domElement != null) {
                searchField = domElement;
              }
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            title={placeholder}
            defaultValue={query}
            className="search-field"
            placeholder={placeholder}
          />
        </form>
      </div>
      <div
        className="svg-container"
        style={{
          cursor: 'pointer',
        }}
      >
        <CrossSVG color="black" onClick={onCrossClick} />
      </div>
    </div>
  );

  const itemsRendered = items
    .filter((item) => !item.hide)
    .map((item, i) => {
      const className = item.id === selected ? 'tab selected' : 'tab';
      return (
        <div className={className} key={item.url}>
          <Link route={item.url}>
            <a>
              <h2>{item.title}</h2>
            </a>
          </Link>
        </div>
      );
    });

  const leftSide = (
    <div className="leftside">
      <nav
        className="tabs"
        style={{
          display: showSearchField ? 'none' : 'flex',
        }}
      >
        {itemsRendered}
      </nav>
      <div
        className="searchfield-container"
        style={{
          display: showSearchField ? 'block' : 'none',
        }}
      >
        {searchFieldRendered}
      </div>
    </div>
  );

  return (
    <div className="tabs-container">
      {leftSide}
      <div className="svg-container" style={{ alignSelf: 'flex-start' }}>
        <span onClick={onLoupeClick} style={{ cursor: 'pointer' }}>
          <LoupeSVG color={showSearchField ? 'black' : '#707070'} />
        </span>
      </div>
      <style jsx>{`
          .tabs-container {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid black;
            margin-bottom: 80px;
            margin-top: 30px;
            flex-grow: 1;
          }
          :global(.svg-container)  {
            flex-basis: 28px;
            flex-shrink: 1;
            align-self: flex-start;
            transition: flex-basis ${transitionDuration};
          }
          :global(.leftside) {
            width: 100%;
            overflow: scroll;
            margin-right: 10px;
            scrollbar-width: none;
          }
          :global(.leftside::-webkit-scrollbar) {
            display: none;
          }
          :global(.search-field) {
            font-size: 32px;
            line-height: 32px;
            width: 100%;
            border: 0;
            padding: 0;
            margin: 0;
            outline: 0;            
            font-weight: 100;
            font-family: inherit;
            transition: font-size ${transitionDuration}, line-height: ${transitionDuration};
            caret-color: black;
          }
          :global(.searchfield-container) {
            width: 100%;
            padding-bottom: 10px;
          }
          :global(.tabs) > :global(.tab) {
            display: inline-block;
            margin-right: 30px;
            border-bottom: 2px solid transparent;
            padding-bottom: 15px;
            transition: margin-right ${transitionDuration};
            white-space: nowrap;
          }
          :global(.tabs) > :global(.tab) :global(h2) {
            margin: 0;
            padding: 0;
            line-height: 32px;
            font-size: 32px;
            font-weight: 100;
            transition: font-size ${transitionDuration}, line-height: ${transitionDuration};
          }
          :global(.tabs) > :global(.tab.selected) {
            border-bottom: 2px solid black;
          }
          /*
          :global(.tabs) > :global(.tab:hover) {
            border-bottom: 2px solid #888;
          }
          */
          :global(.tabs) :global(.tab.selected a) {
            color: black;
          }
          :global(.tabs) > :global(.tab) :global(a) {
            color: #707070;
          }

          @media (max-width: 480px) {
            :global(.tabs) > :global(.tab) {
              margin-right: 10px;
            }
            :global(.tabs) > :global(.tab) :global(h2) {
              font-size: 26px !important;
              line-height: 26px;
            }
            :global(.svg-container) {
              flex-basis: 26px;
            }
            :global(.search-field) {
              font-size: 26px;
              line-height: 26px;
            }
            :global(.searchfield-container) {
              padding-bottom: 9px;
            }
            :global(form) {
              margin: 0;
              padding: 0;
            }
          }

          @media print {
            .tabs-container {
              display: none;
            }
          }
        `}</style>
    </div>
  );
};

export default Tabs;

export const poetMenu = (poet: Poet) => {
  const lang = useContext(LangContext);

  return [
    {
      id: 'works',
      title: _('Værker', lang),
      hide: !poet.has_works && !poet.has_artwork,
      url: Links.worksURL(lang, poet.id),
    },
    {
      id: 'titles',
      title: _('Digttitler', lang),
      hide: !poet.has_poems,
      url: Links.textsURL(lang, poet.id, 'titles'),
    },
    {
      id: 'first',
      title: _('Førstelinjer', lang),
      hide: !poet.has_poems,
      url: Links.textsURL(lang, poet.id, 'first'),
    },
    {
      id: 'mentions',
      title: _('Henvisninger', lang),
      hide: !poet.has_mentions,
      url: Links.mentionsURL(lang, poet.id),
    },
    {
      id: 'bio',
      title: _('Biografi', lang),
      hide: !poet.has_biography,
      url: Links.bioURL(lang, poet.id),
    },
  ];
};

export const kalliopeMenu = () => {
  const lang = useContext(LangContext);
  return [
    { id: 'index', title: 'Kalliope', url: Links.frontPageURL(lang) },
    {
      id: 'poets',
      title: _('Digtere', lang),
      url: Links.poetsURL(lang, 'name'),
    },
    /*
      {
        id: 'poems',
        title: _('Digte', lang),
        url: Links.allTextsURL(lang, 'dk', 'titles', 'A'),
      },
      */
    {
      id: 'keywords',
      title: _('Nøgleord', lang),
      url: Links.keywordsURL(lang),
    },
    //{ id: 'dictionary', title: 'Ordbog', url: Links.dictionaryURL(lang) },
    {
      id: 'about',
      title: _('Om', lang),
      url: Links.aboutURL(lang, 'kalliope'),
    },
  ];
};
