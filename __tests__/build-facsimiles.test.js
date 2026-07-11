import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  extractWithAuto,
  parsePdfImagesList,
  parsePdfInfoPageCount,
  safePdfImagePages,
  validateExtractedPages,
} from '../tools/build-facsimiles.js';

describe('facsimile PDF extraction helpers', () => {
  let tmpdir;

  beforeEach(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-facsimiles-'));
  });

  afterEach(() => {
    fs.rmSync(tmpdir, { recursive: true, force: true });
  });

  const pdfImagesList = `
page   num  type   width height color comp bpc  enc interp  object ID x-ppi y-ppi size ratio
--------------------------------------------------------------------------------------------
   1     0 image     311   386  icc     3   8  image  no       463  0   139   139  371B 0.1%
   1     1 smask     311   386  gray    1   8  image  no       463  0   139   139 5477B 4.6%
   2     2 image    1624  2339  icc     3   8  jpeg   no       171  0   300   300  328K 3.0%
   3     3 image    1566  2312  icc     3   8  jpeg   no       173  0   300   300  182K 1.7%
   3     4 image    1534  2276  icc     3   8  jpeg   no       175  0   300   300  135K 1.3%
   4     5 image    1535  2301  icc     3   8  jp2    no       177  0   300   300  139K 1.3%
`;

  it('parses pdfinfo page counts', () => {
    expect(parsePdfInfoPageCount('Title: Test\nPages:           145\n')).toBe(
      145
    );
  });

  it('selects only pages with one large JPEG image as safe pdfimages pages', () => {
    const images = parsePdfImagesList(pdfImagesList);

    expect(images).toEqual([
      expect.objectContaining({ page: 1, type: 'image', encoding: 'image' }),
      expect.objectContaining({ page: 1, type: 'smask', encoding: 'image' }),
      expect.objectContaining({ page: 2, width: 1624, encoding: 'jpeg' }),
      expect.objectContaining({ page: 3, encoding: 'jpeg' }),
      expect.objectContaining({ page: 3, encoding: 'jpeg' }),
      expect.objectContaining({ page: 4, encoding: 'jp2' }),
    ]);
    expect([...safePdfImagePages(images, 4, 1000)]).toEqual([2]);
  });

  it('uses pdfimages for safe pages and pdftoppm for unsafe pages', async () => {
    const imagesDir = path.join(tmpdir, 'images');
    fs.mkdirSync(imagesDir);
    const calls = [];
    const command = async (cmd, args) => {
      calls.push({ cmd, args });

      if (cmd === 'pdfinfo') {
        return { stdout: 'Pages:           3\n' };
      }

      if (cmd === 'pdfimages' && args.includes('-list')) {
        return {
          stdout: `
page   num  type   width height color comp bpc  enc interp  object ID x-ppi y-ppi size ratio
--------------------------------------------------------------------------------------------
   1     0 image     311   386  icc     3   8  image  no       463  0   139   139  371B 0.1%
   2     1 image    1624  2339  icc     3   8  jpeg   no       171  0   300   300  328K 3.0%
   3     2 image    1566  2312  icc     3   8  jpeg   no       173  0   300   300  182K 1.7%
   3     3 image    1534  2276  icc     3   8  jpeg   no       175  0   300   300  135K 1.3%
`,
        };
      }

      if (cmd === 'pdfimages') {
        const prefix = args[args.length - 1];
        const filename = `${prefix}-002-001.jpg`;
        fs.writeFileSync(filename, 'safe page 2');
        return { stdout: '' };
      }

      if (cmd === 'pdftoppm') {
        const outputPrefix = args[args.length - 1];
        fs.writeFileSync(`${outputPrefix}.jpg`, `rendered ${outputPrefix}`);
        return { stdout: '' };
      }

      throw new Error(`Unexpected command ${cmd}`);
    };

    await extractWithAuto(
      { fullFilename: path.join(tmpdir, 'test.pdf') },
      imagesDir,
      { command }
    );

    expect(fs.readdirSync(imagesDir).sort()).toEqual([
      '000.jpg',
      '001.jpg',
      '002.jpg',
    ]);
    expect(fs.readFileSync(path.join(imagesDir, '001.jpg'), 'utf8')).toBe(
      'safe page 2'
    );
    expect(
      calls.filter(call => call.cmd === 'pdftoppm').map(call => call.args)
    ).toEqual([
      expect.arrayContaining(['-f', '1', '-l', '1']),
      expect.arrayContaining(['-f', '3', '-l', '3']),
    ]);
  });

  it('validates stable page output names', () => {
    fs.writeFileSync(path.join(tmpdir, '000.jpg'), '');
    fs.writeFileSync(path.join(tmpdir, '001.jpg'), '');

    expect(() => validateExtractedPages(tmpdir, 2)).not.toThrow();
    expect(() => validateExtractedPages(tmpdir, 3)).toThrow(/3 sider/);
  });
});
