# Athene, bind IX (1817): færdig digtkorrektur og originaler

Status 3. november 2026: Alle syv udvalgte digte er færdigkorrekturlæst i to
uafhængige sessioner. Importen til #2132 er genoptaget efter brugerens
udtrykkelige anvisning om at indsætte to tomme erstatningssider for de
manglende prosasider 128–129. Prosaen indgår ikke i digtudvalget. De blanke
sider erstatter kun de manglende billedpositioner; ingen tekst er rekonstrueret.

## Kilde og afledt PDF

*Athene. Et Maanedsskrift*, Niende Bind, Julius–December 1817, udgivet af
Christian Molbech. Kiøbenhavn, den Gyldendalske Boghandlings Forlag.

- [KB's oprindelige PDF, 130020878097](https://www.kb.dk/e-mat/dod/130020878097.pdf):
  625 sider, fortsat med det dokumenterede hul.
- Originalens SHA-256:
  `b6ddca64fc37ff38aedb0765025fe3a9fe4e9ba35be9f5cac849c700ac9ec719`.
- [Kalliopes afledte PDF](https://kalliope.org/facsimiles/tidsskrifterdk/1817-athene-09.pdf):
  627 sider, inklusive de to redaktionelle erstatningssider.
- Derivatets SHA-256:
  `46619b3b0a9b1157a24fd26242c95a49ce4ec7ab9bd4552244b2c131ff948196`.
- [Bibliografisk oversigt](https://danskforfatterleksikon.dk/1850/sk1850aar1813.htm#titelnr123805).

Den oprindelige PDF er bevaret. qpdf har indsat to helt blanke sider efter
originalens PDF-side 138. Alle 625 originale siders sidedictionaries,
tekststrømme, billeder og rekursivt refererede ressourcer er sammenlignet
maskinelt efter normalisering af objektreferencer og er uændrede. De to nye
sider har hverken tekst- eller billedstrømme. Den offentligt downloadede PDF
har samme SHA-256 som den kontrollerede lokale fil.

## Det dokumenterede hul og den nye sidemapping

| Ny PDF-side | Facsimilefil | Trykt side eller erstatningsposition | Indhold |
| --- | --- | --- | --- |
| 138 | `137.jpg` | 127 | Holberg-afhandlingen; brødteksten slutter »At han ogsaa kunde være en«. |
| 139 | `138.jpg` | [128] | Helt blank redaktionel erstatningsside. |
| 140 | `139.jpg` | [129] | Helt blank redaktionel erstatningsside. |
| 141 | `140.jpg` | 130 | Fortsættelsen begynder »bør upaatvivleligen regnes med blandt hans kritiske Arbejder«. |

Nabosiderne og begge blanke sider er kontrolleret visuelt. Originalens sider
1–138 har samme position i derivatet; alle efterfølgende originale sider er
flyttet to pladser. Kalliopes facsimile har 627 billeder og sideoffset 11.
Det betyder ikke, at KB's originalfil er blevet komplet.

## Udvælgelse og korrektur

Hele bindets 625 originale billeder og de to nye blanke sider er gennemgået
visuelt. Der er ikke fundet yderligere sidehuller eller noget rettelsesark.
Syv selvstændige digte er udvalgt; de dækker 39 tekst-side-forekomster på
36 forskellige fysiske sider. Indlagte verskandidater er vurderet særskilt,
så uddrag, dramareplikker og afbrudte citater ikke bliver selvstændige digte.

[Registerpakken i #2123](https://github.com/thabz/Kalliope/issues/2123#issuecomment-6551625203)
er integritetskontrolleret og genbrugt til udvælgelse og registerafstemning.
Frisk OCR begrænses til de relevante digtsider. Registeret erstatter ikke
den visuelle gennemgang af resten af bindet.

Alle syv digte i `fdirs/tidsskrifterdk/1817-athene-09.xml` har nu
`korrektur1,korrektur2,kilde,side`, og værket er `complete` inden for det
udtrykkeligt beskrevne digtudvalg. Prosaen og kildehullet er fortsat udeladt.
Frisk OCR er udført på alle 36 digtsider med otte konfigurationer; alle 288
kørsler er verificeret. Titelbladets geometri-QA er bestået. Facsimiler og
thumbnails er publiceret og kontrolleret.

Den nye uafhængige gennemgang omfatter alle 704 metriske vers i otte
poesiblokke, 39 tekst-sideposter og 36 billeder. Der er indført 11 rettelser:
Ubeboeligt (166), skuml (448), manglende strofeafstand før side 449, Haaned
(449), spatieret Bliv! og Vogteren (451), usyltet (455), Gravene (458),
vexler (555), grønnende (559) og udrustet (560). Trykkets usædvanlige
»skuml« og »Gravene« er bevaret efter direkte kontrol. Luthers ode har
19 firelinjede strofer. Hoppe har 7×10 og 13×8 vers; Frederiksborg 8×8.
Europa har 162 vers fordelt på 20 og 142; trykte ombrud er ikke ekstra vers.

Alle 598 OCR-kandidater og 20 slutlige strukturkandidater har individuelle,
afsluttede dispositioner. Alle otte blokke har en uafhængig visuel kontrol af
strofer og indryk, og hver sidepost har særskilt typografikontrol. Ingen
åbne korrekturfund resterer. Tre reviewerintervaller fordeler de fysiske
sider uden overlap; den delte side 452 er tildelt én reviewer.

Skabelsen er forbundet med Ovids Metamorphoses I, 5–88, og Philemon og Baucis
med VIII, 611–724, i den allerede indførte Magnus-udgave fra 1892. Europa er
forbundet med den fulde græske original på 166 vers i Edmonds' *The Greek
Bucolic Poets* (1916), s. 428–440. Fogtmann udelader originalens vers 114–117;
den nyere kritiske udgave har også enkelte tekstvalg, som er dokumenteret i
originalrapporten. Luthers ode er variantforbundet med 1860-forekomsten.

Waage, Fogtmann, Hoppe og Moschos havde allerede fuldt uafhængigt kontrollerede
biografier. Sibberns fulde DBL1-biografi, s. 550–560, er nu også genlæst;
»herhjemme« er rettet til trykkets »her hjemme«. Hans attribution til det
usignerede Frederiksborg er dokumenteret i Erslew III, s. 166. De to
hovedværker er registreret i førsteudgaver, sidste forfatterautoriserede
udgaver og moderne standardudgaver (1826/1850, 1861/1870, 1998/2017).
Et dokumenteret Gemzøe-portræt efter Købke, 1834, SMK KKS7992, er tilføjet
med fuldt billede og særskilt kvadratisk beskæring.

## Tidligere statuscommit og teknisk validering

Snapshot den 2. november 2026: XML-schema, formattering og `git diff --check`
er kontrolleret. `make test` afsluttede med exitkode 0: 139 testsuiter og
2354 tests bestod; én eksisterende suite med ni tests blev sprunget over.
Det er teknisk validering af et uafsluttet tekstudkast, ikke færdig korrektur.

## Afsluttende validering, 3. november 2026

`make test`: exit 0, 139 suiters/2.421 tests bestået; én suite med ni tests
sprunget over. Static-build er bestået med Elasticsearch og billedthumbnailbyg
sprunget over; datasættet er opdateret, og personskillens tekstønskeafstemning
og check giver ingen fejl eller nye sikre matches. Offentlig facsimilekontrol
består for 629 værker og 1.258 repræsentative billeder. XML-skema, formatter,
interne referencer og `git diff --check` er kontrolleret.

De frosne IX- og Qvad-checkpoints ligger uden for repositoryet sammen med de
individuelle reviewerregistre og er verificeret ved commit/push. Nye originaler
og det tilbageværende Schreiber-spørgsmål beskrives i
[originalrapporten](tidsskrifterdk-athene-originaler.md).
