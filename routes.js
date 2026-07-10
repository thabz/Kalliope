import { supportedLanguages } from './common/languages.js';

const lang = supportedLanguages.join('|');

const routeDefinitions = [
  {
    page: '/',
    regex: new RegExp(`^/(${lang})/?$`),
    keys: ['lang'],
  },
  {
    page: '/poets',
    regex: new RegExp(`^/(${lang})/poets/([^/]+)/(name|year)/?$`),
    keys: ['lang', 'country', 'groupBy'],
  },
  {
    page: '/poets-looks',
    regex: new RegExp(`^/(${lang})/poets/([^/]+)/(looks)/?$`),
    keys: ['lang', 'country', 'groupBy'],
  },
  {
    page: '/works',
    regex: new RegExp(`^/(${lang})/works/([^/]+)/?$`),
    keys: ['lang', 'poetId'],
  },
  {
    page: '/museums',
    regex: new RegExp(`^/(${lang})/museums/?$`),
    keys: ['lang'],
  },
  {
    page: '/museum',
    regex: new RegExp(`^/(${lang})/museum/([^/]+)/?$`),
    keys: ['lang', 'museumId'],
  },
  {
    page: '/texts',
    regex: new RegExp(`^/(${lang})/texts/([^/]+)/([^/]+)/?$`),
    keys: ['lang', 'poetId', 'type'],
  },
  {
    page: '/alltexts',
    regex: new RegExp(`^/(${lang})/texts/([^/]+)/([^/]+)/([^/]+)/?$`),
    keys: ['lang', 'country', 'type', 'letter'],
  },
  {
    page: '/bio',
    regex: new RegExp(`^/(${lang})/bio/([^/]+)/?$`),
    keys: ['lang', 'poetId'],
  },
  {
    page: '/bibliography',
    regex: new RegExp(`^/(${lang})/bibliography/([^/]+)/?$`),
    keys: ['lang', 'poetId'],
  },
  {
    page: '/mentions',
    regex: new RegExp(`^/(${lang})/mentions/([^/]+)/?$`),
    keys: ['lang', 'poetId'],
  },
  {
    page: '/work',
    regex: new RegExp(`^/(${lang})/work/([^/]+)/([^/]+)/?$`),
    keys: ['lang', 'poetId', 'workId'],
  },
  {
    page: '/text',
    regex: new RegExp(`^/(${lang})/text/([^/]+)/?$`),
    keys: ['lang', 'textId'],
  },
  {
    page: '/keywords',
    regex: new RegExp(`^/(${lang})/keywords/?$`),
    keys: ['lang'],
  },
  {
    page: '/keyword',
    regex: new RegExp(`^/(${lang})/keyword/([^/]+)/?$`),
    keys: ['lang', 'keywordId'],
  },
  {
    page: '/dict',
    regex: new RegExp(`^/(${lang})/dict/?$`),
    keys: ['lang'],
  },
  {
    page: '/dictitem',
    regex: new RegExp(`^/(${lang})/dict/([^/]+)/?$`),
    keys: ['lang', 'dictItemId'],
  },
  {
    page: '/about',
    regex: new RegExp(`^/(${lang})/about/([^/]+)/?$`),
    keys: ['lang', 'aboutItemId'],
  },
  {
    page: '/search',
    regex: new RegExp(`^/(${lang})/search/([^/]+)/([^/]+)/?$`),
    keys: ['lang', 'country', 'poetId'],
  },
  {
    page: '/search',
    regex: new RegExp(`^/(${lang})/search/([^/]+)/?$`),
    keys: ['lang', 'country'],
  },
];

const decodePathPart = value => {
  try {
    return decodeURIComponent(value);
  } catch (err) {
    return value;
  }
};

const matchRoute = pathname => {
  for (const route of routeDefinitions) {
    const match = route.regex.exec(pathname);
    if (match == null) {
      continue;
    }

    const query = {};
    route.keys.forEach((key, index) => {
      query[key] = decodePathPart(match[index + 1]);
    });
    return { page: route.page, query };
  }

  return null;
};

const getRequestHandler = app => {
  const nextHandler = app.getRequestHandler();

  return (req, res, parsedUrl) => {
    const url =
      parsedUrl ||
      (() => {
        const requestUrl = new URL(req.url, 'http://localhost');
        return {
          pathname: requestUrl.pathname,
          query: Object.fromEntries(requestUrl.searchParams),
        };
      })();
    const match = matchRoute(url.pathname);

    if (match != null) {
      return app.render(req, res, match.page, {
        ...url.query,
        ...match.query,
      });
    }

    return nextHandler(req, res, parsedUrl);
  };
};

export {
  getRequestHandler,
  matchRoute,
};
