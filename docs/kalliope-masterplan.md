# Kalliope – masterplan for alle dansksprogede digtere og deres digte

## Formål

Målet er at opbygge et så fuldstændigt, dokumenteret og efterprøvbart korpus som muligt over:

- alle digtere, der har skrevet på dansk
- alle deres ophavsretligt frie digte
- alle kendte tekstversioner og tryk
- digte i bøger, antologier, tidsskrifter, aviser og senere også manuskripter
- originale digte og oversættelser
- tekster af anonyme, pseudonyme og endnu uidentificerede digtere
- relevante paratekster: dedikationer, forord, efterord og mottoer

Projektet skal være maskinelt drevet, men redaktionelt efterprøvbart. AI skal udføre så meget som muligt af opsporing, registrering, transskription, sammenligning og kontrol, mens menneskelig indsats primært bruges på tvivlstilfælde og egentlige redaktionelle afgørelser.

Projektet begynder med antologier, fordi de på én gang kan udvide Kalliopes dækning med mange digtere og mange tekster, herunder oversete og perifere forfattere.

---

## Grundprincipper

### Afgrænsning

En dansk digter defineres her som en digter, der skriver på dansk.

Projektets første hovedafgrænsning er public domain. Ophavsretsstatus beregnes primært ud fra digterens dødsår, men systemet skal kunne markere undtagelser og sager, der kræver manuel vurdering.

### Kildeprincip

Facsimilet er den primære tekstlige sandhedskilde.

Bibliografiske og biografiske oplysninger skal så vidt muligt understøttes af officielle eller anerkendte kilder, blandt andet:

- Det Kgl. Bibliotek
- bibliotekskataloger
- autoritetsregistre
- Dansk Forfatterleksikon
- Dansk Biografisk Leksikon
- Dansk Kvindebiografisk Leksikon
- relevante specialbibliografier og litteraturhistorier

Facsimiler må komme fra både officielle og andre troværdige digitale samlinger, når publikationen kan identificeres sikkert.

### Tekstprincip

Historisk ortografi, tegnsætning, verslinjer, strofer og relevant typografi skal bevares.

AI må ikke:

- modernisere teksten
- rekonstruere usikre læsninger uden markering
- skjule tekstlige problemer
- slå forskellige tryk eller versioner sammen uden dokumentation

### Komplethed

Kalliope skal ikke hævde absolut komplethed uden dokumentation.

Den korrekte formulering er:

> Forfatterskabet er komplet inden for de registrerede og gennemgåede kilder.

Komplethed skal derfor baseres på et registreret kildeunivers og en søgelog.

---

## Prioritering af materialetyper

Arbejdsrækkefølgen er:

1. Antologier
2. Selvstændige digtsamlinger
3. Litterære tidsskrifter
4. Andre tidsskrifter
5. Aviser
6. Manuskripter og arkivmateriale

Aviser og manuskripter indgår i den samme overordnede datamodel, men har lavere prioritet.

---

## Den centrale datamodel

Systemet skal skelne mellem følgende niveauer.

### Person

En personpost repræsenterer en digter, oversætter, redaktør eller anden bidragyder.

Den bør kunne indeholde:

- stabilt person-ID
- foretrukket navn
- navneformer i kilder
- alternative navne
- pseudonymer
- fødselsår
- dødsår
- identifikatorer som Wikidata og VIAF
- biografiske kilder
- ophavsretsstatus
- identifikationsstatus
- dækningsstatus

Manglende oplysninger må ikke blokere oprettelse. En person kan midlertidigt registreres som eksempelvis:

> Ukendt digter, signaturen “E.”

En sådan post kan senere sammenlægges med en identificeret person.

### Digtværk

Digtværket er det abstrakte litterære værk, som kan eksistere i flere versioner og tryk.

AI må foreslå, hvilke tekster der tilhører samme værk, men vurderingen skal have en eksplicit sikkerhedsstatus.

### Tekstforekomst

En tekstforekomst er et digt eller en paratekst, som optræder i en bestemt fysisk publikation.

Det samme ordret identiske digt i:

- en bog
- en anden bog
- en avis
- et tidsskrift
- en antologi

skal registreres som forskellige tekstforekomster.

Hver tekstforekomst skal have sit eget:

- tekst-ID
- kildegrundlag
- sidetal
- publiceringsår
- bibliografiske kontekst
- redaktionelle noter
- relationer til andre tekstforekomster

### Publikation

En publikation repræsenterer en bibliografisk identificeret fysisk udgivelse, eksempelvis:

- en bestemt bogudgave
- et bestemt tidsskriftshæfte
- en avisudgave
- et bind af en antologi

En publikation kan indeholde:

- titel
- redaktør
- udgave
- år
- forlag
- trykker
- bind
- hæfte
- katalogposter
- bibliografiske identifikatorer
- tekstforekomster
- paratekster

### Facsimile

Et facsimile er en konkret digital gengivelse af en publikation.

Samme publikation kan have flere facsimiler:

- Det Kgl. Bibliotek
- Google Books
- Internet Archive
- lokal PDF
- forbedret eller beskåret PDF

Flere facsimiler af samme fysiske publikation må ikke føre til dublerede tekstforekomster.

Reglen er:

> Ny fysisk publikation giver ny tekstforekomst. Nyt facsimile af samme publikation gør ikke.

### Tekstrelation

Relationer mellem tekstforekomster skal kunne registreres eksplicit, eksempelvis:

- `identical-text`
- `variant-of`
- `revision-of`
- `translation-of`
- `adaptation-of`
- `possibly-same-work`

Relationen skal kunne have:

- sikkerhedsstatus
- begrundelse
- redaktionel note
- kilde
- menneskelig afgørelse

### Kildesøgning

Systemet skal registrere, hvilke kilder der faktisk er undersøgt.

En søgelog bør indeholde:

- kilde eller katalog
- søgestreng
- søgedato
- resultater
- afviste kandidater
- status
- kommentar
- ansvarlig proces eller person

Dette register er grundlaget for dokumenteret dækningsstatus.

### Tvivlstilfælde

Tvivl skal registreres som strukturerede data og ikke kun som tegn i teksten.

Et tvivlstilfælde bør kunne indeholde:

- tekst-ID
- side
- linje
- billedregion
- foreløbig læsning
- alternative læsninger
- årsag
- status
- anvendte kilder eller modeller
- redaktionel afgørelse

Eksempel:

```json
{
  "textId": "text-123",
  "page": 42,
  "line": 8,
  "region": {
    "x": 0.31,
    "y": 0.44,
    "width": 0.18,
    "height": 0.03
  },
  "reading": "sagte",
  "alternatives": ["sagte", "søgte"],
  "status": "review",
  "reason": "unclear_fraktur",
  "sources": ["ocr", "vision-model"],
  "resolution": null
}
```

Anbefalede statusværdier:

- `clear`
- `review`
- `unresolved`
- `damaged`
- `missing`
- `editorially-resolved`

I publiceret tekst vises `[ulæseligt]`, når der ikke findes en forsvarlig læsning.

---

## Tre tekniske lag

### 1. Publiceringslaget

Det offentlige Kalliope-repository indeholder det publicerbare og versionsstyrede resultat:

- personer
- publikationer
- tekstforekomster
- relationer
- kildehenvisninger
- synlige redaktionelle noter
- offentlig dækningsstatus
- Kalliope-XML

XML er autoritativt for publiceret tekst.

### 2. Produktionsregistret

Et særskilt produktionsregister indeholder arbejdsdata, eksempelvis:

- fundne kandidater
- bibliografiske poster
- facsimilelokationer
- søgelog
- OCR-resultater
- AI-resultater
- tvivlstilfælde
- afviste match
- modelversioner
- promptversioner
- omkostninger
- redaktionelle afgørelser
- arbejdsstatus

Produktionsregistret er autoritativt for arbejdsgang, søgelog og problemer.

### 3. Afledte filer

Programmer genererer:

- Kalliope-XML
- dækningsrapporter
- arbejdsbakker
- lister over manglende værker
- offentlige statussider
- valideringsrapporter
- forslag til pull requests

AI skal foreslå indhold og struktur. Deterministisk kode skal generere den endelige XML.

---

## Antologien som produktionsenhed

Hver antologi skal have en manifestfil med bibliografiske oplysninger, facsimiler, sideinventar og arbejdsstatus.

Eksempel:

```yaml
id: anthology-1868-efterklang
title: Efterklang
year: 1868

facsimiles:
  - url: ...
    institution: ...
    status: primary

pages:
  first_content_page: ...
  last_content_page: ...
  complete: true

workflow:
  bibliography: complete
  page_inventory: complete
  segmentation: in_progress
  transcription: in_progress
  review: in_progress
  xml: not_started

contents:
  dedications: true
  preface: true
  afterword: true
  mottos: true
  advertisements: false
```

Manifestet skal gøre det muligt at bevise, at alle sider og tekster er behandlet.

---

## Arbejdsgang for én antologi

### Trin 1: Bibliografisk identifikation

Registrer:

- præcis titel
- redaktør
- udgave
- udgivelsessted
- forlag eller trykker
- år
- bind
- katalogposter
- facsimiler
- tidligere og senere udgaver

AI kan udtrække oplysningerne. Kode og menneskelig kontrol sammenholder dem med autoritative kilder.

### Trin 2: Sideinventar

Hver side klassificeres som eksempelvis:

- omslag
- titelblad
- kolofon
- dedikation
- forord
- motto
- indholdsfortegnelse
- digt
- prosatekst
- efterord
- note
- annonce
- tom side
- ukendt

Ingen side må kunne forsvinde ubemærket mellem OCR, redaktion og publicering.

### Trin 3: Tekstsegmentering

AI identificerer:

- tekstens begyndelse og slutning
- titel
- undertitel
- forfatterangivelse
- pseudonym
- motto
- sideinterval
- genre
- fortsættelse mellem sider
- placering i indholdsfortegnelsen

Strukturen bør valideres, før den endelige transskription genereres.

### Trin 4: Transskription

Den økonomiske standardproces er:

1. Udtræk eksisterende OCR.
2. Udfør teknisk, men ikke ortografisk, normalisering.
3. Rekonstruer verslinjer og strofer.
4. Sammenlign OCR-resultatet med sidebilledet.
5. Send kun problematiske sider eller linjer til en stærkere billedmodel.
6. Send uløste tilfælde til menneskelig vurdering.

Behandlingskæden er:

```text
Alle sider
    ↓
Gratis OCR og lokale kontroller
    ↓
Sider med afvigelser
    ↓
Billig eller lokal billedanalyse
    ↓
Uløste tekstområder
    ↓
Betalt multimodal model
    ↓
Menneskelig arbejdsbakke
```

### Trin 5: Tvivlsmarkering

AI skal markere usikkerhed eksplicit.

Den må ikke erstatte et usikkert sted med sit bedste gæt uden markering.

I arbejdsformatet kan dette vises som:

```text
Hun gik saa ⟦sagte?|søgte⟧ gennem Haven
```

eller:

```text
Hun gik saa ⟦ulæseligt⟧ gennem Haven
```

I publiceret tekst bruges `[ulæseligt]`, hvis læsningen ikke kan afgøres forsvarligt.

### Trin 6: Forfatteridentifikation

Forfatterangivelsen sammenholdes med:

- eksisterende personer i Kalliope
- navnevarianter
- pseudonymer
- autoritetsregistre
- indholdsfortegnelse
- samtidige bibliografiske kilder

Et match får en status:

- `confirmed`
- `probable`
- `possible`
- `rejected`
- `unresolved`

AI foreslår. Deterministisk kode genbruger eller opretter ID’er.

### Trin 7: Variant- og dubletmatch

Den nye tekst sammenlignes med hele Kalliope ud fra:

- normaliseret titel
- førstelinje
- sidste linje
- strofeantal
- n-grammer
- tekstlig lighed
- forfatter
- udgivelsesår

Den oprindelige tekst ændres ikke. Normaliseringen bruges kun internt til søgning og sammenligning.

### Trin 8: XML-generering

Kode genererer Kalliope-XML og udfører:

- DTD-validering
- ID-kontrol
- linkkontrol
- sidetalskontrol
- kontrol af tekstorden
- kontrol af obligatoriske felter
- Unicode-kontrol
- dubletkontrol
- kontrol af mistede verslinjer og strofer

### Trin 9: Automatisk publiceringsvurdering

En tekst kan gå direkte til et pull request, når:

- alle sider er tilgængelige
- tekstens grænser er sikre
- forfatteren er identificeret eller korrekt markeret som ukendt
- flere uafhængige transskriptionsmetoder er enige
- ingen uløste tekstproblemer findes
- XML validerer
- kilden er registreret
- ophavsretskontrollen er bestået

Andre tekster sendes til en menneskelig arbejdsbakke.

---

## AI’ens rolle

AI skal så vidt muligt udføre:

- identifikation af manglende digtere
- forslag til personmatch
- udtræk af bibliografiske oplysninger
- lokalisering af facsimiler
- sideklassifikation
- tekstsegmentering
- førstegangs-OCR
- sammenligning mellem OCR og facsimile
- markering af tvivlstilfælde
- variantmatch
- forslag til tekstrelationer
- forslag til dækningsstatus
- generering af strukturerede mellemdata

AI må ikke alene afgøre irreversible identitetssammenlægninger eller skjule usikkerhed.

---

## Menneskets rolle

Menneskelig tid skal især bruges på:

- tvivlsomme læsninger
- pseudonymer og forfatteridentitet
- relationer mellem tekstversioner
- modstridende bibliografiske kilder
- stikprøver på automatisk godkendte tekster
- godkendelse af særlige ophavsretssager
- forbedring af regler og værktøjer

Mennesket bør ikke bruge tid på:

- manuel kopiering af katalogmetadata
- rutinemæssig XML
- førstegangs-OCR
- åbenlyse dubletter
- gentagne tekniske kontroller
- manuel oprettelse af ensartede statusfelter

---

## Offentlig dækningsstatus

Hver digter og publikation skal kunne få en offentlig status.

Eksempel:

```text
Bibliografisk status
Kendte selvstændige udgivelser: 4
Digitaliserede udgivelser: 3
Kendte antologibidrag: 17
Digitaliserede antologibidrag: 14
Kendte tidsskriftsbidrag: 8
Digitaliserede tidsskriftsbidrag: 3
Ulokaliserede tekster: 2
Uløste læsninger: 4
Senest undersøgt: 20. juli 2026
```

Gennemgåede kilder skal også kunne vises:

```text
✓ Det Kgl. Biblioteks katalog
✓ Dansk Forfatterleksikon
✓ Dansk Kvindebiografisk Leksikon
✓ Efterklang, 1868
○ Illustreret Tidende, 1860–1875 — ikke færdig
```

---

## Ophavsretsstatus

Ophavsretsstatus beregnes primært ud fra dødsår.

Systemet bør ikke kun have et boolesk felt, men eksempelvis:

- `public-domain`
- `protected`
- `probably-public-domain`
- `requires-review`
- `unknown`

Særlige tilfælde skal kunne markeres til kontrol:

- anonymt værk
- pseudonymt værk med ukendt identitet
- flere ophavsmænd
- oversættelse
- ukendt dødsår
- efterladt eller hidtil upubliceret materiale
- usikker attribuering

---

## Månedligt AI-budget

Den foreløbige ramme er 1.000 kr. om måneden.

Systemet skal først forsøge gratis eller lokal behandling.

### Gratis og lokalt

- PDF-OCR
- Tesseract
- tekstnormalisering
- XML-analyse
- dubletregistrering
- tekstsammenligning
- indeks over førstelinjer
- validering
- rapportering
- lokale modeller, hvor de giver mening

### Billig cloudbehandling

- sideklassifikation
- bibliografisk udtræk
- tekstsegmentering
- navnematch
- sandsynlige dubletter

### Dyr multimodal behandling

Bruges kun til:

- vanskelige fraktursider
- uklare linjer
- kompliceret typografi
- modstridende OCR-resultater
- præcise billedudsnit
- sidste maskinelle forsøg før menneskelig kontrol

Hver kørsel skal logge:

- model
- opgave
- sider eller billedudsnit
- tokenforbrug
- pris
- resultat
- om resultatet sparede menneskelig tid

---

## Efterklang (1868) som referencekorpus

`Efterklang` skal være projektets første referenceantologi.

Den bruges samtidig som:

### Publicerbar antologi

Den færdige antologi skal repræsenteres fuldstændigt i Kalliope med:

- alle digte
- alle forfattere
- forord, efterord, dedikationer og mottoer
- sidereferencer
- facsimilehenvisninger
- relationer til andre tekstforekomster

### Golden master

Den manuelt gennemsete tekst bruges som facit til at måle:

- OCR-fejl
- fejl i verslinjer
- fejl i strofeinddeling
- overset typografi
- titel- og forfatterfejl
- moderniseret ortografi
- manglende eller tilføjede ord
- kvaliteten af AI’ens tvivlsmarkering

AI-systemet skal kunne køres på den oprindelige PDF uden adgang til facit. Resultatet sammenlignes derefter automatisk med den manuelle version.

### Udviklingsfixture

Et lille stabilt udsnit af `Efterklang` lægges i testpakken:

- titelblad
- indholdsfortegnelse
- forord
- et tydeligt digt
- et vanskeligt digt
- et digt over flere sider
- en anonym eller pseudonym tekst
- en tekst med motto
- en tekst med typografiske problemer

Når antologikoden ændres, skal disse eksempler fortsat producere korrekt output.

---

## Manglende digtere i Efterklang

For hver navneangivelse i antologien:

1. Søg i eksisterende Kalliope-XML.
2. Søg i navnevarianter og pseudonymer.
3. Sammenlign fødselsår, dødsår og samtid.
4. Find officielle eller leksikalske kilder.
5. Foreslå eksisterende person eller ny person.
6. Angiv sikkerhedsstatus.
7. Opret et redaktionelt forslag.

En rå arbejdsliste bør mindst indeholde:

```text
navn som trykt
teksternes sider
mulig eksisterende Kalliope-person
identifikationsstatus
kilder
noter
```

---

## Første funktionalitet i Kalliope

Antologikoden bør bygges i denne rækkefølge:

### 1. Publikation

Understøt:

- antologititel
- redaktør
- år
- udgave
- forlag og trykker
- bibliografiske kilder
- ét eller flere facsimiler

### 2. Bidrag

Hver tekst registreres som et bidrag med eksempelvis:

```text
publication_id
text_id
contributor_id
role
title
subtitle
first_line
page_from
page_to
sequence
text_type
```

Mulige roller:

```text
author
translator
editor
attributed-author
unknown
```

### 3. Paratekster

Understøt mindst:

```text
poem
preface
afterword
dedication
motto
prose
editorial-note
```

Et motto inde i et digt kan være et element på teksten frem for en selvstændig tekstforekomst.

### 4. Relationer

Tekstrelationer skal kunne gå mellem tekster i forskellige publikationer.

### 5. Facsimilemapping

Flere facsimiler skal kunne knyttes til samme publikation.

Der skal kunne registreres mapping mellem trykt side og digital side:

```text
trykt side 1 → PDF-side 9
trykt side 2 → PDF-side 10
```

---

## Validering

Der bør tidligt etableres en kommando som:

```bash
kalliope anthology validate efterklang-1868
```

Den skal kontrollere:

- at alle sider er dækket
- at bidrag ikke overlapper forkert
- at alle tekster har forfatterstatus
- at person-ID’er findes
- at tekst-ID’er er unikke
- at relationer peger på eksisterende tekster
- at XML validerer
- at facsimilelinks er registreret
- at sideoffset er gyldigt
- at ophavsretsstatus kan beregnes eller er markeret til kontrol

---

## Arbejdsfordeling ved 20–30 timer om ugen

Et foreløbigt udgangspunkt:

- 4–5 timer: bibliografiske og identitetsmæssige afgørelser
- 6–8 timer: tvivlsomme tekststeder
- 4–5 timer: kontrol af pull requests
- 4–6 timer: værktøjer, regler og automatisering
- 2–3 timer: prioritering og kildeopsøgning
- 2–3 timer: stikprøver på automatisk godkendte tekster

Målet er gradvist at flytte tiden fra rutinekorrektur til beslutninger, der forbedrer hele systemet.

---

## Første tekniske milepæl

Den første tekniske milepæl er:

> Én antologi kan gennemløbe hele systemet fra facsimile til valideret pull request, uden at metadata eller redaktionelle afgørelser kopieres manuelt mellem systemer.

Acceptkriterier:

1. Alle sider er registreret.
2. Alle tekster er segmenteret.
3. Alle tekststeder kan spores til facsimileside.
4. Tvivlstilfælde kan åbnes med billedudsnit.
5. Forfattere matches mod eksisterende XML.
6. Nye personer kan oprettes som forslag.
7. Mulige tekstvarianter findes automatisk.
8. XML genereres uden manuel syntaksredigering.
9. DTD og øvrige kontroller køres automatisk.
10. Der genereres en offentlig dækningsrapport.

---

## Første redaktionelle milepæl

Den første redaktionelle milepæl er:

> Efterklang (1868) kan repræsenteres fuldstændigt i den nye antologimodel, inklusive manglende digtere, paratekster, facsimilehenvisninger og uløste læsninger.

Denne milepæl skal nås, før større OCR- og AI-automatisering definerer datamodellen.

---

## Første arbejdsspor

### Spor A: Færdiggør Efterklang manuelt

Gem undervejs:

- facsimileside
- trykt sidetal
- tekstgrænser
- forfatterangivelse præcis som trykt
- usikre læsninger
- begrundede OCR-rettelser
- typografiske egenskaber
- relationer til kendte Kalliope-tekster

### Spor B: Opret manglende digtere

Lav en rå liste over alle bidragydernavne og brug AI til identifikation og kildefinding.

### Spor C: Byg minimumsmodellen

Første version behøver kun at håndtere:

- én publikation
- flere bidrag
- eksisterende og nye personer
- sidetal
- teksttyper
- ét eller flere facsimiler
- relationer
- offentlig dækningsstatus

### Spor D: Byg regressionsværktøjet

Brug `Efterklang` som fast testgrundlag for den kommende antologikode.

---

## Næste konkrete designopgave

Næste skridt er at udforme den konkrete XML-model for:

- publikationer
- bidrag
- facsimiler
- tekstforekomster
- tekstrelationer
- offentlig dækningsstatus

Modellen skal passe til Kalliopes eksisterende DTD, XML-filer og repositorystruktur, men må gerne kræve nødvendige ændringer.
