import {
  decodeHtml,
  importableRecords,
  planHiddenDflSync,
  poetIdForDflId,
  renderInfoXml,
} from '../tools/import-hidden-dfl-poets.js';

describe('import af skjulte DFL-digtere', () => {
  it('danner stabile id-er og afkoder DFL-navne', () => {
    expect(poetIdForDflId('JJohannesJoergensen')).toBe('dfl-jjohannesjoergensen');
    expect(decodeHtml('J&oslash;rgen J&aelig;ger')).toBe('Jørgen Jæger');
  });

  it('udelader eksisterende match og ikke-personer', () => {
    const records = [
      { sourceId: 'new', eligibility: { status: 'eligible' }, resolution: { status: 'needs-review' }, page: {} },
      { sourceId: 'known', eligibility: { status: 'eligible' }, resolution: { status: 'needs-review' }, page: {} },
      { sourceId: 'foreign', eligibility: { status: 'not-danish-language' }, resolution: { status: 'needs-review' }, page: {} },
      { sourceId: 'role', eligibility: { status: 'eligible' }, resolution: { status: 'not-a-person' }, page: {} },
      { sourceId: null, eligibility: { status: 'eligible' }, resolution: { status: 'unresolved' }, page: {} },
    ];
    expect(
      importableRecords(records, new Set(['known'])).map(record => record.sourceId)
    ).toEqual(['new']);
  });

  it('skriver hidden og kilde-id i metadata', () => {
    const xml = renderInfoXml(
      { sourceId: 'JFrankJaeger', names: ['Frank J&aelig;ger'] },
      'dfl-jfrankjaeger'
    );
    expect(xml).toContain('hidden="true"');
    expect(xml).toContain('country="un" lang="da"');
    expect(xml).toContain('<fullname>Frank Jæger</fullname>');
    expect(xml).toContain(
      '<danskforfatterleksikon-dk>JFrankJaeger</danskforfatterleksikon-dk>'
    );
  });

  it('fjerner en genereret dublet, når en redaktionel person har samme DFL-id', () => {
    const records = [{
      sourceId: 'same',
      eligibility: { status: 'eligible' },
      resolution: { status: 'certain' },
      page: {},
    }];
    const generated = {
      dflId: 'same',
      generated: true,
      hidden: true,
    };
    const editorial = {
      dflId: 'same',
      generated: false,
      hidden: false,
    };

    const plan = planHiddenDflSync(records, [generated, editorial]);

    expect(plan.desiredRecords).toEqual([]);
    expect(plan.recordsToCreate).toEqual([]);
    expect(plan.peopleToRemove).toEqual([generated]);
  });
});
