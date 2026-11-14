import { extractRunInUnits } from '../.agents/skills/pdf-to-kalliope/scripts/run-in-structure.js';
import { analyzeWholeWork } from '../.agents/skills/pdf-to-kalliope/scripts/analyze-whole-work.js';
import { validateVisualStructureReviews } from '../.agents/skills/pdf-to-kalliope/scripts/review-checkpoint.js';

const xml = `<kalliopework><workhead/><workbody><text id="example">
<head><source pages="176-179" facsimile-pages="231-232"/></head>
<body><poetry>En faktisk verslinje
<wrap>Første strofe</wrap>

    <wrap>2. Et <i>spl<pb n="179" facs="231.jpg"/>ittet</i> Ord &amp; mere.</wrap>
</poetry></body></text></workbody></kalliopework>`;

describe('running stanzas retain their physical page segments', () => {
  it('preserves an inline word split without creating a verse line or space', () => {
    const units = extractRunInUnits({
      serialized: '    <wrap>Et <i>spl<pb facs="008.jpg"/>ittet</i> Ord &amp; mere.</wrap>',
      startingFacsimile: '007.jpg',
    });
    expect(units).toEqual([{
      unit_index: 1, indentation: 4, text: 'Et splittet Ord & mere.',
      segments: [
        { facsimile: '007.jpg', text: 'Et spl' },
        { facsimile: '008.jpg', text: 'ittet Ord & mere.' },
      ],
    }]);
  });

  it('tracks page markers between units and before their first visible text', () => {
    const units = extractRunInUnits({
      serialized: '<wrap>A</wrap>\n<pb facs="003.jpg"/>    <wrap><pb facs="004.jpg"/>B</wrap>',
      startingFacsimile: '002.jpg',
    });
    expect(units.map(unit => [unit.indentation, unit.segments])).toEqual([
      [0, [{ facsimile: '002.jpg', text: 'A' }]],
      [4, [{ facsimile: '004.jpg', text: 'B' }]],
    ]);
  });

  it('handles multiline wrappers and excludes inline comments', () => {
    expect(extractRunInUnits({ serialized: '<wrap>A<!-- source -->\nB</wrap>' })[0].text)
      .toBe('A\nB');
  });

  it('reports running stanzas in mixed verse blocks as a distinct structure', () => {
    const poem = analyzeWholeWork(xml).poems[0];
    expect(poem.stanza.verse_line_count).toBe(1);
    expect(poem.run_in.unit_count).toBe(2);
    expect(poem.run_in.units[1].segments.map(segment => segment.facsimile))
      .toEqual(['230.jpg', '231.jpg']);
    expect(poem.candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'run_in_structure_review', unit_count: 2, segment_count: 3 }),
    ]));
  });
});

describe('visual run-in checkpoint', () => {
  const analysis = analyzeWholeWork(xml);
  const poem = analysis.poems[0];
  const review = {
    text_id: 'example', block_index: 1, reviewer: 'independent', status: 'reviewed',
    visual_stanza_lengths: poem.stanza.observed_stanza_lengths,
    facsimiles: ['230.jpg', '231.jpg'], disposition: 'Alle kildeafsnit er læst.',
    visual_run_in_units: poem.run_in.units.map(unit => ({
      unit_index: unit.unit_index, indentation: unit.indentation,
      segments: unit.segments.map(segment => ({
        facsimile: segment.facsimile, physical_line_count: 2,
        first_text: segment.text, last_text: segment.text,
      })),
    })),
  };
  const validate = value => validateVisualStructureReviews({
    analysis, reviews: [value], producer: 'editor',
  });

  it('rejects an empty verse profile as evidence for running stanzas', () => {
    expect(validate({ ...review, visual_run_in_units: undefined }))
      .toEqual(expect.arrayContaining([expect.stringContaining('alle løbende strofer')]));
  });

  it('accepts a separate source profile for every stanza and page segment', () => {
    expect(validate(review)).toEqual([]);
  });

  it('rejects an unidentified physical page even when the profile repeats it', () => {
    const brokenAnalysis = JSON.parse(JSON.stringify(analysis));
    brokenAnalysis.poems[0].run_in.units[0].segments[0].facsimile = null;
    const brokenReview = JSON.parse(JSON.stringify(review));
    brokenReview.visual_run_in_units[0].segments[0].facsimile = null;
    expect(validateVisualStructureReviews({
      analysis: brokenAnalysis, reviews: [brokenReview], producer: 'editor',
    }).length).toBeGreaterThan(0);
  });

  it.each(['indentation', 'missing_segment', 'physical_line_count', 'anchor', 'wrong_anchor'])('rejects a bad %s', problem => {
    const changed = JSON.parse(JSON.stringify(review));
    const unit = changed.visual_run_in_units[1];
    if (problem === 'indentation') unit.indentation = 0;
    if (problem === 'missing_segment') unit.segments.pop();
    if (problem === 'physical_line_count') unit.segments[0].physical_line_count = 0;
    if (problem === 'anchor') unit.segments[0].first_text = '';
    if (problem === 'wrong_anchor') unit.segments[0].first_text = 'Andre ord';
    expect(validate(changed).length).toBeGreaterThan(0);
  });
});
