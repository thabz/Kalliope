# Billeder og Sange (1847): import stoppet ved manglende sider

Kontrolleret 8. november 2026. Fuldindsættelsen er ikke gennemført.

## Opgave

Indsæt hele P. L. Møllers *Billeder og Sange*, Kjøbenhavn, C. G. Iversen,
1847, 284 sider, i `fdirs/moellerpl/1847.xml`. Bevar eksisterende tekst-id’er,
indsæt de udeladte tekster efter facsimilet og forbind sikre varianter med
*Lyriske Digte* (1840). Fjern derefter værknoten om udeladte genoptryk.
Erstat også noten på `moellerpl20171228121` (»En Tvivler«) med en
variantrelation til den endnu ikke indsatte »Melankoli«, side 109–110.

## Kilde og konstateret hul

- [KB’s katalogpost for digitaliseringen](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122898018505763)
- [Farve-PDF, direkte URL](https://www.kb.dk/e-mat/dod/11530808155D-color.pdf)
- [Sort-hvid-PDF, kun undersøgt diagnostisk](https://www.kb.dk/e-mat/dod/11530808155D-bw.pdf)
- Eksisterende facsimile-id: `11530808155D_color`.

Den hentede farve-PDF indeholder 293 PDF-sider. Den eksisterende XML angiver
296 facsimilesider; denne forskel er ikke fuldt undersøgt og må ikke løses
ved automatisk at ændre sidetal eller facsimile-offset.

| Kontrolleret kilde | Før hullet | Efter hullet |
| --- | --- | --- |
| Farve-PDF, enbaserede PDF-sidetal | PDF-side 12: trykt side 5 | PDF-side 13: trykt side 8 |
| Eksisterende facsimilebilleder | `012.jpg`: trykt side 5 | `013.jpg`: trykt side 8 |

Dermed mangler trykt side 6–7 i den undersøgte farve-PDF og den eksisterende
facsimileserie. Hullet ligger i »Skizze fra Spanien«, som begynder på side 5
og fortsætter på side 8.

- [Eksisterende billede af side 5](https://kalliope.org/static/facsimiles/moellerpl/11530808155D_color/012.jpg)
- [Eksisterende billede af side 8](https://kalliope.org/static/facsimiles/moellerpl/11530808155D_color/013.jpg)

SHA-256 for den undersøgte farve-PDF:
`27c92a26b96825df22c419f08533744aa630f2d4e2784ce85cf50ab37ad90a32`.

## Udført før stoppet

- Oprettet separat worktree og branch fra `origin/master`.
- Kontrolleret eksisterende XML: 115 tekstposter og kildeintervaller, der
  tilsammen henviser til 155 af de 284 trykte sider. Dette er en optælling,
  ikke en attest for korrektur eller komplet sidedækning.
- Gennemgået foreløbige facsimilebilleder `006.jpg`–`013.jpg`, `113.jpg`–
  `116.jpg` samt `288.jpg` og `290.jpg`. Kun udvalgte sider er læst i fuld
  størrelse; dette er ikke en fuld korrekturgennemgang.
- Læst »Melankoli«, side 109–110, i farvefacsimilet og lavet hjælpelæsninger
  med Tesseract. Der er ikke indsat en ny XML-tekst eller variantrelation.
- Kontrolleret springet fra trykt side 5 til 8 direkte i den hentede
  farve-PDF. Ingen yderligere transskription efter konstateringen.
- Undersøgt KB’s katalogmetadata, Dansk Forfatterleksikon og Internet Archive
  efter en alternativ digitalisering. Ingen komplet erstatningskilde fundet.
  Google Books’ API svarede HTTP 429.

Ingen eksisterende tekst, note, kvalitetsmarkering, titelbladsfil eller
facsimilemetadata er ændret som led i denne PR. Arbejdsfiler, PDF’er,
OCR-resultater og kontrolbilleder ligger uden for Git.

## Udestående og genoptagelse

1. Find en komplet digitalisering af samme udgave, som dokumenterer side 6–7,
   eller få den valgte digitalisering suppleret. En anden udgaves tekst må
   ikke bruges til at rekonstruere de manglende sider.
2. Kontrollér derefter hele kildefølgen og forskellen mellem 293 PDF-sider og
   XML’ens 296 facsimilesider. Flere huller kan endnu ikke udelukkes.
3. Genoptag først da fuldt sideinventar, frisk OCR, kildebaseret transskription
   og begge korrekturgennemgange efter repositoryets importarbejdsgang.
4. Indsæt de udeladte tekster og variantmarkeringerne, herunder forbindelsen
   mellem »En Tvivler« (1840) og »Melankoli« (1847), og fjern først da de
   erstattede noter.
5. Afslut med fuld validering og opdatér denne PR med den komplette import.

Stopkravet følger `.agents/skills/pdf-to-kalliope/SKILL.md`, afsnittet
»Missing facsimile pages: stop the import and deliver a PR«.

## Validering af denne status-PR

`make test` bestod med exitkode 0: 145 testsuiter og 2.552 tests bestod;
1 suite og 9 tests var sprunget over. `git diff --check` bestod.
Dette validerer repositoryet, ikke en gennemført import.
