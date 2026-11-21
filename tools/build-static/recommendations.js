import { textPath } from '../../common/paths.js';
import { poetLastNameString } from '../../components/poetname-helpers.js';
import { loadJSON, writeJSON } from '../libs/helpers.js';

export const buildRecommendations = ({ texts }) => {
  const ids = loadJSON('content/recommendations.json');
  const recommendations = ids.map(id => {
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
  });
  writeJSON('public/api/recommendations.json', recommendations);
};
