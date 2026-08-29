import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultDecisionsFile = path.join(
  rootDir,
  'docs',
  'indsamling',
  'dfl',
  'duplicate-merges.json'
);

const appendWorkIds = (xml, workIds) => {
  if (workIds.length === 0) return xml;
  const worksMatch = xml.match(/<works>([^<]*)<\/works>/);
  if (worksMatch != null) {
    const existing = worksMatch[1].split(',').filter(value => value.length > 0);
    const combined = [...new Set([...existing, ...workIds])];
    return xml.replace(worksMatch[0], `<works>${combined.join(',')}</works>`);
  }
  const worksXml = `  <works>${[...new Set(workIds)].join(',')}</works>\n`;
  const insertionPoint = xml.includes('  <identifiers>')
    ? '  <identifiers>'
    : '</person>';
  return xml.replace(insertionPoint, `${worksXml}${insertionPoint}`);
};

const addDflIdentifier = (xml, dflId) => {
  const existing = xml.match(/<danskforfatterleksikon-dk>([^<]+)<\/danskforfatterleksikon-dk>/)?.[1];
  if (existing != null && existing !== dflId) {
    throw new Error(`Målpersonen har allerede et andet DFL-id: ${existing}`);
  }
  const withoutExisting = existing === dflId
    ? xml.replace(/^\s*<danskforfatterleksikon-dk>[^<]+<\/danskforfatterleksikon-dk>\s*\n/m, '')
    : xml;
  const identifierXml = `    <danskforfatterleksikon-dk>${dflId}</danskforfatterleksikon-dk>\n`;
  const laterIdentifier = ['    <runeberg-org>', '    <gutenberg-org>']
    .find(element => withoutExisting.includes(element));
  if (laterIdentifier != null) {
    return withoutExisting.replace(laterIdentifier, `${identifierXml}${laterIdentifier}`);
  }
  if (withoutExisting.includes('  </identifiers>')) {
    return withoutExisting.replace('  </identifiers>', `${identifierXml}  </identifiers>`);
  }
  return withoutExisting.replace(
    '</person>',
    `  <identifiers>\n${identifierXml}  </identifiers>\n</person>`
  );
};

const retargetWork = (xml, sourcePoetId, targetPoetId) => {
  const source = `author="${sourcePoetId}"`;
  if (xml.includes(source) === false) {
    throw new Error(`Værk mangler forventet forfatter-attribut: ${sourcePoetId}`);
  }
  return xml.replace(source, `author="${targetPoetId}"`);
};

const mergeHiddenDflDuplicates = ({ decisionsFile = defaultDecisionsFile } = {}) => {
  const decisions = JSON.parse(fs.readFileSync(decisionsFile, 'utf8')).merges;
  let merged = 0;
  let worksMoved = 0;
  let skipped = 0;
  decisions.forEach(decision => {
    const sourceDir = path.join(rootDir, 'fdirs', decision.sourcePoetId);
    const targetDir = path.join(rootDir, 'fdirs', decision.targetPoetId);
    const sourceInfo = path.join(sourceDir, 'info.xml');
    const targetInfo = path.join(targetDir, 'info.xml');
    if (fs.existsSync(sourceInfo) === false) {
      if (fs.existsSync(targetInfo) === false) {
        throw new Error(`Målperson mangler: ${decision.targetPoetId}`);
      }
      const targetXml = fs.readFileSync(targetInfo, 'utf8');
      const normalizedTargetXml = addDflIdentifier(targetXml, decision.sourceDflId);
      if (normalizedTargetXml !== targetXml) {
        fs.writeFileSync(targetInfo, normalizedTargetXml);
      }
      skipped += 1;
      return;
    }
    if (fs.existsSync(targetInfo) === false) {
      throw new Error(`Målperson mangler: ${decision.targetPoetId}`);
    }
    const sourceXml = fs.readFileSync(sourceInfo, 'utf8');
    if (sourceXml.includes('hidden="true"') === false) {
      throw new Error(`Kildepersonen er ikke skjult: ${decision.sourcePoetId}`);
    }
    const actualDflId = sourceXml.match(
      /<danskforfatterleksikon-dk>([^<]+)<\/danskforfatterleksikon-dk>/
    )?.[1];
    if (actualDflId !== decision.sourceDflId) {
      throw new Error(`Uventet DFL-id for ${decision.sourcePoetId}: ${actualDflId}`);
    }
    const workFiles = fs.readdirSync(sourceDir)
      .filter(file => file !== 'info.xml' && file.endsWith('.xml'))
      .sort();
    const workIds = workFiles.map(file => path.basename(file, '.xml'));
    let targetXml = fs.readFileSync(targetInfo, 'utf8');
    targetXml = appendWorkIds(targetXml, workIds);
    targetXml = addDflIdentifier(targetXml, decision.sourceDflId);
    fs.writeFileSync(targetInfo, targetXml);
    workFiles.forEach(file => {
      const sourceWork = path.join(sourceDir, file);
      const targetWork = path.join(targetDir, file);
      if (fs.existsSync(targetWork)) {
        throw new Error(`Målværket findes allerede: ${targetWork}`);
      }
      const workXml = retargetWork(
        fs.readFileSync(sourceWork, 'utf8'),
        decision.sourcePoetId,
        decision.targetPoetId
      );
      fs.writeFileSync(targetWork, workXml);
      fs.unlinkSync(sourceWork);
      worksMoved += 1;
    });
    fs.unlinkSync(sourceInfo);
    fs.rmdirSync(sourceDir);
    merged += 1;
  });
  return { merged, worksMoved, skipped };
};

const isMainModule =
  process.argv[1] != null && fileURLToPath(import.meta.url) === process.argv[1];
if (isMainModule) {
  console.log(JSON.stringify(mergeHiddenDflDuplicates()));
}

export { addDflIdentifier, appendWorkIds, mergeHiddenDflDuplicates, retargetWork };
