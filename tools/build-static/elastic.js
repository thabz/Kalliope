const { htmlToXml, replaceDashes } = require('../libs/helpers.js');
const {
  loadXMLDoc,
  safeGetText,
  safeGetAttr,
  getChildByTagName,
  getChildrenByTagNames,
  getChildrenByTagName,
  getElementByTagName,
  safeGetInnerXML,
  tagName,
} = require('./xml.js');
const { isFileModified } = require('../libs/caching.js');
const elasticSearchClient = require('../libs/elasticsearch-client.js');

const update_elasticsearch = collected => {
  const inner_update_elasticsearch = () => {
    collected.poets.forEach((poet, poetId) => {
      collected.workids.get(poetId).forEach(workId => {
        const filename = `fdirs/${poetId}/${workId}.xml`;
        if (!isFileModified(filename)) {
          return;
        }
        let doc = loadXMLDoc(filename);
        const work = getElementByTagName(doc, 'kalliopework');
        const workBody = getElementByTagName(work, 'workbody');
        const status = safeGetAttr(work, 'status');
        const type = safeGetAttr(work, 'type');
        const head = getChildByTagName(work, 'workhead');
        const title = safeGetText(head, 'title');
        const year = safeGetText(head, 'year');
        const workData = {
          id: workId,
          title,
          year,
          status,
          type,
        };
        const data = {
          poet,
          work: workData,
        };

        console.log(`Updating work ${poetId}-${workId} in elasticsearch`);
        elasticSearchClient.create(
          'kalliope',
          'work',
          `${poetId}-${workId}`,
          data
        );
	if (workBody == null) {
            return;
	}
        getChildrenByTagNames(workBody, ['poem', 'prose', 'section']).forEach(
          text => {
            const textId = safeGetAttr(text, 'id');
            if (tagName(text) === 'section' && textId == null) {
              return;
            }
            const head = getChildByTagName(text, 'head');
            const body = getChildByTagName(text, 'body');
            const title =
              safeGetText(head, 'linktitle') ||
              safeGetText(head, 'title') ||
              safeGetText(head, 'firstline');
            const keywords = safeGetText(head, 'keywords');
            let subtitles = null;
            const subtitle = getChildByTagName(head, 'subtitle');
            if (subtitle && getChildrenByTagName(subtitle, 'line').length > 0) {
              subtitles = getChildrenByTagName(subtitle, 'line').map(s =>
                replaceDashes(safeGetInnerXML(s))
              );
            } else if (subtitle) {
              const subtitleString = safeGetInnerXML(subtitle);
              if (subtitleString.indexOf('<subtitle/>') === -1) {
                subtitles = [replaceDashes(subtitleString)];
              }
            }
            let keywordsArray = null;
            if (keywords) {
              keywordsArray = keywords.split(',');
            }

            const textData = {
              id: textId,
              title: replaceDashes(title),
              subtitles,
              is_prose: tagName(text) === 'prose',
              keywords: keywordsArray,
              content_html: htmlToXml(
                (safeGetInnerXML(body) || '')
                  .replace(/<note>.*?<\/note>/g, '')
                  .replace(/<footnote>.*?<\/footnote>/g, '')
                  .replace(/<.*?>/g, ' '),
                collected,
                tagName(text) === 'poem'
              )
                .map(line => line[0])
                .join(' ')
                .replace(/<.*?>/g, ' '),
            };
            const data = {
              poet,
              work: workData,
              text: textData,
            };
            elasticSearchClient.create('kalliope', 'text', textId, data);
          }
        );
      });
    });
  };

  elasticSearchClient
    .createIndex('kalliope')
    .then(() => {
      try {
        inner_update_elasticsearch();
      } catch (error) {
        console.log(error);
      }
    })
    .catch(error => {
      console.log('Elasticsearch server not found on localhost:9200.');
      //console.log(error);
    });
};

module.exports = {
  update_elasticsearch,
};
