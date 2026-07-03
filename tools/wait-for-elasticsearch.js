const { URL } = require('url');

const baseUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
const healthUrl = new URL('/_cluster/health', baseUrl).toString();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const waitForElasticsearch = async () => {
  const timeoutAt = Date.now() + 120000;

  while (Date.now() < timeoutAt) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        const health = await response.json();
        if (health.status === 'yellow' || health.status === 'green') {
          return;
        }
      }
    } catch (error) {
      // Ignore connection and parse errors while Elasticsearch is booting.
    }

    await sleep(1000);
  }

  throw new Error(`Timed out waiting for Elasticsearch at ${healthUrl}`);
};

waitForElasticsearch().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
