import { validateFacsimileCompletion } from '../tools/validate-facsimile-completions.js';

const work = ({
  status = 'complete',
  facsimile = true,
  proofreadings = '<proofreadings><proofreading model="gpt-5.6-sol" datetime="2026-09-01T21:00:00+02:00"/></proofreadings>',
  qualities = ['korrektur1,korrektur2,kilde,side', 'side, kilde, korrektur2, korrektur1'],
} = {}) => `<?xml version="1.0"?>
<kalliopework id="1900" author="test" status="${status}">
<workhead><title>Test</title>${proofreadings}${facsimile ? '<source facsimile="scan"/>' : '<source>Trykt kilde</source>'}</workhead>
<workbody>${qualities.map((quality, index) => `<text id="test${index + 1}"><head><quality>${quality}</quality></head><body><poetry>Linje</poetry></body></text>`).join('')}</workbody>
</kalliopework>`;

describe('first transition to complete for facsimile works', () => {
  it('accepts attestations and all four quality flags on every text', () => {
    expect(validateFacsimileCompletion({
      baseXml: work({ status: 'incomplete', proofreadings: '', qualities: ['', ''] }),
      headXml: work(),
      filename: 'fdirs/test/1900.xml',
    })).toEqual([]);
  });

  it('accepts multiple preserved attestations', () => {
    const proofreadings = '<proofreadings><proofreading model="old-model" datetime="2025-01-01T00:00:00Z"/><proofreading model="new-model" datetime="2026-09-01T21:00:00+02:00"/></proofreadings>';
    expect(validateFacsimileCompletion({ baseXml: null, headXml: work({ proofreadings }) })).toEqual([]);
  });

  it('requires an attestation and every quality flag on every text', () => {
    const errors = validateFacsimileCompletion({
      baseXml: work({ status: 'incomplete' }),
      headXml: work({ proofreadings: '', qualities: ['korrektur1,kilde,side', 'korrektur1,korrektur2,kilde'] }),
      filename: 'fdirs/test/1900.xml',
    });
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('<proofreadings>'),
      expect.stringContaining('test1 mangler kvalitetsmærkerne korrektur2'),
      expect.stringContaining('test2 mangler kvalitetsmærkerne side'),
    ]));
  });

  it('requires a nonblank model and a timestamp with timezone', () => {
    const errors = validateFacsimileCompletion({
      baseXml: null,
      headXml: work({ proofreadings: '<proofreadings><proofreading model=" " datetime="2026-09-01T21:00:00"/></proofreadings>' }),
    });
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining('mangler modelnavn'),
      expect.stringContaining('ugyldigt ISO 8601-tidspunkt med tidszone'),
    ]));
  });

  it.each([
    ['an incomplete draft', null, work({ status: 'incomplete', proofreadings: '', qualities: ['', ''] })],
    ['a non-facsimile work', null, work({ facsimile: false, proofreadings: '', qualities: ['', ''] })],
    ['later changes to an already complete work', work({ proofreadings: '', qualities: ['', ''] }), work({ proofreadings: '', qualities: ['', ''] })],
  ])('does not enforce the first-completion gate for %s', (_label, baseXml, headXml) => {
    expect(validateFacsimileCompletion({ baseXml, headXml })).toEqual([]);
  });
});
