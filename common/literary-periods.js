const requiredTitleLanguages = ['da', 'en', 'fr', 'de'];
const knownLiteraryPeriodCountries = new Set([
  'dk', 'se', 'no', 'gb', 'de', 'fr', 'us', 'it', 'un',
]);

const sources = {
  dk: [{ title: 'Dansk litteraturs historie', url: 'https://dansklitteraturshistorie.lex.dk/Om_Dansk_litteraturs_historie' }],
  se: [{ title: 'Swedish literature', url: 'https://www.britannica.com/art/Swedish-literature' }],
  no: [{ title: 'Norwegian literature', url: 'https://www.britannica.com/art/Norwegian-literature' }],
  gb: [{ title: 'English literature', url: 'https://www.britannica.com/art/English-literature' }],
  de: [{ title: 'German literature', url: 'https://www.britannica.com/art/German-literature' }],
  fr: [{ title: 'French literature', url: 'https://www.britannica.com/art/French-literature' }],
  us: [{ title: 'American literature', url: 'https://www.britannica.com/art/American-literature' }],
  it: [{ title: 'Italian literature', url: 'https://www.britannica.com/art/Italian-literature' }],
  es: [{ title: 'Spanish literature', url: 'https://www.britannica.com/art/Spanish-literature' }],
  fa: [{ title: 'Persian literature', url: 'https://www.britannica.com/art/Persian-literature' }],
  grc: [{ title: 'Greek literature', url: 'https://www.britannica.com/art/Greek-literature' }],
  la: [{ title: 'Latin literature', url: 'https://www.britannica.com/art/Latin-literature' }],
  nl: [{ title: 'Dutch literature', url: 'https://www.britannica.com/art/Dutch-literature' }],
  'sv-fi': [{ title: 'Swedish literature', url: 'https://www.britannica.com/art/Swedish-literature' }],
};

const globalPeriod = (id, sortYear, title) => ({
  id,
  scope: 'global',
  sortYear,
  title,
});

const localPeriod = (id, countries, sortYear, titles, sourceKey) => ({
  id,
  scope: 'local',
  countries,
  sortYear,
  sources: sources[sourceKey],
  title: { da: titles[0], en: titles[1], fr: titles[2], de: titles[3] },
});

const literaryPeriods = [
  globalPeriod('antikken', -800, { da: 'Antikken', en: 'Antiquity', de: 'Antike', fr: 'Antiquité', it: 'Antichità' }),
  localPeriod('grc-arkaisk-og-klassisk-tid', ['un'], -750, ['Græsk arkaisk og klassisk tid', 'Greek Archaic and Classical periods', 'Époques grecques archaïque et classique', 'Griechische Archaik und Klassik'], 'grc'),
  localPeriod('la-romersk-litteratur', ['un'], -240, ['Romersk litteratur på latin', 'Roman literature in Latin', 'Littérature romaine en latin', 'Römische Literatur in lateinischer Sprache'], 'la'),
  globalPeriod('middelalderen', 500, { da: 'Middelalderen', en: 'The Middle Ages', de: 'Mittelalter', fr: 'Moyen Âge', it: 'Medioevo' }),
  localPeriod('fa-klassisk-persisk-litteratur', ['un'], 900, ['Klassisk persisk litteratur', 'Classical Persian literature', 'Littérature persane classique', 'Klassische persische Literatur'], 'fa'),
  localPeriod('it-middelalderlitteratur', ['it'], 1200, ['Italiensk middelalderlitteratur', 'Italian medieval literature', 'Littérature médiévale italienne', 'Italienische Literatur des Mittelalters'], 'it'),
  localPeriod('gb-middelalderlitteratur', ['gb'], 1066, ['Engelsk middelalderlitteratur', 'English medieval literature', 'Littérature médiévale anglaise', 'Englische Literatur des Mittelalters'], 'gb'),
  globalPeriod('renaessance-og-humanisme', 1400, { da: 'Renæssance og humanisme', en: 'Renaissance and humanism', de: 'Renaissance und Humanismus', fr: 'Renaissance et humanisme', it: 'Rinascimento e umanesimo' }),
  localPeriod('it-renaessance', ['it'], 1350, ['Italiensk renæssance', 'Italian Renaissance', 'Renaissance italienne', 'Italienische Renaissance'], 'it'),
  localPeriod('fr-renaessance', ['fr'], 1500, ['Fransk renæssance', 'French Renaissance', 'Renaissance française', 'Französische Renaissance'], 'fr'),
  localPeriod('gb-renaessance', ['gb'], 1500, ['Engelsk renæssance', 'English Renaissance', 'Renaissance anglaise', 'Englische Renaissance'], 'gb'),
  localPeriod('es-guldalder', ['un'], 1500, ['Spansk guldalder', 'Spanish Golden Age', 'Siècle d’or espagnol', 'Spanisches Goldenes Zeitalter'], 'es'),
  localPeriod('de-humanisme-og-reformation', ['de', 'un'], 1500, ['Tysk humanisme og reformation', 'German humanism and Reformation', 'Humanisme et Réforme allemands', 'Deutscher Humanismus und Reformation'], 'de'),
  localPeriod('dk-renaessance-og-reformation', ['dk'], 1500, ['Dansk renæssance og reformation', 'Danish Renaissance and Reformation', 'Renaissance et Réforme danoises', 'Dänische Renaissance und Reformation'], 'dk'),
  localPeriod('se-renaessance-og-reformation', ['se'], 1500, ['Svensk renæssance og reformation', 'Swedish Renaissance and Reformation', 'Renaissance et Réforme suédoises', 'Schwedische Renaissance und Reformation'], 'se'),
  localPeriod('no-renaessance-og-reformation', ['no'], 1500, ['Norsk renæssance og reformation', 'Norwegian Renaissance and Reformation', 'Renaissance et Réforme norvégiennes', 'Norwegische Renaissance und Reformation'], 'no'),
  globalPeriod('barok-og-tidlig-modernitet', 1600, { da: 'Barok og tidlig modernitet', en: 'Baroque and early modernity', de: 'Barock und Frühe Neuzeit', fr: 'Baroque et première modernité', it: 'Barocco e prima modernità' }),
  localPeriod('gb-restauration-og-barok', ['gb'], 1600, ['Engelsk barok og restaurationstid', 'English Baroque and Restoration', 'Baroque et Restauration anglaises', 'Englischer Barock und Restauration'], 'gb'),
  localPeriod('de-barok', ['de', 'un'], 1600, ['Tysk barok', 'German Baroque', 'Baroque allemand', 'Deutscher Barock'], 'de'),
  localPeriod('dk-barok', ['dk'], 1600, ['Dansk barok', 'Danish Baroque', 'Baroque danois', 'Dänischer Barock'], 'dk'),
  localPeriod('se-stormagtstid', ['se'], 1611, ['Svensk stormagtstid', 'Swedish Age of Greatness', 'Ère suédoise de la grandeur', 'Schwedische Großmachtzeit'], 'se'),
  localPeriod('no-barok', ['no'], 1600, ['Norsk barok', 'Norwegian Baroque', 'Baroque norvégien', 'Norwegischer Barock'], 'no'),
  localPeriod('fr-klassicisme', ['fr'], 1660, ['Fransk klassicisme', 'French Classicism', 'Classicisme français', 'Französische Klassik'], 'fr'),
  globalPeriod('oplysningstid-og-klassicisme', 1680, { da: 'Oplysningstid og klassicisme', en: 'The Enlightenment and classicism', de: 'Aufklärung und Klassizismus', fr: 'Lumières et classicisme', it: 'Illuminismo e classicismo' }),
  localPeriod('gb-augustansk-litteratur', ['gb'], 1680, ['Britisk augustansk litteratur', 'British Augustan literature', 'Littérature augustéenne britannique', 'Britische augusteische Literatur'], 'gb'),
  localPeriod('fr-oplysningstid', ['fr'], 1715, ['Fransk oplysningstid', 'French Enlightenment', 'Lumières françaises', 'Französische Aufklärung'], 'fr'),
  localPeriod('us-kolonitid-og-oplysning', ['us'], 1700, ['Amerikansk kolonitid og oplysning', 'American colonial period and Enlightenment', 'Période coloniale et Lumières américaines', 'Amerikanische Kolonialzeit und Aufklärung'], 'us'),
  localPeriod('de-oplysning-og-weimarklassik', ['de', 'un'], 1720, ['Tysk oplysning og Weimarklassik', 'German Enlightenment and Weimar Classicism', 'Lumières allemandes et classicisme de Weimar', 'Deutsche Aufklärung und Weimarer Klassik'], 'de'),
  localPeriod('dk-oplysningstid', ['dk'], 1720, ['Dansk oplysningstid', 'Danish Enlightenment', 'Lumières danoises', 'Dänische Aufklärung'], 'dk'),
  localPeriod('se-frihedstid-og-gustaviansk-tid', ['se'], 1720, ['Svensk frihedstid og gustaviansk tid', 'Swedish Age of Liberty and Gustavian era', 'Ère suédoise de la liberté et époque gustavienne', 'Schwedische Freiheitszeit und Gustavianische Zeit'], 'se'),
  localPeriod('no-oplysningstid', ['no'], 1720, ['Norsk oplysningstid', 'Norwegian Enlightenment', 'Lumières norvégiennes', 'Norwegische Aufklärung'], 'no'),
  localPeriod('it-oplysning-og-nyklassicisme', ['it'], 1740, ['Italiensk oplysning og nyklassicisme', 'Italian Enlightenment and Neoclassicism', 'Lumières et néoclassicisme italiens', 'Italienische Aufklärung und Klassizismus'], 'it'),
  globalPeriod('romantik-og-praeromantik', 1770, { da: 'Romantik og præromantik', en: 'Romanticism and pre-romanticism', de: 'Romantik und Präromantik', fr: 'Romantisme et préromantisme', it: 'Romanticismo e preromanticismo' }),
  localPeriod('de-sturm-und-drang-og-romantik', ['de', 'un'], 1770, ['Tysk Sturm und Drang og romantik', 'German Sturm und Drang and Romanticism', 'Sturm und Drang et romantisme allemands', 'Deutscher Sturm und Drang und Romantik'], 'de'),
  localPeriod('gb-romantik', ['gb'], 1780, ['Britisk romantik', 'British Romanticism', 'Romantisme britannique', 'Britische Romantik'], 'gb'),
  localPeriod('us-amerikansk-romantik', ['us'], 1800, ['Amerikansk romantik', 'American Romanticism', 'Romantisme américain', 'Amerikanische Romantik'], 'us'),
  localPeriod('dk-guldalder-og-romantik', ['dk'], 1800, ['Dansk guldalder og romantik', 'Danish Golden Age and Romanticism', 'Âge d’or et romantisme danois', 'Dänisches Goldenes Zeitalter und Romantik'], 'dk'),
  localPeriod('no-nationalromantik', ['no'], 1814, ['Norsk nationalromantik', 'Norwegian National Romanticism', 'Romantisme national norvégien', 'Norwegische Nationalromantik'], 'no'),
  localPeriod('se-romantik', ['se'], 1800, ['Svensk romantik', 'Swedish Romanticism', 'Romantisme suédois', 'Schwedische Romantik'], 'se'),
  localPeriod('sv-fi-nationalromantik', ['un'], 1800, ['Finlandssvensk nationalromantik', 'Finland-Swedish National Romanticism', 'Romantisme national finlandais de langue suédoise', 'Finnlandschwedische Nationalromantik'], 'sv-fi'),
  localPeriod('fr-romantik', ['fr'], 1820, ['Fransk romantik', 'French Romanticism', 'Romantisme français', 'Französische Romantik'], 'fr'),
  localPeriod('it-romantik-og-risorgimento', ['it'], 1815, ['Italiensk romantik og Risorgimento', 'Italian Romanticism and Risorgimento', 'Romantisme italien et Risorgimento', 'Italienische Romantik und Risorgimento'], 'it'),
  globalPeriod('realisme-og-naturalisme', 1840, { da: 'Realisme og naturalisme', en: 'Realism and naturalism', de: 'Realismus und Naturalismus', fr: 'Réalisme et naturalisme', it: 'Realismo e naturalismo' }),
  localPeriod('gb-victoriansk-litteratur', ['gb'], 1837, ['Britisk victoriansk litteratur', 'British Victorian literature', 'Littérature victorienne britannique', 'Britische Literatur des Viktorianischen Zeitalters'], 'gb'),
  localPeriod('us-realisme-og-naturalisme', ['us'], 1865, ['Amerikansk realisme og naturalisme', 'American Realism and Naturalism', 'Réalisme et naturalisme américains', 'Amerikanischer Realismus und Naturalismus'], 'us'),
  localPeriod('fr-realisme-og-naturalisme', ['fr'], 1848, ['Fransk realisme og naturalisme', 'French Realism and Naturalism', 'Réalisme et naturalisme français', 'Französischer Realismus und Naturalismus'], 'fr'),
  localPeriod('de-poetisk-realisme-og-naturalisme', ['de', 'un'], 1848, ['Tysk poetisk realisme og naturalisme', 'German Poetic Realism and Naturalism', 'Réalisme poétique et naturalisme allemands', 'Deutscher poetischer Realismus und Naturalismus'], 'de'),
  localPeriod('dk-det-moderne-gennembrud', ['dk'], 1870, ['Det moderne gennembrud i Danmark', 'The Danish Modern Breakthrough', 'La Percée moderne danoise', 'Der moderne Durchbruch in Dänemark'], 'dk'),
  localPeriod('no-realisme-og-naturalisme', ['no'], 1870, ['Norsk realisme og naturalisme', 'Norwegian Realism and Naturalism', 'Réalisme et naturalisme norvégiens', 'Norwegischer Realismus und Naturalismus'], 'no'),
  localPeriod('se-det-moderne-gennembrud', ['se'], 1870, ['Det moderne gennembrud i Sverige', 'The Swedish Modern Breakthrough', 'La Percée moderne suédoise', 'Der moderne Durchbruch in Schweden'], 'se'),
  localPeriod('it-verisme', ['it'], 1870, ['Italiensk verisme', 'Italian Verismo', 'Vérisme italien', 'Italienischer Verismus'], 'it'),
  localPeriod('es-realisme-og-naturalisme', ['un'], 1840, ['Spansk realisme og naturalisme', 'Spanish Realism and Naturalism', 'Réalisme et naturalisme espagnols', 'Spanischer Realismus und Naturalismus'], 'es'),
  globalPeriod('symbolisme-og-fin-de-siecle', 1880, { da: 'Symbolisme og fin de siècle', en: 'Symbolism and fin de siècle', de: 'Symbolismus und Fin de Siècle', fr: 'Symbolisme et fin de siècle', it: 'Simbolismo e fin de siècle' }),
  localPeriod('fr-symbolisme', ['fr'], 1860, ['Fransk symbolisme', 'French Symbolism', 'Symbolisme français', 'Französischer Symbolismus'], 'fr'),
  localPeriod('gb-aestheticisme-og-dekadence', ['gb'], 1860, ['Britisk æsteticisme og dekadence', 'British Aestheticism and Decadence', 'Esthétisme et décadence britanniques', 'Britischer Ästhetizismus und Dekadenz'], 'gb'),
  localPeriod('dk-halvfemserne-og-symbolismen', ['dk'], 1890, ['Dansk halvfemserlitteratur og symbolisme', 'Danish 1890s literature and Symbolism', 'Littérature danoise des années 1890 et symbolisme', 'Dänische Literatur der 1890er und Symbolismus'], 'dk'),
  localPeriod('se-nittitalisme', ['se'], 1890, ['Svensk nittitalisme', 'Swedish 1890s literature', 'Littérature suédoise des années 1890', 'Schwedische Literatur der 1890er'], 'se'),
  localPeriod('no-nyromantik', ['no'], 1890, ['Norsk nyromantik', 'Norwegian Neo-Romanticism', 'Néoromantisme norvégien', 'Norwegische Neuromantik'], 'no'),
  localPeriod('de-fin-de-siecle', ['de', 'un'], 1890, ['Tysk fin de siècle', 'German fin de siècle', 'Fin de siècle allemand', 'Deutsches Fin de Siècle'], 'de'),
  localPeriod('nl-tachtigers', ['un'], 1880, ['Nederlandske Tachtigers', 'Dutch Tachtigers', 'Tachtigers néerlandais', 'Niederländische Tachtigers'], 'nl'),
  globalPeriod('modernisme-og-avantgarde', 1900, { da: 'Modernisme og avantgarde', en: 'Modernism and avant-garde', de: 'Modernismus und Avantgarde', fr: 'Modernisme et avant-garde', it: 'Modernismo e avanguardia' }),
  localPeriod('gb-modernisme', ['gb'], 1900, ['Britisk modernisme', 'British Modernism', 'Modernisme britannique', 'Britische Moderne'], 'gb'),
  localPeriod('us-modernisme', ['us'], 1900, ['Amerikansk modernisme', 'American Modernism', 'Modernisme américain', 'Amerikanische Moderne'], 'us'),
  localPeriod('fr-modernisme-og-avantgarde', ['fr'], 1900, ['Fransk modernisme og avantgarde', 'French Modernism and avant-garde', 'Modernisme et avant-garde français', 'Französische Moderne und Avantgarde'], 'fr'),
  localPeriod('de-ekspressionisme-og-ny-saglighed', ['de', 'un'], 1910, ['Tysk ekspressionisme og ny saglighed', 'German Expressionism and New Objectivity', 'Expressionnisme et Nouvelle Objectivité allemands', 'Deutscher Expressionismus und Neue Sachlichkeit'], 'de'),
  localPeriod('dk-tidlig-modernisme', ['dk'], 1900, ['Dansk tidlig modernisme', 'Danish early Modernism', 'Premier modernisme danois', 'Dänische frühe Moderne'], 'dk'),
  localPeriod('no-modernisme', ['no'], 1890, ['Norsk modernisme', 'Norwegian Modernism', 'Modernisme norvégien', 'Norwegische Moderne'], 'no'),
  localPeriod('se-modernisme', ['se'], 1900, ['Svensk modernisme', 'Swedish Modernism', 'Modernisme suédois', 'Schwedische Moderne'], 'se'),
  localPeriod('sv-fi-modernisme', ['un'], 1910, ['Finlandssvensk modernisme', 'Finland-Swedish Modernism', 'Modernisme finlandais de langue suédoise', 'Finnlandschwedische Moderne'], 'sv-fi'),
  localPeriod('it-modernisme-og-futurisme', ['it'], 1900, ['Italiensk modernisme og futurisme', 'Italian Modernism and Futurism', 'Modernisme et futurisme italiens', 'Italienische Moderne und Futurismus'], 'it'),
  globalPeriod('efterkrigstid', 1945, { da: 'Efterkrigstid', en: 'Post-war period', de: 'Nachkriegszeit', fr: 'Après-guerre', it: 'Dopoguerra' }),
  localPeriod('dk-efterkrigsmodernisme', ['dk'], 1945, ['Dansk efterkrigsmodernisme', 'Danish post-war Modernism', 'Modernisme danois d’après-guerre', 'Dänische Nachkriegsmoderne'], 'dk'),
  localPeriod('gb-efterkrigslitteratur', ['gb'], 1945, ['Britisk efterkrigslitteratur', 'British post-war literature', 'Littérature britannique d’après-guerre', 'Britische Nachkriegsliteratur'], 'gb'),
  localPeriod('us-efterkrigslitteratur', ['us'], 1945, ['Amerikansk efterkrigslitteratur', 'American post-war literature', 'Littérature américaine d’après-guerre', 'Amerikanische Nachkriegsliteratur'], 'us'),
  localPeriod('fr-efterkrigslitteratur', ['fr'], 1945, ['Fransk efterkrigslitteratur', 'French post-war literature', 'Littérature française d’après-guerre', 'Französische Nachkriegsliteratur'], 'fr'),
  localPeriod('de-efterkrigslitteratur', ['de', 'un'], 1945, ['Tysk efterkrigslitteratur', 'German post-war literature', 'Littérature allemande d’après-guerre', 'Deutsche Nachkriegsliteratur'], 'de'),
  localPeriod('no-efterkrigsmodernisme', ['no'], 1945, ['Norsk efterkrigsmodernisme', 'Norwegian post-war Modernism', 'Modernisme norvégien d’après-guerre', 'Norwegische Nachkriegsmoderne'], 'no'),
  localPeriod('se-efterkrigsmodernisme', ['se'], 1945, ['Svensk efterkrigsmodernisme', 'Swedish post-war Modernism', 'Modernisme suédois d’après-guerre', 'Schwedische Nachkriegsmoderne'], 'se'),
  localPeriod('it-efterkrigslitteratur', ['it'], 1945, ['Italiensk efterkrigslitteratur', 'Italian post-war literature', 'Littérature italienne d’après-guerre', 'Italienische Nachkriegsliteratur'], 'it'),
  globalPeriod('postmodernisme', 1960, { da: 'Postmodernisme', en: 'Postmodernism', de: 'Postmoderne', fr: 'Postmodernisme', it: 'Postmodernismo' }),
  localPeriod('dk-postmodernisme', ['dk'], 1960, ['Dansk postmodernisme', 'Danish Postmodernism', 'Postmodernisme danois', 'Dänische Postmoderne'], 'dk'),
  localPeriod('gb-postmodernisme', ['gb'], 1960, ['Britisk postmodernisme', 'British Postmodernism', 'Postmodernisme britannique', 'Britische Postmoderne'], 'gb'),
  localPeriod('us-postmodernisme', ['us'], 1960, ['Amerikansk postmodernisme', 'American Postmodernism', 'Postmodernisme américain', 'Amerikanische Postmoderne'], 'us'),
  localPeriod('fr-postmodernisme', ['fr'], 1960, ['Fransk postmodernisme', 'French Postmodernism', 'Postmodernisme français', 'Französische Postmoderne'], 'fr'),
  localPeriod('de-postmodernisme', ['de', 'un'], 1960, ['Tysk postmodernisme', 'German Postmodernism', 'Postmodernisme allemand', 'Deutsche Postmoderne'], 'de'),
  localPeriod('no-postmodernisme', ['no'], 1960, ['Norsk postmodernisme', 'Norwegian Postmodernism', 'Postmodernisme norvégien', 'Norwegische Postmoderne'], 'no'),
  localPeriod('se-postmodernisme', ['se'], 1960, ['Svensk postmodernisme', 'Swedish Postmodernism', 'Postmodernisme suédois', 'Schwedische Postmoderne'], 'se'),
  localPeriod('it-postmodernisme', ['it'], 1960, ['Italiensk postmodernisme', 'Italian Postmodernism', 'Postmodernisme italien', 'Italienische Postmoderne'], 'it'),
  globalPeriod('samtid', 1990, { da: 'Samtid', en: 'Contemporary literature', de: 'Gegenwartsliteratur', fr: 'Littérature contemporaine', it: 'Letteratura contemporanea' }),
  localPeriod('dk-samtidslitteratur', ['dk'], 1990, ['Dansk samtidslitteratur', 'Danish contemporary literature', 'Littérature danoise contemporaine', 'Dänische Gegenwartsliteratur'], 'dk'),
  localPeriod('gb-samtidslitteratur', ['gb'], 1990, ['Britisk samtidslitteratur', 'British contemporary literature', 'Littérature britannique contemporaine', 'Britische Gegenwartsliteratur'], 'gb'),
  localPeriod('us-samtidslitteratur', ['us'], 1990, ['Amerikansk samtidslitteratur', 'American contemporary literature', 'Littérature américaine contemporaine', 'Amerikanische Gegenwartsliteratur'], 'us'),
  localPeriod('fr-samtidslitteratur', ['fr'], 1990, ['Fransk samtidslitteratur', 'French contemporary literature', 'Littérature française contemporaine', 'Französische Gegenwartsliteratur'], 'fr'),
  localPeriod('de-samtidslitteratur', ['de', 'un'], 1990, ['Tysk samtidslitteratur', 'German contemporary literature', 'Littérature allemande contemporaine', 'Deutsche Gegenwartsliteratur'], 'de'),
  localPeriod('no-samtidslitteratur', ['no'], 1990, ['Norsk samtidslitteratur', 'Norwegian contemporary literature', 'Littérature norvégienne contemporaine', 'Norwegische Gegenwartsliteratur'], 'no'),
  localPeriod('se-samtidslitteratur', ['se'], 1990, ['Svensk samtidslitteratur', 'Swedish contemporary literature', 'Littérature suédoise contemporaine', 'Schwedische Gegenwartsliteratur'], 'se'),
  localPeriod('it-samtidslitteratur', ['it'], 1990, ['Italiensk samtidslitteratur', 'Italian contemporary literature', 'Littérature italienne contemporaine', 'Italienische Gegenwartsliteratur'], 'it'),
  localPeriod('dk-middelalderlitteratur', ['dk'], 1100, ['Dansk middelalderlitteratur', 'Danish medieval literature', 'Littérature médiévale danoise', 'Dänische Literatur des Mittelalters'], 'dk'),
  localPeriod('de-middelalderlitteratur', ['de', 'un'], 750, ['Tysk middelalderlitteratur', 'German medieval literature', 'Littérature médiévale allemande', 'Deutsche Literatur des Mittelalters'], 'de'),
  localPeriod('fr-middelalderlitteratur', ['fr'], 1050, ['Fransk middelalderlitteratur', 'French medieval literature', 'Littérature médiévale française', 'Französische Literatur des Mittelalters'], 'fr'),
  localPeriod('es-romantik', ['un'], 1800, ['Spansk romantik', 'Spanish Romanticism', 'Romantisme espagnol', 'Spanische Romantik'], 'es'),
  localPeriod('la-nylatinsk-litteratur', ['un'], 1400, ['Nylatinsk litteratur', 'Neo-Latin literature', 'Littérature néo-latine', 'Neulateinische Literatur'], 'la'),
  localPeriod('sv-fi-realisme-og-nittitalisme', ['un'], 1870, ['Finlandssvensk realisme og nittitalisme', 'Finland-Swedish Realism and 1890s literature', 'Réalisme et littérature finlandaise de langue suédoise des années 1890', 'Finnlandschwedischer Realismus und Literatur der 1890er'], 'sv-fi'),
];

const validateLiteraryPeriods = periods => {
  const ids = new Set();
  periods.forEach(period => {
    if (typeof period.id !== 'string' || period.id === '' || ids.has(period.id)) {
      throw new Error(`Ugyldigt eller gentaget litteraturperiode-id: ${period.id}`);
    }
    ids.add(period.id);
    if (period.scope !== 'global' && period.scope !== 'local') {
      throw new Error(`${period.id} har ugyldigt scope: ${period.scope}`);
    }
    if (typeof period.sortYear !== 'number' || Number.isFinite(period.sortYear) === false) {
      throw new Error(`${period.id} har ugyldigt sortYear`);
    }
    requiredTitleLanguages.forEach(lang => {
      if (typeof period.title?.[lang] !== 'string' || period.title[lang] === '') {
        throw new Error(`${period.id} mangler titel på ${lang}`);
      }
    });
    if (period.scope === 'local') {
      if (!Array.isArray(period.countries) || period.countries.length === 0) {
        throw new Error(`${period.id} mangler landeområde`);
      }
      period.countries.forEach(country => {
        if (!knownLiteraryPeriodCountries.has(country)) {
          throw new Error(`${period.id} har ukendt land: ${country}`);
        }
      });
      if (!Array.isArray(period.sources) || period.sources.length === 0) {
        throw new Error(`${period.id} mangler kilde`);
      }
      period.sources.forEach(source => {
        if (typeof source.title !== 'string' || typeof source.url !== 'string') {
          throw new Error(`${period.id} har ugyldig kilde`);
        }
      });
    }
  });
  return periods;
};

validateLiteraryPeriods(literaryPeriods);

const sortedLiteraryPeriods = literaryPeriods
  .map((period, catalogIndex) => ({ period, catalogIndex }))
  .sort((a, b) => a.period.sortYear - b.period.sortYear || a.catalogIndex - b.catalogIndex)
  .map(entry => entry.period);
const literaryPeriodIds = new Set(literaryPeriods.map(period => period.id));

export {
  literaryPeriods,
  literaryPeriodIds,
  knownLiteraryPeriodCountries,
  sortedLiteraryPeriods,
  validateLiteraryPeriods,
};
