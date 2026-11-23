---
name: add-kalliope-picture
description: Find og registrér dokumenterede kunstbilleder, illustrationer og kunstneriske forsider på Kalliope, eller berig deres metadata. Brug også til den fælles billedregistrering under portræt- og værkimport; titelbladsbehandling og dagsikoner har særskilte arbejdsgange.
---

# Tilføj eller berig et billede

Læs `AGENTS.md`, `docs/style-guide.md`, `docs/alle-danske-digtere.md` og
`docs/corpus-dataset.md`. Stilguiden er autoritativ for billedreglerne.
Læs desuden `docs/xml-portraits-format.md` ved portrætregistrering og
`docs/xml-work-format.md` ved billeder i værker.

## Kilde og registrering

Find et sikkert identificeret billede hos museum, Wikidata eller en anden
dokumenteret kilde. Kontrollér motivets identitet, ophav, datering, teknik,
fysiske mål, samling, identifikatorer, originalfilens kvalitet og
rettigheder/genbrug. Indarbejd alle sikre oplysninger fra gennemgangen;
dokumentér væsentlige ubekendte og kildegrundlaget i XML-kommentarer ved billedet.
Hvis ingen brugbar kilde findes, rapportér resultatet uden tomme billedposter.

Slå den dokumenterede kunstner eller fotograf op i
`public/api/v1/poets.jsonl.gz`, inklusive navnevarianter. Et navn alene sikrer
ikke identiteten. Ved et sikkert match bruges personens eksisterende id:
registrér billedet i kunstnerens `artwork.xml`, hvis det ikke allerede findes,
og brug `artwork="kunstner-id/billed-id"` der, hvor billedet skal vises.
Kunstnernavnet vises da automatisk; gentag det ikke i billedteksten.
Dokumentér kort, om kunstneren blev fundet i korpusset. Uden et sikkert match
bevares kildens kunstnernavn som tekst; opret ikke automatisk en ny person.

Undersøg eksisterende billedregistreringer før indsættelse. Genbrug `artwork`-
eller `portrait`-referencer frem for at registrere samme lokale fil flere gange.
Uden en kendt kunstner i korpusset vælges den relevante direkte registrering:
fx global `content/artwork.xml` til fælles kunst eller `portraits.xml` til et
lokalt portræt. Metadata og kildekommentarer hører til den direkte billedpost.

Gem billedfiler under `public/images/<id>/`, aldrig under `fdirs/`.
Artwork-filer bruger billedets `id` til filnavnet `<id>.jpg`; portrætfiler bruger
lokale filnavne i `src`. Følg formatdokumentationen og buildets stipræfiks ved
andre placeringer. Bevar gode eksisterende billeder. Brug ImageMagick til
dokumentarisk billedbehandling, bevar motivet, og kontrollér den endelige fil
visuelt. Generér ikke et erstatningsbillede for det dokumenterede værk.

## Billedtekst og metadatakontrol

Skriv en kort, kildebaseret billedtekst. Medtag dokumenterede fysiske mål som
højde × bredde med enhed, og skeln mellem billedflade, blad og ramme. Hvis målene
ikke kan dokumenteres, notér det i en XML-kommentar; pixelmål er ikke fysiske mål.
Bevar eksisterende sikre oplysninger, og gentag ikke museum eller numre, som
visningen tilføjer fra metadata.

Ved et originalt fotografi vises fotografen som kunstner. Beskriv et dokumenteret
fotografisk forlæg i billedteksten, inklusive forlægsfotografen. Oplysninger om
senere affotografering samt rettigheder og licens gemmes i XML-kommentarer,
aldrig i offentligt viste felter.

Afslut kildegennemgangen med `<!-- metadata checked: YYYY-MM-DD -->` inde i den
direkte billedpost med gennemgangens faktiske dato. Markeringen attesterer
udført arbejde og må aldrig genereres uden gennemgangen. Referencer og separate
`square-src`-beskæringer kræver ikke egen markering; titelbladsscanninger
(`type="titlepage"`), nodegengivelser (`type="score"`) og dagsikoner er undtaget.

Portrætvalg, primært portræt og kvadratisk beskæring styres af
`add-person-portrait`; denne skill varetager den fælles billedregistrering.
Titelbladsbehandling styres af `prepare-kalliope-titlepage`. Medtag kun en
bogforside som værkbillede, når den har selvstændig grafisk eller kunstnerisk
interesse, efter stilguiden. Ændr ikke dagsikoner eller forsideprioritering
uden en bestilling.

## Kontrol og levering

Formatér ændrede metadatafiler med projektets metadataformatter; brug
værkformatter til værkfiler. Kør `make test`. Ved aflevering kontrolleres nye
billedregistreringer med `npm run validate-new-picture-metadata -- BASE-REF HEAD`
mod PR'ens committede revisioner; kommandoen læser ikke arbejdsfiler.
Dokumentér kilde, filvalg, udført metadatagennemgang, billedbehandling og
eventuelle usikkerheder i overleveringen og PR-checklisten.
Levering og Git-handlinger følger den overordnede opgave og `AGENTS.md`.
