import { findTextInUnlistedWork } from '../tools/build-static/workfiles.js';

describe('unlisted work files', () => {
  it('finds a referenced text in an unlisted work', () => {
    const workFile = {
      filename: 'fdirs/poet/new.xml',
      infoFilename: 'fdirs/poet/info.xml',
      content: '<kalliopework><text id="poet2026072301"/></kalliopework>',
    };

    expect(findTextInUnlistedWork('poet2026072301', [workFile])).toBe(workFile);
  });

  it('does not match a different text id', () => {
    const workFile = {
      filename: 'fdirs/poet/new.xml',
      infoFilename: 'fdirs/poet/info.xml',
      content: '<kalliopework><text id="poet2026072301"/></kalliopework>',
    };

    expect(findTextInUnlistedWork('poet2026072302', [workFile])).toBeUndefined();
  });
});
