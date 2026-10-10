import { DOMParser } from '@xmldom/xmldom';
import { htmlToXml } from '../../tools/libs/helpers.js';
import { getElementsByTagNames, safeGetInnerXML } from '../../tools/build-static/xml.js';
import { loadTrackedWorkFiles } from '../../tools/libs/work-files.js';
import { parseWorkXml } from '../../tools/work-validation.js';

const collected = {
  texts: new Map(),
  keywords: new Map(),
  dict: new Map(),
};

describe('renderable work corpus markup', () => {
  it('keeps every rendered text line valid XML', () => {
    const issues = [];

    for (const { content, filename } of loadTrackedWorkFiles().filter(
      (work) => [
        'fdirs/blicherclausen/1900.xml',
        'fdirs/ingemann/1816a.xml',
        'fdirs/blicherclausen/1903.xml',
        'fdirs/blicher/1814.xml',
        'fdirs/grundtvig/1814a.xml',
        'fdirs/kaalund/1898.xml',
      ].includes(work.filename)
    )) {
      const document = parseWorkXml(content);
      const blocks = getElementsByTagNames(document, ['poetry', 'prose', 'quote']);

      for (const block of blocks) {
        const bodyXml = safeGetInnerXML(block).replace(/<xref\b[^>]*\/>/gu, '');
        const lines = htmlToXml(
          bodyXml,
          collected,
          block.tagName === 'poetry'
        );

        lines.forEach(([line, options = {}], index) => {
          if (options.html !== true) return;
          try {
            new DOMParser({
              onError: (_level, message) => {
                throw new Error(message);
              },
            }).parseFromString(`<content>${line}</content>`, 'text/xml');
          } catch (error) {
            issues.push(`${filename}:${block.tagName} line ${index + 1}: ${error.message}`);
          }
        });
      }
    }

    expect(issues).toEqual([]);
  });
});
