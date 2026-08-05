# SQLite-indeks (statisk build)

Dette er den foretrukne datakilde for agenter og analyseværktøjer, når en
forespørgsel kan løses med de indekserede felter. Start med SQL her i stedet
for at scanne alle XML-filer. Gå til `fdirs/` eller `content/`, hvis et felt
mangler i databasen, eller hvis den originale XML-kilde skal verificeres.

Åbn en interaktiv session med `make sqlite`. Databasen skal først være bygget
med `make build-static` eller `npm run build-static`; `make sqlite` bygger ikke
automatisk databasen.

Bygning:
- Trigger: `npm run build-static`
- Output: `public/api/kalliope.sqlite`
- Optionelt SQL-debug: `caches/sqlite-index-build.sql`
- Bruger `isFileModified` til at springe build over ved uændrede kilder.
- Inkrementel opdatering:
  - Ved ændring af kildefiler findes berørte tekst/work/poet rækker via source-mapping.
  - De berørte rækker slettes først, hvorefter nye rækker indsættes.
  - Der bygges fuld DB, hvis der mangler kilder/afhængigheder ikke kan matches.
  - Eksempel:
    - Ændring: `fdirs/gudmand/work1.xml` (forfatter=`gudmand`, arbejde=`work1`).
    - Tilsvarende afhængigheder:
      - `text`-rækker hvor `work_id = 'gudmand/work1'`
      - `event` for de samme tekster (`text.work_id`).
      - `source` for de samme tekster.
      - `poet` rækker for forfatteren (`poet_id = 'gudmand'`) hvis filen er `info.xml`/`bio.xml`/`events.xml`/`portraits.xml`/`artwork.xml`.
    - Flow:
      1) Identificér berørte `text_id` via mapping.
      2) Slet disse rækker fra `text_search_index`, `text_content`, `text`, `source`, `event`.
      3) Genopbyg kun disse `text_id` + parent `work_id`/`poet_id`.
      4) Opdater filcache for de ændrede filer.

## Kendte begrænsninger

- `DELETE`/`INSERT` sker per `poet/work/text`-scope; afhængigheder uden eksplicit source-mapping kan udløse fuld rebuild.
- Ændringer i ukendte filer (ikke i den indsamlede source-liste) eller ugyldige mapping-regler vælger fuld genopbygning.
- FTS5 er ikke bygget i denne version; søgning bruger `text_search_index` med `LIKE`-fallback.
- Hvis `sqlite3` CLI mangler, springes SQLite-opbygning af over, så `npm run build-static` stadig gennemføres.

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
SQLite-filen er et genereret, internt analyseartefakt; den er ikke en del af
frontendens API. `caches/sqlite-index-build.sql` er kun en valgfri debug-/
importcache og skal ikke redigeres som datakilde.
## Relationer

- `poet` 1:N `work`
- `work` 1:N `text`
- `text` 1:1 `text_content`
- `text` 1:N `event`
- `text` 1:N `source`
- `text_search_index.text_id` peger mod `text.text_id`

## Arbejdsgang for agenter

1. Afgræns forespørgslen til de felter og relationer, der er beskrevet her.
2. Kør en SQL-forespørgsel mod `public/api/kalliope.sqlite`.
3. Brug XML-filerne som kildecheck eller fallback, ikke som første søgestrategi.

Databasen er et genereret analyseartefakt og må ikke redigeres manuelt. Kør et
nyt static-build efter ændringer i XML eller buildlogikken.

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
<<<<<<< HEAD
=======

- Antal indekserbare tekster pr. forfatter og type:

```sql
SELECT poet_id, type, COUNT(*) AS n
FROM text
WHERE indexable = 1
GROUP BY poet_id, type
ORDER BY n DESC;
```

- Seneste ændrede filer ifølge source hash:

```sql
SELECT source_file, sha1, datetime(updated_at / 1000, 'unixepoch') AS updated_at
FROM source_file_hash
ORDER BY updated_at DESC;
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
>>>>>>> ebf3295a02a2ea1d1d1e7955cbaf4904021b267e
