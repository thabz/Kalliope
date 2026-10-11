# Versionsmærket korpusdatasæt

Kalliopes statiske build publicerer et maskinlæsbart korpus under `/api/v1/`.
Det stabile discovery-endpoint `/api/manifest.json` angiver den aktuelle
version og URL'en til dens manifest. Manifestet indeholder absolutte URL'er,
filstørrelser, SHA-256-checksummer, antal poster, relationer og genbrugsnoter.

## Bulkfiler og stabile felter

- `poets.jsonl.gz`: én `poet` per linje med stabilt `id`, navn, land, sprog,
  type, livsdata (`born`, eventuelt `baptized`, og `dead`), kanonisk URL og
  registrerede eksterne identifikatorer.
  Det valgfrie felt `nationality` angiver nationalt tilhørsforhold med en moderne
  ISO 3166-1 alpha-2-landekode. `country` bevarer Kalliopes landegruppering.
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

Buildet gemmer en lokal tilstand i `caches/corpus-dataset.json`. Når metadata,
digternes `info.xml`, de indekserbare teksters API-filer og eksportkoden er
uændrede, og alle outputfiler stadig matcher tilstanden, springes genlæsning
og gzip-komprimering over. Filtilstanden kontrolleres med størrelse, mtime og
ctime. Tilføjelser og sletninger indgår i kontrollen. Manglende eller ændrede
outputfiler, manglende cache og `--force-reload` udløser et nyt eksportbuild.

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

## Værkafgrænset variantkontrol

Ved værktilføjelse og senere kontrol af et bestemt værk kan kandidater findes
uden et nyt static-build:

```sh
node tools/find-variant-candidates.js fdirs/antologierdk/1881.xml
npm run find-variant-candidates -- fdirs/antologierdk/1881.xml --json
```

Værkfilen er obligatorisk; værktøjet har ingen global auditfunktion og ændrer
ingen filer. Inputteksterne læses fra XML med Kalliopes normale forfatterarv.
Korpusfilen streames én gang, og kun førstelinjer hos de relevante digtere
bruges, inklusive tekster i antologier. Hvert kandidatpar involverer mindst én
inputtekst; selvtræffere og gentagne placeringer af samme tekst udelades.
Interne kandidatpar i inputværket medtages. `skip-index`-tekster springes over,
og tekster uden førstelinje tælles særskilt.

Søgningen normaliserer Unicode, store/små bogstaver, mellemrum og tegnsætning,
men rapporten bevarer ordlyden. Kandidater har enten ens normaliserede
førstelinjer, de samme tre indledende ord med mindst 12 bogstaver i begyndelsen,
eller mindst 85 % lighed efter normaliseret Levenshtein-afstand blandt de to
efterfølgende naboer i dansk sortering. Nabokontrollen kræver mindst 15
bogstaver i begge førstelinjer; identiske linjer grupperes inden sorteringen.

Kun kandidaternes konkrete tekst-JSON læses for at kontrollere eksisterende
variantforbindelser. Indirekte forbindelser medtages sammen med inputværkets
aktuelle XML-relationer. Allerede forbundne par tælles særskilt og vises ikke
som udestående kandidater. Manglende data og uløste referencer rapporteres.

Rapporten angiver datasættets buildtid og giver førstelinjer, titler, id'er,
links og matchgrunde grupperet efter digter. Kandidater kræver tekstlig
vurdering; ens begyndelser er ikke i sig selv bevis for et variantforhold.
Stærkt omskrevne begyndelser kan overses. Korpusopslag afspejler den eksisterende
genererede version, mens inputværket altid læses i sin aktuelle form. Manglende
eller ugyldig XML/JSONL giver exitkode 1; kandidatfund og rapporterede
dataproblemer giver exitkode 0, men dataproblemer skal afklares før færdigstatus.

Kalliopes software er GPL-2.0. Korpusset består hovedsageligt af public
domain-tekster, men rettigheder til kilder, redaktionelt materiale, billeder og
tredjepartsdata kan variere. Kildeoplysninger og kreditering skal bevares, og
genbrugsretten skal vurderes for den konkrete anvendelse.
