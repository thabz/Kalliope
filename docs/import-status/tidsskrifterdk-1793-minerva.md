# Minerva 1793 – importen er standset ved et manglende billedblad

Issue #2354 omfatter digte, øvrige versbidrag og hele fabler fra kalenderårets
fire bind. Omslagsdigte, korte verscitater og øvrig prosa ligger uden for
udvalget efter afgrænsningen i #2091.

## Kilder

University of Michigans eksemplarer er identificeret i
[HathiTrusts katalog](https://catalog.hathitrust.org/Record/000550410) og
matchet med Google Books via bibliotekets eksemplar-id. De lokale PDF'er
samler de offentlige farvebilleder i Google Books-læserens rækkefølge.

| Bind | Hæfter | Google Books | HathiTrust-id | Billeder |
| --- | --- | --- | --- | ---: |
| 31 | Januar–marts | [3mI3AAAAMAAJ](https://books.google.dk/books?id=3mI3AAAAMAAJ) | `mdp.39015065142880` | 432 |
| 32 | April–juni | [bGM3AAAAMAAJ](https://books.google.dk/books?id=bGM3AAAAMAAJ) | `mdp.39015065143029` | 456 |
| 33 | Juli–september | [9mM3AAAAMAAJ](https://books.google.dk/books?id=9mM3AAAAMAAJ) | `mdp.39015065142872` | 446 |
| 34 | Oktober–december | [XmQ3AAAAMAAJ](https://books.google.dk/books?id=XmQ3AAAAMAAJ) | `mdp.39015065142856` | 428 |

De transskriberede indholdsfortegnelser for
[8. årgang](https://uforbederlig.dk/tidsskrifter/Minerva-8aarg.htm) og
[9. årgang](https://uforbederlig.dk/tidsskrifter/Minerva-9aarg.htm) giver
indgange til hæfterne. Nasjonalbibliotekets katalog har for kalenderåret
1793 et særskilt digitaliseret [januarhæfte](https://urn.nb.no/URN:NBN:no-nb_digitidsskrift_2022072883160_001).
Kontrollen fandt ingen digitalisering af majhæftet dér.

## Kildehul i bind 32

Kobberstikket til Nicolai Abildgaards artikel om marmortavlen med Solens
Billede, som begynder på s. 277, sidder mellem trykt s. 278 og 279. De
tilgængelige billeder viser bladet indfoldet med gennemslag fra motivet.
Den udfoldede, trykte billedside mangler i serien.

| Kildens side | PDF-side | Lokalt billednummer | Placering i Google Books |
| --- | ---: | --- | --- |
| 278 | 286 | `285.jpg` | [PA278](https://books.google.dk/books?id=bGM3AAAAMAAJ&pg=PA278) |
| Indfoldet blad | 287 | `286.jpg` | [PA278-IA1](https://books.google.dk/books?id=bGM3AAAAMAAJ&pg=PA278-IA1) |
| Indfoldet blad | 288 | `287.jpg` | [PA278-IA2](https://books.google.dk/books?id=bGM3AAAAMAAJ&pg=PA278-IA2) |
| 279 | 289 | `288.jpg` | [PA279](https://books.google.dk/books?id=bGM3AAAAMAAJ&pg=PA279) |

Artiklens tekst fortsætter fra s. 278 til 279. Det manglende opslag er
kobberstikkets billedside til en prosaartikel. Importen skal bruge en
affotografering af det udfoldede blad fra maj 1793 i samme udgave.
HathiTrust viser de samme billeder på
[sekvens 287](https://babel.hathitrust.org/cgi/pt?id=mdp.39015065143029&seq=287)
og [sekvens 288](https://babel.hathitrust.org/cgi/pt?id=mdp.39015065143029&seq=288).
Søgning i Internet Archive og efter en separat digitalisering af stikket
gav ingen verificeret erstatning.

## Gennemført og udestående

- Hentet 1.762 sidebilleder, samlet fire lokale PDF'er og gennemgået
  kontaktark for alle fire bind. Den fulde side- og rettelsesarkkontrol
  afventer en komplet kilde. Kilden til bind 33 har gentagne billeder af
  trykt s. 364–365 omkring PDF-side 372–375. I bind 34 følger den fejltrykte
  s. 514 direkte efter s. 414 med ubrudt tekst.
- Identificeret titelbladene på PDF-side 7 for bind 31 og PDF-side 5 for
  bind 32–34. Alle fire lokale JPEG-kandidater har bestået titelbladsværktøjets
  geometrikontrol. Kandidater, PDF'er, sidebilleder og påbegyndt OCR ligger
  i arbejdsområdet uden for Git. OCR blev stoppet ved det konstaterede
  kildehul, før der blev oprettet værk-XML.
- Lokaliseret og læst Staffeldts *Til Lykken* i bind 31, februarhæftet,
  trykt s. 242–243, PDF-side 252–253. Digtet har fem firlinjede strofer og
  er signeret »Schack von Staffeldt.«. Første ord i vers 14 er trykt med
  stort begyndelsesbogstav i Minerva og med lille i den foreløbige
  DSL-forekomst i PR #2349. [Minerva, s. 242](https://books.google.dk/books?id=3mI3AAAAMAAJ&pg=PA242).
  [Nyerups register, s. 242](https://www.kb.dk/e-mat/dod/130020877678.pdf#page=257)
  bekræfter placeringen og registrerer også de to efterfølgende
  Staffeldt-digte. Knyt først Kellgrens oversættelse til den historiske
  forekomst, når den har et stabilt tekst-id i årgangsværket.
- Værkstruktur, fuld transskription, afstemning mod korpus, korrektur,
  publicering af facsimiler og forlægsrelationen i PR #2349 udestår.
  Den konfigurerede facsimileserver gav desuden `No route to host` ved
  SSH-kontrollen. Offentlig facsimilevalidering kræver adgang til serveren.
