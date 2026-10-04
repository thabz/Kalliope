import fs from 'fs';
import { execFileSync } from 'child_process';
import { loadXMLDoc, getChildByTagName, getChildrenByTagName } from '../../tools/build-static/xml.js';

const biographyFiles = execFileSync(
  'git',
  ['ls-files', 'fdirs/*/bio.xml'],
  { encoding: 'utf8' }
)
  .trim()
  .split('\n')
  .filter(filename => filename.length > 0);

describe('biography XML structure', () => {
  it.each(biographyFiles)('%s has biographies as its only content model', filename => {
    const doc = loadXMLDoc(filename);
    const bio = getChildByTagName(doc, 'bio');
    const biographies = getChildByTagName(bio, 'biographies');
    const entries = getChildrenByTagName(biographies, 'biography');

    expect(biographies).not.toBeNull();
    expect(entries.length).toBeGreaterThan(0);
    for (const biography of entries) {
      expect(getChildByTagName(biography, 'body')).not.toBeNull();
      const hidden = biography.getAttribute('hidden');
      expect(hidden == null || hidden === 'true').toBe(true);
    }

    expect(fs.readFileSync(filename, 'utf8')).not.toMatch(/^\s*---\s*$/m);
  });
});
