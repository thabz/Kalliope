# PR-beskrivelse for et nyt værk

Læs denne reference umiddelbart før reviewcheckpointet og oprettelsen af pull
requesten. PR-beskrivelsen skal begynde med checklisten nedenfor. Tilpas den til
det konkrete værk ved at fjerne irrelevante opgaver og tilføje konkrete
værkspecifikke opgaver, men bevar kategorierne `Agent` og `Bruger` præcis.

Markér kun `[x]`, når opgaven faktisk er udført og kontrolleret. Manuelle
brugeropgaver forbliver `[ ]`, indtil brugeren selv har udført dem.

Under `Bruger` står kun konkrete, undersøgte redaktionelle beslutninger med
placering, muligheder, belæg og anbefaling. Er der ingen, behold sætningen
nedenfor. Udfyldte rutinekontroller står under `Codex`; manglende korrektur
eller tekniske blokeringer står som uafsluttet agentarbejde under `Udestående`.

```markdown
### Agent

- [ ] Opret værket i korrekt mappe og filstruktur
- [ ] Indsæt og strukturer værkets tekst
- [ ] Bevar relevant typografi og strukturel markup
- [ ] Kontrollér visuelt alle digtes verslinjer, strofegrænser og indryk mod
      samtlige relevante facsimilesider
- [ ] Kør helværksanalysen uden tekstfilter og afklar alle stanza- og
      indrykningskandidater direkte mod facsimilet
- [ ] Kontrollér XML/TEI-syntaks
- [ ] Kontrollér at alle interne referencer og id'er er gyldige
- [ ] Tilføj eller opdater metadata for værket
- [ ] Kontrollér titel, forfatter, udgivelsesår og øvrige bibliografiske oplysninger mod kilden
- [ ] Kontrollér titelbladet visuelt mod kilden og gennemfør relevant billed-QA
- [ ] Kontrollér samlingsstruktur, tekststruktur og typografi mod kilden
- [ ] Gennemfør den krævede facsimilekorrektur; ved PDF-import begge fulde gennemgange med uafhængig anden gennemgang og genkontrol af rettelser
- [ ] Tilføj kildehenvisning til den anvendte digitalisering/faksimile
- [ ] Kontrollér eksisterende Kalliope-konventioner i sammenlignelige værker
- [ ] Kør relevante tests eller valideringsværktøjer
- [ ] Gennemgå diff'en for åbenlyse OCR-, markup- og formatteringsfejl
- [ ] Beskriv kendte usikkerheder i PR'en

### Bruger

Ingen udestående brugerbeslutninger.

### Resumé

Kort beskrivelse af værket, den anvendte udgave og ændringens omfang.

### Kilde

Angiv den præcise kilde til teksten eller facsimilet. Medtag så vidt muligt
titel, forfatter, udgivelsesår, forlag eller trykkested, bind og en permanent
URL eller anden stabil reference.

### Arbejde udført af Agent

Beskriv kort de vigtigste operationer uden at gentage hele checklisten, fx
værkstruktur, konvertering eller transskription, markup, metadata, validering
og automatiske kontroller.

### Udestående

Hvis alt er færdigt:

Ingen kendte udeståender.

Ellers angives for hvert punkt så vidt muligt fil, digt/afsnit/side, problem,
foreslået løsning og hvem der forventes at løse det.

### Usikkerheder og redaktionelle valg

Beskriv alle steder, hvor flere fortolkninger var plausible, og hvilket valg
der eventuelt blev truffet. Hvis der ikke er nogen kendte usikkerheder, skriv
det eksplicit.

### Validering

Angiv kun kontroller, der faktisk er udført, med deres resultat. Eksempel:

- XML-validering: OK
- repository-tests: OK
- kontrol af unikke id'er: OK
- stikprøvekontrol mod facsimile: 12 sider
- visuel strukturkontrol: alle digte og relevante facsimilesider kontrolleret;
  alle kandidater fra helværksanalysen afklaret
- kendte warnings: ingen

Ved PDF-import angives sideomfang for hver korrekturgennemgang, reviewer,
genkontrol af rettelser og checkpointets resultat. Stikprøver erstatter ikke
de krævede fulde gennemgange. Angiv CI-status særskilt som bestået, fejlet,
afventer eller ukendt.

### Erfaringer og evaluering

- Relevante erfarings-id'er: angiv id'er eller ingen relevante.
- Omfang og kontrol: relevante sider/tekster og faktisk udført kontrol.
- Gentagne kendte fejl: fejltype, antal fund og hvem der opdagede dem.
- Nødvendige brugerindgreb: antal og årsag; adskil rettelser, redaktionelle valg og publiceringsgodkendelser.
- Læring: henvis til en begrundet opdatering, eller skriv at ingen ny overførbar erfaring blev fundet.

Skriv `ukendt`, når oplysninger mangler; brug kun nul ved faktisk observation.
Genbrug oplysninger fra Validering frem for at gentage dem. Følg
`docs/arbejdserfaringer.md` for opfølgning på de næste tre relevante opgaver.
```

`Udestående` skal altid findes, også når der ikke er noget udestående.
`Usikkerheder og redaktionelle valg` skal skelne mellem dokumenterede valg og
fortsat åbne spørgsmål; åbne spørgsmål gentages eller henvises præcist under
`Udestående`.
