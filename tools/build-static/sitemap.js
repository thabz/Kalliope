const {
  safeMkdir,
  writeText,
  fileExists,
  fileModifiedTime,
} = require('../libs/helpers.js');
const { isFileModified } = require('../libs/caching.js');
const {
  loadXMLDoc,
  safeGetAttr,
  getElementsByTagNames,
} = require('./xml.js');
const { collect_git_modified_dates } = require('./git.js');

const sitemapLastmod = (filename) => {
  const modifiedTime = fileModifiedTime(filename);
  return modifiedTime == null
    ? null
    : new Date(modifiedTime).toISOString().slice(0, 10);
};

const latestDate = (dates) => {
  return dates.filter((date) => date != null).sort().pop() || null;
};

const build_sitemap_xml = (collected) => {
  safeMkdir(`public/sitemaps`);
  const modifiedDates = collect_git_modified_dates();

  const write_sitemap = (filename, urls) => {
    let xmlUrls = urls.map((url) => {
      const loc = typeof url === 'string' ? url : url.loc;
      const lastmod = typeof url === 'string' ? null : url.lastmod;
      return (
        `  <url><loc>${loc}</loc>` +
        (lastmod == null ? '' : `<lastmod>${lastmod}</lastmod>`) +
        '</url>'
      );
    });
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += xmlUrls.join('\n');
    xml += '\n</urlset>\n';
    writeText(filename, xml);
  };

  const sitemap_index_entry = (filename) => {
    const loc = `https://kalliope.org/sitemaps/${filename}`;
    const lastmod = sitemapLastmod(`public/sitemaps/${filename}`);
    return (
      `  <sitemap><loc>${loc}</loc>` +
      (lastmod == null ? '' : `<lastmod>${lastmod}</lastmod>`) +
      '</sitemap>'
    );
  };

  let urls = [];
  ['da', 'en'].forEach((lang) => {
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
  write_sitemap('public/sitemaps/global.xml', urls);

  collected.poets.forEach((poet, poetId) => {
    const filenames = collected.workids
      .get(poetId)
      .map((workId) => `fdirs/${poetId}/${workId}.xml`);
    const poetLastmod = latestDate(
      filenames.map((filename) => modifiedDates.get(filename))
    );
    if (!isFileModified(...filenames)) {
      return;
    }
    const poet_text_urls = [];
    ['da', 'en'].forEach((lang) => {
      if (poet.has_works || poet.has_artwork) {
        poet_text_urls.push({
          loc: `https://kalliope.org/${lang}/works/${poetId}`,
          lastmod: poetLastmod,
        });
      }
      if (poet.has_poems) {
        poet_text_urls.push({
          loc: `https://kalliope.org/${lang}/texts/${poetId}/titles`,
          lastmod: poetLastmod,
        });
        poet_text_urls.push({
          loc: `https://kalliope.org/${lang}/texts/${poetId}/first`,
          lastmod: poetLastmod,
        });
      }
      collected.workids.get(poetId).forEach((workId) => {
        const work = collected.works.get(`${poetId}/${workId}`);
        if (work.has_content) {
          const filename = `fdirs/${poetId}/${workId}.xml`;
          const lastmod = modifiedDates.get(filename);
          poet_text_urls.push({
            loc: `https://kalliope.org/${lang}/work/${poetId}/${workId}`,
            lastmod,
          });
          if (!fileExists(filename)) {
            return;
          }

          let doc = loadXMLDoc(filename);
          if (doc == null) {
            console.log("Couldn't load", filename);
          }
          getElementsByTagNames(doc, ['text', 'section']).forEach((part) => {
            const textId = safeGetAttr(part, 'id');
            if (textId != null) {
              poet_text_urls.push({
                loc: `https://kalliope.org/${lang}/text/${textId}`,
                lastmod,
              });
            }
          });
        }
      });
    });
    write_sitemap(`public/sitemaps/${poetId}.xml`, poet_text_urls);
  });

  const sitemaps_urls_xml = Array.from(collected.poets.values())
    .filter((poet) => poet.has_works || poet.has_artwork)
    .map((poet) => {
      return sitemap_index_entry(`${poet.id}.xml`);
    });
  sitemaps_urls_xml.push(sitemap_index_entry('global.xml'));
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml +=
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += sitemaps_urls_xml.join('\n');
  xml += '\n</sitemapindex>\n';
  writeText('public/sitemap.xml', xml);
};

module.exports = {
  build_sitemap_xml,
};
