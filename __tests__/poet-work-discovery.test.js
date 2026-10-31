jest.mock('../tools/libs/caching.js', () => ({
  isFileModified: jest.fn(() => false),
  loadCachedJSON: jest.fn(),
  writeCachedJSON: jest.fn(),
  force_reload: false,
}));
jest.mock('../tools/libs/helpers.js', () => ({
  fileExists: jest.fn(() => false),
  loadText: jest.fn(),
  fileModifiedTime: () => null,
  safeMkdir: () => {},
  writeJSON: () => {},
  resizeImage: jest.fn(),
}));
jest.mock('../tools/build-static/literary-periods.js', () => ({
  catalogFilename: 'catalog.json',
  literaryPeriods: { idMap: new Map() },
}));
jest.mock('fs', () => ({
  readdirSync: () => ['poet'],
  existsSync: () => true,
}));

import { isFileModified, loadCachedJSON, writeCachedJSON } from '../tools/libs/caching.js';
import { fileExists, loadText, resizeImage } from '../tools/libs/helpers.js';
import { build_poets_first_pass } from '../tools/build-static/poets.js';

describe('poet metadata after automatic work discovery', () => {
  const info = '<person id="poet" country="dk" lang="da" type="poet"><name><lastname>Test</lastname></name></person>';
  beforeEach(() => {
    isFileModified.mockReset().mockReturnValue(false);
    writeCachedJSON.mockClear();
    fileExists.mockReset().mockReturnValue(false);
    resizeImage.mockReset();
    loadCachedJSON.mockReturnValue([['poet', { id: 'poet', has_poems: false, has_works: false }]]);
    loadText.mockImplementation(filename => filename.endsWith('info.xml') ? info : '<kalliopework><poetry>Vers</poetry></kalliopework>');
  });

  it('recomputes flags for new works without an info.xml edit and preserves the registry', async () => {
    const workids = new Map([['poet', ['new']]]);
    const poets = await build_poets_first_pass({ workids, changedWorkPoetIds: new Set(['poet']) });
    expect(poets.get('poet')).toMatchObject({ has_works: true, has_poems: true, has_texts: true });
    expect(workids.get('poet')).toEqual(['new']);
    expect(writeCachedJSON).toHaveBeenCalled();
  });

  it('clears content flags after the last work is deleted', async () => {
    loadCachedJSON.mockReturnValue([['poet', { id: 'poet', has_poems: true, has_works: true }]]);
    const poets = await build_poets_first_pass({ workids: new Map([['poet', []]]), changedWorkPoetIds: new Set(['poet']) });
    expect(poets.get('poet')).toMatchObject({ has_works: false, has_poems: false, has_texts: false });
  });

  it('keeps cached metadata when both files and work membership are unchanged', async () => {
    await build_poets_first_pass({ workids: new Map([['poet', []]]), changedWorkPoetIds: new Set() });
    expect(writeCachedJSON).not.toHaveBeenCalled();
  });

  it.each(['bio.xml', 'events.xml'])('refreshes the biography menu flag after %s changes', async filename => {
    loadCachedJSON.mockReturnValue([['poet', { id: 'poet', has_biography: false }]]);
    isFileModified.mockImplementation((...filenames) => filenames.includes(`fdirs/poet/${filename}`));
    const poets = await build_poets_first_pass({ workids: new Map([['poet', []]]) });
    expect(poets.get('poet').has_biography).toBe(true);
    expect(writeCachedJSON).toHaveBeenCalled();
  });

  describe('square portrait image cache', () => {
    const source = 'public/images/poet/p1-square.jpg';
    const destination = 'public/generated/images/poet/social/poet.jpg';
    const build = () => build_poets_first_pass({ workids: new Map([['poet', []]]) });

    beforeEach(() => {
      fileExists.mockImplementation(filename =>
        filename === 'fdirs/poet/portraits.xml' || filename === destination);
      loadText.mockImplementation(filename => filename.endsWith('info.xml')
        ? info
        : '<pictures><picture src="p1.jpg" square-src="p1-square.jpg"/></pictures>');
    });

    it('refreshes a changed square image with unchanged XML and original portrait', async () => {
      isFileModified.mockImplementation((...filenames) => filenames.includes(source));
      await build();
      expect(resizeImage).toHaveBeenCalledWith(source, destination, 600, { fit: 'cover', quality: 82 });
      expect(isFileModified).not.toHaveBeenCalledWith('public/images/poet/p1.jpg');
      expect(writeCachedJSON).not.toHaveBeenCalled();
    });

    it('does not resize an unchanged square image', async () => {
      await build();
      expect(resizeImage).not.toHaveBeenCalled();
    });

    it('recreates a missing generated image with unchanged inputs', async () => {
      fileExists.mockImplementation(filename => filename === 'fdirs/poet/portraits.xml');
      await build();
      expect(resizeImage).toHaveBeenCalledWith(source, destination, 600, { fit: 'cover', quality: 82 });
    });

    it('refreshes the selected square when portraits.xml changes, regardless of file age', async () => {
      isFileModified.mockImplementation((...filenames) => filenames.includes('fdirs/poet/portraits.xml'));
      await build();
      expect(resizeImage).toHaveBeenCalled();
    });

    it('waits for image generation before completing the first pass', async () => {
      isFileModified.mockImplementation((...filenames) => filenames.includes(source));
      let completeResize;
      resizeImage.mockReturnValue(new Promise(resolve => { completeResize = resolve; }));
      let finished = false;
      const result = build().then(() => { finished = true; });
      await Promise.resolve();
      expect(finished).toBe(false);
      completeResize();
      await result;
      expect(finished).toBe(true);
    });

    it('propagates resize failures instead of reporting a successful build', async () => {
      isFileModified.mockImplementation((...filenames) => filenames.includes(source));
      resizeImage.mockRejectedValue(new Error('Image generation failed'));
      await expect(build()).rejects.toThrow('Image generation failed');
    });
  });

});
