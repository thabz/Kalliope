# Alle danske digtere: kildesamling og kandidatregister

## Formål

Formålet er at opbygge en reproducerbar kildesamling og kandidatproces, der
først indsamler alle relevante observationer og derefter identificerer de
personer, der kan omfattes af projektets langsigtede mål:

- Alle personer, der har skrevet mindst ét digt på dansk
- Tekster, hvor ophavsretlige forhold muliggør indarbejdelse

Kildeobservationer skal bevares med fuld provenance og være sporbare tilbage
til de oprindelige kilder og den konkrete undersøgelse. En senere reduktion til
én række pr. person må aldrig erstatte kildelaget.

## Definition af "dansk digter"

En person vurderes som kandidat, hvis der findes dokumentation for, at personen
har skrevet digte på dansk eller med tydelig relation til dansk poesi, fx
forfatterskab af digte publiceret i danske kontekster. Følgende må tolkes som
indikatorer, men kræver eksplicit mærkning:

- genrebetegnelse eller emnefelt der angiver poesi/digtning
- teksttitler, der entydigt er digte
- omtale af digtning i betroet biografisk eller bibliografisk kilde
- værk/forfatterskab der klart identificerer digtning på dansk

Usikker indikation markeres som usikker og kræver manuel vurdering.

## Kildetyper i første bølge

Første bølge bygger på seks kilder:

- Kalliopes eksisterende personregister
- Dansk Forfatterleksikon
- Dansk Biografisk Leksikon
- Dansk Kvindebiografisk Leksikon
- Nordisk Kvindelitteraturhistorie
- Wikidata

For hver kilde skal der dokumenteres adgangsveje, datastruktur, begrænsninger,
estimeret størrelse og en konkret strategi for reproducerbar høst. Den
kildespecifikke dokumentation ligger under `docs/indsamling/`, og de
indsamlede snapshots ligger i kildemapperne dér.

## Accept, afvisning og bevaring af kandidater

Observationer får ikke status som godkendte personer, før de er sammenholdt.
Foreløbige kandidatgrupper og senere personposter får eksplicit status.
Afviste kandidater og kildens oprindelige observationer slettes ikke.

Minimumsstatusser:

- `new`
- `already-in-kalliope`
- `likely-eligible`
- `needs-review`
- `identity-uncertain`
- `death-date-unknown`
- `not-a-poet`
- `not-danish-language`
- `not-yet-eligible`
- `duplicate`
- `rejected`

Hver kandidat skal have begrundelse (minimum: en kort begrundelse eller nøgleårsag)
for den tildelte status.

## Navneformer og pseudonymer

Systemet skal kunne repræsentere:

- foretrukket navn
- alternative navneformer
- eksplicit dokumenterede pseudonymer
- usikker relation mellem navneformer

Automatisk sammensmeltning må ikke ske på baggrund af navn alene. Matchning
sker kun med stærke signaler (eksterne id’er, fødsels-/dødsdata, klare
identitetsrelationer m.m.) og markeres med usikkerhedsgrad.

## Datamodel og dækningsmål

Det bevarede kilderegister skal minimum kunne afspejle:

- observations-id, kilde, kilde-id og URL
- originale kildeværdier og normaliserede værdier
- normaliseret person-id og navneformer, når en gruppering foreslås
- fødsels- og dødsår/-dato når tilgængeligt
- hentetidspunkt, snapshot/version og parserstatus
- tegn på digtning og tegn på dansk sprog
- matchstatus mod Kalliope-personer
- vurderingsstatus og begrundelse
- konfliktmarkører (navn/identitet/data)
- antal poster pr. kilde og overlap mellem kilder

Målet er, at ingen observation eller kandidat forsvinder uden dokumenteret
beslutning. Overlap mellem kilder er evidens, ikke automatisk identitetsbevis:

- `sikret`
- `sandsynlig`
- `mulig`
- `ingen-match`
- `konflikt`

## Arbejdsprincipper

1. Reproducerbarhed
   - Samme kommando skal kunne genskabe samme output for samme inputversion.
   - Hentede rådata, transformationslogik og vurderingsregler skal være sporbare.
2. Tydelig provenance
   - Alle informationer beholder kilde-id/URL og oprindelig feltværdi.
3. Forsigtig identitetsmatchning
   - Undgå navne-fusion uden stærke kriterier.
   - Konflikter og usikkerhed skelnes klart.
4. Adskillelse af lager
   - Genererede data holdes separat fra manuelt vedligeholdte beslutninger.
5. Dækning før effektivisering
   - Langsigtet dækning vejer tungere end optimering for enkelte kendte forfattere.

## Faseplan

### Fase 1: Dataindsamling og snapshot

For hver af de seks kilder produceres en dokumenteret gennemgang med:

- adgangsmåde
- datastruktur og stabilitet
- forventet antal relevante kandidater
- identificerbarhed og id-kvalitet
- begrænsninger (robots, licens, rate limits m.m.)
- kendte dataproblemer (dubletter, homonymer, navnevarianter)

Kildens rå eller allerede parse­de snapshot gemmes under
`docs/indsamling/<kilde>/`. Manifestet skal angive, hvordan data blev
hentet, hvornår det blev hentet, og hvordan det kan genbruges uden ny
netværkshentning eller parsing.

### Fase 2: Sammenstilling på tværs af kilder

Sammenhold observationer fra alle tilgængelige kilder og producer:

- kildeoverlap
- navneformer og autoritets-id’er
- mulige identitetsgrupper
- konflikter og manglende data
- relation til Kalliopes eksisterende personer

Krav:

- rå observationer skal fortsat kunne inspiceres uafhængigt af grupperingen
- navn alene må ikke medføre automatisk sammenlægning
- sammenstillingen skal kunne køres igen fra snapshots
- rapporten skal være menneskeligt læsbar

### Fase 3: Reduktion til personposter

Når kildesamlingen og overlaprapporten er stabil, kan foreløbige grupper
reduceres til én samlet personpost pr. sandsynlig identitet. Alle personposter
skal fortsat pege tilbage på de underliggende observationer.

### Fase 4: Manuel prioritering

Først nu oprettes en begrænset manuel kø. Den skal hjælpe redaktionen med at
vælge, hvilke dokumenterede kandidater der skal undersøges først; den er ikke
selve kandidatregisteret og skal ikke forsøge at rumme hele kildemængden.

### Fase 5: Drift og efterfølgende bølger

Når kilderne er samlet og personposterne er valideret, kan værker og
digte-høst ske som efterfølgende arbejde. Kandidatregisteret må ikke
udskiftes med en ren importpipeline, før den dokumenterede match- og
valideringsmetode er stabil.
