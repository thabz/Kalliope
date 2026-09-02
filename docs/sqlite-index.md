# SQLite-indeks (valgfrit lokalt analyseværktøj)

Brug normalt de versionsmærkede JSONL-gzipfiler i `public/api/v1/` til opslag,
optællinger, filtrering og audit. De er små nok til streaming med `gzip` og
`jq`; se `docs/corpus-dataset.md`. Dette SQLite-indeks er et valgfrit lokalt
værktøj til forespørgsler, hvor SQL-joins er væsentligt enklere.

Byg databasen med `make build-sqlite`, og åbn derefter en interaktiv session
med `make sqlite`. Standardkommandoerne `make build-static` og
`npm run build-static` bygger ikke databasen.

Bygning:
- Trigger: `make build-sqlite` eller `npm run build-sqlite`
- Output: `caches/kalliope.sqlite`
- Optionelt SQL-debug: `caches/sqlite-index-build.sql`
- Kommandoen genbruger static-buildets normale indsamling, men springer
  Elasticsearch og billedthumbnails over, når den køres via `make`.
- Outputtet ligger under den ignorerede `caches/`-mappe og publiceres ikke.

## Kendte begrænsninger

- Indekset er stort, fordi det indeholder både struktureret indhold,
  søgeflade og renderingsdata. Byg det kun, når SQL er nyttigt for opgaven.
- FTS5 er ikke bygget i denne version; søgning bruger `text_search_index` med `LIKE`-fallback.
- Hvis `sqlite3` CLI mangler, oprettes indekset ikke.

## Tabeller

- `poet`
  - Nøgle: `poet_id`
  - Indeholder basisinfo om forfattere og booleans for antal-typer.
- `work`
  - Nøgle: `work_id`
  - Indeholder værkstamdata, publiceringsdato og relation til parent/work-type.
- `text`
  - Nøgle: `text_id`
  - Linker tekst til `work`/`poet`, source-metadata og visningsfelter.
- `source`
  - Nøgle: `source_id`
  - Source-spor for tekstniveau (default og eventuelle kildedata).
- `event`
  - Nøgle: `event_id`
  - Datostræk for `written`, `printed`, `performed`, `event`.
- `text_content`
  - Nøgle: `text_id`
  - Lager normaliseret tekst, HTML/JSON repræsentationer m.m.
- `text_search_index`
  - Nøgle: `text_id`
  - Denormaliseret søgeflade med `raw_text`, titler, evt. datoer og nøgleord.
- `picture`
  - Nøgle: `picture_id`
  - Sporer `<picture>`-elementer med kildefil, scope, eventuelt `text_id` samt
    metadatafelterne `has_href` og `has_objid`.
SQLite-filen er et genereret, lokalt analyseartefakt og er ikke del af det
offentlige korpusdatasæt. `caches/sqlite-index-build.sql` er kun en valgfri
debug-/importcache og skal ikke redigeres som datakilde.

## Relationer

- `poet` 1:N `work`
- `work` 1:N `text`
- `text` 1:1 `text_content`
- `text` 1:N `event`
- `text` 1:N `source`
- `text_search_index.text_id` peger mod `text.text_id`

## Arbejdsgang for agenter

1. Forsøg først forespørgslen mod JSONL-gzipfilerne som beskrevet i
   `docs/corpus-dataset.md`.
2. Byg kun SQLite-indekset, hvis relationelle joins eller analysefelter gør SQL
   væsentligt enklere.
3. Brug XML-filerne som kildecheck eller fallback, ikke som første søgestrategi.

Databasen må ikke redigeres manuelt. Kør `make build-sqlite` igen efter
ændringer i XML eller buildlogikken.

Indekset opdateres inkrementelt, når en arbejdsfil eller en billedmetadatafil
er ændret. Ved ændringer, der ikke kan afgrænses sikkert, genopbygges det helt.

## Typiske queries

- Tekster på en dato:

```sql
SELECT t.text_id, p.poet_id, t.title, e.date_iso
FROM text t
JOIN poet p ON p.poet_id = t.poet_id
JOIN event e ON e.text_id = t.text_id
WHERE e.event_type = 'written'
ORDER BY e.date_iso;
```

- Hurtig søgning i fladet indeks:

```sql
SELECT text_id, poet_name_fulltext, work_title, text_title
FROM text_search_index
WHERE raw_text LIKE '%' || ? || '%'
LIMIT 200;
```

- Tekster med både tryk- og opførelsesdato:

```sql
SELECT t.text_id, t.title
FROM text t
JOIN event e1 ON e1.text_id = t.text_id AND e1.event_type = 'printed'
JOIN event e2 ON e2.text_id = t.text_id AND e2.event_type = 'performed';
```
- Antal indekserbare tekster pr. forfatter og type:

```sql
SELECT poet_id, type, COUNT(*) AS n
FROM text
WHERE indexable = 1
GROUP BY poet_id, type
ORDER BY n DESC;
```

- Tekster med facsimilekilde:

```sql
SELECT text_id, source_label, pages_text
FROM source
WHERE facsimile IS NOT NULL
ORDER BY text_id;
```

- Billeder uden `href` eller museums-`objid`:

```sql
SELECT
  COUNT(*) AS total_pictures,
  SUM(1 - has_href) AS mangler_href,
  SUM(1 - has_objid) AS mangler_objid,
  SUM(CASE WHEN has_href = 0 OR has_objid = 0 THEN 1 ELSE 0 END) AS mangler_href_eller_objid
FROM picture;
```

- Tekster uden registreret dato, hvor brødteksten indeholder en mulig dato:

```sql
SELECT t.text_id
FROM text t
JOIN text_content c ON c.text_id = t.text_id
WHERE NOT EXISTS (SELECT 1 FROM event e WHERE e.text_id = t.text_id)
  AND lower(c.normalized_text) LIKE '% januar %';
```

Ovenstående er kun et simpelt eksempel. En mere præcis datoanalyse kræver
enten en SQLite-regexp-extension eller behandling af resultatet i et script.
