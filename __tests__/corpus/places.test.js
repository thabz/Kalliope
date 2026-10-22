import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { DOMParser } from '@xmldom/xmldom';
import { loadTrackedWorkFiles } from '../../tools/libs/work-files.js';

const childrenNamed = (parent, name) => Array.from(parent.childNodes)
  .filter(node => node.nodeType === 1 && node.nodeName === name);

describe('place register and work references', () => {
  it('validates the central register', () => {
    expect(() => execFileSync(
      'xmllint',
      ['--noout', '--relaxng', 'schemas/places.rng', 'content/places.xml'],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    )).not.toThrow();
  });

  it('uses unique place IDs and resolves every work and parent reference', () => {
    const parser = new DOMParser();
    const register = parser.parseFromString(
      readFileSync('content/places.xml', 'utf8'),
      'text/xml',
    );
    const places = childrenNamed(register.documentElement, 'place');
    const ids = places.map(place => place.getAttribute('id'));
    const knownIds = new Set(ids);
    const issues = [];

    if (knownIds.size !== ids.length) {
      issues.push('duplicate place IDs in content/places.xml');
    }
    for (const place of places) {
      for (const parent of childrenNamed(place, 'parent')) {
        if (knownIds.has(parent.getAttribute('ref')) !== true) {
          issues.push(`unknown parent for ${place.getAttribute('id')}`);
        }
      }
    }

    for (const { content, filename } of loadTrackedWorkFiles()) {
      if (content.includes('<places>') !== true) {
        continue;
      }
      const work = parser.parseFromString(content, 'text/xml');
      for (const text of Array.from(work.getElementsByTagName('text'))) {
        const head = childrenNamed(text, 'head')[0];
        if (head == null) {
          continue;
        }
        const collections = childrenNamed(head, 'places');
        if (collections.length > 1) {
          issues.push(`${filename}: multiple places lists on ${text.getAttribute('id')}`);
        }
        const seen = new Set();
        for (const collection of collections) {
          for (const place of childrenNamed(collection, 'place')) {
            const ref = place.getAttribute('ref');
            const textId = text.getAttribute('id');
            if (knownIds.has(ref) !== true) {
              issues.push(`${filename}: unknown place ${ref} on ${textId}`);
            }
            if (seen.has(ref) === true) {
              issues.push(`${filename}: duplicate place ${ref} on ${textId}`);
            }
            seen.add(ref);
          }
        }
      }
    }

    expect(issues).toEqual([]);
  });
});
