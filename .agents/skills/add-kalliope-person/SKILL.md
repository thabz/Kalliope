---
name: add-kalliope-person
description: Opret en kildebaseret person på Kalliope, eller berig en eksisterende person med bestilte metadata, biografi, bibliografi eller tidslinje. Brug ved personoprettelse under værkimport; almindelige opslag efter eksisterende person-id kræver ikke denne skill.
---

# Tilføj eller berig en person

Læs `AGENTS.md`, `docs/style-guide.md`, `docs/alle-danske-digtere.md`,
`docs/corpus-dataset.md` og `docs/xml-info-format.md`.
Søg først i JSONL-korpus efter identifikatorer, livsdata og navneformer; navn
alene beviser ikke identitet. Gå derefter til konkrete XML-filer.

## Ny person

Opret dokumenterede navne, livsdata, land, sprog, rolle og eksterne id'er.
Nye digter-id'er er efternavnet med små bogstaver, uden mellemrum og tegnsætning;
translitterér æ/ø/å til ae/oe/aa og øvrige diakritiske tegn til grundbogstavet.
Kun ved optaget efternavn tilføjes alle fornavnenes initialer i rækkefølge.
Bevar eksisterende id'er. Afklar resterende kollisioner med brugeren.

Undersøg biografi efter [biografiarbejdet](references/biography.md).
Brug `$add-person-portrait` til portrætsøgning og eventuel indsættelse.
Registrér væsentlige digteriske udgivelser efter
[værkregistrering](references/works.md). Manglende brugbare kilder skal fremgå
af overleveringen; opret ingen tomme biografi- eller portrætfiler.

## Eksisterende person og tilvalg

Udfør kun den bestilte berigelse. Bibliografi og tidslinje er tilvalg:
læs [bibliografi og tidslinje](references/extensions.md), når de bestilles.
Personarbejde omfatter ikke automatisk tekstimport, dagsikoner eller
forsideprioritering. Brug værk-skillen ved egentlig tekstimport.

## Kontrol og levering

Formatér metadata med `node tools/format-metadata-xml.js <fil>`.
Kør `npm run person-editorial -- --check` og `make test` samt relevante
specialkontroller. Gennemgå diff, kilder, identitet og billedresultater.
Aflever selvstændige personopgaver som PR med kilder, faktisk udførte kontroller
og konkrete udeståender. Ved værkimport indgår personarbejdet i samme PR.
Følg `AGENTS.md` og sessionens autorisation for Git-handlinger og CI.
