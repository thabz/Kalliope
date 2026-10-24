# Nytaarsgave for Damer 1798: importstatus

Årgangens 45 digte og selvstændige prosaindledning er indført i
`fdirs/antologierdk/1798-nytaarsgave.xml` fra [KB's farvefaksimile](https://www.kb.dk/e-mat/dod/115208002988-color.pdf).
Alle 213 PDF-sider er inventorieret; tekstsiderne 1–200 svarer til PDF 6–205.
Ingen sider, nodebilag eller rettelsesark mangler. Værket forbliver
`incomplete`, indtil nedenstående punkter er afklaret.

## Gennemført

- Frisk Kraken-OCR og Tesseract PSM 3/6 fra 300-DPI-sidebilleder.
- Kildebaseret transskription og fuld andenlæsning i andre sessioner.
- Visuel kontrol af alle 47 poesiblokkes strofer og indryk, samt prosaens
  fire afsnit og den trykte typografi.
- Individuel vurdering af 1.856 OCR-kandidater og 162 endelige
  strukturkandidater. Tidligere fund og kandidatdispositioner er bevaret.
- Semantisk sideaudit af 204 tekst-/sideposter: ingen problemer.
- KB-kataloghenvisning, udgivelsesmetadata, forfattersignaturer og
  tekstlige variantrelationer er kontrolleret.

## Seneste brugerreview

- Brugeren har bekræftet læsningerne på s. 104 og 198. På s. 198 er
  »Naar kun den Skjønne Svanebarm« indsat, og skadesnoten er fjernet.
- Brugeren har valgt det direkte ImageGen-redigerede titelblad som den
  foretrukne version. Det er indsat som `1798-nytaarsgave-p1.jpg` med
  transskription. Biblioteksstemplet er fjernet; originalfaksimilen er uændret.
  Den tidligere automatiske beskæringskandidat blev afvist af QA og bruges ikke.
- Faksimilekontrollen og GitHub CI bestod på commit `6e6f74c5d`; den tidligere
  serverblokering er løst.
- »Venskabs Værd« er forbundet med den nu indsatte tyske original hos Meister.

## Åbne punkter

- **Korrekturafslutning:** XML har fortsat `status="incomplete"`,
  `korrektur1,kilde,side` og ingen modelattest. Brugerens bekræftede læsninger
  erstatter ikke dokumentation for det afsluttende, uafhængige modelcheckpoint.
  Afklar eller gennemfør dette før `korrektur2`, modelattest og kompletstatus.

## Redaktionelle valg

»Chor.« står i marginen ved første korvers på s. 191–192. Rendereren kan ikke
formatere spatiering inde i marginfeltet; position og strofer er bevaret.
Asterismerne på s. 149 er gengivet som `⁂ ⁂ ⁂`. Registerets s. 146 for
»Til Agnes« er korrigeret til tekstens faktiske begyndelse på s. 145.

Uidentificerede signaturer A., x—y, Heber, T. M., H. W. Lundbye og B. er
bevaret uden gættede personrelationer. De to tyske forlæg til »Lovtale« er
ikke identificeret; den trykte Lessing-oplysning er bevaret.

## Genoptagelse

Det lokale arbejdsgrundlag ligger i `/private/tmp/kalliope-2019/`: kilde-PDF,
renderinger, valideret OCR-bundle, transskriptionsforslag, individuelle
korrekturrapporter, `findings.jsonl`, `inventory-all-reviewed.jsonl`,
`structure-final.json` og genererede faksimiler i `facsimiles/`.
Disse maskin- og billedfiler er ikke en del af repositoryet.

Ved korrekturafslutningen genkontrolleres de ændrede steder uafhængigt, relevante
audits genkøres, og det frosne checkpoint oprettes fra den endelige tilstand.
Kør `make test`, faksimilekontrollen og GitHub CI før færdigmelding.
