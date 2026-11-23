import fs from 'fs';
import {
  getChildByTagName,
  getChildrenByTagName,
  loadXMLDoc,
  safeGetAttr,
  safeGetText,
} from './build-static/xml.js';

const taxonomy = JSON.parse(
  fs.readFileSync('content/keyword-taxonomy.json', 'utf8')
);
const aliases = new Set(Object.keys(taxonomy.aliases));
const categoryKeywords = new Set(taxonomy.category_keywords);
const records = fs
  .readdirSync('content/keywords')
  .filter(filename => filename.endsWith('.xml'))
  .map(filename => {
    const path = `content/keywords/${filename}`;
    const keyword = getChildByTagName(loadXMLDoc(path), 'keyword');
    const head = getChildByTagName(keyword, 'head');
    const body = getChildByTagName(keyword, 'body');
    const bodyText = (body?.textContent ?? '').replace(/\s+/g, ' ').trim();
    return {
      id: safeGetAttr(keyword, 'id'),
      draft: safeGetAttr(keyword, 'draft') === 'true',
      redirect: safeGetAttr(keyword, 'redirect-url') != null,
      sources: getChildrenByTagName(head, 'source').length,
      relatedIds: getChildrenByTagName(head, 'related')
        .map(element => safeGetText(element).trim())
        .filter(relatedId => categoryKeywords.has(relatedId) === false),
      bodyLength: bodyText.length,
      referenceOnly: /^Se\s/i.test(bodyText) && bodyText.length < 120,
      title: safeGetText(head, 'title'),
    };
  });

const idsWithRelations = new Set();
records.forEach(record => {
  const recordId = taxonomy.aliases[record.id] ?? record.id;
  record.relatedIds.forEach(rawRelatedId => {
    const relatedId = taxonomy.aliases[rawRelatedId] ?? rawRelatedId;
    if (recordId !== relatedId) {
      idsWithRelations.add(recordId);
      idsWithRelations.add(relatedId);
    }
  });
});

const report = (title, items) => {
  console.log(`${title}: ${items.length}`);
  if (items.length > 0) {
    const ids = items.map(item => item.id).sort();
    const visibleIds = ids.slice(0, 25);
    const suffix = ids.length > visibleIds.length
      ? ` … og ${ids.length - visibleIds.length} flere`
      : '';
    console.log(`  ${visibleIds.join(', ')}${suffix}`);
  }
};

console.log(`Nøgleordsartikler: ${records.length}`);
console.log(`Kanoniske artikler: ${records.length - aliases.size}`);
console.log(`Registrerede aliaser: ${aliases.size}`);
report('Kladder', records.filter(record => record.draft === true));
report(
  'Kanoniske artikler uden kilde',
  records.filter(
    record =>
      aliases.has(record.id) === false &&
      record.redirect === false &&
      record.sources === 0
  )
);
report(
  'Korte kanoniske artikler (under 120 tegn)',
  records.filter(
    record =>
      aliases.has(record.id) === false &&
      record.redirect === false &&
      record.bodyLength < 120
  )
);
report(
  'Henvisningsartikler, som ikke er registreret som alias',
  records.filter(
    record => record.referenceOnly === true && aliases.has(record.id) === false
  )
);
report(
  'Kanoniske artikler uden redaktionelle relationer',
  records.filter(
    record =>
      aliases.has(record.id) === false &&
      record.redirect === false &&
      idsWithRelations.has(record.id) === false
  )
);
