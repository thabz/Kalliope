const literaryPeriods = [
  {
    id: 'antikken',
    title: {
      da: 'Antikken',
      en: 'Antiquity',
      de: 'Antike',
      fr: 'Antiquité',
      it: 'Antichità',
    },
  },
  {
    id: 'middelalderen',
    title: {
      da: 'Middelalderen',
      en: 'The Middle Ages',
      de: 'Mittelalter',
      fr: 'Moyen Âge',
      it: 'Medioevo',
    },
  },
  {
    id: 'renaessance-og-humanisme',
    title: {
      da: 'Renæssance og humanisme',
      en: 'Renaissance and humanism',
      de: 'Renaissance und Humanismus',
      fr: 'Renaissance et humanisme',
      it: 'Rinascimento e umanesimo',
    },
  },
  {
    id: 'barok-og-tidlig-modernitet',
    title: {
      da: 'Barok og tidlig modernitet',
      en: 'Baroque and early modernity',
      de: 'Barock und Frühe Neuzeit',
      fr: 'Baroque et première modernité',
      it: 'Barocco e prima modernità',
    },
  },
  {
    id: 'oplysningstid-og-klassicisme',
    title: {
      da: 'Oplysningstid og klassicisme',
      en: 'The Enlightenment and classicism',
      de: 'Aufklärung und Klassizismus',
      fr: 'Lumières et classicisme',
      it: 'Illuminismo e classicismo',
    },
  },
  {
    id: 'romantik-og-praeromantik',
    title: {
      da: 'Romantik og præromantik',
      en: 'Romanticism and pre-romanticism',
      de: 'Romantik und Präromantik',
      fr: 'Romantisme et préromantisme',
      it: 'Romanticismo e preromanticismo',
    },
  },
  {
    id: 'realisme-og-naturalisme',
    title: {
      da: 'Realisme og naturalisme',
      en: 'Realism and naturalism',
      de: 'Realismus und Naturalismus',
      fr: 'Réalisme et naturalisme',
      it: 'Realismo e naturalismo',
    },
  },
  {
    id: 'symbolisme-og-fin-de-siecle',
    title: {
      da: 'Symbolisme og fin de siècle',
      en: 'Symbolism and fin de siècle',
      de: 'Symbolismus und Fin de Siècle',
      fr: 'Symbolisme et fin de siècle',
      it: 'Simbolismo e fin de siècle',
    },
  },
  {
    id: 'modernisme-og-avantgarde',
    title: {
      da: 'Modernisme og avantgarde',
      en: 'Modernism and avant-garde',
      de: 'Modernismus und Avantgarde',
      fr: 'Modernisme et avant-garde',
      it: 'Modernismo e avanguardia',
    },
  },
  {
    id: 'efterkrigstid',
    title: {
      da: 'Efterkrigstid',
      en: 'Post-war period',
      de: 'Nachkriegszeit',
      fr: 'Après-guerre',
      it: 'Dopoguerra',
    },
  },
  {
    id: 'postmodernisme',
    title: {
      da: 'Postmodernisme',
      en: 'Postmodernism',
      de: 'Postmoderne',
      fr: 'Postmodernisme',
      it: 'Postmodernismo',
    },
  },
  {
    id: 'samtid',
    title: {
      da: 'Samtid',
      en: 'Contemporary literature',
      de: 'Gegenwartsliteratur',
      fr: 'Littérature contemporaine',
      it: 'Letteratura contemporanea',
    },
  },
];

const literaryPeriodIds = new Set(literaryPeriods.map((period) => period.id));

export {
  literaryPeriods,
  literaryPeriodIds,
};
