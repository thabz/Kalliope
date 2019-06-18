// server.js
const next = require('next');
const routes = require('./routes');
const fs = require('fs');
const { parse } = require('url');
const { join } = require('path');
const { createServer } = require('http');
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handler = routes.getRequestHandler(app);
const elasticSearchClient = require('./tools/libs/elasticsearch-client.js');
const rootStaticFiles = [
  '/sw.js',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/google88bff7f4fb67a7b5.html',
  '/apple-touch-icon-120x120.png',
  '/apple-touch-icon-152x152.png',
  '/apple-touch-icon-180x180.png',
  '/apple-touch-icon-60x60.png',
  '/apple-touch-icon-76x76.png',
  '/apple-touch-icon.png', // 180x180
];

const worksRedirects = JSON.parse(fs.readFileSync('static/api/redirects.json'));
const redirects = [
  {
    from: /\/(..)\/ffront.cgi/,
    to: '/$1/works/${fhandle}',
  },
  {
    from: /\/ffront.cgi/,
    to: '/da/works/${fhandle}',
  },
  {
    from: /\/(..)\/fvaerker.pl/,
    to: '/$1/works/${fhandle}',
  },
  {
    from: /\/fvaerker.pl/,
    to: '/da/works/${fhandle}',
  },
  {
    from: /\/(..)\/fpop.pl/,
    to: '/$1/works/${fhandle}',
  },
  {
    from: /\/fpop.pl/,
    to: '/da/works/${fhandle}',
  },
  {
    from: /\/(..)\/digt.pl/,
    to: '/$1/text/${longdid}',
  },
  {
    from: /\/digt.pl/,
    to: '/da/text/${longdid}',
  },
  {
    from: /\/(..)\/biografi.cgi/,
    to: '/$1/bio/${fhandle}',
  },
  {
    from: /\/biografi.cgi/,
    to: '/da/bio/${fhandle}',
  },
  {
    from: /\/(..)\/vaerktoc.pl/,
    to: '/$1/work/${fhandle}/${vhandle}',
  },
  {
    from: /\/vaerktoc.pl/,
    to: '/da/work/${fhandle}/${vhandle}',
  },
  {
    from: /\/(..)\/vaerktoc.pl/,
    to: '/$1/work/${vid}',
  },
  {
    from: /\/vaerktoc.pl/,
    to: '/da/work/${vid}',
  },
  {
    // Smid både førsteliner og titler til titler
    from: /\/(..)\/flines.pl/,
    to: '/$1/texts/${fhandle}/titles',
  },
  {
    from: /\/(..)\/bibliography\/(.*)/,
    to: '/$1/mentions/$2',
  },
  {
    // Smid både førsteliner og titler til titler
    from: /\/flines.pl/,
    to: '/da/texts/${fhandle}/titles',
  },
  {
    from: /\/(..)\/keyword.cgi/,
    to: '/$1/keyword/${keyword}',
  },
  {
    from: /\/keyword.cgi/,
    to: '/da/keyword/${keyword}',
  },
  {
    from: /\/(..)\/fsekundaer.pl/,
    to: '/$1/bibliography/${fhandle}',
  },
  {
    from: /\/fsekundaer.pl/,
    to: '/da/bibliography/${fhandle}',
  },
  {
    from: /\/(..)\/poets.cgi/,
    to: '/$1/poets/dk/name',
  },
  {
    from: /\/poets.cgi/,
    to: '/da/poets/dk/name',
  },
  {
    from: /\/..\/work\/([^\/]+)\/(.*?)\.xml/,
    to: '/static/api/$1/$2.xml',
  },
];

const cleanUpRedirectURLRegExp = /[^0-9a-zA-Z\-_\/]/g;

app.prepare().then(() => {
  createServer((req, res) => {
    const { pathname, query } = parse(req.url, true);

    if (rootStaticFiles.indexOf(pathname) > -1) {
      const path = join(__dirname, 'static', pathname);
      app.serveStatic(req, res, path);
      return;
    } else if (
      pathname.indexOf('.cgi') > -1 ||
      pathname.indexOf('.pl') > -1 ||
      pathname.indexOf('/bibliography/') > -1 ||
      (pathname.indexOf('.xml') > -1 && pathname.indexOf('/work/') > -1)
    ) {
      let done = false;
      redirects.forEach(descr => {
        const m = descr.from.exec(pathname);
        if (!done && m != null) {
          let missingParams = false;
          const to = descr.to
            .replace('$1', m[1])
            .replace('$2', m[2])
            .replace(/\${(.*?)}/g, (m, p1) => {
              if (query[p1] == null) {
                missingParams = true;
              }
              return query[p1];
            })
            .replace(cleanUpRedirectURLRegExp, '');
          if (!missingParams) {
            res.writeHead(301, { Location: to });
            res.end();
            done = true;
          }
        }
      });
      if (done) {
        return;
      }
    }
    if (pathname.indexOf('/search') === 0) {
      elasticSearchClient
        .search(
          'kalliope-'+query.country,
          query.country,
          query.poetId,
          query.query,
          query.page || 0
        )
        .then(result => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(result);
          res.end();
        })
        .catch(err => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify({ error: err }));
          res.end();
        });
    } else if (worksRedirects[pathname] != null) {
      const to = worksRedirects[pathname].replace(cleanUpRedirectURLRegExp, '');
      //console.log('Redirecting to', to);
      res.writeHead(302, { Location: to });
      res.end();
    } else {
      //      if (pathname.match(/.(jpg|json)$/) == null) {
      //        console.log('        ' + pathname);
      //      }
      handler(req, res);
    }
  }).listen(3000, err => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});

// Assigning `query` into the params means that we still
// get the query string passed to our application
// i.e. /blog/foo?show-comments=true
//app.render(req, res, r.path, Object.assign(params, query));
