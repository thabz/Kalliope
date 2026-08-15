# Salmonsen-biografier for udenlandske digtere

Denne arbejdsgang bruges til at tilføje biografier i `fdirs/<id>/bio.xml` for
udenlandske digtere, når Salmonsens Konversationsleksikon er kilden.

## Kilder og afgrænsning

Brug kun artikler fra Salmonsens 2. udgave, supplementet eller Den nye
Salmonsen (4. udgave). Kontrollér identiteten, ikke blot efternavnet: mange
opslag gælder en navnebror, et sted eller et begreb.

Projekt Runebergs OCR er et hjælpemiddel. Kontrollér altid facsimilen og:

- transskriber hele artiklen, også fortsættelser på efterfølgende sider
- stop før næste opslag og udelad Runebergs navigation og sidechrome
- bevar den historiske ortografi fra kilden
- indsæt en kildefod med udgave, år, bind og side eller spalte

Opret ikke en tom `bio.xml`, når der ikke findes et kvalificerende opslag.

## Bølgearbejdsgang

1. Vis kandidater med `npm run report-salmonsen-biographies -- --next ANTAL`.
2. Fordel kandidaterne, og undersøg deres opslag i 2. udgave, supplementet og
   4. udgave. Alle medarbejdere kan oprette dokumenterede `bio.xml`-filer.
3. Lad kun bølgens koordinator opdatere
   `tools/data/salmonsen-biography-status.json` for negative fund. Hver post
   skal beskrive det kontrollerede fravær eller den konkrete navneforveksling.
4. Kontrollér nye XML-filer med `xmllint --noout fdirs/<id>/bio.xml` og kør
   `git diff --check`.
5. Valider registeret med
   `npm run report-salmonsen-biographies -- --check` og byg sitet med
   `npm run build-static`.

Et fund er først færdigt, når biografien er en komplet artikel med kildefod,
eller det negative fund er registreret og valideret.

## Statusværktøjet

Behold `tools/report-salmonsen-biographies.js` og
`tools/data/salmonsen-biography-status.json` som den fælles fremdriftslog.
Rapporten viser tre grupper: digtere med biografi, dokumenterede negative fund
og resterende kandidater. Et id må ikke stå i statusregisteret, når det har en
`bio.xml`.
