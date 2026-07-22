import { safeMkdir, writeText, fileModifiedTime } from '../libs/helpers.js';
import { isFileModified } from '../libs/caching.js';
import { collect_git_modified_dates } from './git.js';
import { supportedLanguages } from '../../common/languages.js';
import { textsForWork, worksForPoet } from './anthologies.js';

const LANGS = supportedLanguages;

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
      'content/events.xml',
    ].map((filename) => modifiedDates.get(filename))
  );
};

const keywordLastmod = (keywordId, modifiedDates) => {
  return modifiedDates.get(`content/keywords/${keywordId}.xml`);
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
    const poetWorks = worksForPoet(collected, poetId);
    const filenames = Array.from(
      new Set(poetWorks.flatMap(work => work.sourceFiles || []))
    );
    const poetLastmod = latestDate(
      filenames.map((filename) => modifiedDates.get(filename))
    );
    if (
      !isFileModified(
        'tools/build-static/sitemap.js',
        'tools/build-static/anthologies.js',
        ...filenames
      )
    ) {
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
    poetWorks.forEach(work => {
      const workId = work.id;
      if (work.has_content) {
        const lastmod = latestDate(
          (work.sourceFiles || []).map(filename => modifiedDates.get(filename))
        );
        poet_text_urls.push(
          ...localizedUrls(`/work/${poetId}/${workId}`, lastmod)
        );
        textsForWork(collected, poetId, workId).forEach(text => {
          if (text.indexable !== false) {
            poet_text_urls.push(
              ...localizedUrls(`/text/${text.id}`, lastmod)
            );
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
