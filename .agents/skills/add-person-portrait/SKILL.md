---
name: add-person-portrait
description: Find og indsæt et dokumenteret personportræt på Kalliope, eller berig eksisterende portrætmetadata og kvadratisk beskæring. Brug til portraits.xml og personers portrætbilleder; ikke til titelblade eller dagsikoner.
---

# Tilføj personportræt

Læs `AGENTS.md`, `docs/style-guide.md`, `docs/alle-danske-digtere.md` og
`docs/xml-portraits-format.md`. Identificér først den eksisterende person;
brug `$add-kalliope-person`, hvis personen faktisk skal oprettes.

Find et sikkert identificeret portræt hos en dokumenteret kilde. Kontrollér
motivets identitet, originalfilens kvalitet, ophavsmand og oplysninger om
rettigheder/genbrug. Registrér kun verificerede oplysninger: kunstner, titel,
datering, teknik, kilde, museum, objid/invnr og understøttede identifikatorer.
Bevar eksisterende gode portrætter. Genbrug `artwork`-/`portrait`-referencer,
når billedet allerede er registreret; duplikér ikke deres metadata.

Gem billeder under `public/images/<id>/`; `portraits.xml` bruger lokale filnavne.
Brug ImageMagick til dokumentarisk beskæring og billedbehandling. Bevar motivet;
generér ikke et erstatningsportræt. Lav en separat kvadratisk beskæring, som
bevarer ansigt og væsentlige detaljer, og registrér `square-src`.
Kontrollér visuelt både originalen og den kvadratiske fil. Markér præcis ét
portræt som primært; bevar det eksisterende valg, medmindre opgaven tilsiger andet.

Billedteksten skal være kort og kildebaseret. Gentag ikke museum og numre,
som visningen tilføjer fra metadata. Formatér med metadataformatter og kør
`make test`. Dokumentér kilde, filvalg, beskæring og eventuelle usikkerheder.
Hvis ingen brugbar kilde findes, rapportér resultatet uden tom `portraits.xml`.
Levering og Git-handlinger følger den overordnede opgave; ændr ikke dagsikoner
eller forsideprioritering uden en bestilling.
