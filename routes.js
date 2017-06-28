// routes.js
const nextRoutes = require('next-routes');
const routes = (module.exports = nextRoutes());

// Named routes
routes.add('index', '/:lang/');
routes.add('poets', '/:lang/poets/:groupBy');
routes.add('works', '/:lang/works/:poetId/');
routes.add('lines', '/:lang/lines/:poetId/:type');
routes.add('bio', '/:lang/bio/:poetId');
routes.add('bibliography', '/:lang/bibliography/:poetId');
routes.add('work', '/:lang/work/:poetId/:workId');
routes.add('text', '/:lang/text/:textId');
routes.add('keywords', '/:lang/keywords');
routes.add('keyword', '/:lang/keyword/:keywordId');
routes.add('dictitem', '/:lang/dict/:dictItemId');
