# Athene, bind IX (1817): PDF med erstatningssider og digtimport

Status 2. november 2026: Importen til #2132 er genoptaget efter brugerens
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

Der foreligger XML-udkast til alle syv digte i
`fdirs/tidsskrifterdk/1817-athene-09.xml`, fortsat med `status="incomplete"`.
Frisk OCR er udført på alle 36 digtsider med otte konfigurationer; alle 288
kørsler er verificeret. Titelbladet er beskåret og rettet op med bestået QA.
Facsimiler og thumbnails er publiceret og kontrolleret.

Georg Holger Waage, Nikolai Fogtmann, Børge Anton Hoppe, Frederik Christian
Sibbern og Moschos er oprettet. De fire først producerede personbiografier
(Waage, Fogtmann, Hoppe og Moschos) er fuldt uafhængigt korrekturlæst; alle
fund er rettet og genverificeret. Sibberns fulde DBL1-biografi er
transskriberet og førstegennemgået på s. 550–560, men afventer afsluttende
uafhængig kontrol. Hans attribution til det usignerede Frederiksborg er
sikkert dokumenteret i Erslew, bind III, s. 166.

Færdigstatus og merge afventer fuld uafhængig kontrol af alle syv digtudkast,
strofer, indryk, typografi og sideskift, afsluttede kandidatregistre og
reviewcheckpoint samt endelige metadata-, variant- og forlægskontroller.
Sibberns bibliografiske hovedværker og portrætsøgning er ikke afsluttet.
Der er ikke tilføjet korrektur2 eller modelattest til digtudkastene.

## Statuscommit og teknisk validering

Snapshot den 2. november 2026: XML-schema, formattering og `git diff --check`
er kontrolleret. `make test` afsluttede med exitkode 0: 139 testsuiter og
2354 tests bestod; én eksisterende suite med ni tests blev sprunget over.
Det er teknisk validering af et uafsluttet tekstudkast, ikke færdig korrektur.
