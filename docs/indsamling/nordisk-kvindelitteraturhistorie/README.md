# Nordisk Kvindelitteraturhistorie

Kilden er høstet som et afgrænset, reproducerbart snapshot af det offentlige
danske forfatterindex. Det er kildeevidens, ikke en komplet bibliografi over
danske digtere.

## Hentning

Hentningen bruger webstedets eget JSON-endpoint:

`https://nordicwomensliterature.net/wp-json/nwl/v1/writers/da`

HTML-indexet og JSON-svaret gemmes under
`tools/data/indsamling/nordisk-kvindelitteraturhistorie/raw/`. Kør
`node tools/data/indsamling/nordisk-kvindelitteraturhistorie/collect.mjs` for
at parse det bevarede snapshot eller tilføj `--fetch` for at hente igen.

Snapshotet indeholder 819 observationer, heraf 233 med Danmark som kildeland
og 22 uden land. Hver observation kan spores til sin konkrete profil-URL.

## Felter og begrænsninger

Forfatterindexets felter er navn, fødselsår, dødsår, land, profil-URL og
eventuelt billed-URL. Originale værdier ligger i `raw`, mens normaliserede
værdier ligger separat i `parsed/observations.json`. Pseudonymer og
navnevarianter er ikke sammenlagt.

JSON-indexet indeholder ingen artikelrelationer. Webstedets separate
artikelarkiv skal derfor behandles som en senere, eksplicit afgrænset kilde;
ingen artikelrelationer er automatisk opfundet i dette snapshot. Webstedet
beskriver over 200 artikler og over 800 forfattere, og oplyser samtidig at
biobibliografierne ikke løbende opdateres.

Adgang er offentlig uden login. Høsten gemmer kun indexmetadata, ikke billeder
eller fulde forfatterprofiler, og der er ikke foretaget en juridisk
genbrugsvurdering af biografitekst eller billeder. Checksums og parserstatus
står i `tools/data/indsamling/nordisk-kvindelitteraturhistorie/manifest.json`.
