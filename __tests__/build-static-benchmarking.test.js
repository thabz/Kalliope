import { execFileSync } from 'node:child_process';

const runBenchmark = (source, memoryLog = 'false') => execFileSync(
  process.execPath,
  ['--input-type=module', '--eval', source],
  {
    encoding: 'utf8',
    env: { ...process.env, KALLIOPE_BUILD_STATIC_MEMORY_LOG: memoryLog },
  },
);

const imports = `import { b, print_benchmarking_results } from './tools/build-static/benchmarking.js';`;

describe('static-build benchmarking', () => {
  it('times asynchronous work and accumulates repeated steps without memory logging or GC', () => {
    const output = runBenchmark(`${imports}
      global.gc = () => { throw new Error('Unexpected GC'); };
      const work = async value => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return value;
      };
      if (await b('example', work, 42) !== 42) throw new Error('Result lost');
      await b('example', work, 7);
      print_benchmarking_results();
    `);
    expect(output.match(/example: \d+ms/g)).toHaveLength(1);
    expect(Number(output.match(/example: (\d+)ms/)[1])).toBeGreaterThanOrEqual(30);
    expect(output).toMatch(/SUM: \d+ms/);
    expect(output).toMatch(/TOTAL \(process\): \d+ms/);
    expect(output).not.toContain('MB');
  });

  it('keeps memory logging and explicit GC available', () => {
    const output = runBenchmark(`${imports}
      let collections = 0;
      global.gc = () => { collections += 1; };
      await b('example', async () => null);
      print_benchmarking_results();
      if (collections !== 2) throw new Error('GC hooks lost');
    `, 'true');
    expect(output).toMatch(/example: \d+ms, .*MB heap/);
    expect(output).toContain('MB buffers');
  });

  it('propagates build failures', () => {
    const output = runBenchmark(`${imports}
      try {
        await b('failure', async () => { throw new Error('Build failed'); });
        throw new Error('Failure swallowed');
      } catch (error) {
        if (error.message !== 'Build failed') throw error;
        console.log(error.message);
      }
    `);
    expect(output).toContain('Build failed');
  });
});
