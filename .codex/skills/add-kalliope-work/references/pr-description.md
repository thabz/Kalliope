# PR-beskrivelse for et nyt værk

Læs denne reference umiddelbart før reviewcheckpointet og oprettelsen af pull
requesten. PR-beskrivelsen skal begynde med checklisten nedenfor. Tilpas den til
det konkrete værk ved at fjerne irrelevante opgaver og tilføje konkrete
værkspecifikke opgaver, men bevar kategorierne `Codex` og `Bruger` præcis.

Markér kun `[x]`, når opgaven faktisk er udført og kontrolleret. Manuelle
brugeropgaver forbliver `[ ]`, indtil brugeren selv har udført dem.

```markdown
### Codex

- [ ] Opret værket i korrekt mappe og filstruktur
- [ ] Indsæt og strukturer værkets tekst
- [ ] Bevar relevant typografi og strukturel markup
- [ ] Kontrollér XML/TEI-syntaks
- [ ] Kontrollér at alle interne referencer og id'er er gyldige
- [ ] Tilføj eller opdater metadata for værket
- [ ] Kontrollér titel, forfatter, udgivelsesår og øvrige bibliografiske oplysninger mod kilden
- [ ] Tilføj kildehenvisning til den anvendte digitalisering/faksimile
- [ ] Kontrollér eksisterende Kalliope-konventioner i sammenlignelige værker
- [ ] Kør relevante tests eller valideringsværktøjer
- [ ] Gennemgå diff'en for åbenlyse OCR-, markup- og formatteringsfejl
- [ ] Beskriv kendte usikkerheder i PR'en

### Bruger

- [ ] Kontrollér titelblad og bibliografiske oplysninger visuelt
- [ ] Vurdér tvivlsomme tekststeder, som ikke sikkert kan afgøres automatisk
- [ ] Vurdér eventuelle redaktionelle valg
- [ ] Kontrollér særlige digt-, drama- eller samlingsstrukturer
- [ ] Foretag afsluttende stikprøvekontrol mod faksimilen

### Resumé

Kort beskrivelse af værket, den anvendte udgave og ændringens omfang.

### Kilde

Angiv den præcise kilde til teksten eller facsimilet. Medtag så vidt muligt
titel, forfatter, udgivelsesår, forlag eller trykkested, bind og en permanent
URL eller anden stabil reference.

### Arbejde udført af Codex

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
- kendte warnings: ingen
```

`Udestående` skal altid findes, også når der ikke er noget udestående.
`Usikkerheder og redaktionelle valg` skal skelne mellem dokumenterede valg og
fortsat åbne spørgsmål; åbne spørgsmål gentages eller henvises præcist under
`Udestående`.
