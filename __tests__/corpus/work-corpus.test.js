import { execFileSync } from 'child_process';
import {
  formatWorkXml,
  structuralTagsOutsideColumnZero,
} from '../../tools/format-work-xml.js';
import {
  checksForWorkXml,
  collectBodyLinkIssues,
  collectPageBreakIssues,
  collectSourcePolicyIssues,
  collectSourceStructureIssues,
  collectTextStructureIssues,
  parseWorkXml,
} from '../../tools/work-validation.js';
import { loadTrackedWorkFiles } from '../../tools/libs/work-files.js';
import {
  getElementByTagName,
  getElementsByTagNames,
} from '../../tools/build-static/xml.js';

describe('tracked work corpus', () => {
  let filenames;
  let bodyLinkIssues;
  let emptyAndreFiles;
  let formattingIssues;
  let pageBreakIssues;
  let pageIntervalIssues;
  let pageOnlySourceIssues;
  let andreWorkheadSourceIssues;
  let externalSourceLinkIssues;
  let textFollowsNoteIssues;
  let textStructureIssues;

  beforeAll(() => {
    const works = loadTrackedWorkFiles();
    filenames = works.map(work => work.filename);
    bodyLinkIssues = [];
    emptyAndreFiles = [];
    formattingIssues = [];
    pageBreakIssues = [];
    pageIntervalIssues = [];
    pageOnlySourceIssues = [];
    andreWorkheadSourceIssues = [];
    externalSourceLinkIssues = [];
    textFollowsNoteIssues = [];
    textStructureIssues = [];

    works.forEach(({ content: xml, filename }) => {
      if (filename.endsWith('/andre.xml')) {
        const document = parseWorkXml(xml);
        const workBody = getElementByTagName(document, 'workbody');
        const contents = getElementsByTagNames(workBody, [
          'text',
          'prose',
          'subwork',
        ]);

        if (contents.length === 0) {
          emptyAndreFiles.push(filename);
        }
      }

      if (
        xml !== formatWorkXml(xml) ||
        structuralTagsOutsideColumnZero(xml).length > 0
      ) {
        formattingIssues.push(filename);
      }

      const checks = checksForWorkXml(xml);
      if (
        checks.bodyLinks !== true &&
        checks.sources !== true &&
        checks.sourcePolicy !== true &&
        checks.pageBreaks !== true &&
        checks.textStructure !== true
      ) {
        return;
      }

      const document = parseWorkXml(xml);
      const sourcePolicyIssues = collectSourcePolicyIssues(filename, document);
      andreWorkheadSourceIssues.push(
        ...sourcePolicyIssues.andreWorkheadSources,
      );
      externalSourceLinkIssues.push(...sourcePolicyIssues.externalSourceLinks);
      textFollowsNoteIssues.push(...sourcePolicyIssues.textFollowsNotes);
      if (checks.bodyLinks === true) {
        bodyLinkIssues.push(...collectBodyLinkIssues(filename, document));
      }
      if (checks.textStructure === true) {
        textStructureIssues.push(
          ...collectTextStructureIssues(filename, document),
        );
      }
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

  it('does not contain empty andre.xml files', () => {
    expect(emptyAndreFiles).toEqual([]);
  });

  it('keeps every work canonically formatted', () => {
    expect(formattingIssues).toEqual([]);
  });

  it('keeps links out of work body text', () => {
    expect(bodyLinkIssues).toEqual([]);
  });

  it('requires a workhead source for every page-only text source', () => {
    expect(pageOnlySourceIssues).toEqual([]);
  });

  it('requires legal page intervals on text sources', () => {
    expect(pageIntervalIssues).toEqual([]);
  });

  it('places sources on individual texts in andre.xml', () => {
    expect(andreWorkheadSourceIssues).toEqual([]);
  });

  it('uses source href attributes for external source links', () => {
    expect(externalSourceLinkIssues).toEqual([]);
  });

  it('does not describe structured sources with "Teksten følger" notes', () => {
    expect(textFollowsNoteIssues).toEqual([]);
  });

  it('does not assign first lines to prose-only texts', () => {
    expect(textStructureIssues).toEqual([]);
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
