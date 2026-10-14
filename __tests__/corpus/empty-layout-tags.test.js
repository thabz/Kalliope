import { findEmptyLayoutTags, layoutTagsRequiringContent } from '../../tools/empty-layout-tags.js';
import { loadTrackedWorkFiles } from '../../tools/libs/work-files.js';

const work = body => `<kalliopework><workbody><text><body><poetry>${body}</poetry></body></text></workbody></kalliopework>`;

describe('layout tags with content', () => {
  it.each([...layoutTagsRequiringContent])('rejects empty <%s>, including whitespace and comments', tag => {
    for (const body of [`<${tag}/>`, `<${tag}></${tag}>`, `<${tag}> \n &#160;<!-- tomt --></${tag}>`]) {
      expect(findEmptyLayoutTags(work(body))).toHaveLength(1);
    }
  });

  it('rejects nested empty tags and invisible page and line markers', () => {
    expect(findEmptyLayoutTags(work('<nonum><center><pb n="1" facs="001.jpg"/><br/></center></nonum>')).map(issue => issue.tag)).toEqual(['nonum', 'center']);
  });

  it('accepts text, images, ornaments and standalone markers', () => {
    expect(findEmptyLayoutTags(work('<center><i>VI.</i></center><nonum><asterism/></nonum><right><img src="x.jpg"/></right><pb n="1" facs="001.jpg"/><br/>'))).toEqual([]);
  });

  it('reports source locations', () => {
    expect(findEmptyLayoutTags(work('\n<center/>'), 'test.xml')).toEqual([{ filename: 'test.xml', line: 2, tag: 'center' }]);
  });

  it('has no empty layout tags in the work corpus', () => {
    const issues = loadTrackedWorkFiles().flatMap(({ content, filename }) => findEmptyLayoutTags(content, filename));
    expect(issues.map(({ filename, line, tag }) => `${filename}:${line}: empty <${tag}>`)).toEqual([]);
  });
});
