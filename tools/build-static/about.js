import fs from 'fs';
import { safeMkdir, htmlToXml, writeJSON } from '../libs/helpers.js';
import {
  isFileModified,
  loadCachedJSON,
  writeCachedJSON,
} from '../libs/caching.js';
import { get_pictures, get_notes } from './parsing.js';
import {
  loadXMLDoc,
  safeGetInnerXML,
  safeGetText,
  safeGetAttr,
  getChildByTagName,
} from './xml.js';
import { mapLimit } from './concurrency.js';

const build_about_pages = async (collected) => {
  safeMkdir(`public/api/about`);
  // Regenerate all about-pages if any work-file is modified, since our poem-counts then might be off
  const areAnyWorkModified = Array.from(collected.works.keys())
    .filter(key => {
      const work = collected.works.get(key);
      return isFileModified(...(work.sourceFiles || [`fdirs/${key}.xml`]));
    })
    .reduce((result, b) => b || result, false);
  const folder = 'content/about';
  const pages = fs
    .readdirSync(folder)
    .filter((x) => x.endsWith('.xml'))
    .map((x) => {
      return {
        xml: `${folder}/${x}`,
        json: `public/api/about/${x.replace(/.xml$/, '.json')}`,
      };
    })
    .filter((paths) => isFileModified(paths.xml) || areAnyWorkModified);
  return mapLimit(pages, async (paths) => {
    let lang = 'da';
    const m = paths.xml.match(/_(..)\.xml$/);
    if (m) {
      lang = m[1];
    }
    const doc = loadXMLDoc(paths.xml);
    const about = getChildByTagName(doc, 'about');
    const head = getChildByTagName(about, 'head');
    const body = getChildByTagName(about, 'body');
    const title = safeGetText(head, 'title');
    const pictures = await get_pictures(
      head,
      '/images/about',
      paths.xml,
      collected
    );
    const author = safeGetText(head, 'author');
    const poemsNum = Array.from(collected.texts.values())
      .map(t => (t.type === 'text' && t.indexable !== false ? 1 : 0))
      .reduce((sum, v) => sum + v, 0);
    const poetsNum = Array.from(collected.poets.values())
      .map((t) => (t.type === 'poet' ? 1 : 0))
      .reduce((sum, v) => sum + v, 0);
    const notes = get_notes(head, collected, {
      poemsNum: poemsNum.toLocaleString(lang),
      poetsNum: poetsNum.toLocaleString(lang),
      worksNum: collected.works.size.toLocaleString(lang),
      langsNum: 8 - 1, // gb og us er begge engelsk.
    });
    // Data er samme format som keywords
    const data = {
      // Bevar den eksisterende offentlige id, selv om kildefilen er flyttet.
      id: paths.xml.replace(/^content\//, 'data/'),
      title,
      author,
      has_footnotes: false,
      pictures,
      notes,
      content_lang: lang,
      content_html: htmlToXml(safeGetInnerXML(body), collected),
    };
    writeJSON(paths.json, data);
  });
};

export {
  build_about_pages,
};
