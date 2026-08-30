import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  allocateCandidateId,
  buildRecords,
  jsonl,
  mergeNonEmpty,
  parseDflTitles,
  readJsonl,
  selectPoetryRelations,
  syncLiteraryRegisters,
} from '../tools/sync-literary-registers.js';

const makeWorkspace = () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-upcoming-'));
  const root = path.join(directory, 'root');
  const rawDir = path.join(directory, 'raw');
  fs.mkdirSync(path.join(root, 'fdirs'), { recursive: true });
  fs.mkdirSync(path.join(rawDir, 'author-index'), { recursive: true });
  fs.mkdirSync(path.join(rawDir, 'authors'), { recursive: true });
  return { directory, root, rawDir };
};

const addKalliopePoet = ({ root, poetId, dflId, works = [] }) => {
  const directory = path.join(root, 'fdirs', poetId);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'info.xml'), `<?xml version="1.0"?><person id="${poetId}"><identifiers><danskforfatterleksikon-dk>${dflId}</danskforfatterleksikon-dk></identifiers></person>`);
  works.forEach(work => fs.writeFileSync(path.join(directory, `${work.id}.xml`), `<?xml version="1.0"?><kalliopework id="${work.id}" author="${poetId}"><workhead><title>${work.title}</title><year>${work.year}</year></workhead></kalliopework>`));
};

describe('dækningsregister-sync', () => {
  test('vælger danske digtere og oversættere af udenlandske digte', () => {
    const works = [
      { type: 'digte', language: 'dansk', authors: [{ role: 'author', name: 'A' }, { role: 'translator', name: 'B' }] },
      { type: 'digte', language: 'svensk', authors: [{ role: 'author', name: 'C' }, { role: 'translator', name: 'D' }] },
      { type: 'roman', language: 'dansk', authors: [{ role: 'author', name: 'E' }] },
    ];

    expect(selectPoetryRelations(works).map(work => work.authors.map(author => author.name))).toEqual([['A'], ['D']]);
  });

  test('parser DFL-links og afkoder HTML-entiteter', () => {
    const html = '<p><a id="titelnr123"></a>S&ouml;lv, (1920, digte, dansk)</p><p>af <a href="../1850bib/ASoelv.htm">A. S&ouml;lv</a></p>';
    const [work] = parseDflTitles(html, 'https://danskforfatterleksikon.dk/1850/sk1850tits.htm');

    expect(work.title).toBe('Sölv');
    expect(work.sourceId).toBe('titelnr123');
    expect(work.authors[0]).toMatchObject({ name: 'A. Sölv', sourceId: 'ASoelv', role: 'author' });
  });

  test('danner stabile, kildeneutrale id-er ved navnekollisioner', () => {
    const used = new Set();

    expect(allocateCandidateId('Jens Jensen', '1901', 'JJensJensen1', used)).toBe('jens-jensen');
    expect(allocateCandidateId('Jens Jensen', '1902', 'JJensJensen2', used)).toBe('jens-jensen-1902');
    expect([...used].every(id => id.startsWith('dfl-') === false)).toBe(true);
  });

  test('opretter ikke en personpost for en anonym placeholder', () => {
    const { directory, root, rawDir } = makeWorkspace();
    const dflWorks = [{
      sourceId: 'sk1850tita:1',
      sourceUrl: 'https://example.test/a',
      title: 'Oversat digt',
      year: '1900',
      type: 'digte',
      language: 'tysk',
      originalValue: 'Oversat digt, (1900, digte, tysk)',
      authors: [{ role: 'translator', name: 'anonym tysk', sourceId: 'u1' }],
    }];

    const result = buildRecords({ existingPoets: [], existingWorks: [], dflWorks, root, rawDir });

    expect(result).toEqual({ poets: [], works: [] });
    fs.rmSync(directory, { recursive: true });
  });

  test('bevarer redaktionelle værdier og poster, som ikke længere findes i DFL-inputtet', () => {
    const { directory, root, rawDir } = makeWorkspace();
    fs.writeFileSync(path.join(rawDir, 'author-index', 'a.htm'), '<div class="authorelement"><a href="../1850bib/AAnna.htm">Anna</a></div>');
    fs.writeFileSync(path.join(rawDir, 'authors', 'AAnna.html'), '<h2><b>Anna Andersen</b> (1900-1980)</h2>');
    const existingPoets = [{
      id: 'anna',
      status: 'in-progress',
      editorial_note: 'bevar mig',
      name: { preferred: 'Anna A.' },
      life: { born: { date: '1900-01-02' } },
      identifiers: { 'danskforfatterleksikon-dk': 'AAnna', wikidata: 'Q1' },
      sources: [{ source: 'danskforfatterleksikon', id: 'AAnna' }],
    }, {
      id: 'bevar-mig',
      status: 'candidate',
      name: { preferred: 'Bevar Mig' },
      identifiers: { 'danskforfatterleksikon-dk': 'BBevar' },
      sources: [{ source: 'danskforfatterleksikon', id: 'BBevar' }],
    }];
    const dflWorks = [{
      sourceId: 'sk1850tita:1',
      sourceUrl: 'https://example.test/a',
      title: 'Nye digte',
      year: '1920',
      type: 'digte',
      language: 'dansk',
      originalValue: 'Nye digte, (1920, digte, dansk)',
      authors: [{ role: 'author', name: 'Anna Andersen', sourceId: 'AAnna' }],
    }];
    const existingWorks = [{
      id: 'gammelt-vaerk',
      poet_ids: ['anna'],
      title: 'Gammelt værk',
      sources: [{ source: 'manuel', id: '1' }],
    }];

    const result = buildRecords({ existingPoets, existingWorks, dflWorks, root, rawDir });
    const anna = result.poets.find(poet => poet.id === 'anna');

    expect(anna).toMatchObject({
      status: 'in-progress',
      editorial_note: 'bevar mig',
      name: { preferred: 'Anna A.' },
      life: { born: { date: '1900-01-02' } },
      identifiers: { wikidata: 'Q1' },
    });
    expect(anna.work_ids).toBeUndefined();
    expect(result.works.find(work => work.id === 'nye-digte-1920')).toMatchObject({
      poet_ids: ['anna'],
      status: 'candidate',
    });
    expect(result.poets.some(poet => poet.id === 'bevar-mig')).toBe(true);
    fs.rmSync(directory, { recursive: true });
  });

  test('serialiserer deterministisk og ignorerer en enkelt ugyldig JSONL-linje', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-jsonl-'));
    const file = path.join(directory, 'records.jsonl');
    fs.writeFileSync(file, '{"id":"b"}\nugyldig\n{"id":"a","name":"S&ouml;lv"}\n');
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const records = readJsonl(file);

    expect(records).toEqual([{ id: 'b' }, { id: 'a', name: 'Sölv' }]);
    expect(jsonl(records)).toBe('{"id":"a","name":"Sölv"}\n{"id":"b"}\n');
    expect(warning).toHaveBeenCalledTimes(1);
    warning.mockRestore();
    fs.rmSync(directory, { recursive: true });
  });

  test('tom DFL-værdi erstatter ikke en eksisterende værdi', () => {
    expect(mergeNonEmpty({ preferred: 'Navn', note: 'manuel' }, { preferred: '', note: null })).toEqual({ preferred: 'Navn', note: 'manuel' });
  });

  test('en manglende lokal cache gør offline-sync til en sikker no-op', async () => {
    const { directory, root, rawDir } = makeWorkspace();
    const poetsFile = path.join(directory, 'poets.jsonl');
    const worksFile = path.join(directory, 'works.jsonl');
    fs.writeFileSync(poetsFile, '{"id":"anna","identifiers":{"danskforfatterleksikon-dk":"AAnna"},"name":{"preferred":"Anna"},"sources":[{"id":"AAnna","source":"danskforfatterleksikon"}],"status":"candidate"}\n');
    fs.writeFileSync(worksFile, '{"id":"digte-1900","poet_ids":["anna"],"sources":[{"id":"titelnr1","source":"danskforfatterleksikon"}],"status":"candidate","title":"Digte","year":"1900"}\n');

    const result = await syncLiteraryRegisters({ root, rawDir, poetsFile, worksFile });

    expect(result).toMatchObject({ poets: 1, works: 1, newPoets: 0, newWorks: 0 });
    expect(readJsonl(poetsFile)[0].id).toBe('anna');
    expect(readJsonl(worksFile)[0].id).toBe('digte-1900');
    fs.rmSync(directory, { recursive: true });
  });

  test('medtager en eksisterende Kalliope-digter og markerer et entydigt værk som inkluderet', () => {
    const { directory, root, rawDir } = makeWorkspace();
    fs.writeFileSync(path.join(rawDir, 'author-index', 'a.htm'), '<div class="authorelement"><a href="../1850bib/AAnna.htm">Anna</a></div>');
    addKalliopePoet({
      root,
      poetId: 'andersenanna',
      dflId: 'AAnna',
      works: [{ id: '1900', title: 'Digte.', year: '1900' }],
    });
    const dflWorks = [{
      sourceId: 'titelnr1',
      sourceUrl: 'https://example.test/a',
      title: 'Digte',
      year: '1900',
      type: 'digte',
      language: 'dansk',
      originalValue: 'Digte, (1900, digte, dansk)',
      authors: [{ role: 'author', name: 'Anna Andersen', sourceId: 'AAnna' }],
    }];

    const result = buildRecords({ existingPoets: [], existingWorks: [], dflWorks, root, rawDir });

    expect(result.poets).toEqual([expect.objectContaining({
      id: 'andersenanna',
      status: 'included',
      kalliope: { id: 'andersenanna' },
    })]);
    expect(result.poets[0].work_ids).toBeUndefined();
    expect(result.works).toEqual([expect.objectContaining({
      status: 'included',
      kalliope: { poet_id: 'andersenanna', work_id: '1900' },
    })]);
    fs.rmSync(directory, { recursive: true });
  });

  test('bevarer et tvetydigt titel- og årsmatch som kandidat', () => {
    const { directory, root, rawDir } = makeWorkspace();
    fs.writeFileSync(path.join(rawDir, 'author-index', 'a.htm'), '<div class="authorelement"><a href="../1850bib/AAnna.htm">Anna</a></div>');
    addKalliopePoet({
      root,
      poetId: 'andersenanna',
      dflId: 'AAnna',
      works: [
        { id: '1900a', title: 'Digte', year: '1900' },
        { id: '1900b', title: 'Digte', year: '1900' },
      ],
    });
    const dflWorks = [{
      sourceId: 'titelnr1',
      sourceUrl: 'https://example.test/a',
      title: 'Digte',
      year: '1900',
      type: 'digte',
      language: 'dansk',
      originalValue: 'Digte, (1900, digte, dansk)',
      authors: [{ role: 'author', name: 'Anna Andersen', sourceId: 'AAnna' }],
    }];

    const result = buildRecords({ existingPoets: [], existingWorks: [], dflWorks, root, rawDir });

    expect(result.works[0]).toMatchObject({ status: 'candidate' });
    expect(result.works[0].kalliope).toBeUndefined();
    fs.rmSync(directory, { recursive: true });
  });
});
