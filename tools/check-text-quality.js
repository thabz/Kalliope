import { findOcrCandidates } from './report-ocr-candidates.js';
import { collectPoemLineQualityFindings } from './text-quality-poem-lines.js';

const normalizePath = filename => filename.replace(/^\.\//, '').replace(/\\/g, '/');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const files = args.filter(arg => !arg.startsWith('--')).map(normalizePath);
  return { json, files: files.length === 0 ? null : files };
};

const compareTextQualityIssues = (a, b) => {
  if (a.file < b.file) return -1;
  if (a.file > b.file) return 1;
  if (a.line < b.line) return -1;
  if (a.line > b.line) return 1;
  if (a.rule < b.rule) return -1;
  if (a.rule > b.rule) return 1;
  return 0;
};

const asHumanLine = issue =>
  `${issue.severity}\t${issue.file}:${issue.line ?? ''}\t${issue.rule}\t${issue.textId ?? ''}\t${issue.description}\t${issue.excerpt ?? ''}`;

const toOcrIssue = candidate => ({
  file: candidate.file,
  line: candidate.line,
  textId: candidate.textId,
  rule: candidate.rule,
  severity: candidate.priority,
  description: candidate.reason ?? candidate.rule,
  excerpt: candidate.context,
  source: 'ocr-candidates',
});

const toPoemLineIssue = issue => ({
  file: issue.file,
  line: issue.line,
  textId: issue.textId,
  rule: issue.rule,
  severity: issue.severity,
  description: issue.description,
  excerpt: issue.excerpt,
  source: 'poem-lines',
});

const formatSummary = (issues, technicalError = null) => {
  if (technicalError != null) {
    return {
      status: 'technical-error',
      summary: {
        qualityIssues: issues.length,
        technicalError,
      },
      issues,
    };
  }

  return {
    status: issues.length > 0 ? 'quality-failure' : 'ok',
    summary: {
      qualityIssues: issues.length,
    },
    issues,
  };
};

const run = () => {
  const { json, files } = parseArgs();
  const rootDir = process.cwd();
  const result = {
    issues: [],
  };

  try {
    const ocrCandidates = findOcrCandidates({
      rootDir,
      files,
      disabledTests: process.env.DISABLED_TESTS ?? '',
    });
    const poemLineFindings = collectPoemLineQualityFindings({ rootDir, files });
    result.issues = [...poemLineFindings.map(toPoemLineIssue), ...ocrCandidates.map(toOcrIssue)].sort(compareTextQualityIssues);
  } catch (error) {
    const summary = formatSummary(result.issues, error.message);
    if (json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.error(`Teknisk fejl under tekstkvalitetskontrol: ${error.message}`);
      if (error.stack != null) {
        console.error(error.stack);
      }
      const text = JSON.stringify(summary, null, 2);
      console.error(text);
    }
    process.exitCode = 2;
    return;
  }

  const summary = formatSummary(result.issues);
  if (json) {
    console.log(JSON.stringify(summary, null, 2));
  } else if (result.issues.length > 0) {
    result.issues.forEach(issue => console.log(asHumanLine(issue)));
    console.error(`${result.issues.length} tekstkvalitetsfejl fundet.`);
  } else {
    console.log('Ingen tekstkvalitetsfejl fundet.');
  }

  process.exitCode = result.issues.length > 0 ? 1 : 0;
};

run();
