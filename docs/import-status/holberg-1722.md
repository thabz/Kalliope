# Holberg 1722: import stoppet ved manglende facsimilesider

Issue: [#1739](https://github.com/thabz/Kalliope/issues/1739).
Værk: `holberg/1722`, *4re Skiemte-Digte* (1722).
Status: **stoppet; værket er fortsat ufuldstændigt**.

## Kilde

- [KB-katalogpost](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122881549305763).
- [KB-PDF](https://www.kb.dk/e-mat/dod/11530806412D.pdf), hentet 4. oktober 2026.
- Digitalisering 2014 af udgaven fra 1722; KB-eksemplar `53,-317 8° 06412`.
- PDF: 127 sider, 20.363.760 bytes.
- SHA-256: `8cccbd534dbe04bcae64a021a306f40cc5d385e6634a3eeb806b861868974a13`.

Katalogets offentlige PNX-svar forbinder denne post med den anførte PDF og
identificerer Hans Mikkelsen som Ludvig Holbergs pseudonym.

## Dokumenteret tekstafbrydelse

PDF-side 90, svarende til facsimilefil `089.jpg`, er en versside i
*Poeten Raader sin gamle Ven Jens Larsen fra at gifte sig*, den fjerde satire.
Den har arksignaturen `E 3` og slutter med verslinjen:

> Men ønsker dig/ at du maa blive lam og blind;

Kustoden nederst til højre er `At`. Den varsler fortsat tekst på næste side.
PDF-side 91 (`090.jpg`) begynder i stedet direkte med overskriften
*Agtbare og Velfornemme Ven Signör Hans Mikkelsen!* og prosafortalen til
Sille Hans Dotters forsvarsskrift. Satirens fortsættelse og afslutning er
dermed ikke med i den hentede PDF. Dette er kontrolleret visuelt på begge
helsidesbilleder; PDF'ens OCR-lag er ikke belæg for konstateringen.

Siderne har ikke trykte sidetal. Arksignaturen og overgangen til den nye
fortale tyder på, at hullet omfatter `E3v` og `E4r`: satirens afslutning og
et separat titelblad til forsvarsskriftet. Det svarer sandsynligvis til
udgavens unummererede sider [86–87], når hovedtitelbladet tælles som [1].
Det præcise omfang og indhold skal verificeres med de manglende scanninger;
de kantede sidetal er en beregnet lokalisering, ikke aflæste sidetal.

Facsimilefilnavnene ovenfor følger Kalliopes nulbaserede PDF-konvention og
beskriver den hentede fil. Der er ikke genereret eller publiceret facsimiler.
En komplet erstatnings-PDF kan ændre filnavnene efter hullet, så mappingen
skal etableres på ny før XML-opmærkning.

## Arbejde og kontroller før stop

- Opgaven blev startet i et nyt worktree fra `origin/master`.
- `tools/ocr-environment` blev kørt; de eksisterende OCR- og PDF-værktøjer
  blev kontrolleret.
- Den eksisterende `fdirs/holberg/1722.xml` blev læst. Den indeholder alene
  værktitel og år, har `status="incomplete"` og ingen tekstposter.
- KB-PDF'en blev hentet og dens bibliografiske sammenhæng kontrolleret via
  katalogmetadata.
- Der blev fremstillet midlertidige sidebilleder og oversigter over alle
  127 PDF-sider. Det er et foreløbigt inventar, ikke fuld korrektur.
- Tekstovergange blev kontrolleret visuelt fra PDF-side 22 frem til den
  dokumenterede afbrydelse mellem PDF-side 90 og 91. Disse sider er ikke
  transskriberet eller korrekturlæst ord for ord.
- Importen blev stoppet ved konstateringen. Ingen frisk OCR, transskription,
  korrekturattest eller titelbladsbehandling er gennemført.

Der er ikke ændret XML eller tilføjet billedaktiver. Ingen tekst er
rekonstrueret fra andre udgaver. To fulde korrekturgennemgange og uafhængig
kontrol er udestående, og issue #1739 skal forblive åbent.

## Materiale og arbejde nødvendigt for genoptagelse

1. Fremskaf scanninger fra samme 1722-udgave, der dækker overgangen fra
   `E3r` til fortalen: mindst satirens fortsættelse efter kustoden `At`,
   samt eventuelt mellemliggende titelblad. Verificér især `E3v` og `E4r`.
2. Kontrollér, at en supplerende kilde faktisk er samme udgave, og fastlæg
   hullets omfang ud fra arksignaturer og sammenhængende tekstovergange.
3. Etablér et komplet sideinventar og stabil facsimilemapping. Kontrollér
   hele udgaven for yderligere mangler og rettelsesark.
4. Genoptag først derefter frisk OCR, fuld transskription inklusive
   paratekst, titelbladsbehandling, metadata og sideskiftsopmærkning.
5. Gennemfør begge fulde korrekturgennemgange, uafhængig kontrol og de
   krævede valideringer før færdigstatus.

En eksisterende transskription eller en anden udgave kan ikke erstatte de
manglende kildebilleder.

## Repository-validering

`make test` afsluttede med exitkode 0: 106 testsuiter og 1.588 tests bestod;
én suite og ni tests blev sprunget over. `git diff --check` bestod også.
Disse resultater validerer repositoryet, ikke værkets fuldstændighed eller
korrektur. GitHub CI-resultatet registreres i draft-PR'en.
