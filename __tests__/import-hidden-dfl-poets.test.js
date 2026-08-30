import {
  decodeHtml,
  importableRecords,
  planHiddenDflSync,
  poetIdForDflId,
  renderInfoXml,
  renderWorkXml,
  workIdForDflRecord,
  workRecordsByDflId,
} from '../tools/import-hidden-dfl-poets.js';

describe('import af skjulte DFL-digtere', () => {
  it('danner stabile id-er og afkoder DFL-navne', () => {
    expect(poetIdForDflId('JJohannesJoergensen')).toBe('dfl-jjohannesjoergensen');
    expect(decodeHtml('J&oslash;rgen J&aelig;ger')).toBe('Jørgen Jæger');
    expect(decodeHtml('&yacute; &agrave; &uacute; &THORN;')).toBe('ý à ú Þ');
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
      {
        sourceId: 'JFrankJaeger',
        names: ['Frank J&aelig;ger'],
        page: { birthYear: '1926', deathYear: '1977' },
      },
      'dfl-jfrankjaeger'
    );
    expect(xml).toContain('hidden="true"');
    expect(xml).toContain('country="un" lang="da"');
    expect(xml).toContain('<fullname>Frank Jæger</fullname>');
    expect(xml).toContain('<date>1926</date>');
    expect(xml).toContain('<date>1977</date>');
    expect(xml).toContain(
      '<danskforfatterleksikon-dk>JFrankJaeger</danskforfatterleksikon-dk>'
    );
  });

  it('danner tomme, stabile DFL-værker med bibliografisk metadata', () => {
    const work = {
      sourceId: 'sk1850titd:123',
      sourceUrl: 'https://danskforfatterleksikon.dk/1850/sk1850titd.htm',
      title: 'Danske Digte &amp; Sange',
      year: '1901-02',
    };
    expect(workIdForDflRecord(work)).toBe('dfl-sk1850titd-123');
    expect(renderWorkXml(work, 'dfl-test')).toContain('status="incomplete"');
    expect(renderWorkXml(work, 'dfl-test')).toContain('<title>Danske Digte &amp; Sange</title>');
    expect(renderWorkXml(work, 'dfl-test')).toContain('<year>1901-02</year>');
    expect(renderWorkXml(work, 'dfl-test')).not.toContain('<workbody>');
  });

  it('deduplikerer samme DFL-værkrelation for en person', () => {
    const work = {
      sourceId: 'same-work',
      authors: [{ sourceId: 'person' }, { sourceId: 'person' }],
    };
    expect(workRecordsByDflId([work]).get('person')).toEqual([work]);
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
