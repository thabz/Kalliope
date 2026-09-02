# Nordisk Kvindelitteraturhistorie indsamling

Dette er et kildeevidens-snapshot fra det offentlige danske forfatterindex. Det
er ikke en komplet bibliografi over danske digtere og indeholder ingen
identitetssammenlægning.

## Reproduktion

```sh
node tools/data/indsamling/nordisk-kvindelitteraturhistorie/collect.mjs
node tools/data/indsamling/nordisk-kvindelitteraturhistorie/collect.mjs --fetch
```

Scriptet bruger det JSON-endpoint, som webstedets eget index-script kalder:
`https://nordicwomensliterature.net/wp-json/nwl/v1/writers/da`. HTML-indexet
gemmes også, fordi det dokumenterer den synlige indgang og endpointets
placering. Der hentes ikke automatisk forfatterprofiler, billeder eller hele
artikelarkivet.

## Snapshotresultat

Snapshotet fra 7. august 2026 indeholder 819 observationer. 233 har
`Danmark` som kildeland, 22 mangler land, og resten er fordelt på Finland,
Færøerne, Grønland, Island, Norge og Sverige. Hver observation har kilde-URL
og kilde-id som den konkrete forfatterprofil.

`raw/` bevarer JSON-felterne fra kilden uændret. `parsed/observations.json`
tilføjer normaliserede værdier separat; tomme dødsår bliver `null`, og
navne/lande foldes kun til sammenligning. Pseudonymer og parenteser i det
oprindelige navn bevares i `raw.name`.

## Artikelrelationer, adgang og genbrug

Forfatterindexets felter er `name`, `born`, `dead`, `country`, `profile_url` og
eventuelt `picture_url`; der findes ikke et felt med artikelrelationer.
Webstedet beskriver over 200 artikler og over 800 forfattere, men relationerne
kan derfor ikke udledes reproducerbart fra dette index alene. Artikler skal
indsamles som et separat observationslag ved en senere, eksplicit afgrænset
høst.

Indexet er offentligt tilgængeligt uden login. Snapshotet bruger kun offentlige
GET-kald til HTML-indexet og det endpoint, som siden selv kalder. Webstedet
oplyser, at det hostes af Center for Køn og Diversitet ved Syddansk Universitet
og at biobibliografierne ikke løbende opdateres. Der er ikke foretaget en
juridisk genbrugsvurdering af biografitekst eller billeder; derfor gemmes kun
indexets metadatafelter og ikke billeder eller fulde profiler.

Kilde, metode, felter, parserstatus og SHA-256-checksums står i `manifest.json`.
