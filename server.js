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
    match: route('/:lang/poets/:groupBy'),
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
