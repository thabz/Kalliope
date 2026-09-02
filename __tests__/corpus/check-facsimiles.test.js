import {
  checkFacsimileReferences,
  facsimileAssetUrls,
  facsimilePageUrl,
  findFacsimileReferences,
  isWorkFileContent,
} from '../../tools/check-facsimiles.js';

describe('facsimile checker unit logic', () => {
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
        urls: facsimileAssetUrls(
          'https://example.org/facsimiles/',
          'poet',
          'scan.pdf',
        ),
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

  it('fails when the original exists but a responsive thumbnail is missing', async () => {
    const references = findFacsimileReferences(
      [
        {
          filename: 'fdirs/poet/work.xml',
          content: `
<kalliopework>
  <workhead>
    <source facsimile="scan"/>
  </workhead>
</kalliopework>`,
        },
      ],
      'https://example.org/facsimiles',
    );
    const missingUrl =
      'https://example.org/facsimiles/poet/scan/t/000-w250.jpg';
    const fetchMethod = jest.fn(async url => ({
      ok: url !== missingUrl,
      status: url === missingUrl ? 404 : 200,
    }));

    await expect(
      checkFacsimileReferences(references, { fetchMethod }),
    ).resolves.toEqual([
      {
        filenames: ['fdirs/poet/work.xml'],
        urls: facsimileAssetUrls(
          'https://example.org/facsimiles',
          'poet',
          'scan',
        ),
        reason: 'HTTP 404',
        url: missingUrl,
      },
    ]);
    expect(fetchMethod).toHaveBeenCalledWith(
      missingUrl,
      expect.objectContaining({ method: 'HEAD' }),
    );
    expect(fetchMethod).toHaveBeenCalledTimes(2);
  });
});
