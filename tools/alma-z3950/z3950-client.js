import path from 'path';
import { fileURLToPath } from 'url';

const moduleRoot = path.join(fileURLToPath(import.meta.url), '..', '..');

const z3950DependencyMessage =
  'Z39.50-klientmodul mangler (fx node-z3950). Installer et kompatibelt modul for online-kørsel.';

const getClientConfig = () => ({
  timeoutMs: Number(process.env.KALLIOPE_KB_Z3950_TIMEOUT_MS ?? 15000),
  retries: Number(process.env.KALLIOPE_KB_Z3950_RETRIES ?? 2),
  backoffMs: Number(process.env.KALLIOPE_KB_Z3950_RETRY_BASE_MS ?? 250),
  maxDelayMs: Number(process.env.KALLIOPE_KB_Z3950_RETRY_MAX_MS ?? 3000),
});

const normalizeNumber = value => {
  if (Number.isNaN(value)) {
    return null;
  }
  return value;
};

const isTransientZ3950Error = error => {
  const code = error?.code ?? '';
  const status = error?.status ?? null;
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
    status === 429 ||
    status === 503 ||
    normalized.includes('timeout') ||
    normalized.includes('tempor') ||
    normalized.includes('rate limit') ||
    normalized.includes('service unavailable')
  );
};

const sleep = ms => new Promise(resolve => {
  setTimeout(resolve, ms);
});

const defaultToFiniteNumber = (value, fallback) => {
  const resolved = normalizeNumber(Number(value));
  return resolved == null || Number.isFinite(resolved) === false ? fallback : resolved;
};

const withRetry = async task => {
  const config = getClientConfig();
  const retries = Math.max(0, defaultToFiniteNumber(config.retries, 2));
  const timeoutMs = Math.max(250, defaultToFiniteNumber(config.timeoutMs, 15000));
  const backoffBase = Math.max(50, defaultToFiniteNumber(config.backoffMs, 250));
  const maxDelayMs = Math.max(250, defaultToFiniteNumber(config.maxDelayMs, 3000));

  let attempt = 0;
  while (true) {
    try {
      const wrapped = await task();
      return wrapped;
    } catch (error) {
      if (attempt >= retries || !isTransientZ3950Error(error)) {
        throw error;
      }
      attempt += 1;
      const waitMs = Math.min(maxDelayMs, backoffBase * 2 ** (attempt - 1));
      await sleep(waitMs);
    }
  }
};

const normalizeResponse = payload => {
  if (payload == null) {
    return [];
  }
  if (typeof payload === 'string') {
    return [payload];
  }
  if (Array.isArray(payload)) {
    return payload.filter(item => typeof item === 'string');
  }
  if (Array.isArray(payload.records) === true) {
    return payload.records.filter(item => typeof item === 'string');
  }
  return [];
};

const loadOptionalClient = async () => {
  try {
    const candidate = await import('node-z3950');
    return candidate;
  } catch (error) {
    try {
      const fallback = await import('z3950-client');
      return fallback;
    } catch (_) {
      return null;
    }
  }
};

const createSearchFunction = async () => {
  const client = await loadOptionalClient();
  if (client == null) {
    throw new Error(z3950DependencyMessage);
  }

  if (typeof client.search === 'function') {
    return client.search;
  }

  if (typeof client.default?.search === 'function') {
    return client.default.search;
  }

  const Session =
    client.Session ??
    client.Z3950Session ??
    client.default?.Session;

  if (Session == null) {
    throw new Error(
      'Der blev fundet en z39.50-pakke, men ingen kendt søgerutine. Tilpas tools/alma-z3950/z3950-client.js for den konkrete klient API.',
    );
  }

  return async query => {
    const session = new Session({
      host: process.env.KALLIOPE_KB_Z3950_HOST ?? 'z3950.kb.dk',
      port: Number(process.env.KALLIOPE_KB_Z3950_PORT ?? 210),
      database: process.env.KALLIOPE_KB_Z3950_DB ?? 'L',
      username: process.env.KALLIOPE_KB_Z3950_USER ?? '',
      password: process.env.KALLIOPE_KB_Z3950_PASSWORD ?? '',
      timeout: getClientConfig().timeoutMs,
    });
    if (typeof session.search !== 'function') {
      throw new Error('Inkompatibel Session API fra z39.50-klienten');
    }
    const normalize = async () => normalizeResponse(await session.search(query));
    return withRetry(normalize);
  };
};

const searchWithOptionalClient = async query => {
  const search = await createSearchFunction();
  const executeSearch = async () => normalizeResponse(await search(
    query.pqf,
    query.hash,
    {
      ...query,
      timeoutMs: getClientConfig().timeoutMs,
    },
  ));
  return withRetry(executeSearch);
};

const ensureModuleDirectory = () => {
  return {
    moduleRoot,
  };
};

export {
  createSearchFunction,
  searchWithOptionalClient,
  z3950DependencyMessage,
  ensureModuleDirectory,
};
