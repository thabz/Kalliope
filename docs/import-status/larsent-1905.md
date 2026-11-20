# Stoppet import: Thøger Larsen, Dagene (1905)

Issue: #2293. Status: blokeret af manglende facsimilesider, konstateret
2026-11-20. Værket `fdirs/larsent/1905.xml` forbliver `incomplete`.

## Kilde og dokumenteret hul

Den angivne kilde er `Larsen, Thøger/1905 - Dagene/115308074956_color.pdf`,
lokalt under iCloud-mappen `Kalliope`. PDF'en har 76 sider ifølge `pdfinfo`.
SHA-256: `4c702e06f991aa3d720ab18144397cad9ad60f991885dfec2790436cf0fff3e5`.

Kataloghenvisning fra værkets eksisterende metadata:
[Det Kgl. Bibliotek](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122436855805763).

Den lokale farve-PDF er kontrolleret visuelt med `pdftoppm`:

| PDF-side (1-baseret) | Facsimilefil (0-baseret) | Trykt side / indhold |
| --- | --- | --- |
| 63 | `062.jpg` | 55, slutning af »Kræ-Tammesen og Bordbønnen« |
| 64 | `063.jpg` | 56, begyndelse af »Kræ-Tammesen fæster Pige« |
| 65 | `064.jpg` | 57, slutning af samme digt |
| 66 | `065.jpg` | Blank side uden trykt sidetal |
| 67 | `066.jpg` | 61, »Forklaring til jydske Ord og Talemaader« |
| 68 | `067.jpg` | 62, fortsættelse af forklaringerne |

Trykte sider 58–59 mangler mellem PDF-side 65 og 67; PDF-side 66 indeholder
ikke teksten. Den blanke sides identitet som trykt side 60 er ikke fastslået.
De manglende sider rammer »Kræ-Tammesen i Vorherres Haand«
(`larsent1905b3`, kildeinterval 58–59). Den eksisterende XML oplyser allerede
om hullet og henfører digtet til kilden `byvald`,
[Kim Byvalds digitalisering](https://archive.org/details/dagene1905larsenthger).
Denne alternative kilde er ikke gennemgået eller genverificeret i denne opgave.

## Udført og ikke udført

- Oprettet et særskilt worktree fra `origin/master` og kontrolleret OCR/PDF-værktøjerne
  med `tools/ocr-environment`.
- Læst den konkrete værk-XML og kontrolleret PDF-metadata samt siderne 63–68
  visuelt for at lokalisere det allerede omtalte kildehul.
- Stoppet før ny OCR, transskription og korrektur. Der er ingen nye
  tekstændringer, korrekturattestationer, titelbladsbilleder eller facsimileaktiver.
- Hele bogens sideinventar, rettelsesark, tekstfuldstændighed, sidemarkører,
  strofer, indryk og typografi er ikke gennemgået. De eksisterende
  korrekturmarkeringer er ikke en attestering af denne opgaves arbejde.
- XML-kildens `facsimile-pages-num="74"` afviger fra den lokale PDF's 76 sider.
  Eksisterende offset og sidehenvisninger skal kontrolleres ved genoptagelsen;
  denne rapport ændrer dem ikke uden et fuldt sideinventar.

## Forudsætning for genoptagelse

Fremskaf og verificér læselige scanninger af trykte sider 58–59 fra samme
1905-udgave, eller verificér en komplet alternativ scanning af udgaven og
afklar kildevalget. Den eksisterende alternative kildehenvisning er et spor,
men er ikke i sig selv dokumentation for, at kildehullet er afhjulpet.
Genoptag først derefter sideinventar, frisk OCR, kilde- og sidekortlægning og
to fulde korrekturgennemgange. Værket må ikke markeres færdigt på baggrund
af denne rapport.
