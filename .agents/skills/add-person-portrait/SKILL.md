---
name: add-person-portrait
description: Find og indsæt et dokumenteret personportræt på Kalliope, eller berig eksisterende portrætmetadata og kvadratisk beskæring. Brug til portraits.xml og personers portrætbilleder; ikke til titelblade eller dagsikoner.
---

# Tilføj personportræt

Læs `AGENTS.md`, `docs/style-guide.md`, `docs/alle-danske-digtere.md` og
`docs/xml-portraits-format.md`. Identificér først den eksisterende person;
brug `$add-kalliope-person`, hvis personen faktisk skal oprettes.

Find et sikkert identificeret portræt hos en dokumenteret kilde, og kontrollér,
at motivet er den rette person. Bevar eksisterende gode portrætter.
Brug [fælles billedarbejde](../add-kalliope-picture/SKILL.md)
(`$add-kalliope-picture`) til kilde- og metadatagennemgang, kunstneropslag,
registreringssted, billedtekst, filer, metadatamarkering og validering.
Når portrættet registreres i en kendt kunstners `artwork.xml`, indsættes en
`artwork="kunstner-id/billed-id"`-reference i den portrætteredes `portraits.xml`.

Lav en separat kvadratisk beskæring, som bevarer ansigt og væsentlige detaljer,
og registrér `square-src` efter portrætformatets krav til cirkelkomposition,
opløsning og filstørrelse. Kontrollér visuelt både originalen og den kvadratiske
fil. Markér præcis ét portræt som primært; bevar det eksisterende valg,
medmindre opgaven tilsiger andet.

Dokumentér kilde, filvalg, beskæring og eventuelle usikkerheder. Hvis ingen
brugbar kilde findes, rapportér resultatet uden tom `portraits.xml`.
Levering og Git-handlinger følger den overordnede opgave; ændr ikke dagsikoner
eller forsideprioritering uden en bestilling.
