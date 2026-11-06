# Nytaarsgave 1801: import standset ved manglende facsimilesider

Kontrolleret 22. oktober 2026. Arbejdet vedrører kun årgangen 1801 under
[issue #1879](https://github.com/thabz/Kalliope/issues/1879), som skal forblive
åbent. Den eksisterende tomme værkpost er ikke udfyldt.

## Kilde

- [KB's farve-PDF](https://www.kb.dk/e-mat/dod/11520800311e-color.pdf),
  207 PDF-sider.
- Titelbladet på PDF-side 4 angiver *Nytaarsgave. 1801.* med undertitlen
  *En Fortsættelse af Nytaarsgave for Damer.*
- Værkpost: `fdirs/antologierdk/1801-nytaarsgave.xml`.
- SHA-256 for den undersøgte PDF:
  `c6c1466b7e395e218a374d9e96042b5809c29e9255b6f01ef024384a3dfb4c1f`.

## Dokumenteret hul

PDF-siderne er enbaserede. Facsimilefilnavnene nedenfor følger Kalliopes
nulbaserede konvention og henviser til den nuværende PDF; billederne er ikke
publiceret.

| Manglende trykte sider | Før hullet | Efter hullet |
| --- | --- | --- |
| 182–183 | PDF 186 / `185.jpg`: trykt 181 | PDF 187 / `186.jpg`: trykt 184 |

Begge tilstødende sider er kontrolleret direkte i de indlejrede sidebilleder
i fuld opløsning. Side 181 afslutter »Ved A. N. Næsheims Grav.« med
dateringen »November 1800.« og signaturen »Haste.«. Nederst står kustoden
»Lille«. Næste PDF-side har sidetallet 184 og overskriften »Glædes Sang
for tilvoxende Ungdom.«. Både sidetallene og kustoden viser, at materiale
mellem de to tekster mangler. Den fulde titel og omfanget af teksten, som
begynder med »Lille«, er ikke fastslået.

Årsagen til hullet er ikke afgjort. Det er ikke undersøgt, om andre
digitaliseringer eller eksemplarer indeholder de manglende sider.

## Arbejde før standsning

- Nyt worktree og branch fra `origin/master`.
- OCR/PDF-værktøjer kontrolleret med `tools/ocr-environment`.
- PDF hentet; sideantal og indlejrede billeder undersøgt med Poppler.
- Indledende visuel paginationsgennemgang i kontaktoversigter frem til
  springet fra trykt side 181 til 184. Den allerede åbnede oversigt viste
  også sider frem til trykt 190; der er ikke fortsat inventar efter fundet.
- Titelblad og siderne på hver side af hullet undersøgt visuelt.
- Ingen frisk OCR, XML-transskription eller tekstkorrektur påbegyndt.
  Ingen titelblads- eller facsimilefiler publiceret.

Importen blev standset efter reglen om manglende facsimilesider i
[pdf-to-kalliope](../../.agents/skills/pdf-to-kalliope/SKILL.md).
Der foreligger ikke et fuldt sideinventar eller en erklæring om, at resten
af PDF'en er komplet. Ingen øvrige årgange er ændret.

## Genoptagelse

Fremskaf en komplet digital gengivelse af samme årgang eller dokumenterede
supplerende billeder af mindst trykte sider 182–183 med kildeproveniens og
tilstødende sider til kontrol. Agent kan derefter kontrollere udgaveidentitet
og gennemføre et nyt fuldt sideinventar før OCR og transskription.

Ved en suppleret PDF skal sideantal, sideforskydninger og facsimilefilnavne
bestemmes på ny. Den manglende ordlyd må ikke rekonstrueres fra andre
udgaver eller eksisterende Kalliope-tekster. Bibliografiske metadata,
herunder forskellen mellem årgang og udgivelsesår, skal færdigkontrolleres
ved genoptagelsen.

## Validering

`make test` afsluttede med exitkode 0: 130 beståede testsuiter og 2.137
beståede tests; én suite og ni tests blev sprunget over.
`git diff --check` bestod. Der er ingen ny XML-transskription at validere.
