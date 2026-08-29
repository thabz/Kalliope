# Wikidata

`wikidata.json` er det rå snapshot, `observations.json` er parserens separate
observationslag, og `overlap.json` er krydsreferencerne. Manifestet registrerer
forespørgsel, versioner og SHA-256-checksums.

## Hentning

Kør `npm run collect-wikidata` for at parse det gemte snapshot offline. Brug
`npm run collect-wikidata -- --fetch` for en eksplicit ny hentning. En mindre
afprøvning kan køres med `--limit=10`. Uden `--limit` hentes alle observationer,
som forespørgslen returnerer. Den
afgrænsede forespørgsel ligger i `query.sparql` og udvælger mennesker med en
occupation-kæde til digter (`Q49757`) og en eksplicit dansk sprogclaim
(`P1412 = Q9035`) samt enten en dødsdato senest i 1955 eller, hvis dødsdatoen
mangler, en fødselsdato senest i 1855. Det er den faste 70-årsgrænse for den
aktuelle kandidatindsamling.

## Begrænsning

Wikidata-observationer er berigelse og kandidatbelæg. De må ikke alene bruges
til automatisk identitetssammenlægning.

## Felter og problemer

Observationerne indeholder Q-ID, URL, rå SPARQL-bindinger, labels/aliaser,
fødsels- og dødsdata, occupation-/instance-/værkclaims samt VIAF- og DFL-id’er,
når de findes. Rå og normaliserede værdier er separate. SPARQL-svaret indeholder
ikke qualifiers og references; det er dokumenteret som en begrænsning og kræver
en eksplicit EntityData-berigelse i en senere snapshot-version.

## DFL-autoritets-id'er

`dfl-authorities.json` er et særskilt, normaliseret snapshot for Kalliopes
skjulte DFL-digtere. Koblingen bygger på et eksakt match mellem digterens
gemte DFL-id og Wikidata-egenskaben P12386 og er derfor ikke et navnematch.
Forespørgslen ligger i `dfl-authorities-query.sparql`.

Snapshotet gemmer Wikidata-id samt entydige VIAF- og GND-id'er. Flere værdier
for samme person bevares som flertydige observationer i snapshotet, men skrives
ikke vilkårligt i digterens `info.xml`. Digterne opdateres offline med:

```sh
npm run enrich-hidden-dfl-authorities
```

Et nyt råt SPARQL-resultat normaliseres eksplicit med
`--build-snapshot=FIL`; det overskriver det afledte snapshot og bruges derfor
kun ved en dokumenteret ny hentning.
