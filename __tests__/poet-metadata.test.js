jest.mock('../tools/libs/caching.js', () => ({
  isFileModified: () => false,
  loadCachedJSON: () => null,
  writeCachedJSON: jest.fn(),
  force_reload: false,
}));

jest.mock('../tools/libs/helpers.js', () => ({
  fileExists: jest.fn(() => false),
  safeMkdir: () => {},
  writeJSON: jest.fn(),
  resizeImage: () => {},
}));

jest.mock('../tools/build-static/xml.js', () => ({
  loadXMLDoc: () => null,
  safeGetText: () => null,
  safeGetAttr: () => null,
  getChildByTagName: () => null,
  getElementsByTagName: () => [],
}));

import { writeCachedJSON } from '../tools/libs/caching.js';
import { fileExists, writeJSON } from '../tools/libs/helpers.js';
import { build_poets_json } from '../tools/build-static/poets.js';

describe('beregnede digtermetadata', () => {
  beforeEach(() => {
    fileExists.mockReturnValue(false);
    writeCachedJSON.mockClear();
    writeJSON.mockClear();
  });

  it('markerer digteren dirty, når has_mentions ændres til false', () => {
    const horn = { id: 'horn', has_mentions: true };
    const collected = {
      poets: new Map([['horn', horn]]),
      person_or_keyword_refs: new Map(),
    };

    const dirtyPoetIds = build_poets_json(collected);

    expect(dirtyPoetIds).toEqual(new Set(['horn']));
    expect(horn.has_mentions).toBe(false);
    expect(writeJSON).toHaveBeenCalledWith('public/api/horn.json', horn);
    expect(writeCachedJSON).toHaveBeenCalledWith(
      'collected.poets',
      Array.from(collected.poets)
    );
  });

  it('markerer digteren dirty, når has_mentions ændres til true', () => {
    const horn = { id: 'horn', has_mentions: false };
    const collected = {
      poets: new Map([['horn', horn]]),
      person_or_keyword_refs: new Map([
        ['horn', { mention: ['anden2026071901'], translation: [] }],
      ]),
    };

    const dirtyPoetIds = build_poets_json(collected);

    expect(dirtyPoetIds).toEqual(new Set(['horn']));
    expect(horn.has_mentions).toBe(true);
  });

  it('skriver ikke metadata igen, når has_mentions er uændret', () => {
    const horn = { id: 'horn', has_mentions: false };
    const collected = {
      poets: new Map([['horn', horn]]),
      person_or_keyword_refs: new Map(),
    };

    const dirtyPoetIds = build_poets_json(collected);

    expect(dirtyPoetIds).toEqual(new Set());
    expect(writeJSON).not.toHaveBeenCalled();
    expect(writeCachedJSON).not.toHaveBeenCalled();
  });
});
