import { htmlToXml } from '../libs/helpers.js';
import {
  getChildByTagName,
  getChildren,
  safeGetInnerXML,
  safeGetText,
  tagName,
} from './xml.js';

const latestNewsLimit = 5;

const buildLatestNews = (items, lang, collected) =>
  getChildren(items)
    .filter((item) => tagName(item) === 'item')
    .slice(0, latestNewsLimit)
    .map((item) => {
      const body = getChildByTagName(item, 'body');
      return {
        date: safeGetText(item, 'date'),
        title: safeGetText(item, 'title'),
        content_lang: lang,
        content_html: htmlToXml(safeGetInnerXML(body).trim(), collected),
      };
    });

export { buildLatestNews, latestNewsLimit };
