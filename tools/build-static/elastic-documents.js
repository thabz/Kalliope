import { htmlToXml, replaceDashes } from '../libs/helpers.js';
import {
  loadXMLDoc,
  safeGetText,
  safeGetAttr,
  getChildByTagName,
  getElementsByTagNames,
  getChildrenByTagName,
  getElementByTagName,
  safeGetInnerXML,
  tagName,
} from './xml.js';
import { isAnthologyText, textsForWork } from './anthologies.js';
import { sourceWorkFilename, sourceWorkKey } from './work-cache.js';
import { canonicalKeywordId } from './keyword-taxonomy.js';

const headingText = html =>
  html
    .replace(/<(footnote|note)(\s+[^>]*)?>[\s\S]*?<\/\1>/g, '')
    .replace(/<[^>]+>/g, '');

function* iterateElasticsearchTextEntryDocuments(collected, entry, onParse = () => {}) {
  const { poet, poetId, workId, textEntryKey, work: workMeta } = entry;
  const workData = {
    id: workId,
    title: workMeta.title,
    year: workMeta.year,
    status: workMeta.status,
    type: workMeta.type,
    virtualType: workMeta.virtualType,
  };
  if (workData.title !== 'Andre digte' && workMeta.virtualType !== 'anthology') {
    yield { id: textEntryKey, data: {
      result_type: 'work', index_entry: textEntryKey, poet, work: workData,
    } };
  }

  const appendTextDocument = (text, textId) => {
    if (tagName(text) === 'section' && textId == null) {
      return;
    }
    const head = getChildByTagName(text, 'head');
    const body = getChildByTagName(text, 'body');
    const front = getChildByTagName(text, 'front');
    const titleXml = ([
      safeGetInnerXML(getChildByTagName(head, 'linktitle')),
      safeGetInnerXML(getChildByTagName(head, 'title')),
      safeGetInnerXML(getChildByTagName(head, 'firstline')),
    ].find(value => value != null && value.length > 0) ?? '').replace(/<num>.*<\/num>/, '');
    const title = headingText(titleXml);
    const keywords = safeGetText(head, 'keywords');
    let subtitles = null;
    const subtitle = getChildByTagName(head, 'subtitle');
    if (subtitle != null && getChildrenByTagName(subtitle, 'line').length > 0) {
      subtitles = getChildrenByTagName(subtitle, 'line').map(s =>
        replaceDashes(headingText(safeGetInnerXML(s)))
      );
    } else if (subtitle != null) {
      const subtitleString = safeGetInnerXML(subtitle);
      if (subtitleString.indexOf('<subtitle/>') === -1) {
        subtitles = [replaceDashes(headingText(subtitleString))];
      }
    }
    let keywordsArray = null;
    if (keywords != null && keywords.length > 0) {
      keywordsArray = Array.from(
        new Set(
          keywords.split(',').map(rawKeywordId => {
            const keywordId = rawKeywordId.trim();
            return collected.poets.has(keywordId) === false &&
              collected.keywords?.has(keywordId) === true
              ? canonicalKeywordId(keywordId, collected.keywords)
              : keywordId;
          })
        )
      );
    }
    const keywordTitles = (keywordsArray ?? [])
      .map(keywordId => collected.keywords?.get(keywordId)?.title)
      .filter(title => title != null);

    const textData = {
      id: textId,
      title: replaceDashes(title),
      subtitles,
      keywords: keywordsArray,
      keyword_ids: keywordsArray,
      keyword_titles: keywordTitles,
      content_html: htmlToXml(
        [front, body].map(node => safeGetInnerXML(node) ?? '').join('\n')
          // Nested poem metadata is not part of the enclosing act's full text.
          .replace(/<head\b[^>]*>[\s\S]*?<\/head>/g, '')
          .replace(/<note>.*?<\/note>/g, '')
          .replace(/<footnote>.*?<\/footnote>/g, '')
          .replace(/<.*?>/g, ' '),
        collected,
        false
      )
        .map(line => line[0])
        .join(' ')
        .replace(/<.*?>/g, ' '),
    };
    const textWork = workMeta.virtualType === 'anthology'
      ? collected.works.get(sourceWorkKey(collected.texts.get(textId)))
      : workMeta;
    const data = {
      poet,
      work: {
        id: textWork.id,
        poet_id: textWork.poet_id,
        title: textWork.title,
        year: textWork.year,
        status: textWork.status,
        type: textWork.type,
      },
      text: textData,
    };
    return {
      id: textId,
      data: {
        result_type: 'text',
        index_entry: textEntryKey,
        ...data,
      },
    };
  };

  if (workMeta.virtualType === 'anthology') {
    // Retain only metadata for all groups, and one publication's DOM at a time.
    const groups = new Map();
    for (const textMeta of textsForWork(collected, poetId, workId)) {
      const filename = sourceWorkFilename(textMeta);
      const group = groups.get(filename) ?? [];
      group.push(textMeta);
      groups.set(filename, group);
    }
    for (const [filename, group] of groups) {
      onParse(filename);
      const doc = loadXMLDoc(filename);
      const byId = new Map();
      for (const node of getElementsByTagNames(doc, ['text', 'section'])) {
        const id = safeGetAttr(node, 'id');
        // Match the previous find() semantics if an invalid source repeats an id.
        if (byId.has(id) === false) byId.set(id, node);
      }
      for (const textMeta of group) {
        const sourceText = byId.get(textMeta.sourceTextId);
        if (sourceText == null) {
          throw new Error(`${filename} mangler antologiteksten ${textMeta.sourceTextId}.`);
        }
        const document = appendTextDocument(sourceText, textMeta.id);
        if (document != null) yield document;
      }
    }
  } else {
    const filename = `fdirs/${poetId}/${workId}.xml`;
    onParse(filename);
    const doc = loadXMLDoc(filename);
    const work = getElementByTagName(doc, 'kalliopework');
    const workBody = getElementByTagName(work, 'workbody');
    if (workBody != null) {
      for (const text of getElementsByTagNames(workBody, ['text', 'section'])) {
        const textId = safeGetAttr(text, 'id');
        const textMeta = collected.texts.get(textId);
        if (
          textMeta != null &&
          isAnthologyText(textMeta.poetId, textMeta.sourcePoetId) &&
          textMeta.sourcePoetId === poetId &&
          textMeta.sourceWorkId === workId
        ) {
          continue;
        }
        const document = appendTextDocument(text, textId);
        if (document != null) yield document;
      }
    }
  }
}

const buildElasticsearchTextEntryDocuments = (collected, entry) =>
  Array.from(iterateElasticsearchTextEntryDocuments(collected, entry));

export { buildElasticsearchTextEntryDocuments, iterateElasticsearchTextEntryDocuments };
