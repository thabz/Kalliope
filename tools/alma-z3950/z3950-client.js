import { spawn } from 'child_process';

const DEFAULT_YAZ_BINARY = 'yaz-client';
const DEFAULT_HOST = 'kbdk-kgl.alma.exlibrisgroup.com';
const DEFAULT_PORT = 1921;
const DEFAULT_DATABASE = '45KBDK_KGL';

const yazDependencyMessage = [
  'YAZ-klienten `yaz-client` blev ikke fundet i PATH.',
  'Installer YAZ med `brew install yaz` på macOS eller `sudo apt install yaz` på Debian/Ubuntu.',
].join(' ');

const getClientConfig = () => ({
  binary: process.env.KALLIOPE_KB_YAZ_BINARY ?? DEFAULT_YAZ_BINARY,
  host: process.env.KALLIOPE_KB_Z3950_HOST ?? DEFAULT_HOST,
  port: Number(process.env.KALLIOPE_KB_Z3950_PORT ?? DEFAULT_PORT),
  database: process.env.KALLIOPE_KB_Z3950_DB ?? DEFAULT_DATABASE,
  timeoutMs: Number(process.env.KALLIOPE_KB_Z3950_TIMEOUT_MS ?? 30000),
  retries: Number(process.env.KALLIOPE_KB_Z3950_RETRIES ?? 2),
  backoffMs: Number(process.env.KALLIOPE_KB_Z3950_RETRY_BASE_MS ?? 250),
  maxDelayMs: Number(process.env.KALLIOPE_KB_Z3950_RETRY_MAX_MS ?? 3000),
  maxRecords: Number(process.env.KALLIOPE_KB_Z3950_MAX_RECORDS ?? 100),
});

const normalizeNumber = value => {
  if (Number.isNaN(value)) {
    return null;
  }
  return value;
};

const defaultToFiniteNumber = (value, fallback) => {
  const resolved = normalizeNumber(Number(value));
  return resolved == null || Number.isFinite(resolved) === false ? fallback : resolved;
};

const isTransientZ3950Error = error => {
  const code = error?.code ?? '';
  const normalized = `${error?.message ?? ''}`.toLowerCase();
  const transientCodes = new Set([
    'ETIMEDOUT',
    'ESOCKETTIMEDOUT',
    'ECONNRESET',
    'ECONNABORTED',
    'ECONNREFUSED',
    'EAI_AGAIN',
    'ENOTFOUND',
    'EPIPE',
    'ENETUNREACH',
  ]);
  return (
    transientCodes.has(code) ||
    normalized.includes('timeout') ||
    normalized.includes('timede ud') ||
    normalized.includes('could not resolve address') ||
    normalized.includes('system (lower-layer) error') ||
    normalized.includes('connection failed') ||
    normalized.includes('connection closed')
  );
};

const sleep = ms => new Promise(resolve => {
  setTimeout(resolve, ms);
});

const withRetry = async task => {
  const config = getClientConfig();
  const retries = Math.max(0, defaultToFiniteNumber(config.retries, 2));
  const backoffBase = Math.max(50, defaultToFiniteNumber(config.backoffMs, 250));
  const maxDelayMs = Math.max(250, defaultToFiniteNumber(config.maxDelayMs, 3000));

  let attempt = 0;
  while (true) {
    try {
      return await task();
    } catch (error) {
      if (attempt >= retries || isTransientZ3950Error(error) === false) {
        throw error;
      }
      attempt += 1;
      const waitMs = Math.min(maxDelayMs, backoffBase * 2 ** (attempt - 1));
      await sleep(waitMs);
    }
  }
};

const assertSingleLine = (value, name) => {
  const normalized = `${value ?? ''}`;
  if (normalized.length === 0 || /[\r\n]/.test(normalized)) {
    throw new Error(`Ugyldig ${name} til YAZ-klienten.`);
  }
  return normalized;
};

const buildYazCommands = (query, config) => {
  const host = assertSingleLine(config.host, 'host');
  const database = assertSingleLine(config.database, 'database');
  const pqf = assertSingleLine(query.pqf, 'PQF-forespørgsel');
  const port = Math.max(1, defaultToFiniteNumber(config.port, DEFAULT_PORT));
  return [
    'format xml',
    'elements marcxml',
    `open ${host}:${port}/${database}`,
    `find ${pqf}`,
    '',
  ].join('\n');
};

const parseYazRecords = output => {
  const records = [];
  const recordPattern = /<record(?:\s[^>]*)?>[\s\S]*?<\/record>/g;
  for (const match of `${output ?? ''}`.matchAll(recordPattern)) {
    records.push(match[0]);
  }
  return records;
};

const findYazFailure = output => {
  const normalized = `${output ?? ''}`;
  const patterns = [
    /could not resolve address[^\r\n]*/i,
    /error = [^\r\n]*/i,
    /connection failed[^\r\n]*/i,
    /connection closed[^\r\n]*/i,
    /bib-1 diagnostic[^\r\n]*/i,
    /diagnostic message\(s\) from database:[^\r\n]*/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match != null) {
      return match[0].trim();
    }
  }
  return null;
};

const runYazClient = (query, overrides = {}) => {
  const config = { ...getClientConfig(), ...overrides };
  const binary = assertSingleLine(config.binary, 'YAZ-binær');
  const timeoutMs = Math.max(250, defaultToFiniteNumber(config.timeoutMs, 30000));
  const maxRecords = Math.max(1, Math.floor(defaultToFiniteNumber(config.maxRecords, 100)));
  const commands = buildYazCommands(query, config);

  return new Promise((resolve, reject) => {
    const child = spawn(binary, [], {
      env: process.env,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    let presentRequested = false;

    const finish = callback => {
      if (settled === true) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      callback();
    };

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      const error = new Error(`YAZ-søgningen timede ud efter ${timeoutMs} ms.`);
      error.code = 'ETIMEDOUT';
      finish(() => reject(error));
    }, timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      stdout += chunk;
      const failure = findYazFailure(stdout);
      if (failure != null && child.stdin.destroyed === false) {
        child.stdin.end('quit\n');
        return;
      }
      if (presentRequested === false) {
        const hitMatch = stdout.match(/Number of hits:\s*(\d+)/);
        if (hitMatch != null) {
          presentRequested = true;
          const hitCount = Number.parseInt(hitMatch[1], 10);
          if (hitCount === 0) {
            child.stdin.end('quit\n');
          } else {
            const recordsToFetch = Math.min(hitCount, maxRecords);
            child.stdin.end(`show 1+${recordsToFetch}\nquit\n`);
          }
        }
      }
    });
    child.stderr.on('data', chunk => {
      stderr += chunk;
    });
    child.stdin.on('error', error => {
      finish(() => reject(error));
    });
    child.on('error', error => {
      finish(() => {
        if (error.code === 'ENOENT' || error.code === 'EACCES') {
          reject(new Error(yazDependencyMessage));
          return;
        }
        reject(error);
      });
    });
    child.on('close', code => {
      finish(() => {
        const combinedOutput = [stdout, stderr].filter(value => value.length > 0).join('\n');
        const failure = findYazFailure(combinedOutput);
        if (code !== 0 || failure != null) {
          const trimmedError = stderr.trim();
          const detail = failure ?? (trimmedError.length > 0 ? trimmedError : `exit-kode ${code}`);
          reject(new Error(`YAZ kunne ikke gennemføre Z39.50-søgningen: ${detail}`));
          return;
        }
        resolve(parseYazRecords(stdout));
      });
    });

    child.stdin.write(commands);
  });
};

const searchWithYaz = async query => withRetry(() => runYazClient(query));

export {
  buildYazCommands,
  findYazFailure,
  getClientConfig,
  parseYazRecords,
  runYazClient,
  searchWithYaz,
  yazDependencyMessage,
};
