# Iris (1819): kildegrundlag og importstatus

Status 7. november 2026: Hele teksten er indført og gennemgået to gange mod
facsimilet, med uafhængig slutkorrektur. Det brugerbehandlede titelblad er
indsat efter brugerens udtrykkelige anvisning, og importen er `complete`.

## Udgave og kilde

*Iris. En Samling af Poesie og Prosa.* Udgivet af J. C. Hauch.
Kiøbenhavn: B. Brünnich, 1819. Det alternative titelblad lyder
*Iris. Nytaarsgave for 1819*.

- [KB's katalogpost](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122605395205763)
- [Den anvendte farve-PDF](https://www.kb.dk/e-mat/dod/115208003633-color.pdf)
- 219 PDF-sider, 31.662.015 bytes; SHA-256:
  `95b829b54324c5f1227934cfa0ad306f74a64d160662cb6640667e8820782c1d`.

Katalogets metadata og digitale links er kontrolleret gennem KB's PNX-API
sammen med selve PDF'en. Katalogets browservisning er ikke verificeret.
Omfanget er 198, [2] sider, ikke de 189 sider, som issuebeskrivelsen angiver.

Alle 219 PDF-sider er registreret ved en særskilt visuel inventargennemgang.
Tryksiderne 1–171 ligger på PDF-siderne 10–180; tryksiderne 172–198 på
PDF-siderne 183–209. PDF-siderne 181–182 er ekstra optagelser af 170–171,
ikke ekstra tekst. S. 169 er fejltrykt 199; dette sidetal er bevaret i XML.
PDF 210–211 er indholdsregister, PDF 212 er rettelsesark. Alle fem
rettelsesinstruktioner er indført med `<errata>` og rettelseskommentarer.

## Tekster og relationer

Værket har 24 tekstposter: 19 versbidrag og fem prosabidrag, herunder de to
selvstændige dele under *Ved Hiemsendelsen af Palnatoke*. De 22 versblokke
omfatter også citater i prosa. Der er 175 interne sideskift med facsimilefilnavne
og en `<pagebreaks/>`-erklæring. Overskrifter, signaturer, motto, registerets
uddybende sangnote, dateringer og melodihenvisninger er medtaget.

- Hauchs *Naturforskeren* er flyttet fra `hauch/andre.xml` med det eksisterende
  id `hauch2001050101` og den hidtidige bidragyderkreditering bevaret.
- Hertz' trykte fodnote til `hertz201802209` er bevaret uden link; en særskilt
  redaktionel note henviser med `xref` til *Hunden til Maanen* i denne udgave.
- Ti tekstligt kontrollerede variantrelationer er indsat. Slutopslaget i det
  genererede korpus finder ingen resterende variantkandidater.
- *Daphne* er forbundet med den eksisterende latinske Ovid-tekst; det konkrete
  omfang er *Metamorphoses* I, 452–567.
- Ovid-mottoet til *Retraite* har en dansk redaktionel note med `xref` til
  *Metamorphoses* VII, v. 293, i den eksisterende latinske tekst.
- *Et sælsomt Nat-Eventyr* er tilskrevet Hauch med henvisning til Stephan
  Michael Schröders bibliografi i *Literarischer Spuk* (1994), s. 586.
- Signaturen Joh. Boye under *Retraite* er identificeret som Johannes Boye
  (1756–1830) gennem Erslews forfatterleksikon, bd. 1, s. 188. Personen er
  oprettet som `boyej`, med en fuld kildekontrolleret DBL1-biografi og et
  dokumenteret historisk portræt. *Hamlet* (1777) er registreret bibliografisk
  som tomt værk. Der er ikke fundet en autoriseret eller videnskabelig samlet
  udgave af hans lyrik.

## Korrektur og redaktionelle valg

Frisk OCR er kørt fra sidebilleder med Kraken samt to Tesseract-konfigurationer.
Et særskilt Fraktur-benchmark med fem spredte sider og otte konfigurationer er
valideret. OCR-forslag er kontrolleret mod billederne; senere udgaver er ikke
anvendt som erstatning for kildens tekst.

Første gennemgang dækkede alle 198 tekstsider. Den uafhængige slutgennemgang
brugte andre reviewersessioner end de respektive første gennemgange:

| Slutkorrektur | Tryksider | Reviewer | Model | Afsluttende genkontrol (UTC) |
| --- | --- | --- | --- | --- |
| Del 1 | 1–72 | review_pages_73_142 | gpt-6.1-sol, high | 21:13:28 |
| Del 2 | 73–142 | source_inventory_review | gpt-6.1-sol, high | 21:15:09 |
| Del 3 | 143–198 og rettelsesark | review_pages_1_72 | gpt-6.1-sol, high | 21:07:54 |

Modeloplysningerne er kontrolleret i hver reviewers sessionsmetadata.
Alle 55 konkrete slutkorrekturfund er rettet og genkontrolleret.
Hvert prosaafsnits grænser, førstelinjeindryk og afstand til naboafsnit samt
alle versblokkenes linjer, strofer og indryk er gennemgået visuelt.
Helværksanalysens 91 aktuelle strukturkandidater er alle afklaret mod facsimilet;
sidejournalen har 199 semantiske poster fordelt på 198 fysiske tekstsider.
Rettelsesarket er registreret særskilt i afslutningsinventaret.

Følgende valg og begrænsninger er bevaret synligt:

- Fire usignerede sange er registreret under `anonym1800dk` med udgavenote;
  der er ikke fundet sikker dokumentation for forfatterne.
- På s. 51 er læsningen »naar Du kalder« indført efter brugerens rettelse
  den 7. november 2026; markeringen `[ulæseligt]` og skadesnoten er fjernet.
- *Naturforskeren* følger trykkets strofer på 2, 5, 6, 10, 3 og 15 linjer.
  En hidtidig blanklinje ved sideskiftet 123/124 er ikke bevaret.
- *Til nogle Veninder* er opdelt i fem strofer à otte linjer efter brugerens
  redaktionelle rettelse ved sideskiftet 102/103, efter »Besøge Jorden, himmelfra?«.
- De trykte former »Vuggenver« i *Skildpaddevise* og »tilHvile« i
  *Retraite* (s. 182) er bevaret efter særskilt billedkontrol.

CI-tekstkvalitetskontrollen har fire afgrænsede, dokumenterede undtagelser:
`repeated-adjacent-word` for »den den« (s. 35), »Al al« (s. 49) og
»og og« (s. 160), samt `internal-uppercase` for »tilHvile« (s. 182).
Alle fire former er særskilt genkontrolleret mod facsimilet efter CI-signalet.
Undtagelserne gælder kun de respektive tekstposter; brødteksten er uændret.

## Titelbladsbillede

Titelbladet på PDF-side 8 er transskriberet og bibliografisk kontrolleret.
Den oprindelige automatiske billedkandidat blev afvist med `manual-review`,
fordi højre kantbeskæring var 15,69 %, over skillens 8 %-grænse.

Brugeren har derefter selv behandlet råbilledet og den 7. november 2026
udtrykkeligt bedt om at bruge resultatet som titelblad. Den behandlede JPEG
er kopieret uændret fra skrivebordet til
`public/images/antologierdk/1819-iris-p1.jpg` uden yderligere billedbehandling.
Tekst og ornament er visuelt kontrolleret mod råbilledet fra PDF-side 8.
Den indsatte fil følger brugerens anvisning; den er ikke registreret som en
automatisk bestået beskæringskontrol.

Det almindelige indbindingsomslag har ingen selvstændig grafisk interesse og
er derfor ikke oprettet som forsidebillede.

## Kontroller

Tegnérs to digte fra `andre.xml` er placeret i den videnskabelige samlede
udgave, som begyndte i 1964:

- `tegner2019090501`: *Carl XII. På Hans Minnesfest 1818*, bind III
  (1975), s. 54–55, i `tegner/1975-3.xml`.
- `tegner2026110701`: *Jätten Finn*, bind V (1990), s. 23–27,
  i `tegner/1990-5.xml`.

Begge tekster er transskriberet fra de konkrete bind hos Litteraturbanken;
udgavens ortografi og tegnsætning er kontrolleret mod de syv farvescanninger.
Alle 56 henholdsvis 132 verslinjer, 7 ottelinjede henholdsvis 22 sekslinjede
strofer, indryk, sideskift og slutsignaturen »T—r.« er kontrolleret i to
sessioner. En uafhængig session (`review_jaetten_finn`) har genkontrolleret
hele teksten; alle tre fund er rettet og verificeret 6. november 2026
kl. 23:52:28 UTC. Den fysiske ombrydning af »hans ögon förrn månen sig rundat.«
i *Jätten Finn* er samlet til ét vers efter kildens marginnummerering.
Der er ingen resterende læsefund; variantkontrollen fandt ingen kandidater.
Kildens form »DomkyrkoRådet« er genkontrolleret og har en afgrænset
`internal-uppercase`-undtagelse på `tegner2026110701`.

Teksternes id'er er bevaret, og den nu tomme `andre.xml` er fjernet.
Noten til *St. Laurentius* lyder: »Tegnérs Jätten Finn baserer sig på samme sagn.«
Digttitlen bruger `xref` til teksten; der er ingen oversættelsesrelation.
De nye bind er registreret som `incomplete`, da kun de bestilte digte er indsat.
Titelbladskandidaterne til de to bind blev ikke promoveret, fordi den
geometriske QA kræver manuel vurdering. Iris bruger fortsat brugerens
behandlede titelblad som beskrevet ovenfor.

Sideaudit er bestået med 199 poster og ingen afvigelser. Hele facsimilet er
bygget og synkroniseret; repositoryets facsimilekontrol er bestået. Et fuldt
statisk build er gennemført, og tekstønsker er afstemt uden fejl. De præcise
slutresultater for repositoryets tests og reviewcheckpoint anføres i PR'en.
OCR-, billed-, side- og reviewmellemprodukter ligger i scratch og indgår ikke
i repositoryet.
