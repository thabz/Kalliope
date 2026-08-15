import crypto from 'crypto';

const filename = 'fdirs/poet/work.xml';

const sha1 = data => {
  const shasum = crypto.createHash('sha1');
  shasum.update(data);
  return shasum.digest('hex');
};

const loadCaching = async (fileContent, fileMtime, cachedContent, cachedMtime) => {
  jest.resetModules();

  const files = new Map([[filename, { content: fileContent, mtime: fileMtime }]]);
  const writes = [];
  const cache = {
    [filename]: {
      sha: sha1(cachedContent),
      mtime: cachedMtime,
    },
  };

  jest.doMock('../tools/libs/helpers.js', () => ({
    loadJSON: path => (path === './caches/files-sha.json' ? cache : null),
    loadFile: path => files.get(path)?.content ?? null,
    writeJSON: (path, data) => writes.push({ path, data }),
    safeMkdir: jest.fn(),
    fileExists: path => files.has(path),
    fileModifiedTime: path => files.get(path).mtime,
  }));

  return {
    caching: await import('../tools/libs/caching.js'),
    writes,
  };
};

describe('caching', () => {
  test('treats mtime-only changes as unmodified content', async () => {
    const { caching, writes } = await loadCaching('same', 200, 'same', 100);

    const firstConsumerSeesModified = caching.isFileModified(filename);
    const nextConsumerSeesModified = caching.isFileModified(filename);

    expect(firstConsumerSeesModified).toBe(false);
    expect(nextConsumerSeesModified).toBe(false);

    caching.refreshFilesModifiedCache();

    expect(writes[0].data[filename]).toEqual({
      sha: sha1('same'),
      mtime: 200,
    });
  });

  test('keeps content changes marked modified during the same run', async () => {
    const { caching } = await loadCaching('changed', 200, 'original', 100);

    const firstConsumerSeesModified = caching.isFileModified(filename);
    const nextConsumerSeesModified = caching.isFileModified(filename);

    expect(firstConsumerSeesModified).toBe(true);
    expect(nextConsumerSeesModified).toBe(true);
  });
});
