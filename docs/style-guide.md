# Kalliope Styleguide

Denne guide er den autoritative indgang til projektets faste konventioner.
Agenternes arbejdsproces ligger i `AGENTS.md`; format- og domænedetaljer ligger
i specialdokumenterne nedenfor.

## Dokumentationsvejviser

Læs den relevante specialdokumentation før ændringer på området:

- `docs/kalliope-icons-design.md` ved ændringer i dagsikoner eller
  portrætprioriteringer for **I dag**
- `docs/xml-info-format.md` ved ændringer i `fdirs/<id>/info.xml`
- `docs/xml-portraits-format.md` ved ændringer i `portraits.xml`,
  portrætreferencer eller kvadratiske portrætter
- `docs/xml-work-format.md` ved ændringer i XML-værkfiler
- `docs/xml-biographies-format.md` ved ændringer i `fdirs/<id>/bio.xml`
- `docs/facsimile-korrektur.md` ved transskription og fuld korrektur af tekst,
  strofer og typografi mod et facsimile
- `docs/ocr-korrektur-laerebog.md` ved generelle læringsprincipper for redigering
  og reparation af OCR-scannede tekster
- `docs/kalliope-xml-design-v1.1.md` ved ændringer i XML-modellen for
  publikationer, antologier og tekstforekomster
- `docs/kalliope-masterplan.md` ved arbejde med korpusets afgrænsning,
  kilder, redaktionelle principper eller den langsigtede datastruktur
- `docs/kb-digital-links.md` ved oprettelse eller audit af digitale kilde- og
  facsimilelinks til Det Kgl. Bibliotek
- `docs/sqlite-index.md` ved forespørgsler på det genererede korpusindeks,
  ændringer i SQLite-buildet eller analyseværktøjer
- `docs/corpus-dataset.md` ved ændringer i det offentlige, versionsmærkede
  korpusdatasæt eller dets discovery-endpoint

## GitHub

- Issues, PR-titler og PR-beskrivelser skrives på dansk.
- Skriv konkret hvad der er observeret, ændret og valideret.
- Brug engelske navne eller citater, når de er kildens titel, personnavn eller egentlig terminologi.

## JavaScript

- Brug camelCase til nye JavaScript-identifikatorer (funktioner, variable og
  interne properties). Bevar `snake_case` på serialiserede XML-/JSON-felter og
  andre eksterne kontrakter; introducér ikke nye `snake_case`-symboler i
  JavaScript.
- Brug aldrig implicit boolean coercion. Sammenlign eksplicit med den forventede
  værdi, fx `value != null`, `items.length > 0` eller `flag === true`.
- Brug `??` til fallback for `null` og `undefined`; brug ikke `value || fallback`,
  når `value` ikke er en boolean.
- Brug kun `&&`, `||` og `!` på udtryk, der allerede er booleans.

## Billeder

- Portrætter og kunstgrafik ligger i `public/images/<id>/`.
- Medtag kun en bogforside som værkbillede, når den har selvstændig grafisk eller
  kunstnerisk interesse, fx illustration, ornamentik eller markant typografi.
  Almindelige læderbind og andre rent funktionelle omslag skal ikke medtages.
- Der må ikke ligge `.jpg`, `.jpeg`, `.png`, `.gif` eller `.webp` under `fdirs/`.
- Når billedmetadata som `wikidata`, `museum`, `objid` og `invnr` opdateres, skal alle
  kilder med `<picture>` gennemgås: `content/artwork.xml`, `fdirs/<id>/artwork.xml`,
  `content/events.xml`, `fdirs/<id>/events.xml`, værkernes XML-filer,
  `content/keywords/*.xml`, `content/about/*.xml` og `fdirs/<id>/portraits.xml`.
- Husk at `<picture artwork="...">` og `<picture portrait="...">` er referencer; metadata
  bør normalt ligge på det refererede billede i `artwork.xml` eller `portraits.xml`.
- `fdirs/<id>/portraits.xml` refererer lokale filer med filnavn, fx `src="p1.jpg"` og `square-src="p1-square.jpg"`.
- Den faktiske fil for `fdirs/<id>/portraits.xml` skal derfor være `public/images/<id>/p1.jpg`.
- Square portraits er normalt manuelt beskårne kvadratiske billeder og skal også ligge i `public/images/<id>/`.
- Følg `docs/kalliope-icons-design.md` for dagsikonernes placering, navngivning,
  hvide baggrund og sammenhæng med portrætprioriteringer.

## XML-data

- Hold XML-beskrivelser korte, kildebaserede og i samme stil som omkringliggende filer.
- Biografiers kilder angives kun i biografiens `<head>` som
  `<source href="…">kildeangivelse</source>`. Udelad `href`, når der ikke findes
  en verificeret digital udgave. URL'en skal som udgangspunkt pege på det konkrete
  opslag eller den konkrete side, ikke på værkets eller værtens forside. Hvis der
  kun foreligger en samlet digital udgave, kan kildekilden pege til
  `https://www.rosekamp.dk/DBL_All/dansk_biografisk_leksikon.htm` eller
  `https://runeberg.org/dbl/`. Renderingslaget viser kilderne efter
  biografiteksten og tilføjer selv linktegnet `↗`, tooltip og tilgængeligt navn.
- Markér fremmedsprog inde i en tekst med `<span lang="sv">...</span>` og en
  ISO 639-1-sprogkode. Sæt fortsat `lang` på `<text>`, når hele teksten har
  samme sprog.
- Brug eksisterende attributter og formater; ukendte `<picture>`-attributter er build-fejl.
- Identifikatorer på museum, picture og source valideres særskilt pr. entity-type.
- Alle tekst- og XML-filer skal være UTF-8 encoded. Konvertér gamle Latin-1/ISO-8859-1-filer i stedet for at videreføre dem.
- Formatér `info.xml`, `portraits.xml` og `artwork.xml` med
  `node tools/format-metadata-xml.js <fil>`; testpakken håndhæver det kanoniske output.
- Følg `docs/xml-info-format.md`, `docs/xml-portraits-format.md` eller
  `docs/xml-work-format.md` for det konkrete filformat.
- Følg `docs/kalliope-xml-design-v1.1.md` ved ændringer i den overordnede
  publikations- og antologimodel.

## Arbejdsfiler

- Lokale scratch-filer må gerne eksistere under arbejdet, men de skal ikke committes.
- Tjek `git status --short` før commit og PR.
