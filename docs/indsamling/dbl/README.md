# Dansk Biografisk Leksikon

Snapshotet bruger DBL’s egne taxonomy-indexer som afgrænset adgangsvej:
`Digtere` (`.taxonomy/2817`) og `Forfattere` (`.taxonomy/2818`). Hver linket
artikel gemmes som rå HTML-cache under `tools/data/indsamling/dbl/raw/`, mens
`observations.json` kun indeholder provenance, original metadata og korte
beskrivelsesfelter. Observationer fra de to kategorier bevares separat, også
når samme artikel optræder i begge kategorier.

## Planlagt hentning

Kør `npm run collect-dbl -- --fetch` for at hente de to kendte indexer og deres
linkede opslag. Kør `npm run collect-dbl` uden `--fetch` for at parse det
eksisterende snapshot offline. Scriptet følger ikke ukontrollerede links og
gemmer ikke fuldtekst i det commitbare parsed snapshot.

`robots.txt` begrænser administrative/search-relaterede stier og oplyser, at
genbrug og ekstraktion kræver specifik tilladelse. DBL-siderne er markeret
`Begrænset anvendelse`; derfor bevares kun rå cache til reproduktion og
metadata/observationsfelter i parsed output. Se `manifest.json` for tidspunkt,
metode, checksums og antal.

Der bruges ikke en fri søge-crawl eller Lex’ samlede sitemap i snapshotet.
Taxonomy-indexerne er den reproducerbare afgrænsning: `Digtere` giver et
eksplicit, men smalt digter-signal, mens `Forfattere` giver den bredere
forfattermængde. Samme artikel kan derfor have to observationer. HTML’en blev
observeret som server-renderede indexer med `link-list__link`, canonical-link,
`page-title` og meta-beskrivelse; parseren markerer manglende felter i stedet
for at droppe posten.

## Forventede felter og problemer

Opslagene giver stabil canonical URL, originalt linknavn, artikeloverskrift og
en meta-beskrivelse, som ofte indeholder livsdata. `Digtere` er et eksplicit
poesisignal; `Forfattere` er kun et bredere litterært kildesignal. Sprog,
Wikidata-id og identitetsmatch er ikke udfyldt automatisk.
