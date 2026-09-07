import { htmlToXml } from '../libs/helpers.js';
import { copenhagenDateKey, newsDateKey } from '../../common/news.js';
import {
  getChildByTagName,
  getChildren,
  safeGetInnerXML,
  safeGetText,
  tagName,
} from './xml.js';

const latestNewsLimit = 5;

const buildLatestNews = (items, lang, collected, now = new Date()) => {
  const today = copenhagenDateKey(now);
  const news = getChildren(items)
    .filter((item) => tagName(item) === 'item')
    .map((item) => {
      const body = getChildByTagName(item, 'body');
      return {
        date: safeGetText(item, 'date'),
        title: safeGetText(item, 'title'),
        content_lang: lang,
        content_html: htmlToXml(safeGetInnerXML(body).trim(), collected),
      };
    });
  const window = [];
  let publishedItems = 0;
  for (const item of news) {
    window.push(item);
    const date = newsDateKey(item.date);
    if (date == null || date <= today) publishedItems += 1;
    if (publishedItems === latestNewsLimit) break;
  }
  return window;
};

export { buildLatestNews, latestNewsLimit };
