# Kalliope – XML-design for publikationer, antologier og tekstforekomster

## Status

**Besluttet design, version 1.1**  
**Dato: 20. juli 2026**

Dette dokument omsætter masterplanen til en konkret XML-model, der kan implementeres trinvist i Kalliopes nuværende repository.

Et grundprincip er:

> Så meget semantisk struktureret indhold som muligt skal udtrækkes fra bøgerne og bevares, også når Kalliope endnu ikke har en konkret visning eller funktion, der bruger oplysningerne.

Det er billigere og mere pålideligt at registrere oplysningerne under den første kildegennemgang end at skulle genåbne facsimilet senere. Struktur må dog ikke opfindes: oplysninger skal fremgå af kilden eller markeres med en passende sikkerhedsgrad.


Et andet gennemgående princip er:

> Første version skal afvige mindst muligt fra Kalliopes nuværende repository-, XML- og buildstruktur.

Nye behov løses derfor først med små, bagudkompatible udvidelser. Modellen må gerne være forberedt på en senere mere principiel opdeling, men den skal ikke indføre ekstra mapper, nye rodtyper, omfattende flytninger eller tvangsmigrering, før det er nødvendigt og afprøvet på rigtige publikationer.

Det betyder blandt andet:

- antologier og tidsskrifter bliver foreløbig i `fdirs`
- den eksisterende dybde `fdirs/<mappe>/<fil>.xml` bevares
- build-processens grundlæggende filscan kan bevares
- eksisterende `author`, `source` og facsimilefelter understøttes fortsat
- nye semantiske elementer indføres gradvist
- en mere udfoldet domænemodel kan komme senere uden at være et krav for første antologi

Modellen tager udgangspunkt i den eksisterende struktur:

- persondata i `fdirs/<person-id>/info.xml`
- enkeltforfatterværker i `fdirs/<person-id>/<work-id>.xml`
- værksvalidering med `data/kalliopework.rng`
- personvalidering med `data/info-xml.rng`
- `<kalliopework>` som beholder for en bestemt udgivelse
- `<text>` som en tekstforekomst i udgivelsen
- `<source>` til kilde- og sideoplysninger

Den nuværende schemafil er **Relax NG**, ikke DTD. Tidligere omtale af `kalliopework.dtd` bør derfor forstås som `data/kalliopework.rng`.

---

## 1. Hovedbeslutning

### Behold `<kalliopework>`

Der indføres ikke en ny rod som `<kalliopepublication>` i første version.

Eksisterende værksfiler repræsenterer allerede i praksis en konkret publikation eller udgave. Eksempelvis repræsenterer `fdirs/aarestrup/1838.xml` Emil Aarestrups bogudgave fra 1838 og indeholder de enkelte tekster fra denne publikation.

`<kalliopework>` formaliseres derfor som:

> En XML-beholder for én bibliografisk identificeret fysisk publikation eller udgave og dens tekstforekomster.

Det giver følgende model:

```text
kalliopework
    = fysisk publikation eller udgave

facsimile
    = én digital gengivelse af publikationen

text
    = én tekstforekomst i publikationen
```

Konsekvensen er:

> Ny fysisk publikation giver en ny `<kalliopework>` og nye `<text>`-forekomster.  
> Et nyt facsimile af samme fysiske publikation føjes til den eksisterende `<kalliopework>`.

---

## 2. Repositorystruktur i første fase

For at holde migreringen enkel bliver både almindelige forfatterværker, antologier og tidsskrifter foreløbig under `fdirs`.

```text
fdirs/
  aarestrup/
    info.xml
    1838.xml

  antologierdk/
    1868-efterklang.xml
    1872-blade-fra-danske-kvinder.xml

  tidsskrifterdk/
    1893-taarnet-01.xml
    1893-taarnet-02.xml
```

Der indføres ikke flere mappeniveauer endnu.

Mapperne:

```text
fdirs/antologierdk/
fdirs/tidsskrifterdk/
```

er reserverede publikationsmapper og skal ikke behandles som personmapper.

Navnene er bevidst praktiske frem for endelige. `fdirs` kan senere få et mere dækkende navn, og publikationsmodellen kan senere foldes ud i en mere principiel struktur. Første version skal ikke foregribe denne migration.

Build-processen kan fortsat scanne:

```text
fdirs/*/*.xml
```

Den skal blot skelne mellem:

- almindelige personmapper
- den reserverede mappe `antologierdk`
- den reserverede mappe `tidsskrifterdk`

Denne forskel kan i første version afgøres ud fra mappenavnet. Senere kan den afledes af metadata eller en mere generel repositorymodel.

### Filnavne

Antologier navngives foreløbig:

```text
<år>-<kort-titel>.xml
```

Eksempel:

```text
fdirs/antologierdk/1868-efterklang.xml
```

Tidsskrifter navngives tilsvarende med år og et stabilt hæfte- eller nummerled:

```text
fdirs/tidsskrifterdk/1893-taarnet-01.xml
```

Filnavnet er praktisk navigation og må ikke være den eneste identitet. Det stabile publikations-ID ligger fortsat i XML’en.

---

## 3. ID-regler

### Publikations-ID

Nye flerforfatterpublikationer skal have globalt entydige ID’er:

```xml
<kalliopework id="efterklang1868" ...>
```

Anbefalet format:

```text
<kort-titel><år><eventuelt-bind-eller-hæfte>
```

Eksempler:

```text
efterklang1868
bladefradanskekvinder1872
taarnet1893h1
illustrerettidende1864h247
```

ID’et må ikke ændres, hvis:

- titlen senere normaliseres
- redaktøren identificeres
- katalogoplysninger rettes
- filen flyttes

Eksisterende værks-ID’er som `aarestrup/1838` bevares. Build-processen kan fortsat danne deres globale nøgle af person-ID og værks-ID.

### Tekst-ID

Hver tekstforekomst får et globalt stabilt ID:

```text
efterklang1868t001
efterklang1868t002
efterklang1868t003
```

ID’et må ikke afhænge af:

- titel
- førstelinje
- forfatteridentifikation
- sidenummer
- teksttype

Disse oplysninger kan senere ændres uden at tekstens identitet ændres.

Løbende numre må ikke genbruges, hvis en fejloprettet tekst slettes eller sammenlægges.

### Facsimile-ID

```text
efterklang1868f1
efterklang1868f2
```

### Midlertidige person-ID’er

En endnu uidentificeret person får et stabilt, neutralt placeholder-ID knyttet til publikationen:

```text
efterklang-1868-ukendt-person-01
efterklang-1868-ukendt-person-02
```

Konventionen er:

```text
<publikation>-<år>-ukendt-person-<løbenummer>
```

ID’et må ikke forsøge at indkode en foreløbig tolkning som `anonym`, `E`, `kvinde` eller lignende. Sådanne oplysninger kan være forkerte eller senere ændre sig.

Den konkrete kildeform bevares i contributor-elementet:

```xml
<contributor
    role="author"
    person="efterklang-1868-ukendt-person-01"
    certainty="unresolved">
  E.
</contributor>
```

Placeholderen får sin egen `info.xml` og kan senere sammenlægges med en identificeret person gennem en kontrolleret migration.


---

## 4. Komplet eksempel: `Efterklang` (1868)

Eksemplet bruger pladsholdere, hvor de konkrete bibliografiske eller personmæssige oplysninger endnu ikke er fastlagt.

```xml
<?xml version="1.0" encoding="UTF-8"?>

<kalliopework
    id="efterklang1868"
    status="in-progress"
    type="anthology">

  <workhead>

    <title>Efterklang</title>
    <year>1868</year>

    <contributors>
      <!--
      <contributor
          role="editor"
          person="person-id"
          certainty="confirmed">Navneform som trykt</contributor>
      -->
    </contributors>

    <imprint>
      <place>Kjøbenhavn</place>
      <publisher><!-- udfyldes --></publisher>
      <printer><!-- udfyldes --></printer>
      <edition>1</edition>
    </imprint>

    <identifiers>
      <!--
      <identifier type="rex">...</identifier>
      <identifier type="bibliotek-dk">...</identifier>
      <identifier type="oclc">...</identifier>
      -->
    </identifiers>

    <notes>
      <note>
        Antologien transskriberes efter det primære facsimile.
        Historisk ortografi og tegnsætning er bevaret.
      </note>
    </notes>

    <source id="efterklang1868-source">
      <i>Efterklang</i>, 1868.
    </source>

    <facsimiles>

      <facsimile
          id="efterklang1868f1"
          ref="FACSIMILE-ASSET-ID"
          provider="kb"
          primary="true"
          page-count="0">

        <label>Det Kgl. Bibliotek</label>

        <page-map offset="0">
          <!--
          Almindelig sammenhængende paginering:

          <range
              printed-from="1"
              printed-to="120"
              index-from="9"/>

          Særlige sider eller afvigelser:

          <page label="titelblad" index="3"/>
          <page label="iv" index="8"/>
          <page label="67" index="76"/>
          -->
        </page-map>

      </facsimile>

    </facsimiles>

    <coverage status="in-progress" updated="2026-07-20">

      <scope type="page-inventory" status="in-progress"/>
      <scope type="segmentation" status="in-progress"/>
      <scope type="transcription" status="in-progress"/>
      <scope type="contributors" status="in-progress"/>
      <scope type="variant-relations" status="not-started"/>

      <!--
      <checked-source
          type="catalogue"
          status="complete"
          ref="kb-rex">Det Kgl. Biblioteks katalog</checked-source>
      -->

    </coverage>

  </workhead>

  <workbody>

    <text
        id="efterklang1868t001"
        type="preface"
        status="verified">

      <head>

        <title>Forord</title>

        <contributors>
          <contributor
              role="editor"
              person="person-id"
              certainty="confirmed">Navneform som trykt</contributor>
        </contributors>

        <source
            in="efterklang1868-source"
            pages="I-IV"/>

        <quality>kilde</quality>

      </head>

      <body xml:space="preserve">
        <prose>
Forordets tekst …
        </prose>
      </body>

    </text>

    <text
        id="efterklang1868t002"
        type="poem"
        status="verified">

      <head>

        <title>Eksempel paa en Digt-Titel</title>
        <firstline>Den første Verslinie staar her</firstline>

        <contributors>
          <contributor
              role="author"
              person="kendt-person-id"
              certainty="confirmed">Navneform som trykt</contributor>
        </contributors>

        <source
            in="efterklang1868-source"
            pages="1-2"/>

        <quality>kilde</quality>

        <relations>
          <relation
              type="identical-text"
              target="andet-tekst-id"
              certainty="confirmed">
            Samme ordlyd i en anden fysisk publikation.
          </relation>
        </relations>

      </head>

      <body xml:space="preserve">
        <poetry>
Den første Verslinie staar her
Og den næste følger efter.

Et nyt Afsnit staar her,
Som det findes i Kilden.
        </poetry>
      </body>

    </text>

    <text
        id="efterklang1868t003"
        type="poem"
        status="unresolved">

      <head>

        <title>Uden Titel</title>
        <firstline>En ukendt Stemme taler</firstline>

        <contributors>
          <contributor
              role="author"
              person="efterklang-1868-ukendt-person-01"
              certainty="unresolved">E.</contributor>
        </contributors>

        <source
            in="efterklang1868-source"
            pages="3"/>

        <quality>kilde</quality>

      </head>

      <body xml:space="preserve">
        <poetry>
En ukendt Stemme taler
Fra Skovens dunkle Sal;
Et Ord kan ikke læses:
<gap reason="illegible" unit="word" quantity="1"/> over Dal.
        </poetry>
      </body>

    </text>

    <text
        id="efterklang1868t004"
        type="poem"
        status="verified">

      <head>

        <title>En Oversættelse</title>
        <firstline>Den første danske Linie</firstline>

        <contributors>
          <contributor
              role="translator"
              person="oversaetter-id"
              certainty="confirmed">Oversætterens Navn</contributor>

          <contributor
              role="original-author"
              person="originaldigter-id"
              certainty="confirmed">Originaldigterens Navn</contributor>
        </contributors>

        <credit type="source-attribution">Efter Originaldigterens Navn.</credit>

        <source
            in="efterklang1868-source"
            pages="4-5"/>

        <relations>
          <relation
              type="translation-of"
              target="original-tekst-id"
              certainty="confirmed"/>
        </relations>

      </head>

      <body xml:space="preserve">
        <poetry>
Den første danske Linie
Og Resten af Oversættelsen.
        </poetry>
      </body>

    </text>

  </workbody>

</kalliopework>
```

---

## 5. Rod-elementet `<kalliopework>`

### Nuværende problem

Den nuværende Relax NG-model kræver både:

```xml
id="..."
author="..."
```

Det passer til enkeltforfatterværker, men ikke til antologier, tidsskrifter og aviser.

### Foreslået ændring

`author` gøres valgfri:

```xml
<define name="kalliopework">
  <element name="kalliopework">

    <attribute name="id">
      <text/>
    </attribute>

    <optional>
      <attribute name="author">
        <text/>
      </attribute>
    </optional>

    <optional>
      <attribute name="status">
        <text/>
      </attribute>
    </optional>

    <optional>
      <attribute name="type">
        <text/>
      </attribute>
    </optional>

    <optional>
      <attribute name="parent">
        <text/>
      </attribute>
    </optional>

    <optional>
      <attribute name="ignore-tests">
        <text/>
      </attribute>
    </optional>

    <ref name="workhead"/>
    <optional>
      <ref name="workbody"/>
    </optional>

  </element>
</define>
```

### Applikationsregel

Schemaet kan ikke alene udtrykke den betingede regel:

```text
Hvis type er et enkeltforfatterværk, skal author normalt findes.
Hvis type er anthology, periodical eller newspaper, må author mangle.
```

Denne regel håndhæves i den semantiske validator.

Anbefalede publikationstyper:

```text
poetry
prose
anthology
periodical
newspaper
manuscript
collection
```

---

## 6. Almindelige digtsamlinger med én forfatter

### Eksisterende filer

Eksisterende digtsamlinger skal fortsat kunne stå uændret:

```xml
<kalliopework
    id="1838"
    author="aarestrup"
    status="complete"
    type="poetry">

  <workhead>
    <title>Digte</title>
    <year>1838</year>
  </workhead>

  <workbody>
    <text id="aarestrup1838t001">
      ...
    </text>
  </workbody>

</kalliopework>
```

`author="aarestrup"` er en bekvem shorthand for én sikker standardforfatter. Parseren normaliserer internt oplysningen til en contributor med:

```text
role       = author
personId   = aarestrup
certainty  = confirmed
scope      = publication
```

Der kræves ingen migration af eksisterende samlinger.

### Nye simple digtsamlinger

Nye almindelige digtsamlinger må fortsat bruge den samme enkle form:

```xml
<kalliopework
    id="digte1868"
    author="person-id"
    type="poetry">
```

`<contributors>` bruges først, når den simple forfattermodel ikke er tilstrækkelig, eksempelvis ved:

- antologier
- oversættelser
- redaktører og samlere
- medforfattere
- gæstetekster
- usikker attribuering
- pseudonymer og trykte navneformer
- paratekster skrevet af andre

### Ingen redundant registrering

Følgende bør normalt være ugyldigt:

```xml
<kalliopework author="aarestrup">
  <workhead>
    <contributors>
      <contributor role="author" person="aarestrup"/>
    </contributors>
  </workhead>
</kalliopework>
```

Den samme kanoniske forfatteroplysning skal ikke registreres både som shorthand og contributor. En trykt navneform eller fuld kreditering kan derimod bevares særskilt, når den har kildeværdi.

---

## 7. `<contributors>`

### Formål

`author`-attributten er egnet til én sikker standardforfatter. `<contributors>` bruges til mere komplekse roller og til at bevare den navneform eller attribution, der faktisk står i kilden.

```xml
<contributors>
  <contributor
      role="author"
      person="person-id"
      certainty="confirmed">
    Navneform som trykt
  </contributor>
</contributors>
```

Elementets tekstindhold er diplomatisk: det bevarer navnet, signaturen eller attributionen, som den optræder i den aktuelle publikation. `person` peger på den kanoniske personpost.

### Roller

Første version bør understøtte:

```text
author
translator
original-author
editor
compiler
adapter
attributed-author
recipient
dedicatee
unknown
```

Rollerne beskriver den aktuelle publikation eller tekstforekomst.

### Sikkerhed

```text
confirmed
probable
possible
unresolved
```

### Trykt navneform og fuld kreditering

`<contributor>` bevarer selve navneformen:

```xml
<contributor
    role="original-author"
    person="heinrich-heine"
    certainty="confirmed">
  H. Heine
</contributor>
```

Hvis den fulde formulering har selvstændig kildeværdi, bevares den i `<credit>`:

```xml
<credit type="source-attribution">Efter H. Heine.</credit>
```

Dermed skelnes mellem:

- kanonisk personidentitet
- navneformen i trykket
- den fulde trykte krediteringsformulering

### Oversættelser

Oversætteren beskrives med `role="translator"`. Originalforfatteren kan beskrives med `role="original-author"`, og den konkrete originaltekst kan samtidig forbindes med `translation-of`.

```xml
<contributors>
  <contributor
      role="translator"
      person="christian-winther"
      certainty="confirmed">
    Chr. Winther
  </contributor>

  <contributor
      role="original-author"
      person="heinrich-heine"
      certainty="confirmed">
    H. Heine
  </contributor>
</contributors>

<credit type="source-attribution">Efter H. Heine.</credit>

<relations>
  <relation
      type="translation-of"
      target="heine-buch-der-lieder-1827t042"
      certainty="confirmed"/>
</relations>
```

De to oplysninger er ikke redundante:

- `translation-of` identificerer den konkrete originaltekst
- `original-author` bevarer originalforfatterens attribution og lokale navneform i oversættelsens kilde

`original-author` må også bruges, når originalteksten endnu ikke er oprettet eller identificeret i Kalliope.

Når begge findes, skal validatoren kontrollere, at `original-author/@person` svarer til måltekstens effektive forfatter. Forskellige person-ID’er er en valideringsfejl. Manglende forfatteridentifikation på målteksten giver en advarsel.

En `translation-of` uden `target` er ikke gyldig publicerings-XML. Et manglende originalmatch registreres i produktionsregistret, indtil den konkrete relation kan oprettes.

### Relax NG

```xml
<define name="contributors">
  <element name="contributors">
    <zeroOrMore>
      <ref name="contributor"/>
    </zeroOrMore>
  </element>
</define>

<define name="contributor">
  <element name="contributor">

    <attribute name="role">
      <text/>
    </attribute>

    <optional>
      <attribute name="person">
        <text/>
      </attribute>
    </optional>

    <optional>
      <attribute name="certainty">
        <text/>
      </attribute>
    </optional>

    <text/>

  </element>
</define>

<define name="credit">
  <element name="credit">

    <optional>
      <attribute name="type">
        <text/>
      </attribute>
    </optional>

    <text/>

  </element>
</define>
```

`person` må midlertidigt mangle, men validatoren bør normalt kræve enten:

- et gyldigt person-ID, eller
- `certainty="unresolved"`.

---

## 8. `<text>` som tekstforekomst

### Nye attributter

Den nuværende `<text>` har allerede valgfri `id` og `author`. Der tilføjes:

```xml
type="..."
status="..."
```

Eksempel:

```xml
<text
    id="efterklang1868t002"
    type="poem"
    status="verified">
```

### Teksttyper

```text
poem
prose
preface
afterword
dedication
motto
editorial-note
contents
other
```

### Tekststatus

```text
draft
transcribed
review
verified
unresolved
incomplete
```

### Relax NG-tilføjelse

```xml
<optional>
  <attribute name="type">
    <text/>
  </attribute>
</optional>

<optional>
  <attribute name="status">
    <text/>
  </attribute>
</optional>
```

Eksisterende `author`-attribut bevares af hensyn til bagudkompatibilitet.

### Arveregler

Contributors arves pr. rolle. Den effektive forfatter findes i denne rækkefølge:

1. tekstens `<contributor role="author" person="...">`
2. tekstens eksisterende `author`-attribut
3. publikationens `<contributor role="author" person="...">`
4. publikationens `<kalliopework author="...">`
5. ellers markeres teksten som uafklaret

En eksplicit contributor på tekstniveau erstatter den nedarvede contributor for samme rolle, men ikke andre roller. En gæsteforfatter erstatter derfor publikationens standardforfatter, mens en redaktør eller samler fortsat kan arves.

Parseren skal bevare forskellen mellem:

```text
explicitContributors
effectiveContributors
```

Nedarvede contributors må ikke automatisk serialiseres ind på hvert enkelt digt.

Nye antologitekster bør bruge `<contributors>`. Eksisterende enkeltforfattertekster behøver ikke migreres.

---

## 9. Semantisk udtræk fra kilderne

### Princip

Når en oplysning er tydeligt markeret i kilden, skal den så vidt muligt struktureres frem for kun at blive gemt som flad tekst. Det gælder også oplysninger, som endnu ikke bruges i Kalliopes brugergrænseflade.

Oplysningerne kan være:

- lagret og valideret
- søgbare i produktions- eller build-systemet
- tilgængelige for senere funktioner
- endnu ikke vist offentligt

### Oplysninger, der bør registreres

Hvor kilden giver grundlag for det:

- hovedtitel og undertitel
- overordnet værktitel
- afsnits- og gruppetitler
- nummerering og etiketter
- genrebetegnelser
- førstelinje
- trykt forfatterangivelse
- signatur og pseudonym
- oversætter og originalforfatter
- redaktør og samler
- tilegnelse og tilegnelsesmodtager
- motto eller epigraf
- mottoets attribution
- fuld krediteringsformulering
- sted- og datoangivelser
- notehenvisninger og fodnoter
- redaktionelle anmærkninger
- sprog og originaltitel
- formuleringer som »efter«, »frit efter« og »oversat fra«
- del, afdeling, sang, bog eller kapitel
- typografisk fremhævelse
- trykte rettelser og errata
- kildehenvisninger inde i publikationen
- titelvarianter i indholdsfortegnelsen

### Diplomatiske og normaliserede værdier

Når relevant bevares både:

- den diplomatiske form fra trykket
- en normaliseret identitet eller værdi til søgning og relationer

Eksempel:

```xml
<contributor
    role="original-author"
    person="heinrich-heine"
    certainty="confirmed">
  H. Heine
</contributor>
```

`H. Heine` er kildeformen. `heinrich-heine` er den kanoniske identitet.

### Struktur må ikke opfindes

AI må kun strukturere noget, som:

- fremgår af kilden
- kan udledes med høj sikkerhed af layout og kontekst
- markeres med sikkerhedsgrad, hvis identifikationen er usikker

Tvivlsom semantik må ikke gøres definitiv.

### Foreslåede semantiske elementer

Nummerering og genrebetegnelser:

```xml
<label type="number">III.</label>
<label type="genre">Romance</label>
```

Sted og dato:

```xml
<dateline>
  <place>Rom</place>
  <date when="1841-05-17">17de Mai 1841</date>
</dateline>
```

Den trykte dato bevares som tekst; `when` er den normaliserede værdi.

Dedikation:

```xml
<dedication>
  <label>Til</label>
  <contributors>
    <contributor
        role="dedicatee"
        person="person-id"
        certainty="confirmed">
      Fru N. N.
    </contributor>
  </contributors>
  <prose>Den trykte Tilegnelse …</prose>
</dedication>
```

En omfattende dedikation kan alternativt være en selvstændig `<text type="dedication">`.

Motto eller epigraf:

```xml
<motto>
  <quote xml:space="preserve">
Den trykte Motto-Tekst
  </quote>

  <contributors>
    <contributor
        role="author"
        person="person-id"
        certainty="probable">
      Goethe
    </contributor>
  </contributors>

  <credit type="source-attribution">Goethe.</credit>
</motto>
```

Mottoets contributors påvirker ikke hovedtekstens authorship.

Noter:

```xml
<note type="authorial">...</note>
<note type="editorial">...</note>
<note type="translator">...</note>
<note type="source">...</note>
```

Trykt signatur:

```xml
<signature>
  <contributor
      role="author"
      person="person-id"
      certainty="confirmed">
    E.
  </contributor>
</signature>
```

### Schemahåndtering

Elementer som `<label>`, `<dateline>`, `<dedication>`, `<motto>`, `<quote>` og `<signature>` skal genbruge eksisterende Relax NG-definitioner, hvor de allerede findes. Manglende definitioner tilføjes som mixed-content-elementer med de viste attributter og child-elementer.

De skal samtidig have klart afgrænset scope: contributors inde i eksempelvis et motto eller en dedikation tilhører den indlejrede struktur og må ikke ændre hovedtekstens effektive contributors.

---

## 10. Bibliografiske oplysninger

### `<imprint>`

```xml
<imprint>
  <place>Kjøbenhavn</place>
  <publisher>Forlagets navn</publisher>
  <printer>Trykkeriets navn</printer>
  <edition>1</edition>
</imprint>
```

Relax NG:

```xml
<define name="imprint">
  <element name="imprint">

    <optional>
      <element name="place">
        <text/>
      </element>
    </optional>

    <optional>
      <element name="publisher">
        <text/>
      </element>
    </optional>

    <optional>
      <element name="printer">
        <text/>
      </element>
    </optional>

    <optional>
      <element name="edition">
        <text/>
      </element>
    </optional>

  </element>
</define>
```

`<title>` og `<year>` forbliver direkte under `<workhead>` af hensyn til eksisterende kode.

### `<identifiers>`

Personernes `info.xml` bruger kildespecifikke elementnavne. Publikationer får i stedet et generisk format:

```xml
<identifiers>
  <identifier type="rex">...</identifier>
  <identifier type="bibliotek-dk">...</identifier>
  <identifier type="oclc">...</identifier>
</identifiers>
```

Relax NG:

```xml
<define name="publicationIdentifiers">
  <element name="identifiers">
    <zeroOrMore>
      <element name="identifier">

        <attribute name="type">
          <text/>
        </attribute>

        <optional>
          <attribute name="href">
            <text/>
          </attribute>
        </optional>

        <text/>

      </element>
    </zeroOrMore>
  </element>
</define>
```

Schema-navnet `publicationIdentifiers` undgår konflikt med eventuelle eksisterende definitioner, selv om XML-elementet fortsat hedder `<identifiers>`.

---

## 11. Facsimiler

### Formål

Den nuværende `<source>` sammenblander til dels:

- den fysiske publikation
- den bibliografiske beskrivelse
- det digitale facsimile
- sideforskydning

Den nye model lader roden repræsentere publikationen og gør facsimiler til selvstændige metadata.

### Eksempel

```xml
<facsimiles>

  <facsimile
      id="efterklang1868f1"
      ref="lokalt-asset-id"
      provider="kb"
      primary="true"
      page-count="136">

    <label>Det Kgl. Bibliotek</label>

    <page-map offset="8">
      <range
          printed-from="1"
          printed-to="120"
          index-from="9"/>
      <page label="titelblad" index="3"/>
      <page label="iv" index="8"/>
    </page-map>

  </facsimile>

</facsimiles>
```

### Betydning

- `id`: stabilt internt facsimile-ID
- `ref`: ID eller filnøgle, som Kalliopes facsimilekode bruger
- `provider`: eksempelvis `kb`, `google-books`, `internet-archive`, `local`
- `primary`: hvilket facsimile der vises som standard
- `page-count`: antal digitale sider
- `index`: 1-baseret facsimileside
- `offset`: standardforskydning for almindelige arabiske sidetal

### Relax NG

```xml
<define name="facsimiles">
  <element name="facsimiles">
    <oneOrMore>
      <ref name="facsimile"/>
    </oneOrMore>
  </element>
</define>

<define name="facsimile">
  <element name="facsimile">

    <attribute name="id">
      <text/>
    </attribute>

    <optional>
      <attribute name="ref">
        <text/>
      </attribute>
    </optional>

    <optional>
      <attribute name="provider">
        <text/>
      </attribute>
    </optional>

    <optional>
      <attribute name="href">
        <text/>
      </attribute>
    </optional>

    <optional>
      <attribute name="primary">
        <text/>
      </attribute>
    </optional>

    <optional>
      <attribute name="page-count">
        <text/>
      </attribute>
    </optional>

    <optional>
      <element name="label">
        <text/>
      </element>
    </optional>

    <optional>
      <ref name="pageMap"/>
    </optional>

  </element>
</define>

<define name="pageMap">
  <element name="page-map">

    <optional>
      <attribute name="offset">
        <text/>
      </attribute>
    </optional>

    <zeroOrMore>
      <choice>
        <ref name="pageMapRange"/>
        <ref name="pageMapPage"/>
      </choice>
    </zeroOrMore>

  </element>
</define>

<define name="pageMapRange">
  <element name="range">

    <attribute name="printed-from">
      <text/>
    </attribute>

    <attribute name="printed-to">
      <text/>
    </attribute>

    <attribute name="index-from">
      <text/>
    </attribute>

    <empty/>

  </element>
</define>

<define name="pageMapPage">
  <element name="page">

    <attribute name="label">
      <text/>
    </attribute>

    <attribute name="index">
      <text/>
    </attribute>

    <empty/>

  </element>
</define>
```

### Beregning af facsimileside

For et almindeligt arabisk sidetal:

```text
facsimile-index = trykt-side + offset
```

En eksplicit `<page>`-mapping har altid forrang.

En matchende `<range>` har forrang frem for det generelle `offset`.

### Bagudkompatibilitet

Eksisterende:

```xml
<source
    facsimile="11530803778B_color"
    facsimile-pages-num="306"
    facsimile-pages-offset="14">
```

skal fortsat virke.

Build-processen kan internt omdanne det til et implicit legacy-facsimile.

Eksisterende filer behøver derfor ikke migreres med det samme.

---

## 12. Kildeangivelse på teksten

I en publikationsfil er tekstens kilde implicit den omgivende `<kalliopework>`.

Tekstniveauet registrerer derfor primært trykte sider:

```xml
<source
    in="efterklang1868-source"
    pages="12-13"/>
```

`in` peger på det menneskeligt læsbare `<source id="...">` i værkets hoved.

Facsimilesiden beregnes gennem `<page-map>`.

De eksisterende attributter `facsimile`, `facsimile-pages` og `facsimile-pages-offset` bevares som undtagelser og til legacy-data.

---

## 13. Tekstrelationer

### Eksempel

```xml
<relations>

  <relation
      type="identical-text"
      target="andet-tekst-id"
      certainty="confirmed">
    Ordlyden er identisk, men teksterne stammer fra forskellige
    fysiske publikationer.
  </relation>

  <relation
      type="revision-of"
      target="tidligere-tekst-id"
      certainty="probable"/>

</relations>
```

### Relationstyper

```text
same-work
identical-text
reprint-of
revision-of
translation-of
adaptation-of
possibly-same-work
```

### Semantik

#### `same-work`

Teksterne repræsenterer samme abstrakte digtværk, men relationen er ikke mere præcist bestemt.

Symmetrisk.

#### `identical-text`

Den transskriberede ordlyd er redaktionelt vurderet som identisk.

Teksterne forbliver adskilte, fordi de findes i forskellige fysiske publikationer.

Symmetrisk.

#### `reprint-of`

Den aktuelle tekst er et dokumenteret genoptryk af målteksten.

Retningsbestemt.

#### `revision-of`

Den aktuelle tekst er en revideret version af målteksten.

Retningsbestemt.

#### `translation-of`

Den aktuelle tekst er en oversættelse af målteksten.

Retningsbestemt.

#### `adaptation-of`

Den aktuelle tekst er en bearbejdelse af målteksten.

Retningsbestemt.

#### `possibly-same-work`

Der er en mulig, men uafklaret værkidentitet.

Symmetrisk.

### Relax NG

```xml
<define name="relations">
  <element name="relations">
    <zeroOrMore>
      <ref name="relation"/>
    </zeroOrMore>
  </element>
</define>

<define name="relation">
  <element name="relation">

    <attribute name="type">
      <text/>
    </attribute>

    <attribute name="target">
      <text/>
    </attribute>

    <optional>
      <attribute name="certainty">
        <text/>
      </attribute>
    </optional>

    <optional>
      <text/>
    </optional>

  </element>
</define>
```

### Første implementation af digtværker

Der indføres ikke et selvstændigt register over abstrakte digtværker i første version.

Relationer mellem tekstforekomster er tilstrækkelige til:

- at vise forbindelser
- at gruppere tekster maskinelt
- at lade AI foreslå klynger
- at undgå en for tidlig kanonisk værkidentitet

Et egentligt `textworks.xml` kan senere genereres ud fra den kuraterede relationsgraf.

---

## 14. Ulæselig, manglende og redaktionelt tilføjet tekst

### Ulæselig tekst

```xml
<gap reason="illegible" unit="word" quantity="1"/>
```

Den offentlige visning renderer dette som:

```text
[ulæseligt]
```

### Manglende side eller linje

```xml
<gap reason="missing" unit="line" quantity="2"/>
```

### Beskadiget kilde

```xml
<gap reason="damaged" unit="word" quantity="1"/>
```

### Redaktionelt suppleret tekst

Hvis en læsning kan etableres fra en anden udgave:

```xml
<supplied
    reason="other-witness"
    source="andet-tekst-id"
    certainty="confirmed">Ordet</supplied>
```

Hvis læsningen ikke er forsvarligt afgjort, bruges `<gap>` i stedet for det bedste AI-gæt.

### Relax NG

```xml
<define name="gap">
  <element name="gap">

    <attribute name="reason">
      <text/>
    </attribute>

    <optional>
      <attribute name="unit">
        <text/>
      </attribute>
    </optional>

    <optional>
      <attribute name="quantity">
        <text/>
      </attribute>
    </optional>

    <empty/>

  </element>
</define>

<define name="supplied">
  <element name="supplied">

    <attribute name="reason">
      <text/>
    </attribute>

    <optional>
      <attribute name="source">
        <text/>
      </attribute>
    </optional>

    <optional>
      <attribute name="certainty">
        <text/>
      </attribute>
    </optional>

    <text/>

  </element>
</define>
```

`gap` og `supplied` skal tilføjes til schemaets `mixed`-valg, så de kan optræde i vers og prosa.

---

## 15. Offentlig dækningsstatus

### Princip

XML’en skal gemme de redaktionelle fakta, som ikke kan udledes automatisk.

Afledte optællinger skal ikke vedligeholdes manuelt i XML.

XML’en gemmer eksempelvis:

```xml
<coverage status="in-progress" updated="2026-07-20">

  <scope type="page-inventory" status="complete"/>
  <scope type="segmentation" status="complete"/>
  <scope type="transcription" status="in-progress"/>
  <scope type="contributors" status="partial"/>
  <scope type="variant-relations" status="not-started"/>

  <checked-source
      type="catalogue"
      ref="kb-rex"
      status="complete">
    Det Kgl. Biblioteks katalog
  </checked-source>

</coverage>
```

Build-processen beregner selv:

- antal tekster
- antal digte
- antal paratekster
- antal identificerede personer
- antal uidentificerede personer
- antal `<gap>`-elementer
- antal uløste relationer

### Statusværdier

```text
not-started
in-progress
partial
complete
not-applicable
```

### Relax NG

```xml
<define name="coverage">
  <element name="coverage">

    <attribute name="status">
      <text/>
    </attribute>

    <optional>
      <attribute name="updated">
        <text/>
      </attribute>
    </optional>

    <zeroOrMore>
      <choice>
        <ref name="coverageScope"/>
        <ref name="checkedSource"/>
      </choice>
    </zeroOrMore>

  </element>
</define>

<define name="coverageScope">
  <element name="scope">

    <attribute name="type">
      <text/>
    </attribute>

    <attribute name="status">
      <text/>
    </attribute>

    <empty/>

  </element>
</define>

<define name="checkedSource">
  <element name="checked-source">

    <attribute name="type">
      <text/>
    </attribute>

    <attribute name="status">
      <text/>
    </attribute>

    <optional>
      <attribute name="ref">
        <text/>
      </attribute>
    </optional>

    <text/>

  </element>
</define>
```

---

## 16. Tilføjelser til `mixed`

Den nuværende Relax NG-model bruger et bredt `mixed`-valg, som genbruges mange steder.

Følgende referencer skal tilføjes:

```xml
<ref name="contributors"/>
<ref name="contributor"/>
<ref name="credit"/>
<ref name="imprint"/>
<ref name="publicationIdentifiers"/>
<ref name="facsimiles"/>
<ref name="facsimile"/>
<ref name="pageMap"/>
<ref name="pageMapRange"/>
<ref name="pageMapPage"/>
<ref name="relations"/>
<ref name="relation"/>
<ref name="coverage"/>
<ref name="coverageScope"/>
<ref name="checkedSource"/>
<ref name="gap"/>
<ref name="supplied"/>
```

Desuden skal schemaets eksisterende eller nye definitioner for de semantiske kildeelementer `<label>`, `<dateline>`, `<dedication>`, `<motto>`, `<quote>` og `<signature>` kunne forekomme i de relevante mixed-content-kontekster. Der bør genbruges eksisterende definitioner frem for at oprette parallelle elementtyper.

Bemærk, at `publicationIdentifiers` er navnet på Relax NG-definitionen, mens XML-elementet er `<identifiers>`.

På længere sigt bør schemaet strammes, så eksempelvis `<facsimiles>` kun kan forekomme i `<workhead>`. Det er ikke nødvendigt for den første implementering, fordi den eksisterende model allerede er meget fri.

Semantisk validering i JavaScript skal derfor supplere Relax NG-valideringen.

---

## 17. Personposter for manglende digtere

### Minimal identificeret digter

```xml
<?xml version="1.0" encoding="UTF-8"?>

<person
    id="person-id"
    country="dk"
    lang="da"
    type="poet"
    status="stub">

  <name>
    <firstname>Fornavn</firstname>
    <lastname>Efternavn</lastname>
    <alternative>Navneform i Efterklang</alternative>
  </name>

  <period>
    <born>
      <date>1820</date>
    </born>
    <dead>
      <date>1880</date>
    </dead>
  </period>

  <identifiers>
    <wikidata>Q...</wikidata>
    <viaf>...</viaf>
  </identifiers>

</person>
```

### Uidentificeret signatur

```xml
<?xml version="1.0" encoding="UTF-8"?>

<person
    id="efterklang-1868-ukendt-person-01"
    lang="da"
    type="poet"
    status="unresolved">

  <name>
    <pseudonym>E.</pseudonym>
    <note>
      Uidentificeret signatur i <i>Efterklang</i>, 1868.
    </note>
  </name>

</person>
```

### Ændring i `info-xml.rng`

Tilføj valgfri status:

```xml
<optional>
  <attribute name="status">
    <text/>
  </attribute>
</optional>
```

Anbefalede værdier:

```text
identified
stub
probable
unresolved
merged
```

`country` bør gøres valgfri. At en person skriver på dansk er ikke det samme som, at personens land er sikkert kendt.

`lang="da"` kan fortsat bruges til at angive det relevante forfattersprog.

### `<works>` og antologier

En antologi skal ikke tilføjes manuelt til alle bidragyderes `<works>`.

Build-processen skal danne et omvendt bidragsindeks ud fra:

```xml
<contributor role="author" person="...">
```

Personens side kan dermed vise:

- egne udgivelser
- tekster i antologier
- tidsskriftsbidrag
- oversættelser
- redaktionelle bidrag

uden redundante lister i hver personfil.

---

## 18. Semantiske valideringsregler

Relax NG kontrollerer XML-strukturen. En særskilt validator skal kontrollere betydningen.

### Publikation

1. `kalliopework/@id` skal være stabilt og entydigt.
2. `author` må mangle ved `anthology`, `periodical`, `newspaper` og `manuscript`.
3. En gennemgående oversætter må ikke registreres som `author`.
4. Der må højst være ét facsimile med `primary="true"`.
5. Alle facsimile-ID’er skal være entydige.
6. En side-map må ikke indeholde modstridende mappings.
7. Facsimileindeks skal ligge inden for `page-count`, når det er angivet.

### Contributors og arv

8. Alle `contributor/@person` skal pege på en eksisterende personpost.
9. En contributor uden `person` skal normalt have `certainty="unresolved"`.
10. Den samme kanoniske rolle må ikke registreres redundant via både shorthand og contributor.
11. Tekstniveauets contributor erstatter den nedarvede contributor for samme rolle.
12. Den diplomatiske navneform må afvige fra personens kanoniske navn.
13. Nedarvede contributors må ikke serialiseres som eksplicitte contributors uden redaktionel grund.

### Oversættelser

14. `translator` beskriver oversætteren af den aktuelle tekstforekomst.
15. `original-author` beskriver originalforfatteren og den lokale navneform i oversættelsens kilde.
16. `translation-of` peger på den konkrete originaltekst, når den kendes.
17. `original-author` og `translation-of` må forekomme samtidigt.
18. Når begge er udfyldt, skal `original-author/@person` stemme med måltekstens effektive forfatter.
19. Forskellige person-ID’er er en valideringsfejl.
20. Manglende forfatter på målteksten giver en advarsel.
21. `original-author` uden person-ID, men med trykt navneform, giver en redaktionel kontrolopgave.
22. En `translation-of` uden `target` er ugyldig.
23. Manglende originalmatch registreres i produktionssystemet, ikke som en halv XML-relation.

### Tekster

24. Alle publicerede `<text>` skal have et globalt entydigt ID.
25. Hver tekst skal have en primær ophavsrelation eller være markeret uafklaret.
26. `type="poem"` skal normalt indeholde `<poetry>`.
27. Paratekster skal have en passende type.
28. Alle `<source pages="...">` skal kunne fortolkes.
29. Alle `<gap>` skal have en gyldig `reason`.
30. `status="verified"` må ikke have ubehandlede produktionsproblemer.
31. En tekst med et redaktionelt accepteret `<gap>` kan godt være verificeret.

### Personer

32. En uidentificeret person skal have `status="unresolved"` eller `stub`.
33. Sammenlagte person-ID’er må ikke fortsat bruges i nye tekster.

### Relationer

34. Alle `relation/@target` skal pege på et eksisterende tekst-ID.
35. En tekst må normalt ikke relatere til sig selv.
36. `identical-text` og `same-work` behandles som symmetriske.
37. `reprint-of`, `revision-of`, `translation-of` og `adaptation-of` behandles som retningsbestemte.
38. En bekræftet `identical-text` må kun bruges mellem forskellige tekstforekomster.
39. To facsimiler af samme publikation må ikke føre til to tekstforekomster.

### Semantisk kildeudtræk

40. Strukturerede oplysninger skal kunne spores til kilden.
41. Normaliserede identiteter må ikke erstatte den diplomatiske kildeform.
42. Usikker semantisk analyse skal have en sikkerhedsgrad.
43. AI må ikke opfinde roller, personer, datoer eller relationer.
44. Oplysninger må gerne lagres, selv om de endnu ikke vises på websitet.
45. Contributors inde i mottoer, dedikationer og andre indlejrede strukturer må ikke ændre hovedtekstens effective contributors.

### Dækning

46. `coverage/@updated` skal være en gyldig ISO-dato.
47. `complete` må kun bruges, når det relevante omfang er dokumenteret.
48. Offentlige optællinger beregnes fra XML og gemmes ikke dobbelt.

---

## 19. Foreslået parsermodel

Efter parsing kan en publikation repræsenteres omtrent sådan:

```js
{
  id: "efterklang1868",
  type: "anthology",
  status: "in-progress",
  defaultAuthorId: null,

  title: "Efterklang",
  year: 1868,

  explicitContributors: [],
  effectiveContributors: [],
  imprint: {
    place: "Kjøbenhavn",
    publisher: null,
    printer: null,
    edition: "1"
  },

  identifiers: [],

  facsimiles: [
    {
      id: "efterklang1868f1",
      ref: "...",
      provider: "kb",
      primary: true,
      pageCount: 136,
      pageMap: {
        offset: 8,
        ranges: [],
        pages: []
      }
    }
  ],

  coverage: {
    status: "in-progress",
    updated: "2026-07-20",
    scopes: [],
    checkedSources: []
  },

  texts: []
}
```

En tekst:

```js
{
  id: "efterklang1868t002",
  type: "poem",
  status: "verified",

  title: "Eksempel paa en Digt-Titel",
  firstLine: "Den første Verslinie staar her",

  explicitContributors: [
    {
      role: "author",
      personId: "kendt-person-id",
      printedName: "Navneform som trykt",
      certainty: "confirmed"
    }
  ],

  effectiveContributors: [
    {
      role: "author",
      personId: "kendt-person-id",
      inherited: false
    }
  ],

  credits: [],

  source: {
    sourceId: "efterklang1868-source",
    printedPages: "1-2"
  },

  relations: [],

  containsGaps: false
}
```

---

## 20. Bagudkompatibilitet

### Gamle enkeltforfatterværker

Følgende skal fortsat være gyldigt uden ændringer:

```xml
<kalliopework
    id="1838"
    author="aarestrup"
    status="complete"
    type="poetry">
```

Tekster uden egne bidragydere arver `author="aarestrup"`.

### Gamle facsimilefelter

Eksisterende facsimileattributter på `<source>` fortolkes som ét implicit facsimile.

### Gamle tekstforfattere

Eksisterende:

```xml
<text author="anden-person">
```

fortsætter som en shorthand for:

```xml
<contributors>
  <contributor
      role="author"
      person="anden-person"
      certainty="confirmed"/>
</contributors>
```

### Migration skal være trinvis

Der gennemføres ikke en stor engangsmigration.

Første implementation udvider den eksisterende struktur med mindst mulige ændringer:

- nye antologier lægges i `fdirs/antologierdk`
- nye tidsskriftsfiler lægges i `fdirs/tidsskrifterdk`
- eksisterende værker bliver liggende urørte
- eksisterende XML-shorthands bevares
- gamle filer migreres kun, når de alligevel redigeres, eller når en konkret funktion kræver det

En senere version kan omdøbe `fdirs`, indføre flere publikationskategorier eller normalisere repositorystrukturen. Det må ikke være en forudsætning for første fase.

---

## 21. Implementeringsrækkefølge

### Trin 1: Parser og schema

- gør `kalliopework/@author` valgfri
- tilføj `text/@type` og `text/@status`
- tilføj contributors, credits og arveregler
- tilføj semantiske kildeelementer
- tilføj imprint og publikationsidentifikatorer
- tilføj facsimiles og page-map
- tilføj relations
- tilføj gap og supplied
- tilføj coverage

### Trin 2: Repositoryscan

- scan eksisterende `fdirs/*/*.xml`
- scan reserverede publikationsmapper gennem det eksisterende `fdirs/*/*.xml`-scan
- valider globale publikations- og tekst-ID’er

### Trin 3: Efterklang

- opret `fdirs/antologierdk/1868-efterklang.xml`
- indsæt antologiens paratekster
- indsæt alle digte
- opret manglende personposter
- registrer det primære facsimile
- registrer trykte sider
- markér `[ulæseligt]` med `<gap>`

### Trin 4: Indekser

Generer:

- person → tekstforekomster
- publikation → bidragydere
- tekst → relationer
- digter → antologier
- facsimile → trykte sider
- offentlig dækningsstatus

### Trin 5: Visning

- antologiside
- bidragyderliste
- facsimilevælger
- relationer mellem tekstforekomster
- offentlig dækningsstatus
- visning af `[ulæseligt]`

### Trin 6: Automatisering

Først når XML-modellen fungerer med den manuelle `Efterklang`:

- automatisk segmentering
- AI-baseret personmatch og navneformsregistrering
- AI-baseret krediterings- og semantikanalyse
- AI-baseret variant- og originaltekstmatch
- automatisk generering af XML-forslag
- automatisk publiceringsvurdering

---

## 22. Acceptkriterier

Første implementation er færdig, når `Efterklang` kan repræsenteres sådan, at:

1. Eksisterende enkeltforfatterværker fortsat virker uden ændringer.
2. Nye simple digtsamlinger fortsat kan bruge `author`.
3. Publikationen har intet falsk hovedforfatter-ID.
4. Contributors kan angives med rolle, personidentitet, sikkerhed og trykt navneform.
5. Arv sker pr. rolle, og eksplicitte og effektive contributors holdes adskilt.
6. Hvert digt har et stabilt tekst-ID.
7. Hver tekst kan knyttes til en kendt eller uafklaret person.
8. Oversætteren registreres som `translator`, ikke som `author`.
9. `original-author` kan bruges med eller uden `translation-of`.
10. Når begge findes, kontrolleres personidentiteten.
11. Den lokale originalforfatternavneform og fulde kreditering kan bevares.
12. Forord, efterord, dedikationer og mottoer kan registreres.
13. Datoer, steder, signaturer, noter, etiketter og andre kildeoplysninger kan struktureres.
14. Semantiske oplysninger kan lagres, selv om de endnu ikke vises.
15. Flere facsimiler kan knyttes til samme publikation uden tekstduplikering.
16. Trykte sider kan mappes til hvert facsimile.
17. Identiske tekster i forskellige publikationer forbliver adskilte.
18. Relationer mellem tekstforekomster kan vises begge steder.
19. Ulæselige steder gemmes semantisk og vises som `[ulæseligt]`.
20. Offentlig dækningsstatus kan genereres.
21. Relax NG og den semantiske validator består.

---

## 23. Låste designbeslutninger

Følgende beslutninger betragtes som låste i version 1.1:

- `<kalliopework>` beholdes som publikationsbeholder.
- Første fase skal afvige mindst muligt fra Kalliopes nuværende struktur.
- Antologier placeres i `fdirs/antologierdk/<år>-<titel>.xml`.
- Tidsskrifter placeres i `fdirs/tidsskrifterdk/<år>-<titel>-<nummer>.xml`.
- Der indføres ikke flere repositoryniveauer endnu.
- `antologierdk` og `tidsskrifterdk` er reserverede publikationsmapper, ikke personmapper.
- En mere udfoldet repository- og domænemodel udsættes til en senere migration.
- `author` bevares som shorthand for simple enkeltforfatterværker.
- `<contributors>` bruges til komplekse og kildebevarende personroller.
- Contributors arves pr. rolle.
- Tekstforekomster er knyttet til fysiske publikationer.
- Samme tekst i forskellige fysiske publikationer er forskellige tekster.
- Flere facsimiler af samme publikation giver ikke flere tekster.
- `original-author` og `translation-of` må forekomme samtidigt.
- Der valideres konsistens mellem dem.
- Den trykte originalforfatternavneform bevares.
- Fuld trykt kreditering kan bevares i `<credit>`.
- Semantiske kildeoplysninger registreres også uden aktuel brugergrænseflade.
- Usikkerhed må ikke skjules.
- Eksisterende filer kræver ikke samlet migration.
