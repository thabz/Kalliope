# Versionsmærket korpusdatasæt

Kalliopes statiske build publicerer et maskinlæsbart korpus under `/api/v1/`.
Det stabile discovery-endpoint `/api/manifest.json` angiver den aktuelle
version og URL'en til dens manifest. Manifestet indeholder absolutte URL'er,
filstørrelser, SHA-256-checksummer, antal poster, relationer og genbrugsnoter.

## Bulkfiler og stabile felter

- `poets.jsonl.gz`: én `poet` per linje med stabilt `id`, navn, land, sprog,
  type, livsdata, kanonisk URL og registrerede eksterne identifikatorer.
- `works.jsonl.gz`: ét `work` per linje med globalt `id` på formen
  `{poet_id}/{local_id}`, `poet_id`, værkmetadata og kanonisk URL.
- `texts.jsonl.gz`: én indekserbar tekstplacering per linje med stabilt `id`,
  `poet_id`, `work_id`, kanonisk URL, direkte URL til den komplette eksisterende
  JSON-repræsentation, normaliseret fuldtekst, førstelinje, datoer,
  fodnoteindikator, kildesider og relationer.

`id`, `poet_id`, `work_id`, `canonical_text_id`, `canonical_url` og `api_url`
udgør sammen med de dokumenterede posttyper den offentlige v1-kontrakt.
Nye valgfrie felter kan tilføjes kompatibelt. Inkompatible ændringer kræver en
ny major-version i URL'en.

Poster er sorteret efter `id`, og gzip-filerne er deterministiske for samme
kildeindhold. Manifestets `built_at` er eksplicit buildmetadata. Tekstudvalget
omfatter de indekserbare, kanoniske placeringer; rene publikationsplaceringer
kan fortsat hentes via det eksisterende API, men er ikke selvstændige bulkposter.

## Eksisterende statisk JSON-API

- `/api/{poet_id}.json`: digtermetadata.
- `/api/{poet_id}/works.json`: digter og værker.
- `/api/{poet_id}/{local_id}-toc.json`: værkets indholdsfortegnelse.
- `/api/{poet_id}/texts.json`: titel- og førstelinjeregister.
- `/api/texts/{hash-prefix}/{id}.json`: komplet tekst med kilde, noter,
  referencer, varianter og renderingsdata. Klienter skal bruge bulkpostens
  `api_url` og ikke beregne hashstien.
- `/api/{poet_id}/mentions.json`: henvisninger og oversættelser.

De eksisterende ressourcer er applikationsendpoints. Kun de felter og relationer,
der er beskrevet i v1-schemaet og datasættets README, er en stabil
datasætkontrakt.

## Validering og brug

`schema.json` beskriver de tre JSONL-posttyper. `README.md` i datasættet viser
streaming med `gzip` og `jq`, opslag via id-felter og fuldtekstsøgning uden
udpakket mellemfil.
Static-buildet afviser ukendte `poet_id`- og `work_id`-referencer og beregner
checksums efter alle filer er skrevet.

SQLite er ikke del af det offentlige datasæt. Ved lokale, komplekse relationelle
audits kan et valgfrit indeks bygges med `make build-sqlite`; se
`docs/sqlite-index.md`.

Kalliopes software er GPL-2.0. Korpusset består hovedsageligt af public
domain-tekster, men rettigheder til kilder, redaktionelt materiale, billeder og
tredjepartsdata kan variere. Kildeoplysninger og kreditering skal bevares, og
genbrugsretten skal vurderes for den konkrete anvendelse.
