# Nytaarsgave for Damer 1798: importstatus

Status 11. november 2026: Årgangens 45 digte og selvstændige prosaindledning
er indført og slutkontrolleret mod hele farvefacsimilet. Værket er nu
`complete`, alle 46 tekstposter har `korrektur1,korrektur2,kilde,side`, og
værkhovedet indeholder en modelattest for den afsluttende uafhængige kontrol.

## Kilde og kontrolomfang

[KB's farve-PDF](https://www.kb.dk/e-mat/dod/115208002988-color.pdf),
hentet 11. november 2026: 213 PDF-sider og 20.543.975 bytes.
SHA-256: `2091f36752b4d36f3693f8235ea0d17fa1c20b2d8d50079a3f0d84cb3a9f76a8`.
Tryksiderne 1–200 svarer til PDF-side 6–205 og facsimilefilerne
`005.jpg`–`204.jpg`. Alle øvrige blade, titelblad, register og kolofon er
også gennemgået. Ingen sider, nodebilag eller rettelsesark mangler.

Den oprindelige import i PR #2040 omfattede frisk Kraken-OCR og Tesseract
PSM 3/6 samt kildebaseret transskription og andenlæsning. Dens tidligere
scratchmappe var ikke længere tilgængelig ved slutkontrollen. Sidejournaler,
kandidatrapporter og kontrollen er derfor genskabt fra den mergede XML og
PDF'ens indlejrede 300-DPI-farvebilleder. Ny Tesseract-geometri med `dan+frk`,
PSM 6, understøtter strukturkontrollen; OCR erstatter ikke den direkte læsning.

## Uafhængig slutkorrektur

Tre andre sessioner har læst alle 200 tekstsider direkte mod XML'en i
intervallerne 1–68, 69–138 og 139–200. De har kontrolleret ordlyd,
tegnsætning, overskrifter, noter, spatiering og kursiv, strofer, indryk,
prosaafsnit og fysiske sideskift. Kun én editor har ændret XML'en, og
reviewerne har efterfølgende genåbnet kildesiderne og verificeret rettelserne.

Alle tre revieweres egne sessionslogs identificerer modellen som
`gpt-6.1-sol` med reasoning-niveau `low`. Den sidste genkontrol sluttede
11. november 2026 kl. `10:28:01.372078+00:00`; XML-attesten bruger dette
tidspunkt. Modellen og tidspunktet attesterer den afsluttende kontrol,
ikke en efterfølgende automatisk testkørsel.

49 konkrete fund er rettet og genkontrolleret:

- 39 udeladte slutsignaturer er gengivet med kildens navne, initialer,
  spatiering og afstand til teksten.
- Tre trykte dateringslinjer er genindsat; to yderligere fulde datoer er
  registreret som tekstmetadata.
- På s. 25 er slutkommaet efter »Vare« rettet til punktum; på s. 46 er
  »Litanie« rettet til stort begyndelsesbogstav; på s. 189 er
  »svinderhen« rettet til »svinder hen«.
- Asterismerne efter indledningsstrofen i *Jenny* er gengivet som sådanne
  frem for en vandret streg. Afstanden før Claudius-signaturen er rettet.

Titelbladets ordlyd er genkontrolleret, og versalerne i den bibliografiske
transskription er normaliseret efter formatreglerne. Billedet er uændret.

## Bevarede redaktionelle valg

Brugerens tidligere godkendte læsninger på s. 104 og 198 er bevaret,
herunder »Naar kun den Skjønne Svanebarm« på s. 198.
Det brugerudvalgte titelblad med lokalt fjernet KB-stempel er bevaret;
originalfacsimilet er uændret.

»Chor.« står i marginen ved første korvers på s. 191–192. Rendereren kan
ikke formatere spatiering inde i marginfeltet; position og strofer er bevaret.
Asterismerne på s. 149 gengives som `⁂ ⁂ ⁂`. Registerets s. 146 for
»Til Agnes« er ikke brugt som begyndelsesside; teksten begynder på s. 145.

Uidentificerede signaturer A., x—y, Heber, T. M., H. W. Lundbye og B. er
bevaret uden gættede personrelationer. De to tyske forlæg til »Lovtale« er
fortsat ikke identificeret. Eksisterende dokumenterede original- og
variantrelationer, herunder Meisters »Venskabs Værd«, er bevaret.

## Validering

- Semantisk sideaudit: 204 tekst-/sideposter, ingen problemer.
- Alle 47 poesiblokke med 2.842 verslinjer har selvstændigt visuelt
  kontrollerede strofelængder og fulde facsimilelister.
- Alle 179 aktuelle strukturkandidater og 1.868 aktuelle OCR-kandidater er
  individuelt afklaret mod facsimilet. Historiske kandidatposter bevares
  særskilt i scratch; ingen konkrete korrekturfund står åbne eller blot rettede.
- Sidevis typografikontrol og prosaens afsnitskontrol er afsluttet.
- Repositoryets supplerende OCR-rapport for værket: ingen kandidater.
- RELAX NG/XML-validering og `git diff --check`: bestået.
- Årgangens offentlige facsimile og representative thumbnail: bestået kontrol
  med repositoryets facsimileværktøj.
- `make test`: exitkode 0; 148 testsuiter og 2.585 tests bestået,
  én suite og ni tests oversprunget efter projektets konfiguration.

Det aktuelle kontrolgrundlag ligger midlertidigt i
`/private/tmp/kalliope-2019-final/`: kilde-PDF, sidebilleder, TSV-geometri,
sidejournaler, individuelle fund, struktur- og OCR-dispositioner,
modelproveniens, testlog og frosset reviewcheckpoint. Det er arbejdsfiler og
indgår ikke i repositoryet. Kildehenvisning og checksum ovenfor identificerer
PDF'en uafhængigt af scratchmappen.
