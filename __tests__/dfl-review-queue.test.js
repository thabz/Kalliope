import { buildReviewQueue, publicDomainCutoffYear, validateDecisions } from '../tools/dfl-review-queue.js';

describe('DFL review queue', () => {
  const resolution = {
    records: [
      { key: 'dfl:a', sourceId: 'a', names: ['A'], workCount: 2, page: { deathYear: '1955' }, resolution: { status: 'unresolved' } },
      { key: 'dfl:b', sourceId: 'b', names: ['B'], workCount: 10, page: { pageStatus: 'life-dates-found', deathYear: '1950' }, resolution: { status: 'needs-review' } },
      { key: 'dfl:c', sourceId: 'c', names: ['C'], workCount: 20, resolution: { status: 'certain' } },
    ],
  };

  it('prioritizes review candidates by affected works and evidence', () => {
    const queue = buildReviewQueue(resolution, [], 2, new Date('2026-08-07'));
    expect(queue.records.map(record => record.key)).toEqual(['dfl:b', 'dfl:a']);
    expect(queue.counts).toMatchObject({ eligible: 2, topQueue: 2, undecided: 2, notYetEligible: 0, deathYearUnknown: 0 });
  });

  it('excludes recent and unknown deaths from the public-domain queue', () => {
    expect(publicDomainCutoffYear(new Date('2026-08-07'))).toBe(1955);
    const queue = buildReviewQueue({ records: [
      { key: 'recent', names: ['Recent'], workCount: 3, page: { deathYear: '1956' }, resolution: { status: 'needs-review' } },
      { key: 'unknown', names: ['Unknown'], workCount: 2, page: {}, resolution: { status: 'unresolved' } },
    ] }, [], 100, new Date('2026-08-07'));
    expect(queue.records).toHaveLength(0);
    expect(queue.counts).toMatchObject({ notYetEligible: 1, deathYearUnknown: 1 });
  });

  it('validates decision status and merge target', () => {
    expect(() => validateDecisions([{ key: 'dfl:a', status: 'unknown' }], resolution.records)).toThrow();
    expect(() => validateDecisions([{ key: 'dfl:a', status: 'merge-with' }], resolution.records)).toThrow();
    expect(validateDecisions([{ key: 'dfl:a', status: 'reject', reason: 'placeholder' }], resolution.records)).toHaveLength(1);
  });
});
