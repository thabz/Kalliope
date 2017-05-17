const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const pathMatch = require('path-match');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const route = pathMatch();

const routes = [
  {
    match: route('/:lang/poets'),
    path: '/poets',
  },
  {
    match: route('/:lang/works/:poetId'),
    path: '/works',
  },
];

app.prepare().then(() => {
  createServer((req, res) => {
    const { pathname, query } = parse(req.url, true);

    const matches = routes.filter(p => p.match(pathname) !== false).map(p => {
      return {
        params: p.match(pathname),
        path: p.path,
      };
    });
    if (matches.length === 0) {
      handle(req, res);
      return;
    } else {
      const { params, path } = matches[0];
      // assigning `query` into the params means that we still
      // get the query string passed to our application
      // i.e. /blog/foo?show-comments=true
      app.render(req, res, path, Object.assign(params, query));
    }
  }).listen(3000, err => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
