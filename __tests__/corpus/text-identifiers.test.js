import fs from 'node:fs';
import { DOMParser } from '@xmldom/xmldom';
import { getChildByTagName, getIdentifiers, identifierAllowlist } from '../../tools/build-static/xml.js';
import { loadTrackedWorkFiles } from '../../tools/libs/work-files.js';

const catalogueFromEntry = entry => {
  const identifiers = {};
  if (entry.dgf_id != null) {
    const item = { value: String(entry.dgf_id) };
    for (const attribute of ['variant', 'witness', 'appendix']) {
      if (entry[`dgf_${attribute}`] != null) item[attribute] = entry[`dgf_${attribute}`];
    }
    identifiers['dgf-id'] = [item];
  }
  if (entry.dv_number != null) identifiers['dv-id'] = [{ value: String(entry.dv_number) }];
  return identifiers;
};

describe('catalogue identifiers in the corpus', () => {
  it('validates text identifiers, including per-text duplicate numbers', () => {
    const issues = [];
    for (const { filename, content } of loadTrackedWorkFiles()) {
      if (content.includes('<identifiers>') !== true) continue;
      const document = new DOMParser().parseFromString(content, 'text/xml');
      for (const text of Array.from(document.getElementsByTagName('text'))) {
        try {
          getIdentifiers(getChildByTagName(text, 'head'), identifierAllowlist.text);
        } catch (error) {
          issues.push(`${filename}:${text.getAttribute('id')}: ${error.message}`);
        }
      }
    }
    expect(issues).toEqual([]);
  });

  it('matches all 101 existing Vedel texts to the documented concordance by ID', () => {
    const concordance = JSON.parse(fs.readFileSync('docs/indsamling/folkeviser/vedel-1591-dgf-konkordans.json', 'utf8'));
    const document = new DOMParser().parseFromString(fs.readFileSync('fdirs/vedel/1591.xml', 'utf8'), 'text/xml');
    const texts = Array.from(document.getElementsByTagName('text'));
    const expected = new Map(concordance.entries.map(entry => [entry.kalliope_id, catalogueFromEntry(entry)]));
    expect(texts).toHaveLength(101);
    expect(expected.size).toBe(101);
    expect(texts.map(text => text.getAttribute('id'))).toEqual(concordance.entries.map(entry => entry.kalliope_id));
    const numbers = [];
    const qualifiers = { variant: 0, witness: 0, appendix: 0 };
    let dvCount = 0;
    for (const text of texts) {
      const actual = getIdentifiers(getChildByTagName(text, 'head'), identifierAllowlist.text);
      expect({ id: text.getAttribute('id'), identifiers: actual }).toEqual({ id: text.getAttribute('id'), identifiers: expected.get(text.getAttribute('id')) });
      for (const item of actual['dgf-id'] ?? []) {
        numbers.push(item.value);
        for (const key of Object.keys(qualifiers)) {
          if (item[key] != null) qualifiers[key] += 1;
        }
      }
      dvCount += (actual['dv-id'] ?? []).length;
    }
    expect(numbers).toHaveLength(88);
    expect(new Set(numbers).size).toBe(78);
    expect(dvCount).toBe(12);
    expect(qualifiers).toEqual({ variant: 29, witness: 12, appendix: 1 });
  });
});
