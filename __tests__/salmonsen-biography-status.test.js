import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  buildReport,
  loadPoets,
  parseArgs,
  validateStatus,
} from '../tools/report-salmonsen-biographies.js';

const makePerson = ({ id, country = 'us', type = 'poet', name = id }) => `\
<?xml version="1.0" encoding="UTF-8"?>
<person id="${id}" country="${country}" lang="en" type="${type}">
  <name><firstname>${name}</firstname></name>
</person>
`;

const makeStatus = entries => ({
  version: 1,
  entries: entries.map(poetId => ({
    poet_id: poetId,
    status: 'not_found',
    editions_checked: [2, 4],
    checked_on: '2026-07-29',
    note: 'Intet relevant opslag fundet.',
  })),
});

describe('Salmonsen-biografistatus', () => {
  let rootDir;

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-salmonsen-'));
    fs.mkdirSync(path.join(rootDir, 'fdirs'));
  });

  afterEach(() => {
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  const addPerson = (id, options = {}) => {
    const directory = path.join(rootDir, 'fdirs', id);
    fs.mkdirSync(directory);
    fs.writeFileSync(
      path.join(directory, 'info.xml'),
      makePerson({ id, ...options })
    );
    if (options.hasBiography === true) {
      fs.writeFileSync(path.join(directory, 'bio.xml'), '<bio><body/></bio>');
    }
  };

  it('adskiller færdige, negative og resterende udenlandske digtere', () => {
    addPerson('complete', { hasBiography: true });
    addPerson('danish', { country: 'dk' });
    addPerson('editor', { type: 'editor' });
    addPerson('negative');
    addPerson('pending', { country: 'un' });

    const poets = loadPoets(rootDir);
    const report = buildReport({
      poets,
      status: makeStatus(['negative']),
    });

    expect(report.withBiography.map(poet => poet.id)).toEqual(['complete']);
    expect(report.notFound.map(poet => poet.id)).toEqual(['negative']);
    expect(report.pending.map(poet => poet.id)).toEqual(['pending']);
  });

  it('afviser ukendte digter-id’er', () => {
    addPerson('known');
    const poets = loadPoets(rootDir);

    expect(() => validateStatus(makeStatus(['unknown']), poets)).toThrow(
      'Ukendt digter-id'
    );
  });

  it('afviser et negativt fund, når bio.xml senere oprettes', () => {
    addPerson('found', { hasBiography: true });
    const poets = loadPoets(rootDir);

    expect(() => validateStatus(makeStatus(['found']), poets)).toThrow(
      'har nu bio.xml'
    );
  });

  it('afviser dubletter og usorterede poster', () => {
    addPerson('alpha');
    addPerson('beta');
    const poets = loadPoets(rootDir);

    expect(() =>
      validateStatus(makeStatus(['alpha', 'alpha']), poets)
    ).toThrow('dublet');
    expect(() =>
      validateStatus(makeStatus(['beta', 'alpha']), poets)
    ).toThrow('sorteret');
  });

  it('kræver negativ status og kontrol af begge udgaver', () => {
    addPerson('candidate');
    const poets = loadPoets(rootDir);
    const invalidStatus = makeStatus(['candidate']);
    invalidStatus.entries[0].status = 'pending';
    const missingEdition = makeStatus(['candidate']);
    missingEdition.entries[0].editions_checked = [2];

    expect(() => validateStatus(invalidStatus, poets)).toThrow(
      'Ugyldig Salmonsen-status'
    );
    expect(() => validateStatus(missingEdition, poets)).toThrow(
      '2. og 4. udgave'
    );
  });

  it('fortolker rapportargumenterne', () => {
    expect(parseArgs([])).toEqual({ command: 'report' });
    expect(parseArgs(['--check'])).toEqual({ command: 'check' });
    expect(parseArgs(['--next', '12'])).toEqual({
      command: 'next',
      count: 12,
    });
    expect(() => parseArgs(['--next', '0'])).toThrow('Ugyldige argumenter');
  });
});

describe('repositoryets Salmonsen-status', () => {
  it('registrerer de kendte negative fund og udelukker dem fra næste bølge', () => {
    const expectedPoetIds = [
      'abbott',
      'abschatz',
      'aquino',
      'bates',
      'bayly',
      'blackwood',
      'brenner',
      'brooks',
      'browne',
      'callanan',
      'channing',
      'coupigny',
      'daumer',
      'downing',
      'drayton',
      'dyer',
      'emmett',
      'eschenburg',
      'freneau',
      'gilfillan',
      'goetzn',
      'gubitz',
      'hervey',
      'hoffman',
      'hopkins',
      'hornc',
      'hougen',
      'housman',
      'jerningham',
      'kletke',
      'lautreamont',
      'lawrence',
      'logan',
      'macfie',
      'marino',
      'meyer',
      'mickle',
      'morris',
      'nervander',
      'nouveau',
      'nygard',
      'opie',
      'overbeck',
      'pabodie',
      'parini',
      'parnell',
      'patmore',
      'percival',
      'perk',
      'pinkney',
      'prentice',
      'rossettic',
      'runius',
      'schiebeler',
      'schoenaich',
      'scollard',
      'sears',
      'segni',
      'sigourney',
      'solstad',
      'spegel',
      'sprague',
      'stenhammar',
      'swain',
      'todi',
      'valle',
      'vierordt',
      'white',
      'wilderh',
      'wolfe',
      'wotton',
    ];
    const rootDir = process.cwd();
    const status = JSON.parse(
      fs.readFileSync(
        path.join(
          rootDir,
          'tools/data/salmonsen-biography-status.json'
        ),
        'utf8'
      )
    );
    const poets = loadPoets(rootDir);
    const report = buildReport({ poets, status });

    expect(status.entries.map(entry => entry.poet_id)).toEqual(
      expectedPoetIds
    );
    expect(report.pending.map(poet => poet.id)).toEqual(
      expect.not.arrayContaining(expectedPoetIds)
    );
  });
});
