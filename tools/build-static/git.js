import { execFileSync } from 'child_process';

const GIT_MODIFIED_DATE_PATHS = [
  'fdirs/**/*.xml',
  'content/events.xml',
  'content/keywords/*.xml',
];

const parseGitModifiedDatesLog = (log) => {
  const modifiedDates = new Map();
  let timestamp = null;

  log.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      return;
    }
    if (/^\d+$/.test(trimmed)) {
      timestamp = parseInt(trimmed, 10);
      return;
    }
    if (timestamp != null && !modifiedDates.has(trimmed)) {
      modifiedDates.set(
        trimmed,
        new Date(timestamp * 1000).toISOString().slice(0, 10)
      );
    }
  });

  return modifiedDates;
};

const collect_git_modified_dates = () => {
  let log;
  try {
    log = execFileSync(
      'git',
      [
        '--no-pager',
        'log',
        '--pretty=format:%ct',
        '--name-only',
        '--',
        ...GIT_MODIFIED_DATE_PATHS.map((path) => `:(glob)${path}`),
      ],
      { encoding: 'utf8' }
    );
  } catch (error) {
    if (error.code === 'ENOENT' || error.status === 128) {
      console.warn(
        'Skipping git modified dates; git metadata is unavailable.'
      );
      return new Map();
    }
    throw error;
  }

  return parseGitModifiedDatesLog(log);
};

export {
  collect_git_modified_dates,
  parseGitModifiedDatesLog,
};
