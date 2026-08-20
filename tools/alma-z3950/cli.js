import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DEFAULT_CACHE_DIR,
  DEFAULT_CONTEXT_ID,
  formatReport,
  loadSearchProfiles,
  runDiscovery,
  writeMachineOutput,
} from './index.js';
import { searchWithYaz } from './z3950-client.js';

const usage = `
Usage: node tools/alma-z3950/cli.js (--poet-id <id> | --all) [options]

Udvælgelse:
  --poet-id <id>           Find KB-facsimiler for én digters digtværker.
  --all                    Find KB-facsimiler for alle digteres digtværker.

Øvrige indstillinger:
  --cache-dir <path>       Cache-lager til forespørgsler.
  --force-reload           Ignorer cache og genhent hvert lookup fra Z39.50.
  --jsonl-output <path>    NDJSON-maskinoutput (default: /tmp/alma-z3950-<valg>.ndjson).
  --report <path>          Markdown-rapport (default: /tmp/alma-z3950-<valg>.md).
  --context <1o797oc>      Vælg KB-permalinkkontekst for afledte facsimiler.
  --help                   Vis denne hjælpebesked.
`;

const parseArgs = argv => {
  const args = {
    all: false,
    cacheDir: DEFAULT_CACHE_DIR,
    contextId: DEFAULT_CONTEXT_ID,
    forceReload: false,
    jsonlOutput: null,
    reportPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help') {
      args.help = true;
    } else if (arg === '--all') {
      args.all = true;
    } else if (arg === '--force-reload') {
      args.forceReload = true;
    } else if (arg === '--poet-id' || arg === '--cache-dir' || arg === '--jsonl-output' || arg === '--report' || arg === '--context') {
      const value = argv[index + 1];
      if (value == null || value.startsWith('--')) {
        throw new Error(`${arg} kræver en værdi.`);
      }
      const key = {
        '--poet-id': 'poetId',
        '--cache-dir': 'cacheDir',
        '--jsonl-output': 'jsonlOutput',
        '--report': 'reportPath',
        '--context': 'contextId',
      }[arg];
      args[key] = value;
      index += 1;
    } else {
      throw new Error(`Ukendt parameter: ${arg}`);
    }
  }
  if (args.help !== true && ((args.poetId != null && args.all === true) || (args.poetId == null && args.all === false))) {
    throw new Error('Angiv præcis én af --poet-id eller --all.');
  }
  return args;
};

const defaultOutputBase = args =>
  path.join('/tmp', `alma-z3950-${args.all === true ? 'all' : args.poetId}`);

const run = async (argv = process.argv.slice(2)) => {
  const args = parseArgs(argv);
  if (args.help === true) {
    process.stdout.write(`${usage}\n`);
    return;
  }

  const profiles = await loadSearchProfiles({ poetId: args.poetId, all: args.all });
  const discovery = await runDiscovery({
    profiles,
    cacheDir: args.cacheDir,
    contextId: args.contextId,
    forceReload: args.forceReload,
    z3950Search: searchWithYaz,
  });
  const outputBase = defaultOutputBase(args);
  const jsonlOutput = path.resolve(args.jsonlOutput ?? `${outputBase}.ndjson`);
  const reportPath = path.resolve(args.reportPath ?? `${outputBase}.md`);

  await writeMachineOutput(jsonlOutput, discovery);
  await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.promises.writeFile(reportPath, formatReport(discovery));
  process.stdout.write(`NDJSON skrevet til: ${jsonlOutput}\nRapport skrevet til: ${reportPath}\n`);
};

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  run().catch(error => {
    console.error(`Fejl: ${error.message}`);
    process.exitCode = 1;
  });
}

export { defaultOutputBase, parseArgs, run, usage };
