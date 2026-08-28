import {
  auditPageInventory,
  buildPageInventory,
} from '../.codex/skills/pdf-to-kalliope/scripts/audit-utils.js';
import { analyzeWholeWork } from '../.codex/skills/pdf-to-kalliope/scripts/analyze-whole-work.js';
import { historicalOcrCandidates } from '../.codex/skills/pdf-to-kalliope/scripts/audit-ocr-candidates.js';
import {
  updateFinding,
  validateFindings,
} from '../.codex/skills/pdf-to-kalliope/scripts/findings-register.js';
import {
  createCheckpoint,
  validateReviewerRanges,
  verifyCheckpoint,
} from '../.codex/skills/pdf-to-kalliope/scripts/review-checkpoint.js';

const workXml = `<?xml version="1.0"?>
<kalliopework id="1900" author="test">
<workhead><title>Test</title><year>1900</year><pagebreaks/><source facsimile="test" facsimile-pages-num="20" facsimile-pages-offset="1">Test</source></workhead>
<workbody>
<text id="test1900010101">
<head><title>Digt</title><source pages="10-12"/></head>
<body><poetry>Første linje
Sidste paa ti
<pb n="11" facs="011.jpg"/>Første paa elleve
Et spl<pb n="12" facs="012.jpg"/>ittet Ord
Sidste linje</poetry></body>
</text>
</workbody>
</kalliopework>`;

describe('pdf-to-kalliope page inventory and semantic audit', () => {
  it('builds one side-aware JSON row per printed page', () => {
    expect(buildPageInventory({ xml: workXml })).toEqual([
      expect.objectContaining({
        text_id: 'test1900010101',
        printed_page: '10',
        facsimile: '010.jpg',
        first_line: 'Første linje',
        last_line: 'Sidste paa ti',
        expected_transition: 'text-start',
      }),
      expect.objectContaining({
        printed_page: '11',
        facsimile: '011.jpg',
        first_line: 'Første paa elleve',
        last_line: 'Et spl',
        expected_transition: 'pb',
      }),
      expect.objectContaining({
        printed_page: '12',
        facsimile: '012.jpg',
        first_line: 'ittet Ord',
        expected_transition: 'pb-within-word',
      }),
    ]);
  });

  it('fails on uncovered pages and semantic anchor mismatches', () => {
    const inventory = buildPageInventory({ xml: workXml }).map(row => ({
      ...row,
      status: 'reviewed',
      reviewer: 'worker-2',
      disposition: 'Kontrolleret direkte mod facsimilet.',
    }));
    inventory[1].first_line = 'Forkert sidebegyndelse';
    inventory[2].status = 'pending';

    expect(auditPageInventory({ xml: workXml, inventory }).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'mismatched-first-line', key: 'test1900010101:11' }),
        expect.objectContaining({ rule: 'page-not-reviewed', key: 'test1900010101:12' }),
      ]),
    );
  });

  it('inventories pages that are absent because XML is missing page breaks', () => {
    const brokenXml = workXml.replace('<pb n="11" facs="011.jpg"/>', '');
    const inventory = buildPageInventory({ xml: brokenXml });

    expect(inventory.map(row => row.printed_page)).toEqual(['10', '11', '12']);
    expect(inventory[1]).toEqual(expect.objectContaining({
      facsimile: '011.jpg',
      first_line: '',
      expected_transition: 'pb',
    }));
    expect(inventory[2]).toEqual(expect.objectContaining({
      printed_page: '12',
      first_line: 'ittet Ord',
    }));
    const reviewed = inventory.map((row, index) => ({
      ...row,
      status: 'reviewed',
      reviewer: 'worker-2',
      disposition: 'Kontrolleret direkte mod facsimilet.',
      first_line: index === 1 ? 'Facsimilets sidestart' : row.first_line,
    }));
    expect(auditPageInventory({ xml: brokenXml, inventory: reviewed }).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'missing-xml-page', key: 'test1900010101:11' }),
      ]),
    );
  });

  it('expands Roman page ranges while preserving their labels', () => {
    const romanXml = workXml
      .replace('pages="10-12"', 'pages="iii-v"')
      .replace('n="11"', 'n="iv"')
      .replace('n="12"', 'n="v"');
    expect(buildPageInventory({ xml: romanXml }).map(row => row.printed_page)).toEqual([
      'iii', 'iv', 'v',
    ]);
  });
});

describe('whole-work structure wrapper', () => {
  it('keeps text id and page range and flags very long unbroken poems', () => {
    const lines = Array.from({ length: 80 }, (_, index) => `Vers ${index + 1}`).join('\n');
    const xml = workXml.replace(
      /<body><poetry>[\s\S]*?<\/poetry><\/body>/,
      `<body><poetry>${lines}</poetry></body>`,
    ).replace('pages="10-12"', 'pages="10"');
    const [poem] = analyzeWholeWork(xml).poems;

    expect(poem).toEqual(expect.objectContaining({
      text_id: 'test1900010101',
      pages: '10',
      block_index: 1,
    }));
    expect(poem.candidates).toContainEqual(expect.objectContaining({
      type: 'very-long-unbroken-block',
      verse_line_count: 80,
    }));
  });
});

describe('historical OCR candidate profile', () => {
  it('reports side, facsimile and stable anchor for historical OCR patterns', () => {
    const xml = workXml.replace('Første paa elleve', 'Image {kildrer soc1o.ikke Ordxxx');
    const inventory = buildPageInventory({ xml });
    const candidates = historicalOcrCandidates({ xml, inventory });

    expect(candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ rule: 'image-token', printed_page: '11', facsimile: '011.jpg' }),
      expect.objectContaining({ rule: 'long-s-brace', text_id: 'test1900010101', anchor: expect.stringContaining('{kildrer') }),
      expect.objectContaining({ rule: 'digit-inside-word', match: 'c1' }),
      expect.objectContaining({ rule: 'period-without-space', match: 'o.i' }),
      expect.objectContaining({ rule: 'implausible-ending', match: 'Ordxxx' }),
    ]));
  });

  it('reports Fraktur word-shaped candidates without normalizing historical forms', () => {
    const xml = workXml.replace('Første paa elleve', 'forst gjor det fkal voere klart.');
    const inventory = buildPageInventory({ xml });
    const candidates = historicalOcrCandidates({ xml, inventory });

    expect(candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ rule: 'historical-wordform', match: 'forst' }),
      expect.objectContaining({ rule: 'fraktur-letter-confusion', match: 'gjor' }),
      expect.objectContaining({ rule: 'likely-long-s-substitution', match: 'fkal' }),
      expect.objectContaining({ rule: 'fraktur-letter-confusion', match: 'voere' }),
    ]));

    const historicalXml = workXml.replace('Første paa elleve', 'høi skiøn kiær giøre maaskee.');
    expect(historicalOcrCandidates({
      xml: historicalXml,
      inventory: buildPageInventory({ xml: historicalXml }),
    })).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ rule: 'fraktur-letter-confusion' }),
      expect.objectContaining({ rule: 'historical-wordform' }),
    ]));
  });
});

describe('findings registry and frozen checkpoint', () => {
  const finding = {
    id: 'W2-B1-001',
    batch: 'W2-B1',
    reviewer: 'worker-2',
    text_id: 'test1900010101',
    printed_page: '11',
    facsimile: '011.jpg',
    anchor: 'Første paa elleve',
    severity: 'high',
    description: 'Forkert ord',
    status: 'open',
    disposition: null,
    evidence: null,
    snapshot: 'abc123',
  };

  it('preserves stable ids and requires dispositions/evidence', () => {
    expect(validateFindings([finding])).toEqual([]);
    const withdrawn = updateFinding([finding], finding.id, {
      status: 'withdrawn',
      disposition: 'Auditor trak fundet tilbage.',
      evidence: 'facs 011.jpg',
    });
    expect(withdrawn[0].id).toBe(finding.id);
    expect(validateFindings(withdrawn)).toEqual([]);
    expect(validateFindings([{ ...finding, status: 'withdrawn' }])).toEqual(
      expect.arrayContaining([
        expect.stringContaining('mangler disposition'),
        expect.stringContaining('mangler evidence'),
      ]),
    );
  });

  it('blocks READY on open findings and detects mutations after a checkpoint', () => {
    expect(() => createCheckpoint({
      root: process.cwd(),
      findings: [finding],
      inventory: [{ text_id: 'test', printed_page: '1', status: 'reviewed' }],
      tests: [{ command: 'npm test', status: 'passed' }],
      reviewerRanges: [],
    })).toThrow('åben finding');

    const original = {
      head: 'abc', diff_sha256: 'one', changed_files: ['work.xml'], file_sha256: { 'work.xml': 'hash' },
    };
    const checkpoint = createCheckpoint({
      root: process.cwd(),
      findings: [{
        ...finding,
        status: 'fixed',
        disposition: 'Rettet mod facsimilet.',
        evidence: 'før → efter, facs 011.jpg',
      }],
      inventory: [{
        text_id: 'test', printed_page: '1', facsimile: '010.jpg',
        status: 'reviewed', reviewer: 'anna', disposition: 'Kontrolleret.',
      }],
      tests: [{ command: 'npm test', status: 'passed' }],
      reviewerRanges: [{ reviewer: 'anna', facsimile_from: '010.jpg', facsimile_to: '010.jpg' }],
      state: original,
    });
    expect(verifyCheckpoint({ root: process.cwd(), checkpoint, state: original }).status).toBe('valid');
    expect(verifyCheckpoint({
      root: process.cwd(),
      checkpoint,
      state: { ...original, diff_sha256: 'two' },
    }).status).toBe('invalid');
  });

  it('requires explicit non-overlapping reviewer ranges with full coverage', () => {
    const inventory = [
      { facsimile: '010.jpg', reviewer: 'anna' },
      { facsimile: '011.jpg', reviewer: 'bo' },
    ];
    expect(validateReviewerRanges([
      { reviewer: 'anna', facsimile_from: '010.jpg', facsimile_to: '010.jpg' },
      { reviewer: 'bo', facsimile_from: '011.jpg', facsimile_to: '011.jpg' },
    ], inventory)).toEqual([]);
    expect(validateReviewerRanges([
      { reviewer: 'anna', facsimile_from: '010.jpg', facsimile_to: '011.jpg' },
      { reviewer: 'bo', facsimile_from: '011.jpg', facsimile_to: '012.jpg' },
    ], inventory)).toEqual(expect.arrayContaining([
      expect.stringContaining('overlappende reviewer-ranges'),
      expect.stringContaining('dækkes af 2 reviewer-ranges'),
    ]));
  });
});
