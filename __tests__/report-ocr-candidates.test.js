import {
  findOcrCandidatesInFile,
  formatCandidate,
  removeIgnoredXml,
  removeXmlMarkup,
  repeatedWordsInContext,
  stripXml,
  suggestedWordform,
  textBlocks,
  wordHasAaCircumflexMix,
  wordHasAaRingMix,
  wordHasInternalUppercase,
  wordHasInternalUppercaseCircumflex,
} from '../tools/report-ocr-candidates.js';

describe('OCR candidate report helpers', () => {
  it('strips XML markup from report context', () => {
    expect(stripXml('Sig <i>min</i> Tid &amp; vent.')).toBe(
      'Sig min Tid vent.'
    );
  });

  it('removes ignored editorial XML while preserving line numbers', () => {
    const lines = removeIgnoredXml(
      'Tekst\n<note>på moderne dansk</note>\nMere'
    ).split('\n');

    expect(lines.length).toBe(3);
    expect(lines[1].trim()).toBe('');
  });

  it('removes XML markup but preserves metadata text and line numbers', () => {
    const lines = removeXmlMarkup(
      '<notes>\n<note>opfÃ¸rte skuespil</note>\n</notes>'
    ).split('\n');

    expect(lines).toHaveLength(3);
    expect(lines[1].trim()).toBe('opfÃ¸rte skuespil');
  });

  it('finds text blocks with id, language override and line number', () => {
    const blocks = textBlocks(
      [
        '<kalliopework id="test" author="test">',
        '<text id="one">',
        'Linje',
        '</text>',
        '<text id="two" lang="fr">',
        'Ligne',
        '</text>',
        '</kalliopework>',
      ].join('\n')
    );

    expect(blocks.map(block => [block.id, block.lang, block.startLine])).toEqual(
      [
        ['one', null, 2],
        ['two', 'fr', 5],
      ]
    );
  });

  it('recognizes mixed and internal uppercase character patterns', () => {
    expect(wordHasAaRingMix('saå')).toBe(true);
    expect(wordHasAaRingMix('påa')).toBe(true);
    expect(wordHasAaRingMix('stråalende')).toBe(true);
    expect(wordHasAaRingMix('rååbte')).toBe(true);
    expect(wordHasAaRingMix('på')).toBe(false);

    expect(wordHasAaCircumflexMix('Straâler')).toBe(true);
    expect(wordHasAaCircumflexMix('naâr')).toBe(true);
    expect(wordHasAaCircumflexMix('hâr')).toBe(false);

    expect(wordHasInternalUppercaseCircumflex('bÔer')).toBe(true);
    expect(wordHasInternalUppercaseCircumflex('Ô')).toBe(false);

    expect(wordHasInternalUppercase('tidJig')).toBe(true);
    expect(wordHasInternalUppercase('liUe')).toBe(true);
    expect(wordHasInternalUppercase('detNat')).toBe(true);
    expect(wordHasInternalUppercase('Nympher')).toBe(false);
    expect(wordHasInternalUppercase('DgF')).toBe(false);
  });

  it('recognizes suspicious wordforms and repeated adjacent words', () => {
    expect(suggestedWordform('håndled')).toBe('handled');
    expect(suggestedWordform('Måned')).toBe('Maned');
    expect(suggestedWordform('måned')).toBe('maned');
    expect(suggestedWordform('måne')).toBeNull();

    expect(repeatedWordsInContext('Du trilled som som Perler')).toEqual([
      'som som',
    ]);
    expect(repeatedWordsInContext('Det er som klare Perler')).toEqual([]);
    expect(repeatedWordsInContext('Ha ha! Ja ja.')).toEqual([]);
    expect(repeatedWordsInContext("Naar Læremo'er er ude")).toEqual([]);
  });

  it('reports local suspicious character deviations in Danish text blocks', () => {
    const candidates = findOcrCandidatesInFile({
      filename: 'fdirs/test/aa.xml',
      lang: 'da',
      text: [
        '<kalliopework id="aa" author="test">',
        '<text id="one">',
        'saå han bort',
        'se paå den Fisker',
        'et aåbent Barneøje',
        'i stråalende Lue',
        'de rååbte alle',
        'tætte Straâler',
        'Som bÔer i Naboe-Laget.',
        '</text>',
        '</kalliopework>',
      ].join('\n'),
    });

    expect(candidates.map(candidate => [candidate.word, candidate.rule])).toEqual(
      [
        ['saå', 'mixed-aa-ring'],
        ['paå', 'mixed-aa-ring'],
        ['aåbent', 'mixed-aa-ring'],
        ['stråalende', 'mixed-aa-ring'],
        ['rååbte', 'mixed-aa-ring'],
        ['Straâler', 'mixed-aa-circumflex'],
        ['bÔer', 'internal-uppercase-circumflex'],
      ]
    );
    expect(candidates.every(candidate => candidate.priority === 'høj')).toBe(
      true
    );
  });

  it('reports a single å or â occurrence in a Danish text block', () => {
    const candidates = findOcrCandidatesInFile({
      filename: 'fdirs/test/single.xml',
      lang: 'da',
      text: [
        '<kalliopework id="single" author="test">',
        '<text id="ring">',
        'Let på min Fod,',
        '</text>',
        '<text id="circumflex">',
        'Nu tâlte Magtens Stemmer,',
        '</text>',
        '</kalliopework>',
      ].join('\n'),
    });

    expect(candidates.map(candidate => [candidate.word, candidate.rule])).toEqual(
      [
        ['på', 'single-a-ring-in-text'],
        ['tâlte', 'suspicious-wordform'],
      ]
    );
  });

  it('does not report isolated å occurrences when the work has at least ten', () => {
    const candidates = findOcrCandidatesInFile({
      filename: 'fdirs/test/many-rings.xml',
      lang: 'da',
      text: [
        '<kalliopework id="many-rings" author="test">',
        '<text id="first">Let på min Fod,</text>',
        '<text id="second">Nu går et år, mens båden når en blå å.</text>',
        '<text id="third">Så går vi på.</text>',
        '</kalliopework>',
      ].join('\n'),
    });

    expect(
      candidates.filter(candidate => candidate.rule === 'single-a-ring-in-text')
    ).toEqual([]);
  });

  it('reports known suspicious wordforms with suggested corrections', () => {
    const candidates = findOcrCandidatesInFile({
      filename: 'fdirs/test/wordforms.xml',
      lang: 'da',
      text: [
        '<kalliopework id="wordforms" author="test">',
        '<text id="handled">',
        'Saaledes håndled Kongen i sin Vrede,',
        '</text>',
        '<text id="maned">',
        'Som måned han et Gjenfærd bort,',
        '</text>',
        '<text id="mattet">',
        'Din Tro var måttet af Skuffelser,',
        '</text>',
        '<text id="talte">',
        'Nu tâlte Magtens Stemmer,',
        '</text>',
        '</kalliopework>',
      ].join('\n'),
    });

    expect(
      candidates.map(candidate => [
        candidate.word,
        candidate.rule,
        candidate.reason,
      ])
    ).toEqual([
      [
        'håndled',
        'suspicious-wordform',
        'mistænkelig ordform; mulig rettelse: handled',
      ],
      [
        'måned',
        'suspicious-wordform',
        'mistænkelig ordform; mulig rettelse: maned',
      ],
      [
        'måttet',
        'suspicious-wordform',
        'mistænkelig ordform; mulig rettelse: mattet',
      ],
      [
        'tâlte',
        'suspicious-wordform',
        'mistænkelig ordform; mulig rettelse: talte',
      ],
    ]);
  });

  it('reports internal uppercase letters in every language', () => {
    const candidates = findOcrCandidatesInFile({
      filename: 'fdirs/test/fr.xml',
      lang: 'fr',
      text: [
        '<kalliopework id="fr" author="test">',
        '<text id="fr">',
        'dans leurs plaintes nouveIIes',
        '</text>',
        '</kalliopework>',
      ].join('\n'),
    });

    expect(candidates.map(candidate => [candidate.word, candidate.rule])).toEqual(
      [['nouveIIes', 'internal-uppercase']]
    );
  });

  it('reports probable missing spaces before uppercase letters', () => {
    const candidates = findOcrCandidatesInFile({
      filename: 'fdirs/test/spacing.xml',
      lang: 'da',
      text: '<text id="spacing">dog er detNat endnu</text>',
    });

    expect(candidates.map(candidate => [candidate.word, candidate.rule])).toEqual(
      [['detNat', 'internal-uppercase']]
    );
  });

  it('reports mojibake in metadata and text regardless of language', () => {
    const candidates = findOcrCandidatesInFile({
      filename: 'fdirs/test/mojibake.xml',
      lang: 'en',
      text: [
        '<kalliopework id="mojibake" author="test">',
        '<workhead>',
        '<notes><note>Et opfÃ¸rte skuespil.</note></notes>',
        '</workhead>',
        '<workbody>',
        '<text id="english">an aâ€°rial ship</text>',
        '<text id="swedish" lang="sv">Âskan går.</text>',
        '</workbody>',
        '</kalliopework>',
      ].join('\n'),
    });

    expect(
      candidates.map(candidate => [
        candidate.line,
        candidate.textId,
        candidate.word,
        candidate.rule,
      ])
    ).toEqual([
      [3, '', 'opfÃ¸rte', 'mojibake'],
      [6, 'english', 'aâ€°rial', 'mojibake'],
      [7, 'swedish', 'Âskan', 'mojibake'],
    ]);
  });

  it('reports repeated adjacent words in Danish text with low priority', () => {
    const candidates = findOcrCandidatesInFile({
      filename: 'fdirs/test/repeated.xml',
      lang: 'da',
      text: '<text id="repeated">Du trilled som som Perler</text>',
    });

    expect(
      candidates.map(candidate => [
        candidate.word,
        candidate.rule,
        candidate.priority,
      ])
    ).toEqual([['som som', 'repeated-adjacent-word', 'lav']]);
  });

  it('does not report repeated adjacent words in non-Danish text', () => {
    const candidates = findOcrCandidatesInFile({
      filename: 'fdirs/test/en.xml',
      lang: 'en',
      text: '<text id="en">one last last kiss</text>',
    });

    expect(candidates).toEqual([]);
  });

  it('does not report modern Danish text blocks with many å words', () => {
    const candidates = findOcrCandidatesInFile({
      filename: 'fdirs/test/modern.xml',
      lang: 'da',
      text: [
        '<kalliopework id="modern" author="test">',
        '<text id="modern">',
        'Når solen slår hvirvler på ruden',
        'og står så grå i morgenlys',
        '</text>',
        '</kalliopework>',
      ].join('\n'),
    });

    expect(candidates).toEqual([]);
  });

  it('does not report deferred wordform candidates', () => {
    const candidates = findOcrCandidatesInFile({
      filename: 'fdirs/test/wordforms.xml',
      lang: 'da',
      text: [
        '<kalliopework id="wordforms" author="test">',
        '<text id="wordforms">',
        'naar de taler, som de tænkar?',
        'han fåtted Rytmens Styrke',
        '</text>',
        '</kalliopework>',
      ].join('\n'),
    });

    expect(candidates).toEqual([]);
  });

  it('skips non-Danish files and text blocks with non-Danish language overrides', () => {
    expect(
      findOcrCandidatesInFile({
        filename: 'fdirs/test/fr.xml',
        lang: 'fr',
        text: '<text id="fr">se paå votre âme</text>',
      })
    ).toEqual([]);

    expect(
      findOcrCandidatesInFile({
        filename: 'fdirs/test/da.xml',
        lang: 'da',
        text: [
          '<kalliopework id="da" author="test">',
          '<text id="fr" lang="fr">se paå votre âme</text>',
          '<text id="da">se paå den Fisker</text>',
          '</kalliopework>',
        ].join('\n'),
      }).map(candidate => candidate.textId)
    ).toEqual(['da']);
  });

  it('ignores notes, pictures and skip-index texts', () => {
    const candidates = findOcrCandidatesInFile({
      filename: 'fdirs/test/ignored.xml',
      lang: 'da',
      text: [
        '<kalliopework id="ignored" author="test">',
        '<text id="skip" skip-index="true">se paå den Fisker opfÃ¸rte</text>',
        '<text id="body">',
        '<!-- se paå den Fisker -->',
        '<note>se paå den Fisker</note>',
        '<picture src="x.jpg">Som bÔer i Naboe-Laget.</picture>',
        'Mange Aar uden mistænkelige tegn',
        '</text>',
        '</kalliopework>',
      ].join('\n'),
    });

    expect(candidates).toEqual([]);
  });

  it('allows individual OCR rules to be ignored per text block', () => {
    const candidates = findOcrCandidatesInFile({
      filename: 'fdirs/test/ignore-rule.xml',
      lang: 'da',
      text: [
        '<kalliopework id="ignore-rule" author="test">',
        '<text id="body" ignore-tests="single-a-ring-in-text">',
        'Let på min Fod,',
        'Som bÔer i Naboe-Laget.',
        '</text>',
        '</kalliopework>',
      ].join('\n'),
    });

    expect(candidates.map(candidate => [candidate.word, candidate.rule])).toEqual(
      [['bÔer', 'internal-uppercase-circumflex']]
    );
  });

  it('allows OCR rules to be ignored for a whole work', () => {
    const candidates = findOcrCandidatesInFile({
      filename: 'fdirs/test/ignore-work-rule.xml',
      lang: 'da',
      text: [
        '<kalliopework id="ignore-work-rule" author="test" ignore-tests="mixed-aa-circumflex,single-circumflex-a-in-text,mojibake">',
        '<workhead><notes><note>Et opfÃ¸rte skuespil.</note></notes></workhead>',
        '<workbody>',
        '<text id="reported">saâ detNat</text>',
        '<text id="ignored" ignore-tests="internal-uppercase">saâ detNat</text>',
        '</workbody>',
        '</kalliopework>',
      ].join('\n'),
    });

    expect(
      candidates.map(candidate => [
        candidate.textId,
        candidate.word,
        candidate.rule,
      ])
    ).toEqual([['reported', 'detNat', 'internal-uppercase']]);
  });

  it('allows all new OCR rules to be ignored per text block', () => {
    const candidates = findOcrCandidatesInFile({
      filename: 'fdirs/test/ignore-new-rules.xml',
      lang: 'da',
      text: [
        '<text id="body" ignore-tests="internal-uppercase,mojibake,repeated-adjacent-word">',
        'detNat som som opfÃ¸rte',
        '</text>',
      ].join('\n'),
    });

    expect(candidates).toEqual([]);
  });

  it('formats candidates with text id and rule', () => {
    const candidate = findOcrCandidatesInFile({
      filename: 'fdirs/test/format.xml',
      lang: 'da',
      text: [
        '<kalliopework id="format" author="test">',
        '<text id="format">',
        'Som bÔer i Naboe-Laget.',
        '</text>',
        '</kalliopework>',
      ].join('\n'),
    })[0];

    expect(formatCandidate(candidate)).toBe(
      'høj\tfdirs/test/format.xml:3\tformat\tbÔer\tinternal-uppercase-circumflex\tstort circumflex-tegn midt i ord\tSom bÔer i Naboe-Laget.'
    );
  });
});
