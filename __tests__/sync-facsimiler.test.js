import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

describe('sync-facsimiler', () => {
  let tmpdir;

  beforeEach(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'kalliope-sync-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpdir, { recursive: true, force: true });
  });

  it('gør mapper og filer læsbare for webserveren', () => {
    const sourceDir = path.join(tmpdir, 'source');
    const pagesDir = path.join(sourceDir, 'work');
    const destinationDir = path.join(tmpdir, 'destination');
    const pdfFilename = path.join(sourceDir, 'work.pdf');
    const pageFilename = path.join(pagesDir, '000.jpg');
    fs.mkdirSync(pagesDir, { recursive: true });
    fs.mkdirSync(destinationDir);
    fs.writeFileSync(pdfFilename, 'pdf');
    fs.writeFileSync(pageFilename, 'jpg');
    fs.chmodSync(pagesDir, 0o700);
    fs.chmodSync(pdfFilename, 0o600);
    fs.chmodSync(pageFilename, 0o600);

    const result = spawnSync('sh', ['tools/sync-facsimiler.sh'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        KALLIOPE_FACSIMILE_SOURCE_DIR: sourceDir,
        KALLIOPE_FACSIMILE_RSYNC_TARGET: destinationDir,
      },
    });

    expect(result.status).toBe(0);
    expect(fs.statSync(pagesDir).mode & 0o777).toBe(0o755);
    expect(fs.statSync(pdfFilename).mode & 0o777).toBe(0o644);
    expect(fs.statSync(pageFilename).mode & 0o777).toBe(0o644);
    expect(fs.statSync(path.join(destinationDir, 'work')).mode & 0o777).toBe(
      0o755
    );
    expect(fs.statSync(path.join(destinationDir, 'work.pdf')).mode & 0o777).toBe(
      0o644
    );
    expect(
      fs.statSync(path.join(destinationDir, 'work', '000.jpg')).mode & 0o777
    ).toBe(0o644);
  });
});
