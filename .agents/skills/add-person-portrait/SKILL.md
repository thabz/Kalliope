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
datering, teknik, fysiske mål, kilde, museum, objid/invnr og understøttede identifikatorer.
Bevar eksisterende gode portrætter. Genbrug `artwork`-/`portrait`-referencer,
når billedet allerede er registreret; duplikér ikke deres metadata.

Slå den dokumenterede kunstner eller fotograf op i korpussets
`public/api/v1/poets.jsonl.gz` efter `docs/corpus-dataset.md`, før portrættet
registreres. Kontrollér også navnevarianter; et navn alene sikrer ikke identiteten.
Ved et sikkert match bruges det eksisterende person-id: registrér billedet i
kunstnerens `artwork.xml`, hvis det ikke allerede findes, og brug en
`artwork="kunstner-id/billed-id"`-reference i den portrætteredes `portraits.xml`.
Dermed bliver kunstnernavnet automatisk klikbart; gentag det ikke som almindelig
tekst i billedteksten. Dokumentér kort, om kunstneren blev fundet i korpusset.
Uden et sikkert match bevares kildens kunstnernavn som tekst.

Gem billeder under `public/images/<id>/`; `portraits.xml` bruger lokale filnavne.
Brug ImageMagick til dokumentarisk beskæring og billedbehandling. Bevar motivet;
generér ikke et erstatningsportræt. Lav en separat kvadratisk beskæring, som
bevarer ansigt og væsentlige detaljer, og registrér `square-src`.
Kontrollér visuelt både originalen og den kvadratiske fil. Markér præcis ét
portræt som primært; bevar det eksisterende valg, medmindre opgaven tilsiger andet.

Billedteksten skal medtage dokumenterede fysiske mål som højde × bredde med
enhed, fx `80 × 60 cm`. Søg målene i katalog- eller museumsopslaget; bevar
angivelsen af billedflade, blad eller ramme. Kan målene ikke dokumenteres,
notér det i en XML-kommentar ved billedet. Udled ikke fysiske mål fra pixelmål,
og fjern ikke eksisterende mål ved metadatarettelser.

Billedteksten skal være kort og kildebaseret. Gentag ikke museum og numre,
som visningen tilføjer fra metadata. Ved et originalt portrætfotografi vises
fotografens navn som kunstner. Oplysninger om et fotografisk forlæg, som
kunstneren har brugt til at skabe værket, bevares også i billedteksten,
inklusive forlægsfotografens navn. Kreditering af en senere affotografering
af det færdige kunstværk gemmes i en XML-kommentar ved
billedet. Rettigheds- og licensoplysninger skal også ligge i XML-kommentarer,
aldrig i billedtekst, `description`, `picture-note` eller andre felter, der
vises i grænsefladen. Denne regel gælder al kunst og alle billeder i Kalliope,
ikke kun portrætter; se `docs/style-guide.md`.
Formatér med metadataformatter og kør
`make test`. Dokumentér kilde, filvalg, beskæring og eventuelle usikkerheder.
Hvis ingen brugbar kilde findes, rapportér resultatet uden tom `portraits.xml`.
Levering og Git-handlinger følger den overordnede opgave; ændr ikke dagsikoner
eller forsideprioritering uden en bestilling.

## Metadatakontrol af nye billeder

Ved tilføjelse af kunst, portrætter eller kunstneriske illustrationer: gennemfør
kildekontrollen efter `docs/style-guide.md`, og sæt derefter
`<!-- metadata checked: YYYY-MM-DD -->` i den direkte billedregistrering.
Referencer og separate kvadratiske beskæringer kræver ikke egen markering.
Titelbladsscanninger (`type="titlepage"`) og nodegengivelser (`type="score"`)
er undtaget. Markeringen må ikke genereres uden gennemgangen.
Ved aflevering kontrolleres nye billedregistreringer med
`npm run validate-new-picture-metadata -- BASE-REF HEAD`, og den faktisk udførte
metadatagennemgang af nye kunstneriske billeder angives i PR-checklisten.
