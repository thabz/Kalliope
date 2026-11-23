# Nøgleord

Nøgleord forbinder Kalliopes tekster med redaktionelle artikler om litterære
perioder, genrer, versformer, miljøer og begreber. En artikel ligger i
`content/keywords/<id>.xml`. Redaktionelle data om kategorier og aliaser ligger
i `content/keyword-taxonomy.json`; de er adskilt fra artiklernes kildetekst.

## Kanoniske nøgleord og aliaser

Hvert begreb har ét kanonisk id. Alternative stavemåder og ældre ids registreres
som aliaser i taksonomien. Den eksisterende XML-fil bevares, også når den kun
indeholder en kort »Se …«-henvisning eller en udkommenteret ældre artikeltekst.

Nye tekstregistreringer skal bruge det kanoniske id. Buildet omskriver ældre
aliaser til det kanoniske id i tekst-API'et og søgeindekset. De gamle
nøgleordsadresser viderestilles, og teksthenvisninger under både det kanoniske
id og aliaserne tælles med på den kanoniske artikel.

## Kategorier og relationer

Kategorier er den overordnede navigation og kan overlappe. Et sonnet kan for
eksempel både være en digtart og en versform. Nøgleord uden en udtrykkelig
kategori placeres under »Øvrige begreber«.

De ældre kladdeartikler `genrer`, `perioder` og `verseformer` registreres som
`category_keywords`. Deres `<related>`-lister fortolkes derfor ikke længere som
faglige relationer; medlemskabet vedligeholdes i taksonomien.

`<related>` beskriver en faglig forbindelse mellem to selvstændige begreber.
Relationen vises i begge retninger. Den må ikke bruges til kategori-medlemskab;
det hører hjemme i `content/keyword-taxonomy.json`.

## Nøgleord på tekster

Et nøgleord må tilføjes, når teksten selv er et dokumenterbart eksempel på
formen, genren, perioden eller emnet. En omtale af et begreb er ikke i sig selv
nok. Person-id bruges ved en meningsfuld relation til en digter; en person, der
allerede er linket i en note, gentages ikke i `<keywords>`.

Metriske analyseværktøjer må bruges til at finde kandidater, men resultatet skal
kontrolleres redaktionelt før et formnøgleord tilføjes. Historiske betegnelser
normaliseres gennem aliaser frem for ved at ændre kildeteksten.

Nøgleordsartikler viser op til tre eksempler fra de eksisterende
tekstregistreringer. Danske digtere prioriteres; udenlandske originaltekster
vises, når de er de bedst dokumenterede eller eneste registrerede eksempler.

## Kilder og kvalitetskontrol

Kildeteksten i en artikel gengives tro mod den angivne kilde. Redaktionel
navigation, aliaser, relationer og teksteksempler genereres ved siden af teksten
og må ikke skrives ind som om de var en del af kilden.

Kør `npm run report-keyword-quality` for at finde kladder, manglende kilder,
korte artikler, uregistrerede henvisningsartikler og artikler uden relationer.
Rapporten er en arbejdsliste: den afgør ikke automatisk, om en artikel er
fagligt relevant.
