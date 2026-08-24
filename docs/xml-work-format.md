# Kalliopes XML-vaerkformat

Dette er et internt overblik over XML-formatet for vaerkfiler i `fdirs/<digter>/<vaerk>.xml`.
Det er ikke en formel schemafil, men en praktisk kortlaegning af de elementer og attributter
som build-systemet laeser i dag.

Formatet er tilpasset Kalliopes behov: vaerkmetadata, indholdsfortegnelse, digttekster,
prosa, noter, kilder, faksimiler, varianter, henvisninger og billeder.

## Formatering

Strukturtags står i kolonne 0, også når de er indlejret. Det gælder
`<workhead>`, `<workbody>`, `<text>`, `<section>`, `<head>`, `<content>`,
`<body>`, `<poetry>`, `<prose>`, `<quote>` og `<subwork>` samt deres slut-tags.
Metadatafelter inde i `<head>` og `<workhead>` indrykkes med to mellemrum for
hvert niveau.

Der skal være én blank linje mellem to `<text>`-elementer og én blank linje før
og efter et `<section>`-element. Mellemrum og blanke linjer i selve brødteksten
ændres ikke, fordi de har betydning for tekstens layout og strofestruktur.

En eller flere værkfiler kan formateres uden at ændre brødteksten med:

```sh
node tools/format-work-xml.js fdirs/<digter>/<vaerk>.xml
```

Testen i `__tests__/work-xml-formatting.test.js` kontrollerer den strukturelle
formatering i alle sporede værkfiler.

## Grundstruktur

En vaerkfil har normalt denne form:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<kalliopework id="1856" author="daugaard" status="complete" type="poetry">
  <workhead>
    <title>Lyngblomster</title>
    <year>1856</year>
  </workhead>
  <workbody>
    <text id="daugaard1856a0">
      <head>
        <title>Hederne</title>
        <firstline>De guldhenboelgende Vaenge</firstline>
      </head>
      <body>
        <poetry>
De guldhenboelgende Vaenge
        </poetry>
      </body>
    </text>
  </workbody>
</kalliopework>
```

`<kalliopework>` er roden. Den har disse attributter:

- `id`: vaerkets id. Skal svare til filnavnet uden `.xml`.
- `author`: digterens id. Skal svare til mappen i `fdirs`.
- `status`: typisk `complete` eller `incomplete`.
- `type`: typisk `poetry`; enkelte vaerker bruger `prose`.
- `parent`: valgfri. Bruges naar et vaerk er en underdel af et andet vaerk hos samme digter.
- `ignore-tests`: kommaseparerede, navngivne undtagelser fra enkelte semantiske
  tests. Brug kun en dokumenteret undtagelse og aldrig som generel testafbrydelse.

`<workhead>` indeholder metadata for hele vaerket. `<workbody>` indeholder tekster,
sektioner og eventuelle underværker.

## Workhead

Almindelige felter i `<workhead>`:

- `<title>`: vaerkets titel.
- `<year>`: udgivelsesaar eller andet lovligt aarudtryk. Maa ikke vaere `?`.
- `<subtitle>`: valgfri undertitel. Kan ogsaa bestaa af flere `<line>` elementer.
- `<toctitle>`: titel i indholdsfortegnelser, hvis den skal afvige fra `<title>`.
- `<linktitle>`: titel i links, hvis den skal afvige.
- `<breadcrumbtitle>`: titel i breadcrumbs, hvis den skal afvige.
- `<notes>`: noter om hele vaerket.
- `<pictures>`: billeder knyttet til hele vaerket.
- `<source>`: kildeangivelser, som tekster kan arve eller referere til.
- `<dates>`: datoer for vaerket.
- `<pagebreaks/>`: erklærer, at alle interne sideskift i de inkluderede
  tekstkroppe er registreret med `<pb>`.

Et værks metadata kan have typevaliderede eksterne identifikatorer:

```xml
<workhead>
  <title>Lyngblomster</title>
  <year>1856</year>
  <identifiers>
    <wikidata>Q123</wikidata>
    <openlibrary-work>OL4525390W</openlibrary-work>
  </identifiers>
</workhead>
```

Identifikatorerne gemmes separat i work-metadata.

For værker er `wikidata`, `dbc-work`, `openlibrary-work`,
`dansklitteraturshistorie-lex-dk` og `runeberg-book` tilladt. For konkrete source-udgaver er
`wikidata`, `kb-alma`, `dbc-pid` og `openlibrary-edition` tilladt.

Titelfelter kan bruge `<num>` som prefix:

```xml
<title><num>III.</num> Digtets titel</title>
```

Det bliver splittet i `prefix` og egentlig titel i indholdsfortegnelsen.

### Workhead pagebreaks

Nye værker, der er transskriberet fra et komplet facsimile, skal erklære den
fuldstændige registrering af sideskift i `<workhead>`:

```xml
<workhead>
  <title>Lyngblomster</title>
  <year>1856</year>
  <pagebreaks/>
</workhead>
```

`<pagebreaks/>` betyder, at alle fysiske sideskift **inde i** hver inkluderet
tekst er kontrolleret og markeret efter reglerne nedenfor. Elementet betyder
ikke, at værket nødvendigvis indeholder et `<pb>`: hvis hver tekst står på én
side, er der ingen interne sideskift at indsætte. Fravær af `<pagebreaks/>` i en
ældre værkfil betyder derfor »ikke oplyst«, ikke at kilden er uden sideskift.

### Workhead source

En kilde kan have typevaliderede eksterne identifikatorer. I første version er
kun `<wikidata>` tilladt:

```xml
<source>
  Erica: <i>Lyngblomster</i>, 1856.
  <identifiers><wikidata>Q123</wikidata></identifiers>
</source>
```

Identifikatorerne gemmes separat fra den synlige kildeangivelse.

En kilde paa vaerkniveau kan bruges som default for tekster i samme vaerk:

```xml
<source facsimile="115308051039_color"
        facsimile-pages-num="66"
        facsimile-pages-offset="8">
  Erica: <i>Lyngblomster</i>, 1856.
</source>
```

En stabil digitalisering kan tilføjes på kilde-niveau:

```xml
<source href="https://www.kb.dk/en/..." facsimile="115308051039_color"
        facsimile-pages-num="66"
        facsimile-pages-offset="8">
  Erica: <i>Lyngblomster</i>, 1856.
</source>
```

Attributter:

- `id`: valgfri kilde-id. Uden `id` bliver kilden `default`.
- `facsimile`: mappe/id for faksimile. `.pdf` fjernes automatisk, hvis det er angivet.
- `facsimile-pages-num`: antal sider i faksimilen. Paakraeves naar `facsimile` bruges.
- `facsimile-pages-offset`: tal der laegges til trykte sidetal for at finde faksimilesider.
- `href`: valgfri URL til en stabil digital udgave af teksten.

Flere kilder kan defineres ved at give dem hver deres `id`:

```xml
<source id="bd1" facsimile="..." facsimile-pages-num="..." facsimile-pages-offset="6">...</source>
<source id="bd2" facsimile="..." facsimile-pages-num="..." facsimile-pages-offset="8">...</source>
```

### Workhead dates

```xml
<dates>
  <published>1856</published>
</dates>
```

Understottede felter er:

- `<published>`: bruges som vaerkets publiceringsdato i tidslinjer; falder tilbage til `<year>`.
- `<written>`
- `<performed>`
- `<event>`

Tekstdatoer beskrives nedenfor. De tre sidste samles ogsaa i `caches/collected.dates.json`.

## Workbody

`<workbody>` kan indeholde:

- `<text>`: en normal tekst- eller digtpost. Selvstændig prosa registreres også
  som `<text>` med brødteksten i `<body><prose>...</prose></body>`.
- `<prose>`: en ældre form for selvstændige prosatekster. Brug `<text>` ved nye
  eller redigerede tekstforekomster.
- `<section>`: en gruppe tekster, eventuelt linkbar hvis den har `id`.
- `<subwork ref="..."/>`: henviser til et andet vaerk hos samme digter.

### Text

En normal tekst ser saadan ud:

```xml
<text id="winther2018081001" variant="winther1999032201" aliases="gammelt-id">
  <head>
    <title>Titel</title>
    <firstline>Foerste linje</firstline>
    <keywords>romantikken,heine</keywords>
  </head>
  <body>
    <poetry>
Foerste verslinje
Anden verslinje
    </poetry>
  </body>
</text>
```

Attributter paa `<text>`:

- `id`: globalt tekst-id. Bruges i URL'er og links.
- `author`: valgfrit forfatter-id, hvis teksten har en anden forfatter end værket.
- `variant`: tekst-id for en variant af samme tekst. Variantgrafen bliver symmetrisk.
- `aliases`: komma-separerede gamle id'er, der skal redirecte til denne tekst.
- `skip-index`: hvis sat, udelades teksten fra titel/foerstelinjeindekser.
- `lang`: valgfrit sprog for teksten, hvis den afviger fra digterens `lang`.
- `ignore-tests`: bruges af tests til enkelte dokumenterede undtagelser. Værdien
  `pagebreak-count` springer kun sammenligningen mellem `source/@pages` og antal
  `<pb>` over for teksten.

#### Tekst-id

Nye tekst-id'er består af tekstens effektive digter-id, oprettelsesdatoen i
formatet `YYYYMMDD` og et løbenummer på mindst to cifre:

```text
winther2018081001
winther2018081002
```

Det effektive digter-id er `text/@author`, når attributten findes, og ellers
værkets `kalliopework/@author`. En tekst uden `author` i et værk med
`author="antologierdk"` får derfor eksempelvis id'et
`antologierdk2026081501`. Løbenumre må ikke genbruges, hvis en tekst slettes
eller sammenlægges.

Næste ledige id kan genereres uden at ændre værkfilen:

```sh
npm run new-text-id -- fdirs/antologierdk/1872.xml
npm run new-text-id -- fdirs/antologierdk/1872.xml --author aarestrup
```

CI sammenligner tekst-id'erne semantisk mellem base- og HEAD-committen. Kun
id'er, der ikke fandtes i base-committen, håndhæves efter dette format, så
historiske id-formater fortsat kan bevares uændret.

### Text head

`<head>` paa en tekst kan indeholde:

- `<title>`: tekstens titel. `force-index="true"` viser en ikke-primaer
  variant i titelindekset.
- `<firstline>`: foerstelinje. Maa ikke indeholde markup. `force-index="true"`
  viser en ikke-primaer variant i foerstelinjeindekset.
- `<indextitle>`: titel brugt i titelindekset, hvis den skal afvige.
  `force-index="true"` virker som paa `<title>`.
- `<toctitle>`: titel i vaerkets indholdsfortegnelse.
- `<linktitle>`: titel i links.
- `<subtitle>`: undertitel. Kan indeholde flere `<line>`.
- `<suptitle>`: overtitel. Kan indeholde flere `<line>`.
- `<nofirstline/>`: markerer bevidst manglende foerstelinje.
- `<keywords>`: komma-separerede ids for keywords eller personer/digtere.
- `<notes>`: noter til teksten.
- `<pictures>`: billeder til teksten.
- `<source>`: kilde for teksten.
- `<dates>`: datoer for teksten.
- `<metre>`: en eller flere automatiske, reproducerbare metriske analyser.
- `<form>`: en eller flere automatiske, reproducerbare klassifikationer af
  poetisk form.
- `<structure>`: den observerede, reproducerbare strofe- og linjestruktur.
- `<syllables>`: en eller flere automatiske analyser af digtets stavelsesmønster.

### Automatisk formklassifikation

Formklassifikatoren kombinerer de uafhængige analyser af struktur, rim, metrik
og stavelsesantal. Første version genkender sonetter samt petrarcanske og
shakespeareske undertyper:

```xml
<form>
  <analysis pattern="sonnet" confidence="0.99"/>
  <analysis pattern="petrarchan-sonnet" confidence="0.96"/>
</form>
```

Fjorten linjer er et stærkt, men ikke tilstrækkeligt signal. Manglende
strofegrænser sænker sikkerheden uden automatisk at diskvalificere digtet, og
undertypen udelades, når kun den overordnede form er sikker. Eksisterende
`<form>` betragtes som manuelt kurateret og overskrives aldrig.

Værktøjet kan skrive forslag, vise en forklaring eller blot finde kandidater:

```sh
npm run analyse-form -- --only-missing
npm run analyse-form -- --form sonnet --min-confidence 0.80
npm run analyse-form -- --dry-run --debug
npm run analyse-form -- --find sonnet
```

En samlet, skrivebeskyttet rapport for ét digt-id viser alle delanalyser og den
resulterende formklassifikation:

```sh
npm run poetic-form -- oehlenschlaeger1803000101
```

### Automatisk metrisk analyse

Et kvalificeret automatisk gæt på digtets grundmeter gemmes i tekstens `<head>`:

```xml
<metre>
  <analysis pattern="iambic-pentameter" confidence="0.91"/>
  <analysis pattern="hendecasyllabic" confidence="0.84"/>
</metre>
```

`confidence` er et decimaltal mellem 0 og 1, og analyserne står med den højeste
confidence først. Flere analyser bruges kun, når en rytmisk og en
stavelsesbaseret beskrivelse er kompatible. Eksisterende `<metre>` betragtes som
manuelt kurateret og overskrives ikke af analyseværktøjet.

Kør analysen på hele korpus eller et udvalg med:

```sh
npm run analyse-metre -- --dry-run
npm run analyse-metre -- --poet oehlenschlaeger --debug
npm run analyse-metre -- --work oehlenschlaeger/1803.xml --min-confidence 0.80
```

`--only-missing` kan angives eksplicit; værktøjet springer af hensyn til manuelt
kuraterede oplysninger altid tekster med eksisterende `<metre>` over. Den
danske trykheuristik springer desuden tekster over, når tekstens eller digterens
metadata angiver et andet sprog end `da`.

### Automatisk strukturanalyse

Den observerede strofe- og linjestruktur gemmes i tekstens `<head>`:

```xml
<structure>
  <analysis pattern="4-4-3-3" confidence="1.0"/>
</structure>
```

Tallene er antallet af egentlige verslinjer i hver eksplicit afgrænset strofe.
Et digt med 14 sammenhængende linjer får derfor mønsteret `14`; værktøjet
gætter ikke strofegrænser for at få teksten til at passe til en kendt versform.
Tomme linjer og semantiske speciallinjer som `<nonum>`, `<versenum>`, `<hr>` og
`<metrik>` afgrænser strofer, men tæller ikke som verslinjer. Inline noter,
linjenumre og sideskift tæller heller ikke som selvstændige verslinjer.

Kør analysen på hele korpus eller ét værk med:

```sh
npm run analyse-structure -- --dry-run
npm run analyse-structure -- --work oehlenschlaeger/1803.xml --debug
npm run analyse-structure -- --only-missing
```

Analysen er deterministisk for korrekt XML og får derfor `confidence="1.0"`.
Uden `--only-missing` erstattes en eksisterende strukturanalyse med den aktuelt
observerede struktur. `--dry-run` viser antallet af foreslåede analyser uden at
ændre værkfilerne.

### Automatisk stavelsesanalyse

Et gennemgående stavelsestal gemmes uafhængigt af den rytmiske analyse:

```xml
<syllables>
  <analysis pattern="decasyllabic" confidence="0.94"/>
  <analysis pattern="hendecasyllabic" confidence="0.81"/>
</syllables>
```

Analysen kombinerer et lille udtaleleksikon med regler for moderne og historisk
dansk og en fallback for ukendte ord. Confidence afspejler linjernes
regelmæssighed, udtaleusikkerheden og antallet af analyserede linjer. Naboantal
kan begge gemmes, når fx maskuline og feminine linjeudgange gør dem plausible.

Kør værktøjet direkte eller via npm:

```sh
node tools/analyse-syllables.js --dry-run
node tools/analyse-syllables.js --poet oehlenschlaeger --debug
node tools/analyse-syllables.js --work oehlenschlaeger/1803.xml --min-confidence 0.80
npm run analyse-syllables -- --only-missing
```

Værktøjet overskriver aldrig et eksisterende `<syllables>`-element og springer
tekster over, når tekstens eller digterens metadata angiver et andet sprog end
`da`. `--debug` viser stavelsestallet for hver linje og markerer ord, der er
behandlet med de mindre sikre historiske regler eller elisionsregler.

Titel-fallbacks:

- `title` falder tilbage til `firstline`.
- `indextitle` falder tilbage til `title`.
- `linktitle` falder tilbage til `indextitle` og derefter `title`.
- `toctitle` falder tilbage til `title`.

### Keywords

```xml
<keywords>romantikken,heine</keywords>
```

Hvert id kan vaere:

- et keyword i `content/keywords/*.xml`
- en digter/person i `fdirs/<id>/info.xml`
- et frit subject-id, hvis ingen af de to findes

Hvis en tekst allerede linker til en digter via et digtlink i noter, maa samme digter ikke
ogsaa sta som keyword. Buildet fejler med `Overfloedig keyword-reference`.

### Text source

En tekstkilde kan bruge default-kilden fra `<workhead>`:

```xml
<source pages="11-12"/>
```

```xml
<source href="https://archive.org/details/..." pages="11-12"/>
```

Eller en navngivet kilde:

```xml
<source in="bd2" pages="55-56"/>
```

Attributter:

- `in`: kilde-id fra `<workhead><source id="...">`. Uden `in` bruges `default`.
- `pages`: trykte sidetal.
- `href`: valgfri URL til teksten eller den digitale udgave. Tilsidesætter evt. `href` på den arvede værkkilde.
- `facsimile`: override af faksimile.
- `facsimile-pages`: konkret faksimileside eller interval.

Eksempel (text kilde med arv og override):

```xml
<source href="https://kb.dk/some-stable-record">...</source>
<source in="bd2" href="https://kb.dk/manual-override">...</source>
```

Regler:

- `pages` skal være én fuld sidebetegnelse eller et lukket, ikke-faldende
  interval. Skriv eksempelvis `102-108`, aldrig den bibliografiske forkortelse
  `102-08`; åbne intervaller som `106-` er ugyldige.
- `<workhead><source href="...">` sættes på værkniveau og kan arves af tekster uden egen kilde-href.
- Et tekstniveau `<source href="...">` erstatter URL'en fra den arvede værk-kilde.
- `href`: valgfri URL til den digitale kilde for teksten/udgaven.

`href` arves fra den valgte værkkilde, når teksten ikke selv angiver sin egen `href`.
Hvis teksten angiver en `href`, tilsidesætter den arvet `href`.

Hvis `facsimile-pages` mangler, men `pages` og `facsimile-pages-offset` findes,
beregnes faksimilesiderne automatisk.

Indhold i tekstens `<source>` override'r kildeteksten:

```xml
<source pages="7">En anden kildeangivelse</source>
```

### Text dates

```xml
<dates>
  <written>1871-03-12</written>
  <performed>1871-04</performed>
  <event>1871</event>
</dates>
```

Understottede felter:

- `<published>`
- `<written>`
- `<performed>`
- `<event>`

`written`, `performed` og `event` samles i `caches/collected.dates.json` og bruges til
`andre tekster knyttet til samme dato`.

For tekst-hoveder (`<text><head><dates>`) skal disse felter som minimum være fulde datoer:
`YYYY-MM-DD` på formen år-måned-dag.
Datohjaelperne kender også negative år og enkelte `ca.`-udtryk i andre sammenhænge.

## Body og tekstblokke

`<body>` indeholder en eller flere blokke:

- `<poetry>`: poesi. Linjer nummereres automatisk.
- `<prose>`: prosa. Renderes som prosalinjer/afsnit.
- `<quote>`: citatblok.

Blokattributter:

- `max-width="..."`: valgfri maksimal bredde for især `<quote>`.

`<quote>` renderes med mindre skrift, naturlig bredde og placeres mod højre.
Brug kun `max-width`, når et langt citat skal begrænses yderligere.

Eksempel:

```xml
<body>
  <poetry>
<nonum><right>Til N. N.</right></nonum>
Foerste verslinje
Anden verslinje

----

Tredje verslinje
  </poetry>
  <quote max-width="70%">
Et citat
  </quote>
</body>
```

I `<poetry>` laves linjenummerering automatisk. Hver femte linje faar visningsnummer,
medmindre teksten bruger egne `<num>` eller `<margin>`.

### Sideskift i kilden

Et fysisk sideskift inde i en tekstkrop markeres ved begyndelsen af den nye
kildeside:

```xml
Sidste verslinje på den trykte side
<pb n="12" facs="019.jpg"/>Første verslinje på den næste trykte side
```

Attributterne har forskellig betydning:

- `n`: den nye trykte sides nummer eller trykte sidebetegnelse. Attributten kan
  udelades, når siden ikke har en trykt betegnelse.
- `facs`: det obligatoriske filnavn på facsimilebilledet for den nye side, fx
  `019.jpg`. Angiv kun filnavnet, ikke en sti. Kalliopes genererede
  facsimilefiler er nulbaserede, så PDF-side 20 hedder `019.jpg`.

`<pb>` placeres præcis før det første transskriberede tegn eller inline-element
på den nye side. Hvis en sætning, en verslinje eller et ord fortsætter over
sideskiftet, står markøren inline på det nøjagtige sted:

```xml
En verslinje som fort<pb n="12" facs="019.jpg"/>sætter
```

En `<pb>` må ikke stå på en selvstændig XML-linje i `<poetry>`, fordi den så kan
forveksles med en vers- eller strofegrænse. Ved sideskift mellem verslinjer eller
strofer sættes markøren derfor umiddelbart foran den første tekst på den nye
side. Markøren opretter ikke en verslinje, en blanklinje, en strofe eller et
prosaafsnit og renderes ikke visuelt.

Der indsættes ikke `<pb>` ved begyndelsen eller slutningen af en `<text>` alene
for at gentage tekstens `<source pages="...">`. Derfor kan et værk med
`<pagebreaks/>` lovligt indeholde nul `<pb>`-elementer. I værker med
`<pagebreaks/>` er `facs` redaktionelt obligatorisk på hvert `<pb>`. Schemaet
tillader fortsat ældre `<pb>` uden `facs` af hensyn til bagudkompatibilitet.

Inden for hver tekstpost må de arabiske værdier i `pb/@n` ikke falde. De kan
begynde forfra ved en ny tekstpost, når kilden har selvstændig paginering. De
numeriske facsimilefilnavne i `pb/@facs` må ikke falde inden for den samme
facsimilekilde. I ældre værkfiler med flere kilder begynder en ny rækkefølge,
når tekstens `source/@in` skifter. Uden `source/@in` gælder én rækkefølge for
hele værket. Spring er gyldige, fordi sideskift mellem to tekstposter ikke får
en markør. Romertalsværdier i `n` indgår ikke i den maskinelle
rækkefølgekontrol.

Hvis et lovligt sideinterval undtagelsesvis ikke kan omsættes til
`slutside - startside` interne markører, kan den konkrete tekst bruge
`ignore-tests="pagebreak-count"`. Undtagelsen må ikke bruges til forkortede,
åbne eller faldende `pages`-værdier og springer ikke kravene til `facs`,
placering eller rækkefølge over. Sæt kun undtagelsen på `<kalliopework>`, hvis
den dokumenterede pagineringsafvigelse gælder hele værket.

Særlige linjeformer:

- En blank linje bevares.
- En linje med kun tal eller romertal bliver `<versenum>`.
- En linje med `----` bliver `<hr width="4"/>`.
- En linje med `====` bliver `<hr width="4" class="double"/>`.
- Indledende mellemrum bliver til non-breaking spaces.
- Linjer med kun `***`, `___` eller lignende pakkes i `<nonum>`.

## Sections

Sektioner grupperer tekster og kan nestes:

```xml
<section id="del-1" author="hansenfj" level="2">
  <head>
    <title>Foerste del</title>
  </head>
  <content>
    <text id="...">...</text>
  </content>
</section>
```

Attributter paa `<section>`:

- `id`: gor sektionen linkbar og giver den egen tekstside med intern TOC.
- `author`: valgfrit forfatter-id, som arves af alle tekster og undersektioner.
  Et `author` direkte paa en indlejret `<section>` eller `<text>` overskriver den
  arvede forfatter i den paagaeldende gren.
- `level`: overskriftsniveau i indholdsfortegnelsen.
- `variant`: variant-id, ligesom paa `<text>`.
- `aliases`: gamle id'er, ligesom paa `<text>`.

`<section><head>` bruger især `<title>`, `<toctitle>` og `<linktitle>`.

Sektionens `<content>` kan indeholde `<text>`, `<prose>` og nye `<section>`.

## Prose som tekstpost

Der findes to forskellige ting med navnet `<prose>`:

1. Som tekstpost direkte i `<workbody>` eller `<section><content>`, med `<head>` og `<body>`.
2. Som tekstblok inde i `<body>`.

Som tekstpost ligner den `<text>`:

```xml
<prose id="...">
  <head>
    <title>Prosatekst</title>
  </head>
  <body>
    <prose>
Selve prosateksten.
    </prose>
  </body>
</prose>
```

## Subworks

```xml
<subwork ref="1856-2"/>
```

`ref` skal pege paa et vaerk-id hos samme digter. Vaerket skal ogsaa vaere listet i
digterens `<works>` i `info.xml`.

## Noter

Noter paa vaerk- og tekstniveau:

```xml
<notes>
  <note type="credits">Indtastet af ...</note>
  <note unknown-original-by="heine">Originalen er ikke fundet.</note>
</notes>
```

Attributter paa `<note>`:

- `type`: bruges fx til `credits` og `source`.
- `lang`: sprog for noten; default er `da`.
- `unknown-original-by`: digter-id. Giver noten typen `unknown-original` og bruges som oversaettelsesreference.

Brug en tom `<note unknown-original-by="..."/>`, naar originalens ophavsmand er
kendt, men originalteksten ikke findes i Kalliope. Naar originalteksten findes i
Kalliope, bruges i stedet en `<xref type="translation" poem="..."/>` i en
almindelig note.

Noter i selve teksten kan skrives som `<note>` eller `<footnote>` i tekstblokkene:

```xml
Linje med note<note>Tekstkritisk note.</note>
Prosatekst<footnote>Fodnote.</footnote>
```

Links i noter og fodnoter indgaar i referenceopsamlingen.

## Billeder

`<pictures>` kan staa i `<workhead>` og i tekstens `<head>`.

Lokalt billede:

```xml
<picture src="1856-p1.jpg" type="titlepage" primary="true">
  Titelbladet til <i>Lyngblomster</i>.
</picture>
```

Fælles artwork:

```xml
<picture artwork="eckersberg/thorvaldsen-1814" />
```

Portraet:

```xml
<picture portrait="hugo/p3" />
```

Attributter:

- `src`: lokalt billede. Relative paths slaas op under `/images/<digter>`.
- `artwork`: reference til et billede i `content/artwork.xml` eller `fdirs/<kunstner>/artwork.xml`.
- `portrait`: reference til et portraet i `fdirs/<digter>/portraits.xml`.
- `primary="true"`: markerer primaert billede.
- `year`: aar for billedet.
- `museum`, `objid`, `invnr`: bruges til museumslinks.
- `clip-path`: bruges til visuel beskæring.
- `type`: fri type, fx `titlepage`, `frontpage`, `illustration`.
- `lang`: sprog for lokal billedtekst; default er `da`.

For lokale billeder kan billedteksten enten vaere direkte indhold:

```xml
<picture src="x.jpg">Billedtekst.</picture>
```

Eller splittes op:

```xml
<picture src="x.jpg">
  <description>Billedtekst.</description>
  <!-- Ekstra intern note til redaktøren. -->
</picture>
```

Hvis billedteksten skal opdeles, bruges `description`; der er ikke brug for `<picture-note>`
til interne redaktionelle kommentarer.

## Links og inline-tags

Inline XML bliver renderet client-side af `components/textcontent.js`.

Almindelige inline-tags:

- `<i>`, `<b>`, `<u>`, `<sup>`, `<sub>`, `<strike>`
- `<span lang="sv">`: markerer et inline-tekststykke på et andet sprog uden
  at ændre typografien. Brug ISO 639-1-sprogkoder som `sv`, `de` og `fr`.
- `<s>` og `<small>`
- `<w>`: spatieret tekst; renderes aktuelt som kursiv.
- `<sc>`: small caps.
- `<year>`: semantisk aar, renderes som indholdet.
- `<br/>`
- `<pb n="..." facs="..."/>`: fysisk sideskift i kilden; renderes ikke
  visuelt. Se de fulde regler ovenfor.
- `<colored color="...">`
- `<metrik>`: metriske tegn, hvor `u`, `_`, `-` omsaettes til metrikglyphs.
- `<asterism/>`
- `<center>`, `<right>`, `<block-center>`
- `<blockquote left="50%" right="0">`
- `<two-columns>` med `<column>`
- `<img src="..." width="..." alt="..."/>`

Links:

```xml
<a poet="heine">Heine</a>
<a person="steffens">Steffens</a>
<a poem="schiller2018011501">Die Goetter Griechenlands</a>
<a text="...">tekst</a>
<a keyword="romantikken">romantikken</a>
<a dict="...">ordbogsopslag</a>
<a work="goethe/1819">West-oestlicher Divan</a>
<a href="https://...">eksternt link</a>
<a bible="bibeljohn03,16">Joh 3,16</a>
```

`<xref ...>` er en genvej, der i buildet omskrives til `<a ...>` i noter og tekst:

```xml
<xref poem="schiller2018011501"/>
<xref type="translation" poem="heine..."/>
<xref keyword="romantikken"/>
<xref dict="..."/>
<xref bible="bibeljohn03,16"/>
```

`type="translation"` paa digtlinks bruges til oversaettelsesrelationer.

## Linjenummerering og layout-tags

Disse tags paavirker linjenummerering eller linjelayout:

- `<nonum>...</nonum>`: linjen faar ikke automatisk nummer.
- `<num>...</num>`: manuelt visningsnummer for linjen.
- `<margin>...</margin>`: margintekst/visningsnummer.
- `<resetnum/>`: nulstiller automatisk linjenummerering til 1.
- `<wrap>...</wrap>`: undgaar poesilinje-layout for lange linjer.
- `<center>...</center>` og `<right>...</right>`: linjejustering.

`<nonum>` er den yderste markør for en unummereret linje. En eventuel
linjejustering står inden i `<nonum>`, og typografiske markører står inderst:

```xml
<nonum><right><i>F. H. Guldberg</i></right></nonum>
```

En linje må højst have én linjejustering og må derfor aldrig indeholde både
`<right>` og `<center>`. Typografiske markører som `<i>`, `<small>`, `<w>`,
`<b>` og `<sc>` kan indlejres i vilkårlig rækkefølge.

Hvis en linje indeholder `<num>` eller `<margin>`, regnes teksten for at have egne
visningsnumre, og automatisk visning af hver femte linje slaas fra.

## Typiske valideringer og faldgruber

Buildet tjekker blandt andet:

- `kalliopework@id` skal matche filnavnet.
- `kalliopework@author` skal matche digtermappen.
- `<year>` maa ikke vaere `?` og skal kunne fortolkes som aar.
- En tekst skal have `title`, `linktitle` eller `firstline`.
- `firstline` maa ikke indeholde markup.
- `indextitle` maa ikke indeholde markup.
- En blank `<firstline>` fejler.
- `source in="..."` skal pege paa en kilde defineret i `<workhead>`.
- Faksimileintervaller maa ikke gaa baglaens eller ud over faksimile-sidetallet.
- Tekstaliases maa ikke konflikte med rigtige tekst-id'er eller andre aliases.
- Digtlinks, keywordlinks, dictlinks og bibellinks skal kunne resolves.
- `variant` maa pege paa en kendt tekst.
- `artwork` skal have mappe, fx `kunst/id` eller `kunstner/id`.
- `portrait` skal have formen `digter/pN`.

## Nyttige eksempler at kigge i

- `fdirs/daugaard/1856.xml`: vaerk med kilde, faksimile og titelblad.
- `fdirs/ingemann/1832.xml`: stort vaerk med mange tekster.
- `fdirs/winther/1860-1.xml` og `fdirs/winther/1860-2.xml`: varianter.
- `fdirs/hugo/portraits.xml`: portraetter, inkl. genbrugt keyword-billede.
- `content/keywords/rom.xml`: billeder via `artwork`.
- `content/about/tags.xml`: aeldre, kommenteret oversigt over inline-tags.
