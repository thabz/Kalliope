import fs from 'fs';
import path from 'path';

const findUnlistedWorkFiles = workids => {
  const result = [];
  const listedByPoet = new Map(workids);

  fs.readdirSync('fdirs', { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .forEach(entry => {
      const poetId = entry.name;
      const listed = new Set(listedByPoet.get(poetId) || []);
      const infoFilename = `fdirs/${poetId}/info.xml`;
      fs.readdirSync(`fdirs/${poetId}`, { withFileTypes: true })
        .filter(file => file.isFile() && file.name.endsWith('.xml'))
        .forEach(file => {
          const workId = path.basename(file.name, '.xml');
          if (listed.has(workId)) {
            return;
          }
          const filename = `fdirs/${poetId}/${file.name}`;
          const content = fs.readFileSync(filename, 'utf8');
          if (!/^\s*<kalliopework\b/.test(content)) {
            return;
          }
          result.push({ filename, infoFilename, content });
        });
    });

  return result;
};

const findTextInUnlistedWork = (textId, workFiles) => {
  const escapedTextId = textId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const textPattern = new RegExp(
    `<(?:text|section)\\b[^>]*\\bid=["']${escapedTextId}["']`,
  );
  return workFiles.find(workFile => textPattern.test(workFile.content));
};

export {
  findUnlistedWorkFiles,
  findTextInUnlistedWork,
};
