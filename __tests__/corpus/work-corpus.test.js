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
  collectRedundantTextTitleMetadataIssues,
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

const proseXml = (xml) =>
  xml.replace(/<poetry\b[^>]*>([\s\S]*?)<\/poetry>/gu, (_match, poetry) =>
    [...poetry.matchAll(
      /<(?:note|footnote)\b[^>]*>[\s\S]*?<\/(?:note|footnote)>/gu
    )]
      .map(([note]) => note)
      .join('\n')
  );

const proseWordDivisionPattern = /\b([\p{L}]{3,})- ([\p{L}]{3,})\b/gu;
const hyphenatedCoordinationWords = new Set([
  'and',
  'eller',
  'et',
  'och',
  'oder',
  'og',
  'or',
  'ou',
  'und',
]);

describe('tracked work corpus', () => {
  let filenames;
  let bodyLinkIssues;
  let emptyAndreFiles;
  let formattingIssues;
  let proseWordDivisionIssues;
  let pageBreakIssues;
  let pageIntervalIssues;
  let pageOnlySourceIssues;
  let poetryBoundaryBlankLineIssues;
  let asteriskOrnamentSpacingIssues;
  let rawAsteriskOrnamentIssues;
  let andreWorkheadSourceIssues;
  let externalSourceLinkIssues;
  let textFollowsNoteIssues;
  let textStructureIssues;
  let redundantTextTitleMetadataIssues;
  let unindexedAnthologyTexts;

  beforeAll(() => {
    const works = loadTrackedWorkFiles();
    const corpusWords = new Set(
      works.flatMap(({ content: xml }) =>
        [...xml.replace(/<[^>]+>/gu, ' ').matchAll(/[\p{L}]+/gu)].map(
          ([word]) => word.toLocaleLowerCase('da')
        )
      )
    );
    filenames = works.map((work) => work.filename);
    bodyLinkIssues = [];
    emptyAndreFiles = [];
    formattingIssues = [];
    proseWordDivisionIssues = [];
    pageBreakIssues = [];
    pageIntervalIssues = [];
    pageOnlySourceIssues = [];
    poetryBoundaryBlankLineIssues = [];
    asteriskOrnamentSpacingIssues = [];
    rawAsteriskOrnamentIssues = [];
    andreWorkheadSourceIssues = [];
    externalSourceLinkIssues = [];
    textFollowsNoteIssues = [];
    textStructureIssues = [];
    redundantTextTitleMetadataIssues = [];
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

      const xmlWithoutOrnamentBoundarySpacing = xml
        .replace(
          /(<poetry(?:[ \t][^<>]*)?>\r?\n)[ \t]*\r?\n(?=<nonum><center>\*(?: \*){2,}<\/center><\/nonum>)/gu,
          '$1'
        )
        .replace(
          /(<nonum><center>\*(?: \*){2,}<\/center><\/nonum>\r?\n)[ \t]*\r?\n(?=<\/poetry>)/gu,
          '$1'
        );
      if (
        /<poetry(?:[ \t][^<>]*)?>\r?\n[ \t]*\r?\n/.test(
          xmlWithoutOrnamentBoundarySpacing
        ) ||
        /\r?\n[ \t]*\r?\n<\/poetry>/.test(xmlWithoutOrnamentBoundarySpacing)
      ) {
        poetryBoundaryBlankLineIssues.push(filename);
      }

      for (const match of proseXml(xml).matchAll(proseWordDivisionPattern)) {
        const secondPart = match[2].toLocaleLowerCase('da');
        const joinedWord = `${match[1]}${match[2]}`.toLocaleLowerCase('da');
        if (
          corpusWords.has(joinedWord) &&
          !hyphenatedCoordinationWords.has(secondPart)
        ) {
          proseWordDivisionIssues.push(`${filename}: ${match[0]}`);
        }
      }

      const xmlLines = xml.replace(/\r\n?/g, '\n').split('\n');
      xmlLines.forEach((line, index) => {
        if (
          !/^<nonum><center>\*(?: \*){2,}<\/center><\/nonum>$/.test(
            line.trim()
          )
        ) return;
        if (xmlLines[index - 1] !== '' || xmlLines[index + 1] !== '') {
          asteriskOrnamentSpacingIssues.push(`${filename}:${index + 1}`);
        }
      });

      if (/^[ \t]*\*(?:[ \t]+\*){2,}[ \t]*$/m.test(xml)) {
        rawAsteriskOrnamentIssues.push(filename);
      }

      const checks = checksForWorkXml(xml);
      redundantTextTitleMetadataIssues.push(
        ...collectRedundantTextTitleMetadataIssues(filename, parseWorkXml(xml)),
      );
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

  it('does not preserve probable print-line word divisions in prose', () => {
    expect(proseWordDivisionIssues).toEqual([]);
  });

  it('keeps a blank line around centered asterisk ornaments', () => {
    expect(asteriskOrnamentSpacingIssues).toEqual([]);
  });

  it('requires centered nonum markup for asterisk ornaments', () => {
    expect(rawAsteriskOrnamentIssues).toEqual([]);
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

  it('does not retain text title metadata identical to the title', () => {
    expect(redundantTextTitleMetadataIssues).toEqual([]);
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

  it('keeps every selected publication as an indexed work file', () => {
    const issues = [];

    decisions.forEach(({ id, kalliope }) => {
      const poetId = kalliope?.poet_id;
      const workId = kalliope?.work_id;
      const filename = `fdirs/${poetId}/${workId}.xml`;
      const work = registeredWorks.get(id);

      if (work?.kalliope?.poet_id !== poetId || work?.kalliope?.work_id !== workId) {
        issues.push(`${id}: missing or inconsistent work-register link`);
      }
      if (work?.status === 'included') {
        return;
      }
      if (work?.status !== 'registered') {
        issues.push(`${id}: missing or inconsistent work-register status`);
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
