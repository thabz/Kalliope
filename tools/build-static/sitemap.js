import {
  safeMkdir,
  writeText,
  fileExists,
  fileModifiedTime,
} from '../libs/helpers.js';
import { isFileModified } from '../libs/caching.js';
import {
  loadXMLDoc,
  safeGetAttr,
  getElementsByTagNames,
} from './xml.js';
import { collect_git_modified_dates } from './git.js';

const LANGS = ['da', 'en'];

const sitemapLastmod = (filename) => {
  const modifiedTime = fileModifiedTime(filename);
  return modifiedTime == null
    ? null
    : new Date(modifiedTime).toISOString().slice(0, 10);
};

const latestDate = (dates) => {
  return dates.filter((date) => date != null).sort().pop() || null;
};

const poetBioLastmod = (poetId, modifiedDates) => {
  return latestDate(
    [
      `fdirs/${poetId}/info.xml`,
      `fdirs/${poetId}/bio.xml`,
      `fdirs/${poetId}/events.xml`,
      'data/events.xml',
    ].map((filename) => modifiedDates.get(filename))
  );
};

const keywordLastmod = (keywordId, modifiedDates) => {
  return modifiedDates.get(`data/keywords/${keywordId}.xml`);
};

const workLastmod = (poetId, workId, modifiedDates) => {
  return modifiedDates.get(`fdirs/${poetId}/${workId}.xml`);
};

const localizedUrl = (lang, path) => {
  return `https://kalliope.org/${lang}${path}`;
};

const localizedUrls = (path, lastmod = null) => {
  const alternates = LANGS.map((lang) => {
    return {
      lang,
      href: localizedUrl(lang, path),
    };
  });
  return alternates.map(({ href }) => {
    return {
      loc: href,
      lastmod,
      alternates,
    };
  });
};

const build_sitemap_xml = (collected) => {
  safeMkdir(`public/sitemaps`);
  const modifiedDates = collect_git_modified_dates();

  const write_sitemap = (filename, urls) => {
    let xmlUrls = urls.map((url) => {
      const loc = typeof url === 'string' ? url : url.loc;
      const lastmod = typeof url === 'string' ? null : url.lastmod;
      const alternates = typeof url === 'string' ? [] : url.alternates || [];
      const elements = [`    <loc>${loc}</loc>`];
      alternates.forEach(({ lang, href }) => {
        elements.push(
          '    <xhtml:link rel="alternate" ' +
            `hreflang="${lang}" href="${href}" />`
        );
      });
      if (lastmod != null) {
        elements.push(`    <lastmod>${lastmod}</lastmod>`);
      }
      return `  <url>\n${elements.join('\n')}\n  </url>`;
    });
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml +=
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
      'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
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
  const keywordsLastmod = latestDate(
    Array.from(collected.keywords.keys()).map((keywordId) =>
      keywordLastmod(keywordId, modifiedDates)
    )
  );
  urls.push(...localizedUrls('/'));
  urls.push(...localizedUrls('/keywords', keywordsLastmod));
  collected.keywords.forEach((keyword, keywordId) => {
    urls.push(
      ...localizedUrls(
        `/keyword/${keywordId}`,
        keywordLastmod(keywordId, modifiedDates)
      )
    );
  });
  collected.poets.forEach((poet, poetId) => {
    urls.push(
      ...localizedUrls(`/bio/${poetId}`, poetBioLastmod(poetId, modifiedDates))
    );
    if (poet.has_mentions) {
      urls.push(...localizedUrls(`/mentions/${poetId}`));
    }
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
    if (poet.has_works || poet.has_artwork) {
      poet_text_urls.push(...localizedUrls(`/works/${poetId}`, poetLastmod));
    }
    if (poet.has_poems) {
      poet_text_urls.push(
        ...localizedUrls(`/texts/${poetId}/titles`, poetLastmod)
      );
      poet_text_urls.push(
        ...localizedUrls(`/texts/${poetId}/first`, poetLastmod)
      );
    }
    collected.workids.get(poetId).forEach((workId) => {
      const work = collected.works.get(`${poetId}/${workId}`);
      if (work.has_content) {
        const filename = `fdirs/${poetId}/${workId}.xml`;
        const lastmod = workLastmod(poetId, workId, modifiedDates);
        poet_text_urls.push(
          ...localizedUrls(`/work/${poetId}/${workId}`, lastmod)
        );
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
            poet_text_urls.push(...localizedUrls(`/text/${textId}`, lastmod));
          }
        });
      }
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

export {
  build_sitemap_xml,
};
