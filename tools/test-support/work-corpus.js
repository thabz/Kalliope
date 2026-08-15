import fs from 'fs';
import { execFileSync } from 'child_process';

const trackedWorkFiles = ({ execute = execFileSync } = {}) =>
  execute(
    'git',
    [
      'grep',
      '-l',
      '-e',
      '<kalliopework[[:space:]>]',
      '--',
      'fdirs/*/*.xml',
    ],
    { encoding: 'utf8' },
  )
    .split('\n')
    .filter(filename => filename.length > 0);

const loadWorkCorpus = ({
  filenames = trackedWorkFiles(),
  readFile = fs.readFileSync,
} = {}) =>
  filenames.map(filename => ({
    filename,
    xml: readFile(filename, 'utf8'),
  }));

const checksForWorkXml = xml => ({
  pageBreaks: /<pagebreaks\b/.test(xml),
  sources: /<source\b[^>]*\bpages\s*=/.test(xml),
});

export { checksForWorkXml, loadWorkCorpus, trackedWorkFiles };
