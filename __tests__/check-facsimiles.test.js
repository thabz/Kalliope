import {
  checkFacsimileReferences,
  facsimilePageUrl,
  findFacsimileReferences,
  isWorkFileContent,
} from '../tools/check-facsimiles.js';

describe('facsimile CI check', () => {
  it('recognizes work XML after an XML declaration', () => {
    expect(
      isWorkFileContent(
        '<?xml version="1.0" encoding="UTF-8"?>\n<kalliopework/>',
      ),
    ).toBe(true);
    expect(isWorkFileContent('<kalliope-author/>')).toBe(false);
  });

  it('finds and normalizes facsimiles declared by work sources', () => {
    const references = findFacsimileReferences(
      [
        {
          filename: 'fdirs/poet/work.xml',
          content: `
<kalliopework>
  <workhead>
    <source facsimile="scan.pdf"/>
    <source id="duplicate" facsimile="scan.pdf"/>
  </workhead>
</kalliopework>`,
        },
      ],
      'https://example.org/facsimiles/',
    );

    expect(references).toEqual([
      {
        filenames: ['fdirs/poet/work.xml'],
        url: 'https://example.org/facsimiles/poet/scan/000.jpg',
      },
    ]);
  });

  it('builds safe URLs for facsimile ids', () => {
    expect(
      facsimilePageUrl(
        'https://example.org/facsimiles',
        'poet id',
        'scan color.PDF',
      ),
    ).toBe(
      'https://example.org/facsimiles/poet%20id/scan%20color/000.jpg',
    );
  });

  it('reports unavailable facsimiles with their source files', async () => {
    const references = [
      {
        filenames: ['fdirs/poet/work.xml'],
        url: 'https://example.org/facsimiles/poet/missing/000.jpg',
      },
      {
        filenames: ['fdirs/poet/other.xml'],
        url: 'https://example.org/facsimiles/poet/available/000.jpg',
      },
    ];
    const fetchMethod = jest.fn(async url => ({
      ok: url.includes('/available/') === true,
      status: url.includes('/available/') === true ? 200 : 404,
    }));

    await expect(
      checkFacsimileReferences(references, { fetchMethod }),
    ).resolves.toEqual([
      {
        ...references[0],
        reason: 'HTTP 404',
      },
    ]);
    expect(fetchMethod).toHaveBeenCalledWith(
      references[0].url,
      expect.objectContaining({ method: 'HEAD' }),
    );
  });
});
