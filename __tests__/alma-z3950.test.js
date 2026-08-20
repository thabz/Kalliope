import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  buildBib1Query,
  buildSearchContext,
  buildQuerySignature,
  evaluateMatch,
  extractPdfUrls,
  loadSearchProfiles,
  parseMarcXmlRecord,
  runDiscovery,
  writeMachineOutput,
} from '../tools/alma-z3950/index.js';
import { defaultOutputBase, parseArgs } from '../tools/alma-z3950/cli.js';
import {
  buildYazCommands,
  findYazFailure,
  parseYazRecords,
  runYazClient,
} from '../tools/alma-z3950/z3950-client.js';

const fixturesPath = path.join('tools', 'alma-z3950', 'fixtures');

const responseFixturePath = path.join(fixturesPath, 'pilot-marc-responses.json');
const responseFixture = JSON.parse(fs.readFileSync(responseFixturePath, 'utf8'));
const onlineSearch = async query =>
  responseFixture.entries.find(entry => entry.query?.title === query.title)?.records ?? [];

describe('Alma Z39.50 discovery, online parsing og rapportering', () => {
  it('parser CLI-argumenter for én digter eller hele korpusset', () => {
    const parsed = parseArgs([
      '--poet-id',
      'baggesen',
      '--force-reload',
    ]);
    expect(parsed.poetId).toBe('baggesen');
    expect(parsed.forceReload).toBe(true);
    expect(parseArgs(['--poet-id', 'baggesen', '-v']).verbose).toBe(true);
    expect(() => parseArgs([])).toThrow('præcis én');
    expect(() => parseArgs(['--all', '--poet-id', 'baggesen'])).toThrow('præcis én');
    expect(parseArgs(['--all']).all).toBe(true);
    expect(defaultOutputBase(parsed)).toBe('/tmp/alma-z3950-baggesen');
    expect(defaultOutputBase(parseArgs(['--all']))).toBe('/tmp/alma-z3950-all');
  });

  it('bygger PQF med dokumenteret Digitalisering + title + year + surname', () => {
    expect(buildBib1Query({
      title: 'Ungdoms Legende',
      author: 'Hans Ahlmann',
      publisher: 'Gyldendalsk Forlag',
      year: '1907',
    })).toContain('@attr 1=1016 "digitalisering"');
    expect(buildBib1Query({
      title: 'Ungdoms Legende',
      author: 'Hans Ahlmann',
      year: '1907',
    })).toContain('@attr 1=1004 "hans ahlmann"');
    expect(buildBib1Query({
      title: 'Ungdoms Legende',
      author: 'Hans Ahlmann',
      year: '1907',
    })).toContain('@attr 1=31 "1907"');
    expect(buildBib1Query({
      title: 'Ungdoms Legende',
      author: 'Hans Ahlmann',
      year: '1907',
    })).toContain('@attr 1=1003 "ungdoms legende"');
    expect(buildSearchContext({
      title: 'Ungdoms Legende',
      poetName: 'Hans Christian Andersen',
      year: '1907',
    }).pqf).toContain('@attr 1=1004 "andersen"');
  });

  it('parser MARC-xml og udleder permalinksignaler', () => {
    const firstRecord = responseFixture.entries[0].records[0];
    const parsed = parseMarcXmlRecord(firstRecord);

    expect(parsed.control001).toBe('99122806920105763');
    expect(parsed.title).toBe('Ungdoms Legende');
    expect(parsed.author).toBe('Hans Ahlmann');
    expect(parsed.isAlmaE).toBe(true);
    expect(parsed.hasOnlineSignals).toBe(true);
    expect(parsed.onlineLinks[0]).toContain('alma99122806920105763.pdf');
    expect(parsed.rawFields.rawQuerySignals.almaE).toBe(true);
    expect(parsed.rawFields.onlineLinkLabels).toContain('Link til elektronisk udgave');
    expect(parsed.onlineLinkLabels).toHaveLength(1);
    expect(extractPdfUrls(parsed.onlineLinks)).toEqual([
      'https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122806920105763.pdf',
    ]);
  });

  it('bygger en YAZ-session med KBs dokumenterede Alma-forbindelse', () => {
    const commands = buildYazCommands(
      { pqf: '@attr 1=1003 "digte"' },
      {
        host: 'kbdk-kgl.alma.exlibrisgroup.com',
        port: 1921,
        database: '45KBDK_KGL',
        maxRecords: 25,
      },
    );

    expect(commands).toContain('format xml');
    expect(commands).toContain('elements marcxml');
    expect(commands).toContain('open kbdk-kgl.alma.exlibrisgroup.com:1921/45KBDK_KGL');
    expect(commands).toContain('find @attr 1=1003 "digte"');
    expect(commands).not.toContain('show');
  });

  it('udtrækker MARCXML-poster fra YAZ-output', () => {
    const record = responseFixture.entries[0].records[0];
    const output = `Connecting...OK.\n[45KBDK_KGL]Record type: XML\n${record}\nZ>`;

    expect(parseYazRecords(output)).toEqual([record]);
  });

  it('genkender forbindelsesfejl trods YAZ-prompter på samme linje', () => {
    expect(findYazFailure('Z> Z> Z> Connecting...error = System (lower-layer) error\nZ>'))
      .toBe('error = System (lower-layer) error');
  });

  it('giver installationsvejledning når yaz-client mangler', async () => {
    await expect(runYazClient(
      { pqf: '@attr 1=1003 "digte"' },
      {
        binary: 'kalliope-test-yaz-client-findes-ikke',
        host: 'localhost',
        port: 210,
        database: 'test',
        timeoutMs: 1000,
      },
    )).rejects.toThrow('brew install yaz');
  });

  it('kræver efternavn-validering før stærkt match', () => {
    const match = evaluateMatch(
      {
        poetName: 'Hans Ahlmann',
        title: '',
      },
      {
        control001: '99122806920105763',
        title: 'Ungdoms Legende',
        publicationYear: '1907',
        publisher: 'Gyldendalsk Forlag',
        description: 'Digitalisering 1907',
        isAlmaE: true,
        hasOnlineSignals: true,
        onlineLinks: ['https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122806920105763.pdf'],
        rawFields: {},
      },
    );

    expect(match.status).toBe('no-match');
    expect(match.confidence).toBe('none');
    expect(match.evidence).toContain('title-missing');
  });

  it('mærker forfattersøgning med efternavnskonflikt', () => {
    const match = evaluateMatch(
      {
        poetName: 'Hans Ahlmann',
        title: 'Ungdoms Legende',
      },
      {
        control001: '99122806920105763',
        title: 'Ungdoms Legende',
        publicationYear: '1907',
        publisher: 'Gyldendalsk Forlag',
        description: 'Digitalisering 2017 af udgaven: Ungdoms Legende, 1907, Gyldendalsk Forlag.',
        author: 'Niels Andersen',
        isAlmaE: true,
        hasOnlineSignals: true,
        onlineLinks: ['https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122806920105763.pdf'],
        onlineLinkLabels: ['Link til elektronisk udgave'],
        rawFields: {},
      },
    );

    expect(match.status).toBe('needs-review');
    expect(match.confidence).toBe('medium');
    expect(match.evidence).toContain('author-surname-conflict');
    expect(match.verification.status).toBe('verified');
  });

  it('kræver online-verifikation før strong-match', () => {
    const recordMatchNoVerify = evaluateMatch(
      {
        poetName: 'Hans Ahlmann',
        title: 'Ungdoms Legende',
      },
      {
        control001: '99122806920105763',
        title: 'Ungdoms Legende',
        publicationYear: '1907',
        publisher: 'Gyldendalsk Forlag',
        description: 'Digitalisering 2017 af udgaven: Ungdoms Legende, 1907, Gyldendalsk Forlag.',
        author: 'Hans Ahlmann',
        isAlmaE: true,
        hasOnlineSignals: false,
        onlineLinks: [],
        onlineLinkLabels: ['Link til elektronisk udgave'],
        rawFields: {},
      },
    );
    expect(recordMatchNoVerify.status).not.toBe('strong-match');
    expect(recordMatchNoVerify.verification.status).toBe('needs-review');
  });

  it('bygger søgeprofiler direkte fra korpussets poet- og værkfiler', async () => {
    const profiles = await loadSearchProfiles({ poetId: 'baggesen' });

    expect(profiles.length).toBeGreaterThan(0);
    expect(profiles.every(profile => profile.poetId === 'baggesen')).toBe(true);
    expect(profiles).toEqual(expect.arrayContaining([
      expect.objectContaining({
        poetName: 'Jens Baggesen',
        title: 'Comiske Fortællinger',
        year: '1785',
        workId: 'baggesen/1785',
      }),
    ]));
  });

  it('kører korpusprofiler via online-søgeadapteren', async () => {
    const profiles = [
      { poetId: 'ahlmann', poetName: 'Hans Ahlmann', workId: 'ahlmann/ungdoms-legende', workUrl: '', title: 'Ungdoms Legende', year: '1907', publisher: '' },
      { poetId: 'ingemann', poetName: 'Bernhard Severin Ingemann', workId: 'ingemann/flyvende-sommer', workUrl: '', title: 'Flyvende Sommer', year: '1867', publisher: '' },
      { poetId: 'winther', poetName: 'Christian Winther', workId: 'winther/1828', workUrl: '', title: 'Digte', year: '1828', publisher: '' },
    ];

    const result = await runDiscovery({
      profiles,
      z3950Search: onlineSearch,
      cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-alma-cache-')),
      forceReload: true,
    });

    expect(result.summary.totalProfiles).toBe(3);
    expect(result.summary.strongMatches).toBe(3);
    expect(result.discoveries[0].best?.queryHit?.facsimileId).toContain('alma');
    expect(result.discoveries[0].best?.queryHit?.permalink).toContain('1o797oc');
  });

  it('bevarer output når en enkelt online-søgning fejler', async () => {
    const profiles = [{ poetId: 'baggesen', poetName: 'Jens Baggesen', workId: 'baggesen/1785', workUrl: '', title: 'Comiske Fortællinger', year: '1785', publisher: '' }];
    const result = await runDiscovery({
      profiles,
      z3950Search: async () => {
        const error = new Error('YAZ-søgningen timede ud efter 30000 ms.');
        error.code = 'ETIMEDOUT';
        throw error;
      },
      cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-alma-cache-')),
      forceReload: true,
    });

    expect(result.summary.errors).toBe(1);
    expect(result.discoveries[0].error).toEqual({
      message: 'YAZ-søgningen timede ud efter 30000 ms.',
      code: 'ETIMEDOUT',
    });
    expect(result.discoveries[0].best).toBeNull();
  });

  it('sparer maskinoutput med kandidatproveniens', async () => {
    const tempdir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-alma-z3950-'));
    const machinePath = path.join(tempdir, 'output.ndjson');
    const profiles = [{ poetId: 'ahlmann', poetName: 'Hans Ahlmann', workId: 'ahlmann/ungdoms-legende', workUrl: '', title: 'Ungdoms Legende', year: '1907', publisher: '' }];
    const discovery = await runDiscovery({
      profiles,
      z3950Search: onlineSearch,
      cacheDir: tempdir,
      forceReload: true,
    });
    await writeMachineOutput(machinePath, discovery);
    const ndjson = fs
      .readFileSync(machinePath, 'utf8')
      .trim()
      .split('\n')
      .filter(line => line !== '')
      .map(line => JSON.parse(line));

    expect(ndjson).toHaveLength(1);
    expect(ndjson[0].poetId).toBe('ahlmann');
    expect(ndjson[0]).toHaveProperty('work.id', 'ahlmann/ungdoms-legende');
    expect(ndjson[0]).toHaveProperty('candidates');
    expect(ndjson[0].candidates).toHaveLength(1);
    expect(ndjson[0].candidates[0]).toHaveProperty('provenance.rawFields.control001');
    expect(ndjson[0].candidates[0]).toHaveProperty('provenance.rawFields.rawQuerySignals.almaE');
    expect(ndjson[0].candidates[0]).toHaveProperty('verification.status');
    expect(ndjson[0].candidates[0]).toHaveProperty('verification.reason');
    expect(ndjson[0].candidates[0]).toHaveProperty('pdfUrls.0', 'https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122806920105763.pdf');
    expect(buildQuerySignature({ title: 'Digte', author: 'Christian Winther' })).toHaveLength(40);
  });

});
