let b_keys = [];
let b_millis = {};
let b_memory = {};

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
  if (global.gc) {
    global.gc();
  }
};

const formatMemory = memory =>
  `${memory.heapUsed}MB heap / ${memory.rss}MB rss`;

// Benchmarking
const b = async (name, f, args) => {
  collectGarbage();
  const beforeMemory = memorySnapshot();
  console.log(`${name}... ${formatMemory(beforeMemory)}`);
  const beforeMillis = Date.now();
  const result = await f(args);
  const afterMillis = Date.now();
  collectGarbage();
  const afterMemory = memorySnapshot();
  if (b_millis[name] == null) {
    b_keys.push(name);
    b_millis[name] = 0;
    b_memory[name] = {
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
  b_millis[name] = b_millis[name] + afterMillis - beforeMillis;
  b_memory[name].afterHeapUsed = afterMemory.heapUsed;
  b_memory[name].afterExternal = afterMemory.external;
  b_memory[name].afterArrayBuffers = afterMemory.arrayBuffers;
  b_memory[name].afterRss = afterMemory.rss;
  b_memory[name].maxHeapUsed = Math.max(
    b_memory[name].maxHeapUsed,
    beforeMemory.heapUsed,
    afterMemory.heapUsed
  );
  b_memory[name].maxExternal = Math.max(
    b_memory[name].maxExternal,
    beforeMemory.external,
    afterMemory.external
  );
  b_memory[name].maxArrayBuffers = Math.max(
    b_memory[name].maxArrayBuffers,
    beforeMemory.arrayBuffers,
    afterMemory.arrayBuffers
  );
  b_memory[name].maxRss = Math.max(
    b_memory[name].maxRss,
    beforeMemory.rss,
    afterMemory.rss
  );
  return result;
};

const print_benchmarking_results = () => {
  let sum = 0;
  console.log('\nSTATS');
  b_keys.forEach(key => {
    const millis = b_millis[key];
    const memory = b_memory[key];
    sum += millis;
    console.log(
      `${key}: ${millis}ms, ` +
        `${memory.beforeHeapUsed}->${memory.afterHeapUsed}MB heap, ` +
        `${memory.beforeExternal}->${memory.afterExternal}MB ext, ` +
        `${memory.beforeArrayBuffers}->${memory.afterArrayBuffers}MB buffers, ` +
        `${memory.beforeRss}->${memory.afterRss}MB rss, ` +
        `max ${memory.maxHeapUsed}MB heap / ${memory.maxExternal}MB ext / ` +
        `${memory.maxArrayBuffers}MB buffers / ${memory.maxRss}MB rss`
    );
  });
  console.log(`SUM: ${sum}ms`);
};

module.exports = {
  b,
  print_benchmarking_results,
};
