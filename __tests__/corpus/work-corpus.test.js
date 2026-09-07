import { execFileSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
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
import { resolveAuthorId } from '../../tools/build-static/anthologies.js';

const loadJsonLines = (filename) =>
  readFileSync(filename, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));

describe('tracked work corpus', () => {
  let filenames;
  let bodyLinkIssues;
  let emptyAndreFiles;
  let formattingIssues;
  let pageBreakIssues;
  let pageIntervalIssues;
  let pageOnlySourceIssues;
  let poetryBoundaryBlankLineIssues;
  let andreWorkheadSourceIssues;
  let externalSourceLinkIssues;
  let textFollowsNoteIssues;
  let textStructureIssues;
  let unindexedAnthologyTexts;

  beforeAll(() => {
    const works = loadTrackedWorkFiles();
    filenames = works.map((work) => work.filename);
    bodyLinkIssues = [];
    emptyAndreFiles = [];
    formattingIssues = [];
    pageBreakIssues = [];
    pageIntervalIssues = [];
    pageOnlySourceIssues = [];
    poetryBoundaryBlankLineIssues = [];
    andreWorkheadSourceIssues = [];
    externalSourceLinkIssues = [];
    textFollowsNoteIssues = [];
    textStructureIssues = [];
    unindexedAnthologyTexts = [];

    works.forEach(({ content: xml, filename }) => {
      const anthologyDirectory = filename.match(/^fdirs\/(antologier[^/]+)\//);
      if (anthologyDirectory != null) {
        const anthologyId = anthologyDirectory[1];
        const document = parseWorkXml(xml);
        getElementsByTagNames(document, ['text']).forEach((text) => {
          if (
            resolveAuthorId(text, anthologyId) === anthologyId &&
            text.getAttribute('skip-index') !== 'true'
          ) {
            unindexedAnthologyTexts.push(
              `${filename}: ${text.getAttribute('id')}`
            );
          }
        });
      }

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

      if (
        /<poetry(?:[ \t][^<>]*)?>\r?\n[ \t]*\r?\n/.test(xml) ||
        /\r?\n[ \t]*\r?\n<\/poetry>/.test(xml)
      ) {
        poetryBoundaryBlankLineIssues.push(filename);
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
        ...sourcePolicyIssues.andreWorkheadSources
      );
      externalSourceLinkIssues.push(...sourcePolicyIssues.externalSourceLinks);
      textFollowsNoteIssues.push(...sourcePolicyIssues.textFollowsNotes);
      if (checks.bodyLinks === true) {
        bodyLinkIssues.push(...collectBodyLinkIssues(filename, document));
      }
      if (checks.textStructure === true) {
        textStructureIssues.push(
          ...collectTextStructureIssues(filename, document)
        );
      }
      if (checks.sources === true) {
        const sourceIssues = collectSourceStructureIssues(filename, document);
        pageIntervalIssues.push(...sourceIssues.pageIntervals);
        pageOnlySourceIssues.push(...sourceIssues.pageOnlySources);
      }
      if (checks.pageBreaks === true) {
        pageBreakIssues.push(
          ...collectPageBreakIssues(filename, xml, document)
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

  it('keeps poetry free of leading and trailing blank lines', () => {
    expect(poetryBoundaryBlankLineIssues).toEqual([]);
  });

  it('keeps anthology texts without an identified author out of indexes', () => {
    expect(unindexedAnthologyTexts).toEqual([]);
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
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
      );
    } catch (error) {
      throw new Error(error.stderr || error.message);
    }
  });
});

describe('registered first-edition placeholders', () => {
  const decisions = JSON.parse(
    readFileSync(
      'tools/data/indsamling/register/manual-decisions.json',
      'utf8'
    )
  ).decisions.filter(
    ({ decision, entity }) =>
      decision === 'register-first-edition' && entity === 'work'
  );
  const registeredWorks = new Map(
    loadJsonLines('tools/data/indsamling/register/vaerker.jsonl').map((work) => [
      work.id,
      work,
    ])
  );

  it('keeps every selected publication as an empty, indexed work file', () => {
    const issues = [];

    decisions.forEach(({ id, kalliope }) => {
      const poetId = kalliope?.poet_id;
      const workId = kalliope?.work_id;
      const filename = `fdirs/${poetId}/${workId}.xml`;
      const work = registeredWorks.get(id);

      if (
        work?.status !== 'registered' ||
        work?.kalliope?.poet_id !== poetId ||
        work?.kalliope?.work_id !== workId
      ) {
        issues.push(`${id}: missing or inconsistent work-register link`);
      }
      if (!poetId || !workId || workId === 'andre' || !existsSync(filename)) {
        issues.push(`${id}: invalid or missing placeholder path ${filename}`);
        return;
      }

      const xml = readFileSync(filename, 'utf8');
      const document = parseWorkXml(xml);
      const root = document.documentElement;
      const workhead = getElementByTagName(root, 'workhead');
      const title = getElementByTagName(workhead, 'title');
      const year = getElementByTagName(workhead, 'year');
      const contents = getElementsByTagNames(root, [
        'workbody',
        'text',
        'prose',
        'subwork',
      ]);

      const isCompletedWork =
        root.getAttribute('status') === 'complete' && contents.length > 0;
      if (
        root.getAttribute('id') !== workId ||
        root.getAttribute('author') !== poetId ||
        (root.getAttribute('status') !== 'incomplete' && !isCompletedWork) ||
        root.getAttribute('type') !== 'poetry' ||
        !title?.textContent.trim() ||
        !year?.textContent.trim() ||
        (!isCompletedWork && contents.length !== 0)
      ) {
        issues.push(`${id}: invalid placeholder metadata or body`);
      }

      const info = readFileSync(`fdirs/${poetId}/info.xml`, 'utf8');
      const infoDocument = parseWorkXml(info);
      const listedWorkIds = getElementsByTagNames(infoDocument, ['works'])
        .flatMap((node) => node.textContent.split(','))
        .map((workId) => workId.trim());
      if (!listedWorkIds.includes(workId)) {
        issues.push(`${id}: ${workId} is missing from ${poetId}/info.xml`);
      }
    });

    expect(issues).toEqual([]);
  });
});
