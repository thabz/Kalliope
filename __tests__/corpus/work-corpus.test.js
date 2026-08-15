import { execFileSync } from 'child_process';
import {
  formatWorkXml,
  structuralTagsOutsideColumnZero,
} from '../../tools/format-work-xml.js';
import {
  checksForWorkXml,
  collectPageBreakIssues,
  collectSourceStructureIssues,
  parseWorkXml,
} from '../../tools/work-validation.js';
import { loadTrackedWorkFiles } from '../../tools/libs/work-files.js';

describe('tracked work corpus', () => {
  let filenames;
  let formattingIssues;
  let pageBreakIssues;
  let pageIntervalIssues;
  let pageOnlySourceIssues;

  beforeAll(() => {
    const works = loadTrackedWorkFiles();
    filenames = works.map(work => work.filename);
    formattingIssues = [];
    pageBreakIssues = [];
    pageIntervalIssues = [];
    pageOnlySourceIssues = [];

    works.forEach(({ content: xml, filename }) => {
      if (
        xml !== formatWorkXml(xml) ||
        structuralTagsOutsideColumnZero(xml).length > 0
      ) {
        formattingIssues.push(filename);
      }

      const checks = checksForWorkXml(xml);
      if (checks.sources !== true && checks.pageBreaks !== true) {
        return;
      }

      const document = parseWorkXml(xml);
      if (checks.sources === true) {
        const sourceIssues = collectSourceStructureIssues(filename, document);
        pageIntervalIssues.push(...sourceIssues.pageIntervals);
        pageOnlySourceIssues.push(...sourceIssues.pageOnlySources);
      }
      if (checks.pageBreaks === true) {
        pageBreakIssues.push(
          ...collectPageBreakIssues(filename, xml, document),
        );
      }
    });
  });

  it('contains tracked work files', () => {
    expect(filenames.length).toBeGreaterThan(0);
  });

  it('keeps every work canonically formatted', () => {
    expect(formattingIssues).toEqual([]);
  });

  it('requires a workhead source for every page-only text source', () => {
    expect(pageOnlySourceIssues).toEqual([]);
  });

  it('requires legal page intervals on text sources', () => {
    expect(pageIntervalIssues).toEqual([]);
  });

  it('keeps declared page-break markup consistent', () => {
    expect(pageBreakIssues).toEqual([]);
  });

  it('conforms to the Kalliope work schema', () => {
    try {
      execFileSync(
        'xmllint',
        ['--noout', '--relaxng', 'schemas/kalliopework.rng', ...filenames],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      );
    } catch (error) {
      throw new Error(error.stderr || error.message);
    }
  });
});
