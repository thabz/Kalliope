jest.mock('../tools/libs/caching.js', () => ({
  isFileModified: jest.fn(() => false),
  loadCachedJSON: jest.fn(),
  writeCachedJSON: jest.fn(),
  force_reload: false,
}));
jest.mock('../tools/libs/helpers.js', () => ({
  fileExists: () => false,
  loadText: jest.fn(),
  fileModifiedTime: () => null,
  safeMkdir: () => {},
  writeJSON: () => {},
  resizeImage: () => {},
}));
jest.mock('../tools/build-static/literary-periods.js', () => ({
  catalogFilename: 'catalog.json',
  literaryPeriods: { idMap: new Map() },
}));
jest.mock('fs', () => ({
  readdirSync: () => ['poet'],
  existsSync: () => true,
}));

import { loadCachedJSON, writeCachedJSON } from '../tools/libs/caching.js';
import { loadText } from '../tools/libs/helpers.js';
import { build_poets_first_pass } from '../tools/build-static/poets.js';

describe('poet metadata after automatic work discovery', () => {
  const info = '<person id="poet" country="dk" lang="da" type="poet"><name><lastname>Test</lastname></name></person>';
  beforeEach(() => {
    writeCachedJSON.mockClear();
    loadCachedJSON.mockReturnValue([['poet', { id: 'poet', has_poems: false, has_works: false }]]);
    loadText.mockImplementation(filename => filename.endsWith('info.xml') ? info : '<kalliopework><poetry>Vers</poetry></kalliopework>');
  });

  it('recomputes flags for new works without an info.xml edit and preserves the registry', () => {
    const workids = new Map([['poet', ['new']]]);
    const poets = build_poets_first_pass({ workids, changedWorkPoetIds: new Set(['poet']) });
    expect(poets.get('poet')).toMatchObject({ has_works: true, has_poems: true, has_texts: true });
    expect(workids.get('poet')).toEqual(['new']);
    expect(writeCachedJSON).toHaveBeenCalled();
  });

  it('clears content flags after the last work is deleted', () => {
    loadCachedJSON.mockReturnValue([['poet', { id: 'poet', has_poems: true, has_works: true }]]);
    const poets = build_poets_first_pass({ workids: new Map([['poet', []]]), changedWorkPoetIds: new Set(['poet']) });
    expect(poets.get('poet')).toMatchObject({ has_works: false, has_poems: false, has_texts: false });
  });

  it('keeps cached metadata when both files and work membership are unchanged', () => {
    build_poets_first_pass({ workids: new Map([['poet', []]]), changedWorkPoetIds: new Set() });
    expect(writeCachedJSON).not.toHaveBeenCalled();
  });
});
