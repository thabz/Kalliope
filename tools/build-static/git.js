const { execFileSync } = require('child_process');

const GIT_MODIFIED_DATE_PATHS = [
  'fdirs/**/*.xml',
  'data/events.xml',
  'data/keywords/*.xml',
];

const collect_git_modified_dates = () => {
  const log = execFileSync(
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

module.exports = {
  collect_git_modified_dates,
};
