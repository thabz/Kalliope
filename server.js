const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const pathMatch = require('path-match');
const { join } = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const route = pathMatch();

const rootStaticFiles = ['/sw.js'];

const routes = [
  {
    match: route('/:lang/'),
    path: '/index',
  },
  {
    match: route('/:lang/poets/:groupBy'),
    path: '/poets',
  },
  {
    match: route('/:lang/works/:poetId'),
    path: '/works',
  },
  {
    match: route('/:lang/lines/:poetId/:type'),
    path: '/lines',
  },
  {
    match: route('/:lang/bio/:poetId'),
    path: '/bio',
  },
  {
    match: route('/:lang/work/:poetId/:workId'),
    path: '/work',
  },
  {
    match: route('/:lang/text/:textId'),
    path: '/text',
  },
  {
    match: route('/:lang/keywords'),
    path: '/keywords',
  },
  {
    match: route('/:lang/keyword/:keywordId'),
    path: '/keyword',
  },
];

app.prepare().then(() => {
  createServer((req, res) => {
    const { pathname, query } = parse(req.url, true);

    if (rootStaticFiles.indexOf(pathname) > -1) {
      const path = join(__dirname, 'static', pathname);
      app.serveStatic(req, res, path);
      return;
    }

    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      const params = r.match(pathname);
      if (params !== false) {
        // Assigning `query` into the params means that we still
        // get the query string passed to our application
        // i.e. /blog/foo?show-comments=true
        app.render(req, res, r.path, Object.assign(params, query));
        return;
      }
    }
    handle(req, res);
  }).listen(3000, err => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
