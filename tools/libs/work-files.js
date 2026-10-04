import fs from 'fs';
import { execFileSync } from 'child_process';

const isWorkFileContent = content => /<kalliopework\b/.test(content);

const trackedWorkFilenames = ({ execute = execFileSync } = {}) =>
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

const loadTrackedWorkFiles = ({
  filenames = trackedWorkFilenames(),
  readFile = fs.readFileSync,
} = {}) =>
  filenames.map(filename => ({
    content: readFile(filename, 'utf8'),
    filename,
  }));

export {
  isWorkFileContent,
  loadTrackedWorkFiles,
  trackedWorkFilenames,
};
