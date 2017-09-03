// routes.js
const nextRoutes = require('next-routes');
const routes = (module.exports = nextRoutes());

// Named routes
routes.add('index', '/:lang(da|en)/');
routes.add('poets', '/:lang(da|en)/poets/:country/:groupBy(name|year)');
routes.add('poets-looks', '/:lang(da|en)/poets/:country/:groupBy(looks)');
routes.add('works', '/:lang(da|en)/works/:poetId/');
routes.add('texts', '/:lang(da|en)/texts/:poetId/:type');
routes.add('bio', '/:lang(da|en)/bio/:poetId');
routes.add('bibliography', '/:lang(da|en)/bibliography/:poetId');
routes.add('work', '/:lang(da|en)/work/:poetId/:workId');
routes.add('text', '/:lang(da|en)/text/:textId');
routes.add('keywords', '/:lang(da|en)/keywords');
routes.add('keyword', '/:lang(da|en)/keyword/:keywordId');
routes.add('dict', '/:lang(da|en)/dict');
routes.add('dictitem', '/:lang(da|en)/dict/:dictItemId');
routes.add('about', '/:lang(da|en)/about/:aboutItemId');
routes.add('search-poet', '/:lang(da|en)/search/:country/:poetId', 'search');
routes.add('search-kalliope', '/:lang(da|en)/search/:country', 'search');
