# Minerva: bind 5 (1786) og bind 70 (1802)

Import til #2421 og #2424. De eksisterende årgangsværker udvides med henholdsvis
11 og 4 selvstændige tekster. Andre bind og deres tekster ændres ikke.
Bind 6 og 69 behandles særskilt i #2448 og #2457; manglerne fremgår af
årgangenes redaktionelle værknoter med offentlige kildehenvisninger.
Manglende plancher er ikke en hindring for denne import.

## Kilder og sidegennemgang

- Bind 5, juli–september 1786: [Google Books, iGA3AAAAMAAJ](https://books.google.com/books?id=iGA3AAAAMAAJ).
  404 forskellige sidebilleder, bevaret i original rækkefølge. Billeder 295–296
  gentager 278–279. De trykte sidetal 263–264 er sprunget over i satsen;
  tekstforløbet er sammenhængende. Første årgangs indbundne titel og dedikation
  bruges ikke som titelblad for anden årgang. Rettelsesarket på trykt side 388
  er kontrolleret; dets to rettelser vedrører ikke de importerede tekster.
- Bind 70, oktober–december 1802: [Google Books, xWI3AAAAMAAJ](https://books.google.com/books?id=xWI3AAAAMAAJ).
  368 sidebilleder; ingen konstaterede manglende tekstsider eller rettelsesark.
- Rasmus Nyerups [Minerva-register (1801)](https://www.kb.dk/e-mat/dod/130020877678.pdf)
  er brugt til kontrol af attributioner for bind 5, ikke som tekstgrundlag.

Samtlige 772 billeder er inventeret. Alle relevante tekstsider er læst i fuld
opløsning; indhold, verslinjer, strofer, indryk, fremhævelser og prosaafsnit er
kontrolleret uafhængigt af XML-redaktøren. Google-indeksernes ekstra gentagne
forhåndsvisninger er ikke ekstra kildesider. Facsimilefilerne er nulbaserede.

## Tekster

| Bind | Trykte sider | Tekst | Forfatter |
| --- | --- | --- | --- |
| 5 | 84–91 | Mariehøien | Knud Lyne Rahbek |
| 5 | 91–94 | Ved en stærk Tørke | Jens Zetlitz |
| 5 | 94–96 | Til Kiedsomhed | Magdalene Sophie Buchholm |
| 5 | 192–202 | Maculatur | Anonym |
| 5 | 203–234 | Censurens Oprindelse | Jens Baggesen |
| 5 | 234–236 | Naturen | Anonym |
| 5 | 342–348 | Laura til Selim i hans lange Fraværelse | Magdalene Sophie Buchholm |
| 5 | 348–350 | En Bondekones Sang mellem sine Slægtningers Grave | Manderup Peder Kruuse |
| 5 | 350–356 | En Verden efter mit Sind, og ikke efter mit Sind | Anonym |
| 5 | 388 | H. S. E. | Peter Frederik Suhm |
| 5 | 388 | Indsendt | Anonym |
| 70 | 82–85 | Synet | Carl Jacob Voldemar Schwentzen |
| 70 | 184–186 | Sang ved Biskop Schmidts Embeds-Jubilæum | Frederik Schmidt |
| 70 | 311–326 | Thyrsis eller Sangen | Theokrit, oversat af Christen Andersen Lund |
| 70 | 327–330 | Thule’s Klage | Finnur Magnússon |

## Redaktionelle valg

De to selvstændige prosafabler i bind 5 medtages i deres helhed. Prosaens
indledninger og digtenes oprindelige noter bevares. Uddrag citeret i kritiske
artikler og biografier oprettes ikke som selvstændige digte. Kruses titel er
hentet fra bindets indholdsfortegnelse. Fejltrykket 309 for side 343 i Laura
registreres som en kommentar; den semantiske paginering er 343. Andre særlige
stavemåder og kildefejl er bevaret, også den trykte bibelhenvisning ved Thule.

Tre nye variantrelationer forbinder Baggesens og Buchholms tekster med
allerede registrerede versioner. Tekstønsket om Schwentzens Synet er opfyldt,
og den eksisterende biografis omtale er forbundet med teksten. Lunds oversættelse er forbundet med den
eksisterende græske original til Theokrits første idyl; oversætterens egne
noter om udeladelser og omstillinger er bevaret.

Der er én snæver læseusikkerhed: diakritikken på det første græske Ε i Lunds
note til vers 125, trykt side 326 (333.jpg), er svag. Grundbogstaver og de
følgende ord er kontrolleret; diakritikken kræver brugerens afsluttende vurdering.

## Kontroller og overdragelse

Helværksanalyserne omfatter alle nye tekster, herunder samtlige 12 og 8
poesiblokke med indlejrede citater. Der bruges ingen digtfiltre. Eksisterende
tekster fra andre bind indgår ikke i importens analyseudsnit. Reviewmaterialet
omfatter sideinventarer, semantiske sideankre, OCR-kandidater, visuelle
strukturkontroller og frosne reviewcheckpoints. De 1.188 og 343 historiske
OCR-advarsler er gennemgået enkeltvis mod kildeankre.

Titelbladene er rettet op, beskåret og visuelt kontrolleret. XML og metadata
valideres med `make test`; det statiske site og korpusdatasættet bygges med
`npm run build-static`. Elasticsearch er ikke tilgængelig lokalt og springes
over af buildets normale kontrol. Tekstønsker og variantkandidater kontrolleres
mod det genererede korpus.

Facsimiler uploades senere af brugeren fra en anden maskine. Den lokale
uploadpakke indeholder alle 772 originalbilleder, 6.948 afledte størrelser,
SHA-256-manifest og uploadvejledning. Pakken pakkes ud i repositoryets rod,
hvorefter `./tools/sync-facsimiler.sh` køres på den anden maskine.
`npm run check-facsimiles` køres efter upload. Offentlig tilgængelighed er
ikke kontrolleret som en del af denne levering.
