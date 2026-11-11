# Poetisk Lommebog for 1813: standset import

Status 11. november 2026: Importen til #2107 er standset under den indledende
kildekontrol, fordi den angivne PDF mangler tryksiderne IV og 1.
Der er ikke oprettet værk-XML, transskriberet tekster eller publiceret billeder.

## Kilde

*Poetisk Lommebog for 1813*, samlet og udgivet ved P. Foersom.
Kiøbenhavn: Fr. Brummer, [1813]. Bibliografien i issue #2107 angiver
IV, 256, [1] s., [2] tav., portræt og noder samt digitalisering i 2013
af KB-eksemplaret 53,-111 8°. Disse oplysninger er endnu ikke fuldt
kontrolleret mod titelblad, katalog og sideinventar.

- [KB's digitale katalogpost](https://soeg.kb.dk/permalink/45KBDK_KGL/k16kb6/alma99122280638105763)
- [Den undersøgte KB-PDF](https://www.kb.dk/e-mat/dod/115308006906.pdf)
- Hentet 11. november 2026; 277 PDF-sider, 43.950.105 bytes.
- SHA-256: `c971d41be761a1071ff1b42330408e0bdea61dd49bc308413d125afd24f72120`.

## Dokumenteret kildehul

PDF-sidenumrene nedenfor er én-baserede. Billednavnene er kun lokale
kontrolrenderinger; der er ikke genereret eller publiceret Kalliope-faksimiler.

| PDF-side | Lokalt kontrolbillede | Visuelt kontrolleret indhold |
| --- | --- | --- |
| 14 | `check-014.png` | Indholdsfortegnelsens trykte side III; sidste opslag er »Bøn til Evan«, s. 177. |
| 15 | `check-015.png` | Trykt side 2, begyndende »Og har ei begge Ret? Maae vi ei kiæmpe«. |
| 16 | `check-016.png` | Trykt side 3, begyndende »Med Taarer stundom blidt bedugges maae,«. |

Overgangen fra III direkte til 2 mangler opslaget IV–1. Den litterære
hovedtekst starter dermed i fortsættelsen af et bidrag, hvis begyndelse og
eventuelle titel og forfattersignatur på side 1 ikke er tilgængelige.
Indholdsfortegnelsen er også ufuldstændig. Der er ikke forsøgt at rekonstruere
det manglende indhold eller tilskrive bidraget ud fra gæt.

## Udført og ikke udført

`tools/ocr-environment` er kørt før PDF-arbejdet. Poppler, ImageMagick og
Tesseract findes; Kraken blev ikke fundet. PDF-metadata og det eksisterende
tekstlag er undersøgt diagnostisk, og lokale miniaturebilleder er renderet.
Tekstlaget er ikke brugt som transskription. PDF-siderne 14–16 er renderet
større og kontrolleret visuelt, hvilket dokumenterer hullet.

Ved fundet er yderligere sideinventar, OCR, transskription og korrektur
standset efter `pdf-to-kalliope`. Ingen tekstside er færdigtransskriberet
eller korrekturlæst. Hele skanningens sideinventar, titelblad, attributioner,
variant- og oversættelsesrelationer, rettelsesark, portræt, tavler og nodebilag
er derfor fortsat ukontrollerede. Bibliografiens omfang er ikke attesteret.

## Genoptagelse

Agenten skal først fremskaffe faktiske facsimilebilleder af IV og 1 fra samme
udgave og kontrollere deres proveniens og sammenhæng med de tilstødende sider,
eller finde en komplet skanning af samme udgave. En anden udgaves tekst eller
OCR kan ikke udfylde hullet. Fortsæt derefter med hele sideinventaret; der kan
være yderligere huller, da gennemgangen blev standset ved dette fund.

Først når kildehullet er løst, kan den fulde import under `antologierdk`,
titelbladsbehandling, kildebaseret transskription, forfatterregistrering,
relationskontrol og to fulde korrekturgennemgange fortsætte.

Lokale arbejdsfiler ligger midlertidigt i `/tmp/kalliope-2107/` og er ikke
en del af ændringen. Kilde-URL, størrelse og checksum ovenfor identificerer
den undersøgte PDF uafhængigt af disse midlertidige filer.
