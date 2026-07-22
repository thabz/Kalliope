# Kalliopes info.xml-format

Dette er et internt overblik over `fdirs/<id>/info.xml`.
Filen beskriver en person, kunstner, samling eller anden aktør i Kalliope og er grundlaget
for navne, lande-/sproggruppering, værklister, biografisider, tidslinjer og eksterne links.

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
  <literary-periods>oplysningstid-og-klassicisme,romantik-og-praeromantik</literary-periods>
  <works>1795,1808,1819,1832,romi,andre</works>
  <identifiers>
    <wikidata>Q5879</wikidata>
    <viaf>24602065</viaf>
  </identifiers>
</person>
```

## Person-attributter

`<person>` er roden og har disse attributter:

- `id`: personens id. Skal svare til mappenavnet i `fdirs`.
- `country`: landekode/grupperingskode. Bruges bl.a. i forfatteroversigter.
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
- `<sortname>`: eksplicit sorteringsnavn.
- `<pseudonym>`: pseudonym. Kan forekomme flere gange i data.
- `<christened>`: døbenavn/fødenavn.
- `<realname>`: egentligt navn bag pseudonym.

Navnevisningen bruger helperne i `components/poetname-helpers.js` og
`tools/build-static/formatting.js`, så effekten af de enkelte felter kan afhænge af kontekst.

## Period

`<period>` beskriver fødsel, død og i nogle tilfælde kroning:

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

- `<born>`
- `<dead>`
- `<coronation>`

Hver af dem kan indeholde:

- `<date>`: dato, typisk `YYYY`, `YYYY-MM` eller `YYYY-MM-DD`.
- `<place>`: stednavn.

`<place>` kan have attributten `inon`:

```xml
<place inon="on">Frederiksberg</place>
```

`inon` bruges til præpositionen i biografivisning og tidslinjer:

- default er `in`
- `on` bruges fx ved øer eller steder hvor dansk tekst vil sige "på"
- `by` findes som sjælden specialcase

Hvis `period` mangler enten `born` eller `dead`, bliver perioden behandlet som ukomplet i
den statiske data. Biografisiden kan dog stadig findes, hvis der er `bio.xml`, `events.xml`
eller portrætter.

## Literary Periods

```xml
<literary-periods>romantik-og-praeromantik,det-moderne-gennembrud</literary-periods>
```

Kommasepareret liste af litteraturperiode-id'er. De valideres mod
`common/literary-periods.js`.

Feltet bruges til `/literary-periods` og til at gruppere digtere efter periode.

## Works

```xml
<works>1830,1831,1832,1833,1833S,1838,1847,1849,1851,1854,1863,1867,1879,eventyr,andre</works>
```

Kommasepareret liste over værk-id'er.

Regler:

- Hvert id svarer normalt til `fdirs/<person>/<work-id>.xml`.
- Rækkefølgen bruges som udgangspunkt for buildets gennemløb.
- Et værk kan godt stå i listen uden at filen findes, men det bliver ignoreret mange steder.
- Hvis et værk refereres som `<subwork ref="..."/>`, skal det også være nævnt her.

Hvis `<works>` mangler eller er tom, har personen ingen tekstværker, men kan stadig have
portrætter, artwork, bio eller mentions.

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
  <lex-dk>H.C._Andersen</lex-dk>
  <teaterleksikon-lex-dk>H.C._Andersen</teaterleksikon-lex-dk>
  <biografisk-leksikon-lex-dk>H.C._Andersen</biografisk-leksikon-lex-dk>
  <kvindebiografisk-leksikon-lex-dk>Benedicte_Arnesen_Kall</kvindebiografisk-leksikon-lex-dk>
  <litteraturpriser-dk>AHCAndersen</litteraturpriser-dk>
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
- `<gravsted-dk>`
- `<lex-dk>`
- `<teaterleksikon-lex-dk>`
- `<biografisk-leksikon-lex-dk>`
- `<kvindebiografisk-leksikon-lex-dk>`
- `<litteraturpriser-dk>`
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

- `has_works`: baseret på `<works>`.
- `has_poems`: sand hvis et værk indeholder `<poetry>`.
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
- `lang` skal være en kendt sprogkode.
- `literary-periods` skal bestå af kendte periode-id'er.
- Hvis `portraits.xml` findes, skal der være et square-portræt.
- Værk-id'er fra `<works>` bruges til at finde og bygge værkdata.

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
