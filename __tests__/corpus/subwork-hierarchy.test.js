import { loadTrackedWorkFiles } from '../../tools/libs/work-files.js';
import { parseWorkXml } from '../../tools/work-validation.js';
import { getElementsByTagNames } from '../../tools/build-static/xml.js';

const hierarchyIssues = works => {
  const keys = new Set(works.map(work => work.key));
  const parents = new Map();
  const children = new Map();
  const issues = [];
  const addRelation = (parent, child) => {
    if (keys.has(parent) === false || keys.has(child) === false) {
      issues.push(`Unknown work: ${parent} -> ${child}`);
      return;
    }
    if (parents.has(child) === false) parents.set(child, new Set());
    if (children.has(parent) === false) children.set(parent, new Set());
    parents.get(child).add(parent);
    children.get(parent).add(child);
  };
  for (const work of works) {
    if (work.parent != null) addRelation(work.parent, work.key);
    for (const child of work.children) addRelation(work.key, child);
  }
  for (const [child, ancestors] of parents) {
    if (ancestors.size > 1) issues.push(`Multiple parents: ${child}`);
  }
  const visit = (key, path) => {
    if (path.includes(key)) {
      issues.push(`Cycle: ${[...path, key].join(' -> ')}`);
      return;
    }
    const next = [...path, key];
    if (next.length > 3) {
      issues.push(`More than three work levels: ${next.join(' -> ')}`);
      return;
    }
    for (const child of children.get(key) ?? []) visit(child, next);
  };
  // Start at every node so cycles without a root are checked too.
  for (const key of keys) visit(key, []);
  return [...new Set(issues)].sort();
};

const work = (key, children = [], parent = null) => ({ key, children, parent });

describe('bounded work hierarchy', () => {
  it('allows collection, department and volume', () => {
    expect(hierarchyIssues([
      work('collection', ['department']),
      work('department', ['volume'], 'collection'),
      work('volume', [], 'department'),
    ])).toEqual([]);
  });

  it('rejects a fourth level, including parent-only relations', () => {
    expect(hierarchyIssues([
      work('a'), work('b', [], 'a'), work('c', [], 'b'), work('d', [], 'c'),
    ])).toEqual(['More than three work levels: a -> b -> c -> d']);
  });

  it('rejects cycles and self references', () => {
    expect(hierarchyIssues([work('a', ['b']), work('b', ['a'])]))
      .toEqual(expect.arrayContaining(['Cycle: a -> b -> a']));
    expect(hierarchyIssues([work('a', ['a'])])).toEqual(['Cycle: a -> a']);
  });

  it('rejects conflicting parent and subwork declarations', () => {
    expect(hierarchyIssues([
      work('a', ['c']), work('b'), work('c', [], 'b'),
    ])).toEqual(['Multiple parents: c']);
  });

  it('rejects unresolved references', () => {
    expect(hierarchyIssues([work('a', ['missing'])]))
      .toEqual(['Unknown work: a -> missing']);
  });

  it('checks all tracked corpus works', () => {
    // Bulk data does not expose the subwork graph; inspect source XML.
    const works = loadTrackedWorkFiles().map(({ content }) => {
      const root = parseWorkXml(content).documentElement;
      const author = root.getAttribute('author');
      const parent = root.getAttribute('parent');
      return {
        key: `${author}/${root.getAttribute('id')}`,
        parent: parent == null || parent.length === 0 ? null : `${author}/${parent}`,
        children: getElementsByTagNames(root, ['subwork']).map(
          node => `${author}/${node.getAttribute('ref')}`,
        ),
      };
    });
    expect(hierarchyIssues(works)).toEqual([]);
  });
});
