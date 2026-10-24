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

## Åbne punkter

- **Titelblad:** QA for den automatisk fundne beskæring kræver manuel kontrol
  (10,86 % fjernet fra højre kant mod grænsen 8 %). Ingen kandidat er
  promoveret, og `p1` mangler. Der må ikke indsættes en reference til et
  ikke-eksisterende billede eller lempes på QA-grænserne for at få pass.
- **Faksimiler:** sider og thumbnails er genereret lokalt. Serveren
  `jec@10.0.0.5:/Volumes/Alma/Faksimiler` svarer `No route to host`, også via
  Katholt.local og IPv6. Offentligt `000.jpg` og thumbnail giver 404.
  Synkronisering og `npm run check-facsimiles` skal bestå før færdigstatus.
- **S. 104, Til Erycine, `sander20261024201901`:** i/j i »Kjærlighed« kan
  ikke afgøres sikkert i de to scanninger. Den foreløbige læsning er bevaret.
- **S. 198, Monjourdans Afskedssang, `frankenau20261024201905`:** ordets
  begyndelse før »Svanebarm« er beskadiget. `[…]jønne` og en fodnote viser
  kildens begrænsning. Et andet eksemplar bør undersøges; en senere variants
  læsning må ikke indsættes som rekonstruktion.
- **Korrekturafslutning:** de to kildefund og faksimilefejlen blokerer det
  afsluttende reviewcheckpoint. Der er ikke tilføjet `korrektur2` eller attest.

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

Efter kildeafklaring genkontrolleres de ændrede steder uafhængigt, relevante
audits genkøres, og det frosne checkpoint oprettes fra den endelige tilstand.
Kør `make test`, faksimilekontrollen og GitHub CI før færdigmelding.
