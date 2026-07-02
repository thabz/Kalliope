const { htmlToXml, replaceDashes } = require('../libs/helpers.js');
const {
  loadXMLDoc,
  safeGetText,
  safeGetAttr,
  getChildByTagName,
  getElementsByTagNames,
  getChildrenByTagName,
  getElementByTagName,
  safeGetInnerXML,
  tagName,
} = require('./xml.js');
const { isFileModified } = require('../libs/caching.js');
const elasticSearchClient = require('../libs/elasticsearch-client.js');
const { mapLimit } = require('./concurrency.js');

const update_elasticsearch = async collected => {
  const inner_update_elasticsearch = async () => {
    const tasks = [];

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
        tasks.push(() =>
          elasticSearchClient.create(
            'kalliope',
            'text',
            `${poetId}-${workId}`,
            data
          )
        );
        if (workBody == null) {
          return;
        }
        getElementsByTagNames(workBody, ['text', 'section']).forEach(text => {
          const textId = safeGetAttr(text, 'id');
          if (tagName(text) === 'section' && textId == null) {
            return;
          }
          const head = getChildByTagName(text, 'head');
          const body = getChildByTagName(text, 'body');
          const title = (
            safeGetInnerXML(getChildByTagName(head, 'linktitle')) ||
            safeGetInnerXML(getChildByTagName(head, 'title')) ||
            safeGetInnerXML(getChildByTagName(head, 'firstline'))
          ).replace(/<num>.*<\/num>/, '');
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
            keywords: keywordsArray,
            content_html: htmlToXml(
              (safeGetInnerXML(body) || '')
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
          const data = {
            poet,
            work: workData,
            text: textData,
          };
          //console.log(`Putting textId ${textId}: ${title}`);
          tasks.push(() =>
            elasticSearchClient.create('kalliope', 'text', textId, data)
          );
        });
      });
    });

    await mapLimit(tasks, task => task(), 2);
  };

  try {
    await elasticSearchClient.createIndex('kalliope');
    await inner_update_elasticsearch();
  } catch (error) {
    console.log('Elasticsearch update failed.');
    console.log(error);
  }
};

module.exports = {
  update_elasticsearch,
};
