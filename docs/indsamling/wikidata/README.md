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
fødsels- og dødsdata, occupation-/instance-/værkclaims samt VIAF-, GND- og DFL-id’er,
når de findes. Rå og normaliserede værdier er separate. SPARQL-svaret indeholder
ikke qualifiers og references; det er dokumenteret som en begrænsning og kræver
en eksplicit EntityData-berigelse i en senere snapshot-version.
