# Redaktionelle noter i værkerne

Gennemgangen den 25. oktober 2026 tager udgangspunkt i `800ccf89c` (#2047).
Den omfatter alle `<note>` og `<footnote>` i værkernes XML, herunder
værkhoveder, teksthoveder, titler, mottoer, prosa og vers. Biografier,
leksikonartikler og interne person-/stedmetadata indgår ikke.

Udgangspunktet var 15.033 noter i 916 værkfiler. Fem blandede noter er delt,
så slutresultatet er **15.038 noter: 8.862 mærkede Kalliope-noter,
6.015 bevarede kilde-/tredjepartsnoter og 161 noter med uafklaret ophav**.
Kildegruppen omfatter også litterære oversættelser i notefelter og overførte
produktionsmeddelelser; de tilskrives ikke Kalliopes redaktion.

Dette er en gennemgang af noternes ophav, ikke en ny fuldstændig
facsimilekorrektur af værkerne. Manglende markering betyder fortsat ikke i sig
selv, at en note er forfatterens.

## Reproducerbart inventar

```sh
node tools/report-editorial-notes.js
node tools/report-editorial-notes.js --unresolved --json
node tools/report-editorial-notes.js --json --group=asterisk-declaration
```

Værktøjet læser kilde-XML, fordi det offentlige bulkdatasæt ikke indeholder
noternes fulde indhold. Det skriver ingen filer. JSONL-output indeholder fil,
fysisk linje/kolonne, nulbaseret noteindeks inden for filen, tekst-id (`scope`),
indhold, markering og indholdshash. `scope: "work"` betegner værkniveauet.
Indholdshashen ser bort fra `editorial="true"`, også i indlejrede noter.

Inventarets SHA-256 efter gennemgangen er:

```text
d43b59340d87b32986dc080a67a65ea45b3bcd8a9992905e0138e9f0cc44fff8
```

Fingeraftrykket omfatter noternes rækkefølge, fil, tekst-id, indhold og
markering. Det er ikke en attest for resten af værkets tekst eller metadata.
Ved et ændret inventar advarer værktøjet om, at denne rapports dækningsantal
gælder det registrerede øjebliksbillede. Det indfører aldrig markeringer og
udleder ikke nye noters ophav under et build.

De 161 undtagelser findes grupperet med begrundelser i
[`tools/data/editorial-note-exceptions.json`](../tools/data/editorial-note-exceptions.json).
De identificeres ved fil, tekst-id og hash frem for linjenummer eller
noteindeks, så nye noter tidligere i en fil ikke flytter afgørelsen. En
ændret, slettet, dobbeltregistreret eller alligevel mærket undtagelse giver
exitkode 1 og skal vurderes igen.

## Gennemgåede grupper

Grupperne nedenfor er gensidigt udelukkende og dækker hele inventaret.
Gruppebetegnelserne er arbejdshjælp; de er ikke generelle beviser for ophav.

| Gruppe i værktøjet | Kalliope | Kilde/øvrige | Uafklaret |
| --- | ---: | ---: | ---: |
| `asterisk-declaration` | 128 | 0 | 0 |
| `declared-editorial` | 2.190 | 0 | 0 |
| `declared-source` | 0 | 1.698 | 0 |
| `asterisk-without-declaration` | 12 | 280 | 0 |
| `credits` | 1.259 | 0 | 0 |
| `errata` | 171 | 0 | 0 |
| `correction` | 482 | 0 | 0 |
| `translation-reference` | 1.901 | 0 | 0 |
| `other-metadata` | 2.175 | 284 | 105 |
| `other-inline` | 544 | 3.753 | 56 |
| **I alt** | **8.862** | **6.015** | **161** |

### Asterisk-konventioner

128 erklæringer i 128 værkfiler beskriver, at stjernemærkede noter er
digterens, oversætterens eller den trykte udgivers. Varianterne omfatter
`asterisk`, `asteriks`, `foranstillet *` og `markeret med *`. Selve
forklaringen er Kalliopes, også når den selv begynder med en stjerne som i
`winther/1846`.

126 erklæringer gælder hele værket. I `baggesen/1819` gælder erklæringen kun
`baggesen2002110201`, og i `rodeh/1928` kun `rodeh201709102`. Andre tekster i
de to filer er gennemgået særskilt. Rodes formulering siger udtrykkeligt,
at alle fodnoter og de stjernemærkede noter er hans: derfor beskyttes også
ustjernede `<footnote>` i netop den tekst.

De øvrige ustjernede noter i de erklærede områder er gennemgået som
Kalliopes forklaringer, henvisninger, krediteringer og tekstkritiske apparat.
Stjernemærkede noter uden erklæring er gennemgået særskilt. De 12 mærkede
undtagelser i denne gruppe findes i `baggesen/1815`: her siger metadata, at
stjernen angiver førstetrykkets læsemåde, ikke digterens ophav. Stjernen
bevares som tekst, men visningen giver den ikke tooltippen »Forfatterens
note«, når noten udtrykkeligt er redaktionel.

### Kreditering, forlæg og tekstkritik

Krediteringerne beskriver bidrag, indtastning, digitalt tekstgrundlag,
korrektur og tilladelser. De er gennemgået efter indhold, inklusive ældre
krediteringer uden `type="credits"`.

Forlægsnoter med oversættelsesrelationer og `unknown-original-by` er
gennemgået som redaktionelle oplysninger om de konkrete tekstversioner.
Et link alene gør ikke en trykt note til Kalliopes; trykte noter med
tilføjede links er bevaret som kildeapparat.

Rettelsesnoter er vurderet som Kalliopes registrering af indførte rettelser
eller udgaveforskelle. Et `]`, en nutidig stavemåde eller en bestemt tagtype
er ikke alene en klassifikationsregel. Oplysningen om 1838 ved
»Vestalinden«, både i `mueller/1838` og `mueller/andre`, kan føres tilbage
til den udtrykkelige redaktionelle tilføjelse i commit `6693f3610`.

Automatisk dannede pseudonymnoter og værksidernes forklaringer om gennemgåede
rettelseslister får samme mærkat. De er ikke ekstra XML-noter og indgår
derfor ikke i tabellens optælling. Almindelige strukturerede kildeangivelser
bevarer deres eksisterende visning.

### Overførte noter og kildekontrol

Sammenhængende trykte noteapparater er bevaret, bl.a. Molbechs Dante-noter,
Christian Molbechs ordforklaringer til Herr Michael, Thaarups Falster-noter,
Blichers Ossian-noter, Moths anmærkninger, Larsens Edda-noter, Grundtvigs
folkeviseindledninger og de trykte noter i de indførte årgange af
*Nytaarsgave for Damer* og *Gæa*. Førstepersonsnoter og udtrykkeligt
tilskrevne noter hos bl.a. Jacobsen, Staffeldt, Haller, Rilke, Shelley og
Whitman bevares ligeledes.

Importhistorikken dokumenterer konkrete kildegrupper i
[Herr Michael (#1653)](https://github.com/thabz/Kalliope/pull/1653),
[Moth (#1630)](https://github.com/thabz/Kalliope/pull/1630),
[Ossian (#1976)](https://github.com/thabz/Kalliope/pull/1976) og
[*Nytaarsgave for Damer* 1798 (#2040)](https://github.com/thabz/Kalliope/pull/2040).
Ved tvivl om korte ældre noter er tilføjelses-/flyttehistorikken undersøgt;
automatisk XML-konvertering og senere omplacering er ikke taget som bevis
for, at teksten er skrevet af Kalliope.

Følgende konkrete facsimilestikprøver kontrollerer de gennemgåede
kildegrupper. Sidetallene er trykkets, billednumrene er nulbaserede.

| Værk | Kontrolleret side | Facsimile og billede |
| --- | --- | --- |
| Molbech, *Helvede* (1851) | 6 og 219 | `130016730948_color/119.jpg`, `332.jpg` |
| Thøger Larsen, *Slægternes Træ* (1914) | 118–119 | `11530807499D_color/123.jpg`, `124.jpg` |
| Åkjær, *Fri Felt* (1905) | 29 | `11530803730A_color/042.jpg` |
| Åkjær, *Rugens Sange* (1906) | 44 | `11530803731D_color/049.jpg` |
| Åkjær, *Muld og Malm* (1909) | 16 | `115308037427_color/029.jpg` |
| Åkjær, *Den Sommer og den Eng* (1910) | 45 | `115308037430_color/058.jpg` |
| Åkjær, *Vejr og Vind og Folkesind* (1916) | 24 | `11530803750F_color/031.jpg` |
| Bønnelycke, *Buer og Staal* (1919) | 16 | `115308049197-color/021.jpg` |
| Langsted, *Lyng* (1901) | 78 | `130001750527-color/084.jpg` |
| Brandes, *Ungdomsvers* (1898) | 9 | `115308046617/023.jpg` |

Billederne findes under
`https://kalliope.org/static/facsimiles/<digterid>/<facsimile>/<billede>`.
Åkjærs ordforklaringer findes også som ustjernede metadata-noter i XML;
stikprøverne bekræfter, at disse grupper kommer fra trykket og ikke skal
mærkes som Kalliopes. Brandes' note om *toga prætexta* er trykt under
»Aarets Ran« og bevares også i den senere tekstversion.

## Blandede noter og udeståender

Fem selvstændige tilføjelser er skilt ud med bevaret ordlyd og tilknytning:

| Værk | Kalliopes udskilte tilføjelse |
| --- | --- |
| `andersen/1831` | `[orig. har: ,,Clanrens''.]` |
| `baggesen/1785` | Forklaringen af henvisningen til Wessels *Vôtre Serviteur* |
| `baggesen/1807e` | Forklaringen om Mallet og hans mytologiske kilde |
| `baggesen/1815` | Oplysningen om, at noten kun findes i *Den nordiske Tilskuer* |
| `baggesen/andre` | Identifikationen af tidsskriftet *Athene* |

Korte indføjede lemmata, udeladelsestegn, sproglige fuldstændiggørelser og
rene linktilføjelser er ikke gjort til selvstændige noter. Bruns note om
Røros, med parentesen »feilskrift for 6te, red.«, er fortsat uafklaret:
det er ikke sikkert fastslået, hvilken redaktion parentesen kommer fra.

De 161 uafklarede noter fordeler sig på 79 korte dateringer, 18
ordforklaringer i de to barokantologier, 58 korte forklaringer/identifikationer
og 6 længere mulige udgiver-/tredjepartstekster. De står uden mærkat.
Deres præcise indhold og placering kan hentes med `--unresolved --json`.
De er dokumenterede udeståender, ikke fastslåede kilde- eller Kalliope-noter.

## Validering

Den maskinelle sammenligning mod udgangspunktet kontrollerer, at kun
`editorial`-attributter, de fem dokumenterede noteopdelinger og nødvendig
metadataformatering ændres. Den kontrollerer også, at brødtekst,
linkattributter, sidemarkører og eksisterende notetegn bevares.

Tests dækker erklæringsvarianter, lokal afgrænsning, titelfodnoter,
Rodes særlige konvention, fysiske XML-positioner, stabile undtagelsesreferencer,
blandede noter, egne stjerner i redaktionelt apparat, genererede noter,
fortløbende notenumre og dansk/engelsk tilgængelig tekst.

Slutkontrollen er kørt på det endelige indhold:

- `make test`: exitkode 0; 132 testsuiter og 2.184 tests bestået. Én suite og
  ni tests er sprunget over efter testsuitens normale konfiguration.
- Statisk build: exitkode 0 med `KALLIOPE_SKIP_IMAGE_THUMBNAILS=true` og
  `KALLIOPE_SKIP_ELASTICSEARCH=true`. Tekst- og værk-API samt korpusdatasæt
  er genopbygget; billedafledninger og søgeindeks er ikke genopbygget.
- Indholdssammenligning: bestået for alle 881 ændrede værkfiler. Kun
  markeringer, de fem registrerede opdelinger og metadataformatering ændres.
- `git diff --check`: bestået.

Visuel browser- og udskriftskontrol er **ikke afsluttet**. Browserstyringen
var ustabil; den lokale webpack-devserver gav desuden HTTP 500 fra den
eksisterende `_document.js` med `Class extends value #<Object> is not a
constructor or null`. Browserforsøgene er stoppet, og devserveren er lukket.
Frameworkkode er ikke ændret som del af noteudrulningen. De beståede
renderingstests er ikke en erstatning for den manglende visuelle kontrol.
