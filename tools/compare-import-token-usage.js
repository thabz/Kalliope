#!/usr/bin/env node
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const fields = ['input_tokens', 'cached_input_tokens', 'output_tokens', 'total_tokens'];

async function readSession(path) {
  const lines = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  let sessionId;
  let usage;
  let lineNumber = 0;
  for await (const line of lines) {
    lineNumber += 1;
    try {
      const event = JSON.parse(line);
      if (event.type === 'session_meta') {
        if (sessionId !== undefined || typeof event.payload.id !== 'string') {
          throw new Error('Forventede ét sessions-id');
        }
        sessionId = event.payload.id;
      }
      if (event.type !== 'event_msg' || event.payload.type !== 'token_count') continue;
      const current = event.payload.info?.total_token_usage;
      if (current == null) continue;
      for (const field of fields) {
        if (!Number.isSafeInteger(current[field]) || current[field] < (usage?.[field] ?? 0)) {
          throw new Error(`Ugyldig kumulativ tæller: ${field}`);
        }
      }
      if (current.cached_input_tokens > current.input_tokens ||
          current.total_tokens !== current.input_tokens + current.output_tokens) {
        throw new Error('Tokenfelterne stemmer ikke overens');
      }
      usage = Object.fromEntries(fields.map(field => [field, current[field]]));
    } catch (error) {
      throw new Error(`${path}:${lineNumber}: ${error.message}`);
    }
  }
  if (sessionId === undefined || usage === undefined || usage.total_tokens === 0) {
    throw new Error(`${path}: Mangler sessions-id eller tokenmåling`);
  }
  return { session_id: sessionId, ...usage };
}

function summarize(sessions) {
  const totals = fields.map(field => [
    field, sessions.reduce((total, session) => total + session[field], 0)
  ]);
  return { sessions, ...Object.fromEntries(totals) };
}

async function main(args) {
  const separator = args.indexOf('--');
  if (separator < 1 || separator === args.length - 1 || args.lastIndexOf('--') !== separator) {
    throw new Error('Brug: node tools/compare-import-token-usage.js HIDTIDIG.jsonl [...] -- NY.jsonl [...]');
  }
  const [baselineSessions, candidateSessions] = await Promise.all([
    Promise.all(args.slice(0, separator).map(readSession)),
    Promise.all(args.slice(separator + 1).map(readSession))
  ]);
  const sessionIds = [...baselineSessions, ...candidateSessions].map(session => session.session_id);
  if (new Set(sessionIds).size !== sessionIds.length) {
    throw new Error('Hver session må kun medregnes én gang');
  }
  const baseline = summarize(baselineSessions);
  const candidate = summarize(candidateSessions);
  const tokenSavings = Object.fromEntries(fields.map(field => [field, baseline[field] - candidate[field]]));
  console.log(JSON.stringify({
    baseline,
    candidate,
    token_savings: tokenSavings,
    total_savings_percent: 100 * tokenSavings.total_tokens / baseline.total_tokens
  }, null, 2));
}

main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
