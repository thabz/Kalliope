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
Efter enhver egentlig tekstimport køres ønskerapporten og sikre match afstemmes
med `npm run person-editorial -- --reconcile`.
