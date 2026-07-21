# Kalliopes XML-vaerkformat

Dette er et internt overblik over XML-formatet for vaerkfiler i `fdirs/<digter>/<vaerk>.xml`.
Det er ikke en formel schemafil, men en praktisk kortlaegning af de elementer og attributter
som build-systemet laeser i dag.

Formatet er tilpasset Kalliopes behov: vaerkmetadata, indholdsfortegnelse, digttekster,
prosa, noter, kilder, faksimiler, varianter, henvisninger og billeder.

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

Titelfelter kan bruge `<num>` som prefix:

```xml
<title><num>III.</num> Digtets titel</title>
```

Det bliver splittet i `prefix` og egentlig titel i indholdsfortegnelsen.

### Workhead source

En kilde paa vaerkniveau kan bruges som default for tekster i samme vaerk:

```xml
<source facsimile="115308051039_color"
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

- `<text>`: en normal tekst/digtpost.
- `<prose>`: en selvstaendig prosatekst med `head` og `body`.
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
- `ignore-tests`: bruges af tests til enkelte undtagelser.

### Text head

`<head>` paa en tekst kan indeholde:

- `<title>`: tekstens titel.
- `<firstline>`: foerstelinje. Maa ikke indeholde markup.
- `<indextitle>`: titel brugt i titelindekset, hvis den skal afvige.
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

- et keyword i `data/keywords/*.xml`
- en digter/person i `fdirs/<id>/info.xml`
- et frit subject-id, hvis ingen af de to findes

Hvis en tekst allerede linker til en digter via et digtlink i noter, maa samme digter ikke
ogsaa sta som keyword. Buildet fejler med `Overfloedig keyword-reference`.

### Text source

En tekstkilde kan bruge default-kilden fra `<workhead>`:

```xml
<source pages="11-12"/>
```

Eller en navngivet kilde:

```xml
<source in="bd2" pages="55-56"/>
```

Attributter:

- `in`: kilde-id fra `<workhead><source id="...">`. Uden `in` bruges `default`.
- `pages`: trykte sidetal.
- `facsimile`: override af faksimile.
- `facsimile-pages`: konkret faksimileside eller interval.

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
"andre tekster knyttet til samme dato".

Datoformatet er normalt `YYYY`, `YYYY-MM` eller `YYYY-MM-DD`. Datohjaelperne kender ogsaa
negative aar og enkelte `ca.`-udtryk.

## Body og tekstblokke

`<body>` indeholder en eller flere blokke:

- `<poetry>`: poesi. Linjer nummereres automatisk.
- `<prose>`: prosa. Renderes som prosalinjer/afsnit.
- `<quote>`: citatblok.

Blokattributter:

- `font-size="small"`: mindre skrift.
- `margin-left="30%"` eller lignende: bruges især paa `<quote>`.
- `margin-right="..."`: bruges især paa `<quote>`.

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
  <quote margin-left="30%" font-size="small">
Et citat
  </quote>
</body>
```

I `<poetry>` laves linjenummerering automatisk. Hver femte linje faar visningsnummer,
medmindre teksten bruger egne `<num>` eller `<margin>`.

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
- `artwork`: reference til et billede i `data/artwork.xml` eller `fdirs/<kunstner>/artwork.xml`.
- `portrait`: reference til et portraet i `fdirs/<digter>/portraits.xml`.
- `primary="true"`: markerer primaert billede.
- `year`: aar for billedet.
- `museum`, `objid`, `invnr`, `wikidata`: bruges til museumslinks.
- `clip-path`: bruges til visuel beskæring.
- `type`: fri type, fx `titlepage`, `frontpage`, `illustration`.
- `lang`: sprog for lokal billedtekst; default er `da`.

For lokale billeder kan billedteksten enten vaere direkte indhold:

```xml
<picture src="x.jpg">Billedtekst.</picture>
```

eller splittes op:

```xml
<picture src="x.jpg">
  <description>Billedtekst.</description>
  <picture-note>Ekstra note.</picture-note>
</picture>
```

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
- `<pb n="..."/>`: sidebrud; renderes ikke visuelt, men kan bruges semantisk.
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
<xref bibel="bibeljohn03,16"/>
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
- `data/keywords/rom.xml`: billeder via `artwork`.
- `data/about/tags.xml`: aeldre, kommenteret oversigt over inline-tags.
