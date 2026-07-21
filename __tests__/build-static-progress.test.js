import { createProgressReporter } from '../tools/build-static/progress.js';

describe('build-static progress reporting', () => {
  it('reports periodically and once when finished', () => {
    const messages = [];
    const progress = createProgressReporter(
      'Skrev tekstfiler',
      2,
      message => messages.push(message)
    );

    for (let i = 0; i < 5; i += 1) {
      progress.increment();
    }
    progress.finish();

    expect(messages).toEqual([
      'Skrev tekstfiler: 2',
      'Skrev tekstfiler: 4',
      'Skrev tekstfiler: 5 (færdig)',
    ]);
  });
});
