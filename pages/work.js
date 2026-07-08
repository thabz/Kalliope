import * as Client from '../common/client.js';
import * as OpenGraph from '../common/opengraph.js';
import _ from '../common/translations.js';
import { workCrumbs } from '../components/breadcrumbs.js';
import { formattedDate } from '../components/formatteddate.js';
import * as Links from '../components/links.js';
import { poetMenu } from '../components/menu.js';
import Note from '../components/note.js';
import Page from '../components/page.js';
import { poetNameString } from '../components/poetname-helpers.js';
import PoetName from '../components/poetname.js';
import SidebarPictures from '../components/sidebarpictures.js';
import SidebarSplit from '../components/sidebarsplit.js';
import SubHeading from '../components/subheading.js';
import TextContent from '../components/textcontent.js';
import TOC from '../components/toc.js';
import WorkName, { workTitleString } from '../components/workname.js';
import WorksList from '../components/workslist.js';
import WorkSubtitles from '../components/worksubtitles.js';
import ErrorPage from './error.js';

const WorkPage = (props) => {
  const {
    lang,
    poet,
    work,
    notes,
    pictures,
    toc,
    subworks,
    modified,
    prev,
    next,
    error,
  } = props;

  if (error) {
    return <ErrorPage error={error} lang={lang} message="Ukendt værk" />;
  }
  const requestPath = `/${lang}/work/${poet.id}/${work.id}`;

  const renderedNotes = notes.map((note, i) => {
    return (
      <Note key={'note' + i} type={note.type}>
        <TextContent
          contentHtml={note.content_html}
          contentLang={note.content_lang}
        />
      </Note>
    );
  });

  const renderedPictures = <SidebarPictures pictures={pictures} lang={lang} />;
  const completedStatus =
    work.status === 'incomplete' && work.id !== 'andre' ? (
      <div>
        Kalliopes udgave af <WorkName work={work} cursive={true} lang={lang} />{' '}
        er endnu ikke fuldstændig.
      </div>
    ) : null;
  const modifiedDate =
    modified != null ? (
      <div className="modified">
        {_('Sidst ændret', lang)} {formattedDate(modified)}.
      </div>
    ) : null;
  let sidebar = null;
  if (
    pictures.length > 0 ||
    notes.length > 0 ||
    completedStatus != null ||
    modifiedDate != null
  ) {
    sidebar = (
      <div>
        {renderedPictures}
        {renderedNotes}
        {completedStatus}
        {modifiedDate}
      </div>
    );
  }
  let table = null;
  if (toc != null && toc.length > 0) {
    table = <TOC toc={toc} lang={lang} />;
  } else if (subworks != null && subworks.length > 0) {
    table = <WorksList lang={lang} poet={poet} works={subworks} />;
  } else {
    table = (
      <div className="nodata">
        <i>Kalliope indeholder endnu ingen tekster fra dette værk.</i>
      </div>
    );
  }
  let ogDescription = null;
  if (toc != null && toc.length > 0) {
    ogDescription = toc.map((part) => part.title).join(', ');
  } else if (subworks != null && subworks.length > 0) {
    ogDescription = subworks.map((part) => part.toctitle).join(', ');
  }

  let paging = {};
  if (prev != null) {
    paging.prev = {
      url: Links.workURL(lang, poet.id, prev.id),
      title: workTitleString(prev, lang),
    };
  }
  if (next != null) {
    paging.next = {
      url: Links.workURL(lang, poet.id, next.id),
      title: workTitleString(next, lang),
    };
  }

  return (
    <Page
      headTitle={`${workTitleString(work, lang)} - ${poetNameString(
        poet,
        false,
        false,
        lang
      )} - Kalliope`}
      ogTitle={
        poetNameString(poet, false, false, lang) +
        ': ' +
        workTitleString(work, lang)
      }
      ogImage={OpenGraph.poetImage(poet)}
      ogDescription={ogDescription}
      requestPath={`/${lang}/works/${poet.id}`}
      crumbs={workCrumbs(lang, poet, work)}
      pageTitle={<PoetName poet={poet} includePeriod />}
      pageSubtitle={_('Værker', lang)}
      paging={paging}
      menuItems={poetMenu(poet)}
      poet={poet}
      selectedMenuItem="works">
      <SidebarSplit sidebar={sidebar}>
        <div>
          <SubHeading>
            <WorkName work={work} lang={lang} />
            <WorkSubtitles work={work} lang={lang} />
          </SubHeading>
          {table}
          <style jsx>{`
            :global(.nodata) {
              padding: 30px 0;
            }
            .modified {
              color: #777;
              font-size: 0.9em;
              margin-top: 30px;
            }
          `}</style>
        </div>
      </SidebarSplit>
    </Page>
  );
};

WorkPage.getInitialProps = async ({ query: { lang, poetId, workId } }) => {
  const json = await Client.work(poetId, workId);
  return {
    lang,
    poet: json.poet,
    work: json.work,
    toc: json.toc,
    subworks: json.subworks,
    notes: json.notes,
    pictures: json.pictures,
    modified: json.modified,
    prev: json.prev,
    next: json.next,
    error: json.error,
  };
};

export default WorkPage;
