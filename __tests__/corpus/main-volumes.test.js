import {
  getChildByTagName,
  getChildrenByTagName,
  getElementsByTagName,
} from '../../tools/build-static/xml.js';
import { loadTrackedWorkFiles } from '../../tools/libs/work-files.js';
import { parseWorkXml } from '../../tools/work-validation.js';

const mainVolumePoemIssues = (filename, document) => {
  const workBody = getChildByTagName(document.documentElement, 'workbody');
  if (
    workBody == null ||
    getChildrenByTagName(workBody, 'subwork').length === 0
  ) {
    return [];
  }

  return getElementsByTagName(workBody, 'text')
    .filter(text => {
      const body = getChildByTagName(text, 'body');
      return body != null && getElementsByTagName(body, 'poetry').length > 0;
    })
    .map(text =>
      `${filename}: hovedbind med <subwork> indeholder digtet ${text.getAttribute('id')}; digtet skal placeres i det relevante underbind.`,
    );
};

const issuesFor = content => mainVolumePoemIssues('work.xml', parseWorkXml(
  `<kalliopework><workbody>${content}</workbody></kalliopework>`,
));

const poem = '<text id="poem"><body><poetry>Vers</poetry></body></text>';
const issue = 'work.xml: hovedbind med <subwork> indeholder digtet poem; digtet skal placeres i det relevante underbind.';

describe('hovedbind uden digte', () => {
  it('rejects poems directly in a main volume', () => {
    expect(issuesFor(`<subwork ref="volume-1"/>${poem}`)).toEqual([issue]);
  });

  it('rejects poems in nested sections regardless of subwork order', () => {
    expect(issuesFor(`
      <section><content><section><content>${poem}</content></section></content></section>
      <subwork ref="volume-1"/>
    `)).toEqual([issue]);
  });

  it('allows poems in works without subworks', () => {
    expect(issuesFor(poem)).toEqual([]);
  });

  it('allows a main volume containing only subworks', () => {
    expect(issuesFor('<subwork ref="volume-1"/><subwork ref="volume-2"/>'))
      .toEqual([]);
  });

  it('allows prose paratext in a main volume', () => {
    expect(issuesFor(`
      <subwork ref="volume-1"/>
      <text id="foreword"><body><prose>Forord</prose></body></text>
    `)).toEqual([]);
  });

  it('ignores commented-out poems and subwork references', () => {
    expect(issuesFor(`<subwork ref="volume-1"/><!-- ${poem} -->`)).toEqual([]);
    expect(issuesFor(`<!-- <subwork ref="volume-1"/> -->${poem}`)).toEqual([]);
  });

  it('checks every tracked main volume for poems', () => {
    // The bulk dataset does not expose <subwork> structure; check source XML.
    const works = loadTrackedWorkFiles();
    const candidates = works.filter(({ content }) => /<subwork\b/.test(content));
    const issues = candidates.flatMap(({ filename, content }) =>
      mainVolumePoemIssues(filename, parseWorkXml(content)),
    );

    expect(candidates.length).toBeGreaterThan(0);
    expect(issues).toEqual([]);
  });
});
