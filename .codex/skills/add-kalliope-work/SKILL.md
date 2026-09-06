---
name: add-kalliope-work
description: Indsæt et nyt værk på Kalliope, kontrollér struktur, tekst, metadata, kilder og referencer, og aflever arbejdet som en pull request med en præcis statuscheckliste. Brug når en bruger beder om at tilføje, indsætte eller importere et nyt værk; ved komplette scannede PDF'er bruges også pdf-to-kalliope.
---

# Indsæt nyt værk på Kalliope

Indsæt et nyt værk ensartet, kildebaseret og valideret, og gør det resterende
menneskelige arbejde konkret og let at finde i pull requesten.

## Ansvar og afgrænsning

Løs selv alt, der kan afgøres pålideligt ud fra repositoryets struktur, den
angivne kilde, klare bibliografiske oplysninger eller maskinel validering.
Gæt ikke ved redaktionelle eller filologiske tvivlsspørgsmål.

Når kilden er en komplet scannet PDF, skal `$pdf-to-kalliope` også bruges. Dens
krav styrer PDF-inventar, OCR, transskription, facsimilekontrol og korrektur;
denne skill styrer den generelle værkindsættelse, PR-checklisten og den tydelige
overdragelse til brugeren.

Når værket oprettes for at indsætte en konkret originaltekst til en
oversættelse, skal `$add-translation-original` også bruges. Dens krav styrer
identifikation, versionsvalg, kildeprioritering og den præcise
oversættelsesrelation.

Følg altid repositoryets aktuelle `AGENTS.md`. Skillen giver ikke i sig selv
tilladelse til commit, push eller oprettelse af en PR. Indhent den godkendelse,
som `AGENTS.md` kræver, efter at brugeren har kunnet gennemgå ændringerne.
Et nyt værk skal dog altid ende i en oprettet PR; en lokal ændring eller et
reviewoplæg er kun et mellemtrin og ikke den færdige levering.

## 1. Undersøg repositoryet før ændringer

1. Læs `AGENTS.md`, `docs/style-guide.md` og
   `docs/alle-danske-digtere.md`.
2. Læs mindst `docs/xml-work-format.md` og de yderligere specialdokumenter,
   som stilguiden henviser til for den konkrete kilde og ændring. Ved
   transskription læses også `docs/facsimile-korrektur.md`,
   `docs/ocr-korrektur-laerebog.md` og `docs/kalliope-masterplan.md`; ved links
   til Det Kgl. Bibliotek læses `docs/kb-digital-links.md`.
3. Kontrollér `git status --short`, eksisterende person- og værk-id'er samt om
   værket allerede findes som udgave, variant eller ufærdig import.
4. Find mindst ét og helst flere aktuelle værker, der strukturelt ligner det
   nye værk. Brug dem som reference for filplacering, filnavne, XML-struktur,
   metadata, titelblad, indholdsfortegnelse, digt- eller dramastruktur, noter,
   kildeangivelser og øvrige Kalliope-konventioner.

Brug de genererede korpusdata efter reglerne i `AGENTS.md` til brede opslag og
audit. Gå til konkrete XML-filer, når kilde-XML eller sammenlignelig markup er
nødvendig. Dokumentation og validering har forrang for tilfældig ældre praksis.
Opfind ikke et nyt format, når repositoryet allerede har en etableret løsning.

## 2. Indsæt og kontrollér værket

Tilpas arbejdet til kilden og værktypen, men gennemfør alt relevant arbejde:

- opret korrekt mappe- og filstruktur;
- indsæt hele den relevante tekst og den semantiske struktur;
- bevar historisk ordlyd, tegnsætning, verslinjer, strofer og understøttet
  typografi efter kilden;
- opret eller opdatér værkmetadata og nødvendige personmetadata;
- kontrollér titel, forfatter, udgivelsesår, forlag eller trykkested, bind og
  andre bibliografiske oplysninger mod kilden;
- tilføj en præcis kildehenvisning og om muligt et stabilt link til den
  anvendte digitalisering eller det anvendte facsimile;
- kontrollér alle interne referencer og id'er, herunder varianter, personer,
  kilder og billeder;
- formatér og validér med repositoryets aktuelle værktøjer;
- kør hele testpakken før PR-oprettelse, som krævet af `AGENTS.md`;
- gennemgå den endelige diff for åbenlyse OCR-, markup- og
  formatteringsfejl.

Markér ikke en opgave som udført alene fordi filerne bygger. En kontrol er
først færdig, når den faktisk er kørt eller gennemført og resultatet er
vurderet.

## 3. Håndtér tvivl eksplicit

Forsøg først at afklare et spørgsmål ud fra kilden, repositoryets konventioner
og relevante kontroller. Hvis det ikke kan afgøres sikkert:

1. lad den relevante checkbox stå umarkeret;
2. beskriv spørgsmålet under `Udestående`;
3. angiv fil og så præcist som muligt digt, afsnit, side eller tekst-id;
4. angiv plausible muligheder og en foreslået næste handling;
5. angiv om Codex eller brugeren forventes at løse punktet;
6. beskriv et foretaget valg under `Usikkerheder og redaktionelle valg`, også
   når én plausibel løsning allerede er valgt.

Skjul aldrig ulæselige ord, OCR-tvivl, usikker tegnsætning, uklare
overskriftsniveauer eller værkgrænser, mulige fejl i originalen, uregelmæssig
paginering eller tvivl om kursiv, spatiering og anden typografi.

Hvis et åbent punkt senere kan løses sikkert af Codex, skal det løses og
verificeres før overdragelsen i stedet for blot at stå som udestående.

## 4. Forbered review og pull request

Før brugerens review skal du sammenfatte:

- hvad der er indsat og fra hvilken udgave;
- hvilke filer der er ændret;
- hvilke kontroller og tests der faktisk er gennemført;
- alle kendte usikkerheder og udeståender med præcise placeringer;
- de konkrete punkter, brugeren skal vurdere.

Når PR'en må oprettes, læs og brug
[PR-skabelonen](references/pr-description.md). PR-beskrivelsen skal begynde med
checklisten og derefter indeholde alle skabelonens obligatoriske afsnit.

Efter PR-oprettelsen skal du vente på GitHub CI og kontrollere det endelige
resultat. Meld først opgaven løst, når alle krævede CI-checks er grønne. Hvis en
check fejler, skal fejlen undersøges og relevante fejl rettes og pushes, så CI
kører igen. Kan CI ikke bringes i mål inden for opgavens rammer, skal opgaven
meldes som uafsluttet med den konkrete blokering; en oprettet PR alene er ikke
tilstrækkelig.

Tilpas checklisten til værket: fjern kun punkter, der reelt ikke er relevante,
og tilføj konkrete værkspecifikke punkter efter behov. Bevar kategorierne
`Codex` og `Bruger` præcis. Checkboxene er aktuel status:

- `[x]` betyder udført og kontrolleret;
- `[ ]` betyder ikke udført, ikke verificeret eller kræver brugerens
  vurdering.

Markér aldrig en manuel brugeropgave som færdig på brugerens vegne. Skriv
heller aldrig, at en validering er OK, hvis den ikke faktisk er kørt og bestået.

En PR er klar fra Codex' side, når alt sikkert automatiserbart arbejde er
udført, det resterende menneskelige arbejde er konkret, lokaliseret og
overskueligt, og alle krævede CI-checks er grønne. PR-beskrivelsen skal inden
for få sekunder vise, hvad der er indsat, kilden, hvad Codex har kontrolleret,
hvad der mangler, hvor brugeren skal kigge, og hvilke usikkerheder der findes.
