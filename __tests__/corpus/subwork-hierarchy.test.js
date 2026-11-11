import { loadTrackedWorkFiles } from '../../tools/libs/work-files.js';
import { parseWorkXml } from '../../tools/work-validation.js';
import { getElementsByTagNames } from '../../tools/build-static/xml.js';

it('allows subworks only as leaves of the work hierarchy', () => {
  const works = loadTrackedWorkFiles().map(({ filename, content }) => {
    const document = parseWorkXml(content);
    const root = document.documentElement;
    const author = root.getAttribute('author');
    return {
      filename,
      key: `${author}/${root.getAttribute('id')}`,
      parent: root.getAttribute('parent') ?? '',
      author,
      children: getElementsByTagNames(root, ['subwork']).map(
        subwork => `${author}/${subwork.getAttribute('ref')}`
      ),
    };
  });
  const parents = new Map();
  const children = new Map();
  const addRelation = (parent, child) => {
    if (parents.has(child) === false) parents.set(child, new Set());
    if (children.has(parent) === false) children.set(parent, new Set());
    parents.get(child).add(parent);
    children.get(parent).add(child);
  };
  for (const work of works) {
    if (work.parent.length > 0) {
      addRelation(`${work.author}/${work.parent}`, work.key);
    }
    for (const child of work.children) addRelation(work.key, child);
  }

  const issues = works
    .filter(work => parents.has(work.key) && children.has(work.key))
    .map(work => ({
      filename: work.filename,
      parents: [...parents.get(work.key)].sort(),
      subworks: [...children.get(work.key)].sort(),
    }));
  expect(issues).toEqual([]);
});
