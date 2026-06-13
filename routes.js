// routes.js
const React = require('react');
const { parse } = require('url');

const getNextLink = () => {
  const NextLinkModule = require('next/link');
  return NextLinkModule.default || NextLinkModule;
};

const getNextRouter = () => {
  const NextRouterModule = require('next/router');
  return NextRouterModule.default || NextRouterModule;
};

const routeDefinitions = [
  {
    page: '/',
    regex: /^\/(da|en)\/?$/,
    keys: ['lang'],
  },
  {
    page: '/poets',
    regex: /^\/(da|en)\/poets\/([^/]+)\/(name|year)\/?$/,
    keys: ['lang', 'country', 'groupBy'],
  },
  {
    page: '/poets-looks',
    regex: /^\/(da|en)\/poets\/([^/]+)\/(looks)\/?$/,
    keys: ['lang', 'country', 'groupBy'],
  },
  {
    page: '/works',
    regex: /^\/(da|en)\/works\/([^/]+)\/?$/,
    keys: ['lang', 'poetId'],
  },
  {
    page: '/museums',
    regex: /^\/(da|en)\/museums\/?$/,
    keys: ['lang'],
  },
  {
    page: '/museum',
    regex: /^\/(da|en)\/museum\/([^/]+)\/?$/,
    keys: ['lang', 'museumId'],
  },
  {
    page: '/texts',
    regex: /^\/(da|en)\/texts\/([^/]+)\/([^/]+)\/?$/,
    keys: ['lang', 'poetId', 'type'],
  },
  {
    page: '/alltexts',
    regex: /^\/(da|en)\/texts\/([^/]+)\/([^/]+)\/([^/]+)\/?$/,
    keys: ['lang', 'country', 'type', 'letter'],
  },
  {
    page: '/bio',
    regex: /^\/(da|en)\/bio\/([^/]+)\/?$/,
    keys: ['lang', 'poetId'],
  },
  {
    page: '/bibliography',
    regex: /^\/(da|en)\/bibliography\/([^/]+)\/?$/,
    keys: ['lang', 'poetId'],
  },
  {
    page: '/mentions',
    regex: /^\/(da|en)\/mentions\/([^/]+)\/?$/,
    keys: ['lang', 'poetId'],
  },
  {
    page: '/work',
    regex: /^\/(da|en)\/work\/([^/]+)\/([^/]+)\/?$/,
    keys: ['lang', 'poetId', 'workId'],
  },
  {
    page: '/text',
    regex: /^\/(da|en)\/text\/([^/]+)\/?$/,
    keys: ['lang', 'textId'],
  },
  {
    page: '/keywords',
    regex: /^\/(da|en)\/keywords\/?$/,
    keys: ['lang'],
  },
  {
    page: '/keyword',
    regex: /^\/(da|en)\/keyword\/([^/]+)\/?$/,
    keys: ['lang', 'keywordId'],
  },
  {
    page: '/dict',
    regex: /^\/(da|en)\/dict\/?$/,
    keys: ['lang'],
  },
  {
    page: '/dictitem',
    regex: /^\/(da|en)\/dict\/([^/]+)\/?$/,
    keys: ['lang', 'dictItemId'],
  },
  {
    page: '/about',
    regex: /^\/(da|en)\/about\/([^/]+)\/?$/,
    keys: ['lang', 'aboutItemId'],
  },
  {
    page: '/search',
    regex: /^\/(da|en)\/search\/([^/]+)\/([^/]+)\/?$/,
    keys: ['lang', 'country', 'poetId'],
  },
  {
    page: '/search',
    regex: /^\/(da|en)\/search\/([^/]+)\/?$/,
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
    const url = parsedUrl || parse(req.url, true);
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

const Link = ({ route, to, href, children, ...props }) => {
  const nextHref = href || route || to;
  const NextLink = getNextLink();

  if (React.isValidElement(children) && children.type === 'a') {
    const { onClick, ...linkProps } = props;
    const child = onClick
      ? React.cloneElement(children, { onClick })
      : children;

    return React.createElement(
      NextLink,
      { href: nextHref, legacyBehavior: true, passHref: true, ...linkProps },
      child
    );
  }

  return React.createElement(
    NextLink,
    { href: nextHref, ...props },
    children
  );
};

const Router = {
  pushRoute: (url, as, options) =>
    getNextRouter().push(as || url, undefined, options),
  replaceRoute: (url, as, options) =>
    getNextRouter().replace(as || url, undefined, options),
};

module.exports = {
  Link,
  Router,
  getRequestHandler,
  matchRoute,
};
