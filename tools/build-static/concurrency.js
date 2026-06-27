const pLimit = require('p-limit');

const DEFAULT_CONCURRENCY = 4;

const buildConcurrency = Math.max(
  1,
  parseInt(process.env.KALLIOPE_BUILD_CONCURRENCY, 10) || DEFAULT_CONCURRENCY
);

const mapLimit = (items, mapper, concurrency = buildConcurrency) => {
  const limit = pLimit(concurrency);
  return Promise.all(
    items.map((item, index) => limit(() => mapper(item, index)))
  );
};

module.exports = {
  buildConcurrency,
  mapLimit,
};
