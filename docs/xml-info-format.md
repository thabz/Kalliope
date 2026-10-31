# Kalliopes info.xml-format

Dette er et internt overblik over `fdirs/<id>/info.xml`.
Filen beskriver en person, kunstner, samling eller anden aktør i Kalliope og er grundlaget
for navne, lande-/sproggruppering, værklister, biografisider, tidslinjer og eksterne links.

## Formatteringsregel

Alle `info.xml` skal bruge to mellemrum pr. indrykningsniveau. Kør formatteren
efter oprettelse eller redigering:

```sh
node tools/format-metadata-xml.js fdirs/<id>/info.xml
```

Testpakken sammenligner alle versionsstyrede `info.xml` med formatterens output,
så afvigende formatering ikke kan merges.

## Grundstruktur

```xml
<?xml version="1.0" encoding="UTF-8"?>
<person id="goethe" country="de" lang="de" type="poet">
  <name>
    <firstname>Johann Wolfgang von</firstname>
    <lastname>Goethe</lastname>
  </name>
  <period>
    <born>
      <date>1749-08-28</date>
      <place>Frankfurt am Main</place>
    </born>
    <dead>
      <date>1832-03-22</date>
      <place>Weimar</place>
    </dead>
  </period>
  <literary-periods>dk-oplysningstid,dk-guldalder-og-romantik</literary-periods>
  <identifiers>
    <wikidata>Q5879</wikidata>
    <viaf>24602065</viaf>
    <gnd>1073490319</gnd>
  </identifiers>
</person>
```

## Person-attributter

`<person>` er roden og har disse attributter:

- `id`: personens id. Skal svare til mappenavnet i `fdirs`.
- `country`: landekode/grupperingskode. Bruges bl.a. i forfatteroversigter.
- `nationality`: nationalt tilhørsforhold med en moderne ISO 3166-1 alpha-2-
  landekode i små bogstaver. Påkrævet ved `country="un"`, ellers valgfri.
  For historiske digtere bruges en moderne pendant; for samleposter angiver
  attributten traditionens tilhørsforhold.
- `lang`: personens standardsprog. Bruges bl.a. til sortering og tekstsprog.
- `type`: typen af aktør.

Landekoder, som buildet accepterer i dag:

- `dk`
- `se`
- `no`
- `gb`
- `de`
- `fr`
- `us`
- `it`
- `un`

`un` bruges som en praktisk "uden fast landegruppe"-gruppe og sorteres efter danske regler.

Nationaliteter skal findes i flagopslaget i `common/flags.js`. Det understøtter
`dk`, `se`, `no`, `gb`, `de`, `fr`, `us`, `it`, `es`, `nl`, `gr`, `ir`, `fi`, `is`,
`ch`, `at`, `pt` og `cz`. Fx bevarer Runeberg sin gruppering under »andre«:

```xml
<person id="runeberg" country="un" nationality="fi" lang="sv" type="poet">
```

Jubilæumskalenderen vælger flag med `flagMap[nationality ?? country]`.
`nationality` videreføres til digtermetadata og det offentlige korpusdatasæt.

Sprogkoder, som buildet accepterer i dag:

- `da`
- `sv`
- `no`
- `en`
- `de`
- `fr`
- `la`
- `fa`
- `es`
- `nl`
- `is`
- `cs`
- `un`
- `it`

Typer, der bruges i data:

- `poet`: digter/forfatter med tekster.
- `artist`: billedkunstner, typisk med `artwork.xml`.
- `person`: person der kan omtales, men ikke nødvendigvis har værker.
- `collection`: samlings-id, fx folkeviser eller bibelstof.

## Name

`<name>` samler navnefelter:

```xml
<name>
  <firstname>H.C.</firstname>
  <lastname>Andersen</lastname>
  <fullname>Hans Christian Andersen</fullname>
  <sortname>Andersen, H.C.</sortname>
  <christened>Hans Christian Andersen</christened>
  <realname>...</realname>
  <pseudonym>...</pseudonym>
</name>
```

Understøttede felter:

- `<firstname>`: fornavn(e) eller forled.
- `<lastname>`: efternavn eller hovednavn.
- `<fullname>`: fuldt navn, hvis det ikke bare skal konstrueres af fornavn + efternavn.
  Udelad feltet, når det er identisk med det viste navn; korpustesten kontrollerer
  dette efter normalisering af Unicode og mellemrum.
- `<sortname>`: eksplicit sorteringsnavn.
- `<pseudonym>`: pseudonym. Kan forekomme flere gange i data.
- `<christened>`: døbenavn/fødenavn.
- `<realname>`: egentligt navn bag pseudonym.

Navnevisningen bruger helperne i `components/poetname-helpers.js` og
`tools/build-static/formatting.js`, så effekten af de enkelte felter kan afhænge af kontekst.

## Period

`<period>` beskriver fødsel eller dåb, død og i nogle tilfælde kroning:

```xml
<period>
  <born>
    <date>1805-04-02</date>
    <place>Odense</place>
  </born>
  <dead>
    <date>1875-08-04</date>
    <place>København</place>
  </dead>
</period>
```

Understøttede underfelter:

- `<born>`: fødsel.
- `<baptized>`: dåb. Bruges som startbegivenhed, når fødselsdatoen ikke er
  dokumenteret; feltet må også stå sammen med `<born>`, når begge begivenheder
  kendes.
- `<dead>`
- `<coronation>`

Hver af dem kan indeholde:

- `<date>`: dato, typisk `YYYY`, `YYYY-MM` eller `YYYY-MM-DD`.
- `<place>`: stednavn.

Alle poster undtagen `type="collection"` kræver en fødsels- eller dåbsdato og
en dødsdato. Kravet gælder også kunstnerposter (`type="artist"`). Brug
`<date>?</date>`, når datoen ikke er registreret; udelad ikke perioden eller
datofeltet. Korpustesten håndhæver dette krav.

Når fødselsåret er ukendt, men dødsåret kendes, vises navnets leveår som
`(† 1695)` eller fx `(† c. 1700)` ved et omtrentligt dødsår. Når begge år er
ukendte, vises `(Ukendt levetid)`. Mellemrummet efter `†` er fast (U+00A0),
så tegnet holdes sammen med årstallet.

`<place>` kan have attributten `inon`:

```xml
<place inon="on">Frederiksberg</place>
```

`inon` bruges til præpositionen i biografivisning og tidslinjer:

- default er `in`
- `on` bruges fx ved øer eller steder hvor dansk tekst vil sige "på"
- `by` findes som sjælden specialcase

Hvis `period` mangler både `born` og `baptized`, eller hvis `dead` mangler,
bliver perioden behandlet som ukomplet i den statiske data. Biografisiden kan
dog stadig findes, hvis der er `bio.xml`, `events.xml` eller portrætter.

En dåbsdato vises som »Døbt« på biografisiden og som »døbt« i tidslinjen. Den
bruges som dokumenteret startår i navnenes årsspænd og årssortering, men den
behandles ikke som fødselsdag i »I dag«, jubilæumskalenderen eller
aldersberegningen.

## Literary Periods

```xml
<literary-periods>romantik-og-praeromantik,dk-guldalder-og-romantik,dk-det-moderne-gennembrud</literary-periods>
```

Kommasepareret liste af litteraturperiode-id'er. Listen kan indeholde vilkårligt
mange overlappende, traditionsspecifikke perioder, og medlemskab angives altid
eksplicit. Perioderne er flade kategorier; der findes ingen globale
standardperioder eller automatisk medlemskab. Id'erne har traditionens prefix,
fx `dk-`, `gb-`, `de-`, `es-` eller `sv-fi-`, og må kun bruges for personer i
periodens angivne landeområde. Det redaktionelle katalog ligger i
`content/literary-periods.json` og valideres under `build-static`; XML-feltet
refererer kun til id'erne.

Feltet bruges til `/literary-periods` og til at gruppere digtere efter periode.

## Automatisk værkregistrering

`<works>` er afskaffet og afvises af RELAX NG-schemaet. Værker findes automatisk
som XML-filer med rodelementet `<kalliopework>` direkte i digterens mappe.
Filnavnet uden `.xml` skal svare til værkets `id`, og `author` skal svare til
mappenavnet. Også ufuldstændige værker, antologier og underværker registreres.
En ny værkfil kræver ingen ændring i `info.xml`.

Den normale visningsrækkefølge bestemmes af år og titel. Særlige rækkefølger
angives med den valgfrie `sort-order` på hver værkfil, jf.
`docs/xml-work-format.md`. Bibelen bruger denne attribut til sin bogrækkefølge.

Korpustesten og buildet bruger samme filklassifikation. Ud over værkfiler
accepteres kun disse metadatafiler med de angivne rodelementer:

| Fil | Rodelement | Funktion |
| --- | --- | --- |
| `info.xml` | `person` | Personmetadata og identifikatorer |
| `bio.xml` | `bio` | Biografitekst |
| `events.xml` | `events` | Tidslinjebegivenheder |
| `portraits.xml` | `pictures` | Portrætter |
| `artwork.xml` | `pictures` | Kunstværker |
| `bibliography-primary.xml` | `items` | Primærbibliografi |
| `bibliography-secondary.xml` | `items` | Sekundærbibliografi |

Ukendte XML-filer eller et forkert rodelement er fejl. De gamle, ubrugte
`links.xml`-filer er fjernet; de indgår ikke i det nuværende linkformat.

Buildet gemmer filklassifikationen i `caches/poet-files.json`. Mapperne
kontrolleres ved hvert build; uændrede filer genbruger klassifikationen uden
XML-parsing. Tilføjede, ændrede og slettede værker genberegner berørte
forfatterdata og værkoutput. En manglende eller ældre cache genskabes automatisk.

Ved merge af ældre PR'er fjernes deres `<works>`-ændringer, mens værkfilerne
bevares. Schemaet og `make test` håndhæver oprydningen.

## Identifiers

`<identifiers>` samler eksterne id'er:

```xml
<identifiers>
  <wikidata>Q5673</wikidata>
  <wikipedia-da>H.C. Andersen</wikipedia-da>
  <wikipedia-en>Hans Christian Andersen</wikipedia-en>
  <wikipedia-fr>Hans Christian Andersen</wikipedia-fr>
  <wikipedia-de>Hans Christian Andersen</wikipedia-de>
  <gravsted-dk>hcandersen</gravsted-dk>
  <viaf>4925902</viaf>
  <gnd>1073490319</gnd>
  <lex-dk>H.C._Andersen</lex-dk>
  <teaterleksikon-lex-dk>H.C._Andersen</teaterleksikon-lex-dk>
  <biografisk-leksikon-lex-dk>H.C._Andersen</biografisk-leksikon-lex-dk>
  <kvindebiografisk-leksikon-lex-dk>Benedicte_Arnesen_Kall</kvindebiografisk-leksikon-lex-dk>
  <danskforfatterleksikon-dk>AHCAndersen</danskforfatterleksikon-dk>
  <runeberg-org>andersen</runeberg-org>
  <gutenberg-org>2298</gutenberg-org>
</identifiers>
```

Buildet læser ikke alle felter direkte i `poets.js`, men de bruges af link-/bio-komponenter
og er derfor en del af formatet.

Almindelige felter:

- `<wikidata>`
- `<wikipedia-da>`, `<wikipedia-en>`, `<wikipedia-fr>` og `<wikipedia-de>`
- `<viaf>`
- `<gnd>`
- `<gravsted-dk>`
- `<lex-dk>`
- `<teaterleksikon-lex-dk>`
- `<biografisk-leksikon-lex-dk>`
- `<kvindebiografisk-leksikon-lex-dk>`
- `<danskforfatterleksikon-dk>`: Dansk Forfatterleksikon-id fra Wikidata-egenskaben P12386.
- `<runeberg-org>`
- `<gutenberg-org>`

Wikipedia-felterne indeholder artikeltitler fra Wikidatas sitelinks. Grænsefladen
vælger feltet for det aktuelle Kalliope-sprog og falder tilbage til
`<wikipedia-en>`, hvis der ikke findes en artikel på det aktuelle sprog. Hvis
begge mangler, vises der ikke et Wikipedia-link. Felterne opdateres sammen med
de øvrige eksterne id'er af `tools/sync-wikidata.rb`. Kør synkroniseringen i
dens kortlivede værktøjscontainer:

```sh
make sync-wikidata
```

Angiv eventuelt en eller flere digter-id'er for kun at synkronisere dem:

```sh
make sync-wikidata POETS="pope andersen"
```

Der kan findes andre sjældne id-felter i data; de bør dokumenteres her, når de får aktiv brug.

## Afledte has-felter

Buildet udleder en række booleans fra `info.xml` og nabofiler:

- `has_works`: mindst én automatisk registreret værkfil.
- `has_poems`: sand hvis et værk indeholder `<poetry>`.
- `has_indexed_poems`: sand hvis mindst ét digt indgår i titel- og
  førstelinjeindekserne.
- `has_prose`: sand hvis et værk indeholder `<prose>`.
- `has_texts`: `has_poems || has_prose`.
- `has_portraits`: findes `fdirs/<id>/portraits.xml`.
- `has_square_portrait`: mindst et portræt har `square-src`.
- `has_artwork`: findes `fdirs/<id>/artwork.xml`.
- `has_biography`: findes `bio.xml`, lokal `events.xml`, eller brugbar fødsels-/dødsperiode.
- `has_mentions`: udledes senere fra referencer og bibliografier.

Hvis en person har `portraits.xml`, skal der være mindst et `square-src`, ellers fejler buildet.

## Valideringer og faldgruber

Buildet tjekker blandt andet:

- Alle mapper i `fdirs` skal have `info.xml`.
- `country` skal være en kendt landekode.
- `country="un"` kræver en ikke-tom `nationality`, og enhver angivet nationalitet
  skal kunne oversættes til en flag-emoji. Korpusregressionen kontrollerer også,
  at `nationality ?? country` giver en flag-emoji for hver post i `info.xml`.
- `lang` skal være en kendt sprogkode.
- `literary-periods` skal bestå af kendte periode-id'er.
- lokale litteraturperioder skal passe til personens `country`.
- Hvis `portraits.xml` findes, skal der være et square-portræt.
- Alle XML-filer i digtermapperne skal have en understøttet funktion; værker registreres automatisk.

Bemærk:

- `person@id` valideres ikke eksplicit mod mappenavnet i `poets.js`, men bør altid matche.
- `country` er lande-/gruppekode; `lang` er sproget og bør ikke bruges som landekode.
- Stednavne oversættes andre steder via `common/place-names.js`, ikke i `info.xml`.

## Nyttige eksempler

- `fdirs/andersen/info.xml`: fuldt dansk digtereksempel med identifiers.
- `fdirs/goethe/info.xml`: tysk digter med litteraturperioder.
- `fdirs/abildgaard/info.xml`: kunstner (`type="artist"`).
- `fdirs/folkeviser/info.xml`: samlings-/collection-lignende data.
- `fdirs/christian7/info.xml`: person med kroningsdata.

## Dokumenteret forgæves biografisøgning

Alle nye egentlige personer kræver en synlig, ikke-tom biografi eller en
`biography-status` efter `docs/person-editorial.md`. Samleposter undtages.
Markøren er redaktionelle metadata; den opretter ikke en biografiside og
ændrer ikke `has_biography`. Opret aldrig en tom `bio.xml` som negativt fund.
