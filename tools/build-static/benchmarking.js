import { performance } from 'node:perf_hooks';

const benchmarkKeys = [];
const benchmarkMillis = {};
const benchmarkMemory = {};

const memoryLogEnabled = ['1', 'true', 'yes'].includes(
  (process.env.KALLIOPE_BUILD_STATIC_MEMORY_LOG ?? '').toLowerCase()
);

const megabytes = bytes => Math.round(bytes / 1024 / 1024);

const memorySnapshot = () => {
  const memory = process.memoryUsage();
  return {
    heapUsed: megabytes(memory.heapUsed),
    external: megabytes(memory.external),
    arrayBuffers: megabytes(memory.arrayBuffers),
    rss: megabytes(memory.rss),
  };
};

const collectGarbage = () => {
  if (typeof global.gc === 'function') {
    global.gc();
  }
};

const formatMemory = memory =>
  `${memory.heapUsed}MB heap / ${memory.rss}MB rss`;

// Benchmarking
const b = async (name, f, args) => {
  if (memoryLogEnabled === true) {
    collectGarbage();
  }
  const beforeMemory = memoryLogEnabled === true ? memorySnapshot() : null;
  console.log(beforeMemory == null
    ? `${name}...`
    : `${name}... ${formatMemory(beforeMemory)}`);
  const beforeMillis = performance.now();
  const result = await f(args);
  const elapsedMillis = performance.now() - beforeMillis;
  if (benchmarkMillis[name] == null) {
    benchmarkKeys.push(name);
    benchmarkMillis[name] = 0;
  }
  benchmarkMillis[name] += elapsedMillis;
  if (memoryLogEnabled === false) {
    return result;
  }
  collectGarbage();
  const afterMemory = memorySnapshot();
  if (benchmarkMemory[name] == null) {
    benchmarkMemory[name] = {
      beforeHeapUsed: beforeMemory.heapUsed,
      afterHeapUsed: afterMemory.heapUsed,
      beforeExternal: beforeMemory.external,
      afterExternal: afterMemory.external,
      beforeArrayBuffers: beforeMemory.arrayBuffers,
      afterArrayBuffers: afterMemory.arrayBuffers,
      beforeRss: beforeMemory.rss,
      afterRss: afterMemory.rss,
      maxHeapUsed: afterMemory.heapUsed,
      maxExternal: afterMemory.external,
      maxArrayBuffers: afterMemory.arrayBuffers,
      maxRss: afterMemory.rss,
    };
  }
  benchmarkMemory[name].afterHeapUsed = afterMemory.heapUsed;
  benchmarkMemory[name].afterExternal = afterMemory.external;
  benchmarkMemory[name].afterArrayBuffers = afterMemory.arrayBuffers;
  benchmarkMemory[name].afterRss = afterMemory.rss;
  benchmarkMemory[name].maxHeapUsed = Math.max(
    benchmarkMemory[name].maxHeapUsed,
    beforeMemory.heapUsed,
    afterMemory.heapUsed
  );
  benchmarkMemory[name].maxExternal = Math.max(
    benchmarkMemory[name].maxExternal,
    beforeMemory.external,
    afterMemory.external
  );
  benchmarkMemory[name].maxArrayBuffers = Math.max(
    benchmarkMemory[name].maxArrayBuffers,
    beforeMemory.arrayBuffers,
    afterMemory.arrayBuffers
  );
  benchmarkMemory[name].maxRss = Math.max(
    benchmarkMemory[name].maxRss,
    beforeMemory.rss,
    afterMemory.rss
  );
  return result;
};

const print_benchmarking_results = () => {
  let sum = 0;
  console.log('\nSTATS');
  benchmarkKeys.forEach(key => {
    const millis = benchmarkMillis[key];
    const memory = benchmarkMemory[key];
    sum += millis;
    if (memory == null) {
      console.log(`${key}: ${Math.round(millis)}ms`);
      return;
    }
    console.log(
      `${key}: ${Math.round(millis)}ms, ` +
        `${memory.beforeHeapUsed}->${memory.afterHeapUsed}MB heap, ` +
        `${memory.beforeExternal}->${memory.afterExternal}MB ext, ` +
        `${memory.beforeArrayBuffers}->${memory.afterArrayBuffers}MB buffers, ` +
        `${memory.beforeRss}->${memory.afterRss}MB rss, ` +
        `max ${memory.maxHeapUsed}MB heap / ${memory.maxExternal}MB ext / ` +
        `${memory.maxArrayBuffers}MB buffers / ${memory.maxRss}MB rss`
    );
  });
  console.log(`SUM: ${Math.round(sum)}ms`);
  console.log(`TOTAL (process): ${Math.round(process.uptime() * 1000)}ms`);
};

export {
  b,
  print_benchmarking_results,
};
