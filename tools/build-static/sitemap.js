const { safeMkdir, writeText, fileExists } = require('../libs/helpers.js');
const { isFileModified } = require('../libs/caching.js');
const {
  loadXMLDoc,
  safeGetInnerXML,
  safeGetText,
  safeGetAttr,
  getElementsByTagNames,
  getChildByTagName,
} = require('./xml.js');

const build_sitemap_xml = collected => {
  safeMkdir(`static/sitemaps`);

  const write_sitemap = (filename, urls) => {
    let xmlUrls = urls.map(url => {
      return `  <url><loc>${url}</loc></url>`;
    });
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += xmlUrls.join('\n');
    xml += '\n</urlset>\n';
    writeText(filename, xml);
  };

  let urls = [];
  ['da', 'en'].forEach(lang => {
    urls.push(`https://kalliope.org/${lang}/`);
    urls.push(`https://kalliope.org/${lang}/keywords`);
    collected.keywords.forEach((keyword, keywordId) => {
      urls.push(`https://kalliope.org/${lang}/keyword/${keywordId}`);
    });
    collected.poets.forEach((poet, poetId) => {
      urls.push(`https://kalliope.org/${lang}/bio/${poetId}`);
      if (poet.has_mentions) {
        urls.push(`https://kalliope.org/${lang}/mentions/${poetId}`);
      }
    });
  });
  write_sitemap('static/sitemaps/global.xml', urls);

  collected.poets.forEach((poet, poetId) => {
    const filenames = collected.workids
      .get(poetId)
      .map(workId => `fdirs/${poetId}/${workId}.xml`);
    if (!isFileModified(...filenames)) {
      return;
    }
    const poet_text_urls = [];
    ['da', 'en'].forEach(lang => {
      if (poet.has_works || poet.has_artwork) {
        poet_text_urls.push(`https://kalliope.org/${lang}/works/${poetId}`);
      }
      if (poet.has_poems) {
        poet_text_urls.push(
          `https://kalliope.org/${lang}/texts/${poetId}/titles`
        );
        poet_text_urls.push(
          `https://kalliope.org/${lang}/texts/${poetId}/first`
        );
      }
      collected.workids.get(poetId).forEach(workId => {
        const work = collected.works.get(`${poetId}/${workId}`);
        if (work.has_content) {
          poet_text_urls.push(
            `https://kalliope.org/${lang}/work/${poetId}/${workId}`
          );
          const filename = `fdirs/${poetId}/${workId}.xml`;
          if (!fileExists(filename)) {
            return;
          }

          let doc = loadXMLDoc(filename);
          if (doc == null) {
            console.log("Couldn't load", filename);
          }
          getElementsByTagNames(doc, ['poem', 'prose', 'section']).forEach(
            part => {
              const textId = safeGetAttr(part, 'id');
              if (textId != null) {
                poet_text_urls.push(
                  `https://kalliope.org/${lang}/text/${textId}`
                );
              }
            }
          );
        }
      });
    });
    write_sitemap(`static/sitemaps/${poetId}.xml`, poet_text_urls);
  });

  const sitemaps_urls_xml = Array.from(collected.poets.values())
    .filter(poet => poet.has_works || poet.has_artwork)
    .map(poet => {
      return `https://kalliope.org/static/sitemaps/${poet.id}.xml`;
    })
    .map(url => {
      return `  <sitemap><loc>${url}</loc></sitemap>`;
    });
  sitemaps_urls_xml.push(
    `  <sitemap><loc>https://kalliope.org/static/sitemaps/global.xml</loc></sitemap>`
  );
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml +=
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">>\n';
  xml += sitemaps_urls_xml.join('\n');
  xml += '\n</sitemapindex>\n';
  writeText('static/sitemap.xml', xml);
};

module.exports = {
  build_sitemap_xml,
};
