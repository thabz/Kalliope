const { 
  loadXMLDoc, 
  htmlToXml,
  replaceDashes,
} = require('../libs/helpers.js');
const { safeGetText } = require('./xml.js');
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
        const work = doc.get('//kalliopework');
        const status = work.attr('status').value();
        const type = work.attr('type').value();
        const head = work.get('workhead');
        const title = head.get('title').text();
        const year = head.get('year').text();
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

        elasticSearchClient.create(
          'kalliope',
          'work',
          `${poetId}-${workId}`,
          data
        );
        doc.find('//poem|//prose').forEach(text => {
          const textId = text.attr('id').value();
          const head = text.get('head');
          const body = text.get('body');
          const title =
            safeGetText(head, 'linktitle') ||
            safeGetText(head, 'title') ||
            safeGetText(head, 'firstline');
          const keywords = head.get('keywords');
          let subtitles = null;
          const subtitle = head.get('subtitle');
          if (subtitle && subtitle.find('line').length > 0) {
            subtitles = subtitle.find('line').map(s =>
              replaceDashes(
                s
                  .toString()
                  .replace('<line>', '')
                  .replace('</line>', '')
                  .replace('<line/>', '')
              )
            );
          } else if (subtitle) {
            const subtitleString = subtitle
              .toString()
              .replace('<subtitle>', '')
              .replace('</subtitle>', '');
            if (subtitleString.indexOf('<subtitle/>') === -1) {
              subtitles = [replaceDashes(subtitleString)];
            }
          }
          let keywordsArray = null;
          if (keywords) {
            keywordsArray = keywords.text().split(',');
          }

          const textData = {
            id: textId,
            title: replaceDashes(title),
            subtitles,
            is_prose: text.name() === 'prose',
            keywords: keywordsArray,
            content_html: htmlToXml(
              body
                .toString()
                .replace('<body>', '')
                .replace('</body>', '')
                .replace(/<note>.*?<\/note>/g, '')
                .replace(/<footnote>.*?<\/footnote>/g, '')
                .replace(/<.*?>/g, ' '),
              collected,
              text.name() === 'poem'
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
        });
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
