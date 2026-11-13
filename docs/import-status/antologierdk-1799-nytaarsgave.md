# Nytaarsgave for Damer 1799: standset import

Status 13. november 2026: Importen under #2020 er standset ved det indledende
sideinventar. KB's farve-PDF mangler tryksiderne **72–73**. Værket i
`fdirs/antologierdk/1799-nytaarsgave.xml` er fortsat en tom, ufuldstændig
registrering. Hverken årgangen eller originaltekster til dens oversatte digte
er indsat i denne ændring.

## Kilde

- [KB's samlede katalogpost for Nytaarsgave for Damer](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122048920505763).
- [1799-årgangens farve-PDF](https://www.kb.dk/e-mat/dod/11520800300F-color.pdf),
  hentet 13. november 2026: 275 PDF-sider, 23.664.744 bytes.
- SHA-256: `a7b7e3c33964fd01ceff6af9a6fd416a866aa6d151d60b3e9d91f2d351172731`.

Katalogpostens offentlige PNX-metadata henviser til denne fil med betegnelsen
»1799 Farve 23 MB«. Den undersøgte fil svarer dermed til både årgangsissuets
kilde og katalogpostens farvelink. Den fulde bibliografiske kontrol, herunder
adskillelsen af årgang og faktisk udgivelsesår, er ikke afsluttet.

## Dokumenteret hul

| PDF-side, enbaseret | Forventet facsimilefil, nulbaseret | Trykside | Synligt indhold ved hullet |
| --- | --- | --- | --- |
| 78 | `077.jpg` | 71 | Strofer 67–69; nederst kustoden »70.« |
| 79 | `078.jpg` | 74 | Begynder med strofe 76; derefter strofer 77–78 |

Begge tilstødende sider er set direkte i farvescanningerne. Springet i
tryksidetal ledsages af et spring i digtets strofenumre: stroferne 70–75 er
ikke med mellem disse sider. Det dokumenterer et teksttab midt i det
strofenummererede digt om bruden og Schott, frem for blot et forkert trykt
sidetal. Digtets titel, ophav og eventuelle original er ikke fastslået ved
den afbrudte segmentering.

Filnavnene i tabellen angiver den normale nulbaserede facsimilemapping for
den undersøgte PDF. Der er ikke publiceret et nyt facsimile.

## Kontroller udført før stop

- `tools/ocr-environment` er kørt; de eksisterende PDF- og OCR-værktøjer er
  registreret uden installation af nye systemværktøjer.
- PDF'ens sideantal, filstørrelse og checksum er registreret.
- Siderne er udtrukket til scratch uden for repositoryet til sideinventar.
- Det indledende inventar af sidehoveder er gennemgået frem til hullet ved
  PDF-side 79. Det er en paginationskontrol, ikke fuld tekstkorrektur.
- Trykside 3 ligger på PDF-side 8. To indskudte nodebilleder på PDF-side
  26–27 betyder, at trykside 21 ligger på PDF-side 28; én fast forskydning
  fra PDF til trykside må derfor ikke antages for hele årgangen.
- Den eksisterende PDF-tekst er kun undersøgt diagnostisk; bortset fra KB's
  digitaliseringsblad er der intet brugbart tekstlag. Frisk OCR og
  transskription er ikke påbegyndt.

Ved fundet er videre OCR, transskription og korrektur standset efter
`pdf-to-kalliope`-skillens regel om manglende facsimilesider. Der er ikke
rekonstrueret tekst eller indsat tekster fra andre udgaver. Det resterende
sideinventar er ikke gennemgået, og senere sider kan derfor også have huller.
Rettelsesark, samlet tekstomfang, attributioner og oversættelser er endnu
ikke fuldt kontrolleret.

## Genoptagelse

1. Fremskaf faktiske farvescanninger af tryksiderne 72–73 fra samme udgave,
   eller en rettet, komplet farve-PDF. KB er ikke kontaktet som led i dette
   arbejde.
2. Dokumentér kilden og kontrollér siderne visuelt. Gennemfør derefter hele
   sideinventaret, inklusive nodeblade, illustrationer og eventuelle
   rettelsesark. Genberegn facsimilemappingen fra det komplette materiale.
3. Transskriber hele årgangen med relevant paratekst, og gennemfør begge
   korrekturgennemgange samt kilde-, metadata-, variant- og XML-kontroller.
4. Identificér og indsæt de sikkert dokumenterede originaltekster til de
   oversatte digte efter `add-translation-original`. Forbind hver
   oversættelse med den konkrete originaltekstversion.
5. Bevar både KB's samlede kataloghenvisning og årgangens konkrete
   facsimilehenvisning ved opdateringen af værkets kilde.

Opgaven forbliver uafsluttet, indtil kildehullet er løst og importen er
gennemført. Den foreliggende ændring dokumenterer alene blokeringen.
