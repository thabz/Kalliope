# Salmonsen-biografier

Denne arbejdsgang bruges til at tilføje biografier i `fdirs/<id>/bio.xml` for
digtere, når Salmonsens Konversationsleksikon er kilden.

Salmonsen er en foretrukken standardkilde til ikke-danske forfattere. For
danske forfattere bruges <i>Dansk Biografisk Leksikon</i> (DBL) først; Salmonsen
bruges, hvis DBL ikke har et relevant opslag eller ikke giver en tilstrækkelig
biografisk fremstilling. En Salmonsen-artikel kan da enten stå alene eller
supplere en selvstændig DBL-biografi i et separat `<biography>`-element.

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

## Registrering og kontrol

Biografiarbejdet følger `$add-kalliope-person`. Undersøg de relevante opslag
i 2. udgave, supplementet og 4. udgave. Registrér en forgæves søgning i
personens `info.xml` efter [personstatus](person-editorial.md), med faktisk
søgedato, undersøgte kilder og en konkret begrundelse. Hvis en biografi senere
indsættes, fjernes den negative status.

Kontrollér nye biografier med `xmllint --noout fdirs/<id>/bio.xml` og
`git diff --check`, og kør `npm run person-editorial -- --check`,
`npm run build-static` og `make test` før aflevering.

Et fund er færdigbehandlet, når biografien er en komplet artikel med kildefod,
eller den forgæves søgning er registreret og valideret i personmetadata.
