import { loadTrackedWorkFiles } from '../../tools/libs/work-files.js';
import { findMissingTextDates } from '../../tools/text-date-validation.js';

it('registers complete dates printed in headings and closing datelines', () => {
  const findings = loadTrackedWorkFiles().flatMap(({ filename, content }) =>
    findMissingTextDates({ file: filename, data: content }));
  if (findings.length > 0) {
    throw new Error(findings.map(finding =>
      `${finding.file}:${finding.line} ${finding.textId}: ${finding.printedDate} requires ${finding.date} in <dates> (${finding.location}).`,
    ).join('\n'));
  }
});
