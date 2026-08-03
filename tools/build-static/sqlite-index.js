import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const SQL_CACHE_FILE = path.resolve('caches/sqlite-index-build.sql');
const SQLITE_PATH = path.resolve('public/api/kalliope.sqlite');

const fixSqlSemicolons = (sql) => {
  return sql
    .replace(/\)\s*(INSERT(?:\s+OR\s+REPLACE)?|COMMIT)/g, ');\n$1');
};

export const updateSqliteIndex = () => {
  const rawSql = fs.readFileSync(SQL_CACHE_FILE, 'utf8');
  const fixedSql = fixSqlSemicolons(rawSql);

  const importSqlite = spawnSync('sqlite3', [SQLITE_PATH], {
    input: fixedSql,
    encoding: 'utf8',
    stdio: ['pipe', process.stdout, process.stderr],
  });

  if (importSqlite.status !== 0) {
    throw new Error(
      `Kunne ikke opdatere SQLite-index: ${importSqlite.stderr || importSqlite.error}`,
    );
  }

  return true;
};
