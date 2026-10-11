import { XMLSerializer } from '@xmldom/xmldom';
import { loadTrackedWorkFiles } from '../../tools/libs/work-files.js';
import { htmlToXml } from '../../tools/libs/helpers.js';
import { parseWorkXml } from '../../tools/work-validation.js';

const children = node => Array.from(node?.childNodes ?? []).filter(child => child.nodeType === 1);
const child = (node, name) => children(node).find(item => item.nodeName === name);
const innerXml = node => {
  const serializer = new XMLSerializer();
  return Array.from(node.childNodes).map(item => serializer.serializeToString(item)).join('');
};
const placeholderMap = { get: id => ({ title: id }) };
const collected = { texts: placeholderMap, keywords: placeholderMap, dict: placeholderMap };

describe('renderable work corpus fragments', () => {
  it('validates every body line and text heading with the client XML wrapper', () => {
    const issues = [];
    for (const { content, filename } of loadTrackedWorkFiles()) {
      const document = parseWorkXml(content);
      const workId = document.documentElement.getAttribute('id') ?? filename;
      for (const entry of Array.from(document.getElementsByTagName('*'))) {
        if (entry.nodeName !== 'text' && entry.nodeName !== 'prose') continue;
        const body = child(entry, 'body');
        if (body == null) continue;
        const textId = entry.getAttribute('id') ?? '?';
        const head = child(entry, 'head');
        const blocks = children(body).filter(node =>
          ['poetry', 'prose', 'quote'].includes(node.nodeName));
        const headings = children(head).filter(node =>
          ['title', 'subtitle', 'suptitle'].includes(node.nodeName));
        const notes = children(child(head, 'notes')).filter(node => node.nodeName === 'note');
        for (const node of [...blocks, ...headings, ...notes]) {
          const blockType = node.nodeName;
          try {
            htmlToXml(innerXml(node), collected, blockType === 'poetry', {
              workId, textId, blockType,
            });
          } catch (error) {
            issues.push(`${filename}: ${error.message}`);
          }
        }
      }
    }
    expect(issues).toEqual([]);
  });
});
