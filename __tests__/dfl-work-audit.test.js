import { auditWorks, normalizeWorkValue, workKey } from '../tools/dfl-work-audit.js';

describe('DFL work audit', () => {
  const matched = { status: 'already-in-kalliope', kalliopeId: 'andersen' };

  it('builds a stable key from author, title and year', () => {
    expect(workKey({ title: '  Babylon, marcherer ', year: '1970', authors: [{ sourceId: 'knudsen' }] })).toBe('dfl:knudsen|babylon marcherer|1970');
    expect(normalizeWorkValue('H.C. Andersen')).toBe('h c andersen');
  });

  it('does not collapse different editions and marks repeated keys', () => {
    const audit = auditWorks([
      { title: 'Digte', year: '1900', authors: [{ sourceId: 'x', name: 'X', match: matched }], sourceUrl: 'one' },
      { title: 'Digte', year: '1900', authors: [{ sourceId: 'x', name: 'X', match: matched }], sourceUrl: 'two' },
      { title: 'Digte', year: '1901', authors: [{ sourceId: 'x', name: 'X', match: matched }], sourceUrl: 'three' },
    ]);
    expect(audit.counts.raw).toBe(3);
    expect(audit.counts.uniqueKeys).toBe(2);
    expect(audit.records.filter(record => record.duplicateStatus === 'possible-duplicate')).toHaveLength(2);
  });

  it('sends missing and uncertain authors to audit review', () => {
    const audit = auditWorks([
      { title: 'Ukendt', year: '1970', authors: [] },
      { title: 'Usikker', year: '1970', authors: [{ name: 'Samme navn', match: { status: 'needs-review' } }] },
    ]);
    expect(audit.counts.missingAuthors).toBe(1);
    expect(audit.counts.manualReview).toBe(1);
  });
});
