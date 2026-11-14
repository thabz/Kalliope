import { extractPoetryBlocks } from '../.agents/skills/pdf-to-kalliope/scripts/prepare-poetry-geometry.js';
import { prepareRunInGeometry, physicalRows } from '../.agents/skills/pdf-to-kalliope/scripts/prepare-run-in-geometry.js';
import { validateWholeWorkCandidates } from '../.agents/skills/pdf-to-kalliope/scripts/review-checkpoint.js';
import { analyzeWholeWork } from '../.agents/skills/pdf-to-kalliope/scripts/analyze-whole-work.js';

const work = body => `<kalliopework><workhead/><workbody><text id="outer"><head><source facsimile-pages="1-2"/></head><body>${body}</body></text></workbody></kalliopework>`;
const row = (text, top, left = 100) => ({ text, top, left, width: text.length * 8, height: 20, page: 1 });
const variant = lines => [{ name: 'psm6', lines }];
const units = report => report.blocks[0].units;

describe('running stanza OCR geometry', () => {
  it('matches physical rows without turning them into editorial verse lines', () => {
    const xml = work('<poetry>En faktisk verslinje\n    <wrap>Første strofe begynder her og fortsætter paa anden linje.</wrap>\n</poetry>');
    const report = prepareRunInGeometry({ xml, variantsByFacsimile: { '000.jpg': variant([
      row('1', 0), row('En faktisk verslinje', 30), row('Første strofe begynder her', 60, 130),
      row('og fortsætter paa anden linje.', 90), row('Kustode', 160),
    ]) } });
    expect(report.status).toBe('matched');
    expect(units(report)[0].indentation).toBe(4);
    expect(units(report)[0].segments[0]).toMatchObject({ physical_line_count: 2, first_text: 'Første strofe begynder her' });
    expect(report.pages[0].unmatched_rows.map(line => line.text)).toEqual(['1', 'En faktisk verslinje', 'Kustode']);
    expect(extractPoetryBlocks(xml)[0].lines).toHaveLength(1);
  });

  it('aligns both halves of a word divided by a physical page break', () => {
    const xml = work('<poetry><wrap>En lang begyndelse med spl<pb facs="001.jpg"/>ittet ord paa næste side.</wrap></poetry>');
    const report = prepareRunInGeometry({ xml, variantsByFacsimile: {
      '000.jpg': variant([row('En lang begyndelse med spl-', 50)]),
      '001.jpg': variant([row('ittet ord paa næste side.', 50)]),
    } });
    expect(units(report)[0].segments.map(segment => segment.status)).toEqual(['matched', 'matched']);
    expect(units(report)[0].segments.map(segment => segment.text).join('')).toBe('En lang begyndelse med splittet ord paa næste side.');
  });

  it('uses monotonic nonoverlapping windows for repeated refrains', () => {
    const xml = work('<poetry><wrap>Det samme omkvæd gentages her</wrap>\n<wrap>Det samme omkvæd gentages her</wrap></poetry>');
    const report = prepareRunInGeometry({ xml, variantsByFacsimile: { '000.jpg': variant([
      row('Det samme omkvæd gentages her', 50), row('Det samme omkvæd gentages her', 80),
    ]) } });
    expect(units(report).map(unit => unit.segments[0].rows[0].top)).toEqual([50, 80]);
    const missing = prepareRunInGeometry({ xml, variantsByFacsimile: { '000.jpg': variant([row('Det samme omkvæd gentages her', 50)]) } });
    expect(units(missing).filter(unit => unit.segments[0].status === 'matched')).toHaveLength(1);
    expect(missing.status).toBe('manual_review');
  });

  it('reports competing physical positions and missing OCR instead of claiming readiness', () => {
    const xml = work('<poetry><wrap>Ord med to mulige placeringer</wrap></poetry>');
    const report = prepareRunInGeometry({ xml, variantsByFacsimile: { '000.jpg': variant([
      row('Ord med to mulige placeringer', 50), row('Ord med to mulige placeringer', 100),
    ]) } });
    expect(units(report)[0].segments[0].status).toBe('ambiguous');
    expect(prepareRunInGeometry({ xml }).status).toBe('manual_review');
  });

  it('validates current structure with attached OCR evidence and still detects changed units', () => {
    const xml = work('<poetry><wrap>En lang strofe med mange ord</wrap></poetry>');
    const analysis = analyzeWholeWork(xml, { variantsByFacsimile: {
      '000.jpg': variant([row('En lang strofe med mange ord', 50)]),
    } });
    const findings = analysis.poems.flatMap(poem => poem.candidates.map(candidate => ({
      candidate_id: candidate.candidate_id, status: 'verified',
    })));
    expect(validateWholeWorkCandidates({ analysis, workXml: xml, findings })).toEqual([]);
    analysis.poems[0].run_in.units[0].text = 'Forkert tekst';
    expect(validateWholeWorkCandidates({ analysis, workXml: xml, findings }))
      .toContain('digtet outer svarer ikke til aktuel XML');
  });

  it('flags equally good OCR passes that disagree on physical row count', () => {
    const xml = work('<poetry><wrap>En lang strofe med mange ord</wrap></poetry>');
    const report = prepareRunInGeometry({ xml, variantsByFacsimile: { '000.jpg': [
      { name: 'one', lines: [row('En lang strofe med mange ord', 50)] },
      { name: 'two', lines: [row('En lang strofe', 50), row('med mange ord', 80)] },
    ] } });
    expect(units(report)[0].segments[0].status).toBe('ambiguous');
    expect(units(report)[0].segments[0].variant_alternatives).toHaveLength(1);
  });

  it('chooses the best OCR pass for a page and joins boxes on a shared baseline', () => {
    const xml = work('<poetry><wrap>Den lange strofe fortsætter her</wrap></poetry>');
    const lines = [row('Den lange strofe', 50), row('fortsætter her', 50, 250)];
    expect(physicalRows(lines)).toHaveLength(1);
    const report = prepareRunInGeometry({ xml, variantsByFacsimile: { '000.jpg': [
      { name: 'bad', lines: [row('Helt andre ord', 50)] }, { name: 'good', lines },
    ] } });
    expect(report.pages[0].variant).toBe('good');
    expect(units(report)[0].segments[0].physical_line_count).toBe(1);
    expect(analyzeWholeWork(xml, { variantsByFacsimile: { '000.jpg': variant(lines) } }).poems[0].run_in.geometry.units).toHaveLength(1);
  });
});

describe('nested text geometry ownership', () => {
  const xml = work(`<poetry><wrap>Ydre første strofe</wrap></poetry>
<text id="child"><head><source facsimile-pages="1-2"/></head><body>
<poetry><wrap>Indre strofe<pb facs="001.jpg"/>fortsat</wrap></poetry>
</body></text>
<poetry><wrap>Ydre senere strofe</wrap></poetry>`);
  it('collects child poetry once and carries its page transition into later parent poetry', () => {
    const blocks = extractPoetryBlocks(xml);
    expect(blocks.map(block => [block.textId, block.blockIndex])).toEqual([['outer', 1], ['child', 1], ['outer', 2]]);
    expect(blocks[2].runInUnits[0].segments[0].facsimile).toBe('001.jpg');
    const report = analyzeWholeWork(xml);
    expect(report.poems.map(block => [block.text_id, block.block_index])).toEqual([['outer', 1], ['outer', 2], ['child', 1]]);
    expect(report.poems.map(block => block.run_in.unit_count)).toEqual([1, 1, 1]);
  });
});
