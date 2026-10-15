# Sophus Claussen: kilde- og facsimilestatus

Opfølgning på [issue #1953](https://github.com/thabz/Kalliope/issues/1953).
Undersøgelsen er udført 15. oktober 2026. Katalogoplysninger er kontrolleret
via KB's offentlige Primo/PNX-API; tilgængelige PDF'er er hentet og undersøgt.

## Fire eksisterende samlinger

De strukturerede bibliografier og digitale kildelinks i `1887.xml`, `1904.xml`,
`1912.xml` og `1917.xml` er kontrolleret mod de konkrete titelblade. Alle 209
tekstposter har tomme, tekstspecifikke `<source pages="…"/>` og arver
værkkilden. Eksisterende facsimile-id'er, sideantal og offsets er bevaret.

| Fil | Udgave | Digital KB-post | PDF |
| --- | --- | --- | --- |
| `1887.xml` | *Naturbørn*, København, i Kommission hos C. A. Reitzel, 1887 | [99122976713005763](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122976713005763) | [11530805030F-color.pdf](https://www.kb.dk/e-mat/dod/11530805030F-color.pdf) |
| `1904.xml` | *Djævlerier*, København og Kristiania, Gyldendalske Boghandel, Nordisk Forlag, 1904 | [99122684087405763](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122684087405763) | [11530805039F-color.pdf](https://www.kb.dk/e-mat/dod/11530805039F-color.pdf) |
| `1912.xml` | *Danske Vers*, København og Kristiania, Gyldendalske Boghandel, Nordisk Forlag, 1912 | [99122143097905763](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122143097905763) | [115308050440-color.pdf](https://www.kb.dk/e-mat/dod/115308050440-color.pdf) |
| `1917.xml` | *Fabler*, Kjøbenhavn og Kristiania, Gyldendalske Boghandel, 1917 | [99122143071205763](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122143071205763) | [11530805046E-color.pdf](https://www.kb.dk/e-mat/dod/11530805046E-color.pdf) |

`claussen2003060104` (*II. Vision*) fortsætter på s. 58; intervallet er rettet
fra `57` til `57-58` efter visuel kontrol. Titelbladstransskriptionens
»Kommision« i *Naturbørn* er rettet til trykkets »Kommission«.
Alle 418 tekstgrænser er sammenlignet med frisk OCR fra 362 forskellige
startsider/slutsider. De ti svage match er afgjort direkte på billederne;
kun ovenstående sideinterval krævede rettelse. Kildekontrollen er ikke en
ny fuld tekst-, strofe- eller typografikorrektur.

De gamle billedserier er ikke identiske med PDF'ernes sideindeks: den
historiske billedudtrækning medtog også forsidemasken. Nye PDF-sidetal må
ikke uden kontrol bruges som filnumre i disse serier.

## Den danske Sommer

`1921.xml` indeholder 61 digte og et selvstændigt prosaforord fra
[1921-udgaven hos KB](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99124386955605763),
[PDF 130001749596-color.pdf](https://www.kb.dk/e-mat/dod/130001749596-color.pdf).
PDF'en har 253 sider. Forordet står på PDF-side 14 uden trykt sidetal;
digtsamlingens trykte s. 1–233 svarer til PDF-side 18–250, offset 17.
Katalogets angivelse på 232 sider er ikke brugt til at afkorte den sidste tekst.

Hele PDF'en er inventeret for manglende sider, tekstgrænser, paratekster og
rettelsesark. Der er ingen fundne huller eller rettelsesark. Titelbladet er
PDF-side 10 (`1921-p1.jpg`), det grafiske omslag PDF-side 6
(`1921-p2.jpg`). Begge nye bøgers titelblade har bestået den faste billed-QA.

Transskriptionen er dannet fra frisk OCR af 300 dpi-sidebilleder med Tesseract
PSM 3 og PSM 6, efterfulgt af direkte sidevis læsning. PDF'ens eksisterende
tekstlag er kun brugt diagnostisk; det mangler bl.a. tekst på sider, hvor
billederne er intakte. Begge fulde korrekturgennemgange er afsluttet, den anden af uafhængige
reviewere. Alle 253 fysiske sider er dækket; ordlyd, strofer, indryk, typografi
og interne sideskift er kontrolleret direkte mod billederne. Den afsluttende
helværksanalyse omfatter alle 61 versblokke og 424 kandidater; hver kandidat
har en individuel afgørelse med facsimilehenvisning. Værket er markeret
`complete` med `korrektur2`, `<pagebreaks/>` og modelattest efter denne kontrol.

De tre længere prosamottoer er bevaret som mottoer i de tilhørende tekster.
De 169 interne sideskift har eksplicitte `facs`-filnavne i den nye billedserie.
Forordet har fået den redaktionelle titel »Forord« med en note om, at trykket
ikke har en overskrift. Indholdsfortegnelse og annoncer er ikke oprettet som
tekstposter. Titelblad og kolofon er brugt til metadata.

Genoptryk er sammenholdt med de eksisterende, konkrete tekstversioner efter
oprettelsen af den kildebaserede kladde. De sikre helhedsvarianter forbindes
med bevarede tekst-id'er. Delvise relationer beskrives særskilt: *Valfart*
samler de ældre tekster *Valfart* og *Paa Nedfart*, *Røg* samler *Kulrøg* og
*Festrøg*, og *Fanfare* gengiver kun begyndelsen af den længere 1904-post.
*Palmesøndag* deler en indledning med *Maaltider i Siena*. Disse delrelationer
må ikke automatisk gøre de forskellige hele tekster til samme variant.
Den afsluttende variantkørsel gav seks sådanne restkandidater og ingen
advarsler; de er alle vurderet mod de konkrete tekstversioner.

## Hvededynger

Det hidtil uverificerede PDF-link findes i `pnx.addata.url`, selv om
`delivery.link` er tomt på [den digitale KB-post](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99128221814205763):
[115308050546-color.pdf](https://www.kb.dk/e-mat/dod/115308050546-color.pdf).

PDF'en har 173 sider og gengiver København: Gyldendalske Boghandel, Nordisk
Forlag, 1930. Titelbladet er PDF-side 10; trykt s. 11 er PDF-side 18.
Facsimilet `115308050546_color` bruger offset 7 og PDF'ens sidefølge.
Alle sider er inventeret for mangler og rettelsesark; ingen blev fundet.

Alle 64 eksisterende teksters begyndelse og slutning er lokaliseret.
Ordsekvenserne er sammenlignet med scanningen som udgavekontrol; der er ikke
identificeret systematiske udgaveafvigelser. Konkrete, visuelt bekræftede
fejl er rettet i `claussen20010414b6`, `b29`, `b34`, `b52`, `b53`, `b58` og `b61`
(med samme `claussen20010414`-prefix). Undertiteltegnsætning er kontrolleret
og rettet i `b31` og `b33`; de fire trykte undertitellinjer i `b31` er bevaret.
Den afsluttende ordkontrol gav 44 konkrete kandidater: fem allerede eller
efterfølgende rettede afvigelser er genverificeret; 39 er visuelt afvist som
OCR-, tokeniserings- eller linjedelingsafvigelser.

Kilde- og sidetalskontrollen er ikke en fuld ny korrektur. De eksisterende
`korrektur1`-mærker er bevaret; der er ikke tilføjet `korrektur2`, en
korrekturattest eller en erklæring om komplette interne sideskift.

Nodesiden før *Hyrdinden og Kærligheden* er vedlagt som tekstbillede.
Facsimilelinket åbner på digtets tekst, s. 123, og omfatter s. 123–124.
Noder på første tekstside af *Den unge Vin* og *Folkevise fra Besançon*
kan ses i deres facsimileintervaller.

## Udgaver uden verificeret scanning

| Værk / fil | Kontrollerede KB-poster | Nødvendigt næste trin |
| --- | --- | --- |
| *Frøken Regnvejr*, `1912a.xml` | [1912](https://soeg.kb.dk/permalink/45KBDK_KGL/1pioq0f/alma99122479366505763), [2. udgave 1912](https://soeg.kb.dk/permalink/45KBDK_KGL/1pioq0f/alma99122889732005763) | Skaffe scanning af den konkrete 1912-udgave og afgrænse forspillet fra *Unge Bander*. |
| *Titania holdt Bryllup*, `1927.xml` | [1927](https://soeg.kb.dk/permalink/45KBDK_KGL/1pioq0f/alma99121971233605763), også `alma99122334627305763` | Skaffe scanning af Levin & Munksgaards 1927-udgave; kontrollere de eksisterende 12 tekster og dramatiske partier før kildeangivelse. |
| *Hundrede Taels*, `1927a.xml` | [1927](https://soeg.kb.dk/permalink/45KBDK_KGL/1pioq0f/alma99121974079805763), også `alma99122781785105763` og `alma99122217453405763` | Skaffe scanning af Gyldendals 1927-udgave; medtage forfatterforord og afgrænse bibliografien ved Poul Uttenreitter og Stig Veibel. |

For disse poster er både søgeresultater og fulde PNX-poster kontrolleret,
inklusive `delivery.link` og `pnx.addata.url`. Ingen offentlig scanning af de
angivne udgaver blev verificeret. Titelsøgninger i Internet Archives katalog
gav heller ingen fund. Nasjonalbibliotekets katalog er også undersøgt med
titelsøgninger: [1912-posten med *Frøken Regnvejr*](https://api.nb.no/catalog/v1/items/5fd6ce56d46fb5ef12f158aa41c28ea4)
er ikke digitaliseret (`isDigital: false`); *Titania*-fundet vedrører en
ikke-digital 2000-udgave, og *Hundrede Taels* gav ingen titelpost. Det
beviser ikke, at scanninger ikke findes.

[KB's digitaliserede DSL-udgave af *Unge Bander*](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99125509557205763)
er 1986-udgaven med 1894 som tekstgrundlag; den er ikke tilskrevet
1912-posten. En nutidig e-bog af *Titania holdt Bryllup* er heller ikke et
facsimile af 1927-trykket.

De tre opgaver kræver adgang til scanninger eller en henvendelse til KB om
adgang/digitalisering. Der er ikke sendt bestillinger eller henvendelser.
`1912a.xml` og `1927a.xml` er fortsat tomme og `incomplete`; den eksisterende
tekstversion i `1927.xml` har ikke fået en udokumenteret kilde.

## Heroica og øvrige tekster

*Heroica* behandles fortsat i [PR #1925](https://github.com/thabz/Kalliope/pull/1925)
og [korrektur-issue #1938](https://github.com/thabz/Kalliope/issues/1938).
PR'en var åben og havde grønne CI-checks ved kontrollen. `1925.xml` er ikke
ændret her. De øvrige fire tidlige samlingers kilder og billedserien til
*Eroter og Fauner* er ligeledes bevaret.

`digtefraprosa.xml`, `ovs.xml` og `andre.xml` kræver tekstvis kildeafklaring
under #1912; de har ikke fået fælles kilder fra de ovenstående samlinger.

## Afsluttende validering

`make test` bestod med 1.952 tests (ni eksisterende tests sprunget over).
XML-validering og `git diff --check` bestod. Den offentlige facsimilekontrol
bestod for 513 serier; alle 426 nye sidebilleder og deres 426 thumbnails
er desuden kontrolleret enkeltvis med HTTP 200 og JPEG-indhold.
