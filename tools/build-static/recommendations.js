import { textPath } from '../../common/paths.js';
import { poetLastNameString } from '../../components/poetname-helpers.js';
import { loadJSON, writeJSON } from '../libs/helpers.js';

export const buildRecommendations = ({ texts }) => {
  const categories = loadJSON('content/recommendations.json');
  const resolveText = id => {
    if (texts.has(id) === false) {
      throw new Error(`Ukendt tekst-id i content/recommendations.json: ${id}`);
    }
    const data = loadJSON(textPath(id));
    if (data == null) {
      throw new Error(`Mangler genererede tekstdata til anbefalingen ${id}`);
    }
    const { poet, work, text } = data;
    return {
      id,
      title: text.title,
      lang: text.content_lang,
      poet: poetLastNameString(poet),
      work: { id: work.id, title: work.title },
      href: `/text/${id}`,
      image: text.pictures[0]?.src ?? null,
    };
  };
  const recommendations = categories.map(({ title, texts }) => ({
    title,
    items: texts.map(resolveText),
  }));
  writeJSON('public/api/recommendations.json', recommendations);
};
