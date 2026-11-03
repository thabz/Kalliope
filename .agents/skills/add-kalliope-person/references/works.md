# Registrér væsentlige værker

Læs `docs/xml-work-format.md`. Undersøg både gældende videnskabelig
standardudgave og seneste dokumenterede forfatterautoriserede samlede udgave.
Medtag begge som særskilte udgaver, når de findes og er forskellige. Registrér
bibliografisk kilde, redaktør, udgave, år, bind og verificeret facsimilelink, hvor
oplysningerne findes. Forklar de to udgavers status i PR-overleveringen.

Opret `kalliopework` med `status="incomplete"`, dokumenteret `workhead` og tomt
`workbody` for væsentlige digteriske udgivelser. Opret ikke tomme tekstposter.
Brug eksisterende bind-/underværksmodel for flerbindsudgaver. Vælg omfang efter
forfatterskabets dokumenterede hovedværker; medtag ikke automatisk små
vaudeviller, enkeltstående lejlighedsdigte og lignende småarbejder.
Undgå dubletter og opret aldrig `works` i `info.xml`.

Et blankværk kan modtage et værklink, men opfylder ikke et ønske om et digt.
Ved PR-forberedelsen efter egentlig tekstimport afstemmes tekstønsker mod et
opdateret JSONL-korpus. Kør skillens script fra repository-roden:

```sh
node .agents/skills/add-kalliope-person/scripts/wanted-texts.js
```

Rapporten matcher forfatter og normaliseret titel, navnevariant eller
førstelinje. Matcher er kandidater, som kræver manuel identifikation. Efter
et sikkert fund tilføjes `targetId` og begrundelse i ønskeregisteret, og
omtalerne forbindes med teksten:

```sh
node .agents/skills/add-kalliope-person/scripts/wanted-texts.js --reconcile
```

`--check` validerer og rapporterer uden at ændre filer. Afstemningen validerer
hele registeret før skrivning og bevarer omtalt ordlyd og typografi. Gennemgå
diffen bagefter. Rapporten køres samlet for PR'en og ikke efter hvert build.
Se `docs/person-editorial.md` for registerformat og identifikationskrav.
