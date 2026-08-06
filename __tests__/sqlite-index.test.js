import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';

import {
  buildIncrementalSql,
  updateSqliteIndex,
} from '../tools/build-static/sqlite-index.js';

const SOURCE_STATE_FILE = path.resolve('caches/sqlite-index-sources.json');
const SQLITE_PATH = path.resolve('public/api/kalliope.sqlite');

const makeDirent = (name, isDirectory) => ({
  name,
  isDirectory: () => isDirectory,
});

const installVirtualSources = ({
  sourceFiles,
  sourceContents = {},
  sourceState,
  currentSourceState,
}) => {
  const sourceSet = new Set(sourceFiles);
  const contentXml = [];
  const contentDirs = new Set();
  const poetFiles = new Map();
  const previousState =
    sourceState == null ? {} : Object.assign({}, sourceState);
  const activeCurrentState =
    currentSourceState == null ? previousState : currentSourceState;

  sourceFiles.forEach((sourceFile) => {
    if (!sourceFile.startsWith('content/') && !sourceFile.startsWith('fdirs/')) {
      return;
    }

    const parts = sourceFile.split('/');
    if (parts[0] === 'content' && parts.length === 2) {
      contentXml.push(parts[1]);
      return;
    }

    if (parts[0] === 'content' && parts.length > 2 && parts[1]) {
      contentDirs.add(parts[1]);
      return;
    }

    if (parts[0] === 'fdirs' && parts.length === 3) {
      const poet = parts[1];
      contentDirs.add(`__fdirs:${poet}`);
      const files = poetFiles.get(poet) || [];
      files.push(parts[2]);
      poetFiles.set(poet, files);
    }
  });

  jest.spyOn(fs, 'readdirSync').mockImplementation((filename, options) => {
    if (filename === 'content') {
      if (options?.withFileTypes === true) {
        return [...contentDirs.values()]
          .filter((name) => !name.startsWith('__fdirs:'))
          .map((name) => makeDirent(name, true));
      }
      return contentXml.slice();
    }

    if (filename === 'fdirs') {
      if (options?.withFileTypes === true) {
        return [...poetFiles.keys()].map((poet) => makeDirent(poet, true));
      }
      return []; // fallback for defensive consistency
    }

    const poetMatch = /^fdirs\/(.+)$/u.exec(filename);
    if (poetMatch != null) {
      const poet = poetMatch[1];
      const files = poetFiles.get(poet) || [];
      return files.slice();
    }

    return [];
  });

  jest
    .spyOn(fs, 'lstatSync')
    .mockImplementation((filename) => {
      if (filename === 'content' || filename === 'fdirs') {
        return { isDirectory: () => true };
      }

      const parts = filename.split('/');
      if (parts[0] === 'content') {
        return { isDirectory: () => parts.length === 1 || parts.length === 2 };
      }

      if (parts[0] === 'fdirs' && parts.length === 2) {
        return { isDirectory: () => poetFiles.has(parts[1]) };
      }

      if (parts[0] === 'fdirs' && parts.length === 3) {
        return {
          isDirectory: () => false,
        };
      }

      return { isDirectory: () => false };
    });

  jest.spyOn(fs, 'existsSync').mockImplementation((filename) => {
    if (filename === SOURCE_STATE_FILE || filename === SQLITE_PATH) {
      return true;
    }

    if (sourceSet.has(filename)) {
      return true;
    }

    const parts = filename.split('/');
    if (parts[0] === 'content' && parts.length === 1) {
      return true;
    }
    if (parts[0] === 'content' && parts.length === 2 && parts[1]) {
      return (
        !parts[1].endsWith('.xml')
          ? contentDirs.has(parts[1])
          : contentXml.includes(parts[1])
      );
    }
    if (parts[0] === 'content' && parts.length > 2) {
      return contentDirs.has(parts[1]);
    }
    if (parts[0] === 'fdirs' && parts.length === 1) {
      return poetFiles.size > 0;
    }
    if (parts[0] === 'fdirs' && parts.length === 2) {
      return poetFiles.has(parts[1]);
    }
    if (parts[0] === 'fdirs' && parts.length > 2) {
      return poetFiles.has(parts[1]) && poetFiles.get(parts[1]).includes(parts[2]);
    }

    return false;
  });

  jest.spyOn(fs, 'statSync').mockImplementation((filename) => {
    if (activeCurrentState[filename] != null) {
      return { mtimeMs: activeCurrentState[filename] };
    }

    return { mtimeMs: 0 };
  });

  jest.spyOn(fs, 'readFileSync').mockImplementation((filename, ...rest) => {
    if (filename === SOURCE_STATE_FILE) {
      return JSON.stringify(previousState);
    }

    if (sourceContents[filename] != null) {
      return sourceContents[filename];
    }

    return '<xml/>';
  });

  const stateWrites = [];
  jest.spyOn(fs, 'writeFileSync').mockImplementation((filename, content) => {
    stateWrites.push({ filename, content });
  });

  return {
    stateWrites,
  };
};

describe('buildIncrementalSql', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('emits scoped SQL for work-text changes', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const collected = {
      works: new Map([
        [
          'alpha/1790',
          {
            id: '1790',
            title: 'Testværk',
          },
        ],
      ]),
      texts: new Map(),
      poets: new Map(),
      dates: new Map(),
    };

    const result = buildIncrementalSql(collected, ['fdirs/alpha/1790.xml']);

    expect(result.isIncremental).toBe(true);
    expect(result.sql).not.toMatch(/DROP TABLE/);
    expect(result.sql).toContain("DELETE FROM text WHERE work_id IN ('alpha/1790');");
    expect(result.sql).toContain("INSERT INTO work (work_id");
    expect(result.sql).toContain(
      "DELETE FROM picture WHERE source_file IN ('fdirs/alpha/1790.xml');"
    );
  });

  it('emits picture-only refresh SQL for artwork/portraits changes', () => {
    const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((filename) => {
      if (filename === 'content/artwork.xml') {
        return '<art><picture href="https://example.org/p.png"/></art>';
      }
      return '<xml/>';
    });
    jest
      .spyOn(fs, 'existsSync')
      .mockImplementation((filename) => filename === 'content/artwork.xml');

    const collected = {
      works: new Map(),
      texts: new Map(),
      poets: new Map(),
      dates: new Map(),
    };

    const result = buildIncrementalSql(collected, ['content/artwork.xml']);

    expect(result.isIncremental).toBe(true);
    expect(result.sql).toContain("DELETE FROM picture WHERE source_file IN ('content/artwork.xml');");
    expect(result.sql).toContain("INSERT INTO picture (picture_id,source_file,scope,text_id,has_href,has_objid,created_at,updated_at) VALUES ('content/artwork.xml#");
    expect(result.sql).toContain('content_artwork');
    expect(result.sql).not.toContain("DELETE FROM text WHERE");
    expect(result.sql).not.toContain('DROP TABLE');

    spy.mockRestore();
    fs.existsSync.mockRestore();
  });

  it('falls back for unsupported source files', () => {
    const result = buildIncrementalSql({ works: new Map(), texts: new Map(), poets: new Map(), dates: new Map() }, ['content/about/ignore.xml']);

    expect(result.isIncremental).toBe(false);
    expect(result.reason).toBe('unsupported-changed-files');
  });
});

describe('updateSqliteIndex', () => {
  let spawnSyncMock;

  beforeEach(() => {
    spawnSyncMock = jest
      .spyOn(childProcess, 'spawnSync')
      .mockReturnValue({ status: 0, stdout: '', stderr: '' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds incremental SQL when a picture source changes', () => {
    const sourceFiles = ['content/artwork.xml', 'fdirs/alpha/portraits.xml'];
    const sourceState = {
      'content/artwork.xml': 1234,
      'fdirs/alpha/portraits.xml': 5678,
    };
    const currentState = {
      ...sourceState,
      'fdirs/alpha/portraits.xml': 9012,
    };

    const { stateWrites } = installVirtualSources({
      sourceFiles,
      sourceContents: {
        'content/artwork.xml': '<art></art>',
        'fdirs/alpha/portraits.xml': '<art><picture href="/a"/></art>',
      },
      sourceState,
      currentSourceState: currentState,
    });

    const result = updateSqliteIndex({});

    expect(result).toBe(true);
    expect(spawnSyncMock).toHaveBeenCalledTimes(1);
    const sql = spawnSyncMock.mock.calls[0][2].input;
    expect(sql).not.toContain('DROP TABLE');
    expect(sql).toContain("DELETE FROM picture WHERE source_file IN ('fdirs/alpha/portraits.xml');");
    expect(sql).toContain("INSERT INTO picture (picture_id,source_file,scope,text_id,has_href,has_objid,created_at,updated_at)");
    expect(sql).not.toContain("DELETE FROM picture WHERE source_file IN ('content/artwork.xml');");
    expect(stateWrites).toHaveLength(1);
  });

  it('skips sqlite3 import when source files are unchanged', () => {
    const sourceFiles = ['content/artwork.xml', 'fdirs/alpha/portraits.xml'];
    const sourceState = {
      'content/artwork.xml': 1234,
      'fdirs/alpha/portraits.xml': 5678,
    };

    const { stateWrites } = installVirtualSources({
      sourceFiles,
      sourceContents: {
        'content/artwork.xml': '<art></art>',
        'fdirs/alpha/portraits.xml': '<art><picture href="/a"/></art>',
      },
      sourceState,
      currentSourceState: sourceState,
    });

    const result = updateSqliteIndex({});

    expect(result).toBe(true);
    expect(spawnSyncMock).not.toHaveBeenCalled();
    expect(stateWrites).toHaveLength(0);
  });

  it('falls back to full rebuild on unsupported source changes', () => {
    const sourceFiles = ['content/about/ignore.xml'];
    const previousState = {
      [sourceFiles[0]]: 1111,
    };
    const nextState = {
      [sourceFiles[0]]: 2222,
    };

    const { stateWrites } = installVirtualSources({
      sourceFiles,
      sourceContents: {
        [sourceFiles[0]]: '<ignore><picture href="/a"/></ignore>',
      },
      sourceState: previousState,
      currentSourceState: nextState,
    });

    const result = updateSqliteIndex({});

    expect(result).toBe(true);
    expect(spawnSyncMock).toHaveBeenCalledTimes(1);
    const sql = spawnSyncMock.mock.calls[0][2].input;
    expect(sql).toContain('DROP TABLE IF EXISTS poet');
    expect(stateWrites).toHaveLength(1);
  });
});
