import { useContext } from 'react';
import LangContext from '../common/LangContext.js';
import _ from '../common/translations.js';
import { kalliopeCrumbs } from '../components/breadcrumbs.js';
import { kalliopeMenu } from '../components/menu.js';
import Page from '../components/page.js';

const copy = {
  da: {
    lead: 'Download Kalliopes versionsmærkede korpus til reproducerbar maskinel analyse.',
    manifest: 'Manifest og filkatalog',
    documentation: 'Dokumentation og eksempler',
    schema: 'JSON Schema',
  },
  en: {
    lead: 'Download Kalliope’s versioned corpus for reproducible machine analysis.',
    manifest: 'Manifest and file catalogue',
    documentation: 'Documentation and examples',
    schema: 'JSON Schema',
  },
  de: {
    lead: 'Laden Sie Kalliopes versioniertes Korpus für reproduzierbare maschinelle Analysen herunter.',
    manifest: 'Manifest und Dateikatalog',
    documentation: 'Dokumentation und Beispiele',
    schema: 'JSON-Schema',
  },
  fr: {
    lead: 'Téléchargez le corpus versionné de Kalliope pour une analyse informatique reproductible.',
    manifest: 'Manifeste et catalogue des fichiers',
    documentation: 'Documentation et exemples',
    schema: 'Schéma JSON',
  },
};

const Dataset = () => {
  const lang = useContext(LangContext);
  const text = copy[lang] ?? copy.da;
  return (
    <Page
      headTitle={`Kalliope – ${_('Data', lang)}`}
      requestPath={`/${lang}/dataset`}
      crumbs={[...kalliopeCrumbs(lang), { title: _('Data', lang) }]}
      pageTitle={_('Data', lang)}
      menuItems={kalliopeMenu()}
      selectedMenuItem="dataset">
      <main className="dataset">
        <p>{text.lead}</p>
        <ul>
          <li><a href="/api/manifest.json">{text.manifest}</a></li>
          <li><a href="/api/v1/README.md">{text.documentation}</a></li>
          <li><a href="/api/v1/schema.json">{text.schema}</a></li>
        </ul>
      </main>
      <style jsx>{`
        .dataset { line-height: 1.6; max-width: 760px; }
        .dataset li { margin-bottom: 12px; }
      `}</style>
    </Page>
  );
};

Dataset.getInitialProps = async ({ query: { lang = 'da' } }) => ({ lang });

export default Dataset;
