# Wikidata

Snapshot af SPARQL-resultatet fra den første bølge. `wikidata.json` er det rå
resultat; manifestet registrerer forespørgsel og hentetidspunkt.

## Hentning

Resultatet blev hentet fra Wikidata Query Service på
`https://query.wikidata.org/` med den SPARQL-forespørgsel, der er gemt i
manifestet. Snapshotet skal bruges ved offline-kørsler, fordi SPARQL-resultater
ændrer sig over tid og tjenesten har kapacitetsbegrænsninger.

## Begrænsning

Wikidata-observationer er berigelse og kandidatbelæg. De må ikke alene bruges
til automatisk identitetssammenlægning.

## Felter og problemer

Snapshotet indeholder Wikidata-id, labels/aliaser, occupation, fødsels- og
dødsdata samt VIAF- og DFL-id’er, når de findes. SPARQL-resultater kan ændre
sig, indeholde flere claims og have konflikter eller manglende værdier.
