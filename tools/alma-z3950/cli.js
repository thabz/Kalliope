import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DEFAULT_CACHE_DIR,
  DEFAULT_CONTEXT_ID,
  DEFAULT_SNAPSHOT,
  DEFAULT_TARGETS,
  formatReport,
  loadTargets,
  runDiscovery,
  writeMachineOutput,
} from './index.js';
import { searchWithOptionalClient, z3950DependencyMessage } from './z3950-client.js';

const usage = `
Usage: node tools/alma-z3950/cli.js [options]

Options:
  --offline                Brug reproducerbar snapshot og lad ikke Z39.50 køre.
  --scope <all|one|slice>  Vælg kørsel omfang (default: all).
  --poet-id <id>           Kør et enkelt mål (bruges med --scope one).
  --index <n>              Kør et enkelt mål efter listeindeks (bruges med --scope one).
  --slice <start>:<end>    Kør interval af mål, fx 0:10 (bruges med --scope slice).
  --targets <path>         Pilotmål i JSON (default: tools/alma-z3950/fixtures/pilot-targets.json)
  --snapshot <path>        Snapshot med MARC-hits (default: tools/alma-z3950/fixtures/pilot-snapshots/pilot-offline-run.json)
  --cache-dir <path>       Cache-lager til forespørgsler.
  --force-reload           Ignorer cache og genhent hvert lookup fra Z39.50.
  --jsonl-output <path>    NDJSON-maskinoutput (default: stdout hvis udvidet, ellers ingen fil)
  --report <path>          Kort rapport i markdown.
  --context <1o797oc>      Vælg KB-permalinkkontekst for afledte facsimiler.
  --help                   Vis denne hjælpebesked.
`;

const parseSliceRange = value => {
  const match = String(value ?? '').match(/^(\d+)(?::(\d+))?$/);
  if (match == null) {
    throw new Error('Ugyldigt format for --slice. Brug <start>:<end> hvor begge er heltal (fx 0:10).');
  }
  const start = Number.parseInt(match[1], 10);
  const end = match[2] == null ? null : Number.parseInt(match[2], 10);
  if (Number.isNaN(start) || (end != null && Number.isNaN(end))) {
    throw new Error('Slice-indekser skal være heltal.');
  }
  return { start, end };
};

const applyScope = (targets, args) => {
  const scope = args.scope ?? 'all';
  if (scope === 'all') {
    return targets;
  }
  if (scope === 'one') {
    const indexProvided = args.targetIndex != null ? Number.parseInt(args.targetIndex, 10) : null;
    const targetId = args.poetId;
    if (Number.isInteger(indexProvided)) {
      if (indexProvided < 0 || indexProvided >= targets.length) {
        throw new Error(`--index out of range: ${indexProvided}`);
      }
      return [targets[indexProvided]];
    }
    if (targetId != null && targetId !== '') {
      const match = targets.find(target => target.poetId === targetId);
      if (match == null) {
        throw new Error(`Ingen target med poet-id ${targetId}`);
      }
      return [match];
    }
    throw new Error('scope=one kræver --poet-id eller --index');
  }
  if (scope === 'slice') {
    const range = args.sliceRange;
    if (range == null) {
      throw new Error('--scope slice kræver --slice <start>:<end>');
    }
    const end = range.end == null ? targets.length : range.end;
    if (range.start > end) {
      throw new Error(`Ugyldig range: ${range.start}:${end}`);
    }
    return targets.slice(range.start, end);
  }
  throw new Error(`Ukendt scope: ${scope}`);
};

const parseArgs = argv => {
  const args = {};
  args.offline = false;
  args.scope = 'all';
  args.targets = DEFAULT_TARGETS;
  args.snapshot = DEFAULT_SNAPSHOT;
  args.cacheDir = DEFAULT_CACHE_DIR;
  args.contextId = DEFAULT_CONTEXT_ID;
  args.jsonlOutput = null;
  args.reportPath = null;
  args.forceReload = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help') {
      args.help = true;
      continue;
    }
    if (arg === '--offline') {
      args.offline = true;
      continue;
    }
    if (arg === '--force-reload') {
      args.forceReload = true;
      continue;
    }
    if (arg === '--scope') {
      args.scope = argv[index + 1] ?? args.scope;
      index += 1;
      continue;
    }
    if (arg === '--poet-id') {
      args.poetId = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--index') {
      args.targetIndex = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--slice') {
      args.sliceRange = parseSliceRange(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === '--targets') {
      args.targets = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--snapshot') {
      args.snapshot = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--cache-dir') {
      args.cacheDir = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--jsonl-output') {
      args.jsonlOutput = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--report') {
      args.reportPath = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--context') {
      args.contextId = argv[index + 1] ?? args.contextId;
      index += 1;
      continue;
    }
  }

  return args;
};

const safeWrite = async (filename, content) => {
  await fs.promises.mkdir(path.dirname(filename), { recursive: true });
  await fs.promises.writeFile(filename, content);
};

const run = async (argv = process.argv.slice(2)) => {
  const args = parseArgs(argv);
  if (args.help === true) {
    process.stdout.write(`${usage}\n`);
    return;
  }

  const targets = loadTargets(args.targets);
  const scopedTargets = applyScope(targets, args);
  const discovery = await runDiscovery({
    targets: scopedTargets,
    snapshotPath: args.snapshot,
    cacheDir: args.cacheDir,
    contextId: args.contextId,
    forceReload: args.forceReload,
    offline: args.offline,
    z3950Search: args.offline ? null : searchWithOptionalClient,
  }).catch(error => {
    if (args.offline || error.message.includes('Z39.50-klientmodul mangler')) {
      throw error;
    }
    throw new Error(`${z3950DependencyMessage}\nÅrsag: ${error.message}`);
  });

  if (args.jsonlOutput != null && args.jsonlOutput !== '') {
    const filename = path.resolve(args.jsonlOutput);
    await writeMachineOutput(filename, discovery);
  } else {
    process.stdout.write(JSON.stringify(discovery, null, 2));
    process.stdout.write(os.EOL);
  }

  const report = formatReport(discovery);
  if (args.reportPath != null && args.reportPath !== '') {
    await safeWrite(path.resolve(args.reportPath), report);
    process.stdout.write(`Rapport skrevet til: ${args.reportPath}\n`);
  } else {
    process.stdout.write(`${report}\n`);
  }
};

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  run().catch(error => {
    console.error(`Fejl: ${error.message}`);
    process.exitCode = 1;
  });
}

export { parseArgs, run, usage };
