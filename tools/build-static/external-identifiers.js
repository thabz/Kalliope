import {
  buildExternalIdentifierLinks,
  externalIdentifierIds,
} from '../../common/external-identifiers.js';
import { supportedLanguages } from '../../common/languages.js';
import { loadXMLDoc, safeGetText, getChildByTagName } from './xml.js';

const loadExternalIdentifiers = (poetId) => {
  const doc = loadXMLDoc(`fdirs/${poetId}/info.xml`);
  const person = getChildByTagName(doc, 'person');
  const identifiersElement = getChildByTagName(person, 'identifiers');
  const identifiers = {};
  externalIdentifierIds.forEach((identifierId) => {
    const value = safeGetText(identifiersElement, identifierId);
    if (value != null && value.trim() !== '') {
      identifiers[identifierId] = value.trim();
    }
  });
  return identifiers;
};

const hasExternalIdentifiers = (poetId, category) => {
  const identifiers = loadExternalIdentifiers(poetId);
  return supportedLanguages.some(
    (lang) =>
      buildExternalIdentifierLinks(identifiers, { category, lang }).length > 0,
  );
};

export { hasExternalIdentifiers, loadExternalIdentifiers };
