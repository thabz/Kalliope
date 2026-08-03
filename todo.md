# TODO: SQLite-indeks for Kalliope (statisk build)

## Formål
Byg en genereret, lokal SQLite-database som en del af `npm run build-static`, brugt kun til analyse/eksport-workflows (ikke frontenden).

## Valgt output
- Artefakt: `public/api/kalliope.sqlite`
- Genopbygning: fuldt regenereret som del af static build.
- Forøgelse: inkrementel opdatering ved fil-hashes (source-fil ændres → genindlæs helt den fil og genopbyg alle afhængige db-rækker).
- SQL-fil ved fejlfinding: `caches/sqlite-index-build.sql` (valgfri).

## Overordnet plan (små opgaver)
1. [x] Opret `tools/build-static/sqlite-index.js`
   - Modtager `collected`, bruger eksisterende parser-funktioner (`worksFirstPass` output, `extractDates`, `extractTitle`, `safeGetAttr`, `loadXMLDoc` osv.)
   - Opbygker in-memory rækker for poet/work/text/source/events/content.
2. [x] Definer skema i SQLite og migration/initialisering.
   - Slå tabeller/relationer ned på `DROP TABLE IF EXISTS` i deterministisk rækkefølge.
3. [x] Byg normaliserede kerne-tabeller (`poet`, `work`, `text`, `text_content`, `source`, `event`, `source_file_hash`).
4. [x] Byg denormaliseret søge-fladtabel (`text_search_index`) til hurtige opslag.
5. [x] Tilføj fuldtekstindeks (FTS5) på `text_search_index` (eller fallback til LIKE, hvis FTS5 ikke er tilgængeligt i miljøet).
6. [x] Implementér inkrementel opdatering:
   - Registrér sidste hash pr. kildefil i `source_file_hash`.
   - Ved ny build: find ændrede filer, slet relaterede `text/work`-rækker via mapping og opbyg dem igen.
   - Genindlæs altid hele berørte filer (ingen delvise tekstdiffs).
   - Eksempel:
     - Ændret fil: `fdirs/gudmand/work1.xml`
     - Aflastning: `text`-ID'er med `work_id = 'gudmand/work1'`.
     - Slet først rækker i `text`, `text_content`, `source`, `event`, `text_search_index`.
     - Indlæs derefter de samme `text`-ID'er igen + opdaterede `source_file_hash`.
7. [x] Integrér i `tools/build-static.js` som sidste trin før cache-opdatering.
8. [x] Brug progress-log som de øvrige builders (`createProgressReporter`).
9. [x] Tilføj README-/docs-snippet med felter, relationer og foreslåede queries ([docs/sqlite-index.md](docs/sqlite-index.md)).
10. [x] Opdater `todo.md` med status ved gennemførsel.

## Foreslået skema (version 1)

### Core-tabeller

- `poet`
  - `poet_id TEXT PRIMARY KEY`
  - `country TEXT`
  - `lang TEXT`
  - `type TEXT`
  - `square_portrait TEXT`
  - `name_firstname TEXT`
  - `name_lastname TEXT`
  - `name_fullname TEXT`
  - `name_pseudonym TEXT`
  - `name_sortname TEXT`
  - `born_date TEXT`
  - `born_place TEXT`
  - `dead_date TEXT`
  - `dead_place TEXT`
  - `has_poems INTEGER`, `has_prose INTEGER`, `has_works INTEGER`
  - `created_at INTEGER`, `updated_at INTEGER`

- `work`
  - `work_id TEXT PRIMARY KEY` (fx `poetId/workId`)
  - `poet_id TEXT NOT NULL`
  - `local_id TEXT` (fx `workId`)
  - `title TEXT`
  - `subtitles_json TEXT`
  - `toctitle TEXT`
  - `linktitle TEXT`
  - `breadcrumbtitle TEXT`
  - `year TEXT`
  - `status TEXT`
  - `type TEXT`
  - `has_content INTEGER`
  - `published_date_raw TEXT`
  - `published_date_iso TEXT`
  - `parent_work_id TEXT`
  - `is_virtual INTEGER`
  - `created_at INTEGER`, `updated_at INTEGER`

- `text`
  - `text_id TEXT PRIMARY KEY`
  - `work_id TEXT NOT NULL`
  - `poet_id TEXT NOT NULL`
  - `source_poet_id TEXT`
  - `source_work_id TEXT`
  - `source_text_id TEXT`
  - `placement TEXT` (canonical/author/publication/section)
  - `canonical_text_id TEXT`
  - `type TEXT`
  - `title TEXT`
  - `indextitle TEXT`
  - `linktitle TEXT`
  - `firstline TEXT`
  - `content_lang TEXT`
  - `text_lang TEXT`
  - `has_footnotes INTEGER`
  - `footnotes_count INTEGER`
  - `indexable INTEGER`
  - `source_node_in TEXT`
  - `page_range_text TEXT`
  - `digital_url TEXT`
  - `facsimile TEXT`
  - `facsimile_pages_json TEXT`
  - `facsimile_page_count INTEGER`
  - `created_at INTEGER`, `updated_at INTEGER`

- `source`
  - `source_id TEXT PRIMARY KEY`
  - `scope TEXT` (`work`/`text`/`anthology_source`)
  - `work_id TEXT`
  - `text_id TEXT`
  - `source_key TEXT`
  - `source_label TEXT` (rå kildetekst)
  - `pages_text TEXT`
  - `digital_url TEXT`
  - `facsimile TEXT`
  - `facsimile_pages_offset INTEGER`
  - `facsimile_page_count INTEGER`
  - `facsimile_pages_json TEXT`
  - `created_at INTEGER`, `updated_at INTEGER`

- `event`
  - `event_id TEXT PRIMARY KEY`
  - `event_type TEXT` (`written`,`printed`,`performed`,`event`)
  - `text_id TEXT`
  - `work_id TEXT`
  - `poet_id TEXT`
  - `date_raw TEXT`
  - `date_iso TEXT`
  - `source_file TEXT`
  - `source_file_row_hash TEXT`
  - `created_at INTEGER`, `updated_at INTEGER`

- `text_content`
  - `text_id TEXT PRIMARY KEY`
  - `normalized_text TEXT` (renset tekst for hurtig fremsøgning)
  - `rendered_html TEXT` (beholdt rendering)
  - `raw_blocks_json TEXT`
  - `notes_json TEXT`
  - `keywords_json TEXT`
  - `variant_group TEXT`

- `source_file_hash`
  - `source_file TEXT PRIMARY KEY`
  - `sha1 TEXT NOT NULL`
  - `mtime_ms INTEGER`
  - `updated_at INTEGER`

### Denormaliseret indeks-tabel

- `text_search_index`
  - `text_id TEXT PRIMARY KEY`
  - `poet_id TEXT`
  - `poet_name_fulltext TEXT`
  - `work_id TEXT`
  - `work_title TEXT`
  - `text_title TEXT`
  - `text_firstline TEXT`
  - `keywords TEXT`
  - `raw_text TEXT`
  - `has_footnotes INTEGER`
  - `source_pages TEXT`
  - `written_iso TEXT`
  - `written_raw TEXT`
  - `printed_iso TEXT`
  - `printed_raw TEXT`
  - `performed_iso TEXT`
  - `performed_raw TEXT`
  - `event_iso TEXT`
  - `event_raw TEXT`

## Opdateringsstrategi (inkrementelt)
- Ved build: beregn ændrede filer med eksisterende cache (`isFileModified`) eller læs `source_file_hash`.
- Når en fil ændres:
  1) læs filen og rebuild alle afhængige værker/tekster i hukommelse
  2) slet tidligere rækker for de derafledte `text_id` / `work_id` / `poet_id`
  3) indsæt nye rækker igen
- Hvis forfatterinfo-fil (`fdirs/<poet>/info.xml`) ændrer sig: markér alle poetens `work_id`/`text_id` til genindlæsning.
- Hvis `fdirs/<poet>/<work>.xml` ændres: markér `work_id` + alle tekster i det værk.
- Hvis en tekst source-fil ændres: reindtast tilhørende tekst og knyttede datoer/source.

## Status (seneste kørsel)
- [x] Reparerede import af `caches/sqlite-index-build.sql` til at indsætte manglende semikoloner mellem `INSERT`-statements.
- [x] Fikset `tools/build-static/sqlite-index.js` til at importere en valideret SQL-cache før `kalliope.sqlite` bygges.
- [x] Kørte `npm run build-static` uden fejlkørsel (`EXIT:0`).

## Foreslåede forespørgsler
```sql
-- Tekster skrevet samme dato (maskinlæsbar):
SELECT t.text_id, p.poet_id, t.title, e.date_iso, e.date_raw
FROM text t
JOIN event e ON e.text_id = t.text_id
WHERE e.event_type = 'written'
ORDER BY e.date_iso ASC, p.poet_id, t.title;

-- Hurtig søgning i indeks-tabel (FTS eller LIKE):
SELECT text_id, poet_name_fulltext, work_title, text_title
FROM text_search_index
WHERE raw_text LIKE '%' || :needle || '%'
LIMIT 200;

-- Antal tekster pr. digter og arbejdstype:
SELECT poet_id, type, COUNT(*) AS n
FROM text t
JOIN text_content c ON c.text_id = t.text_id
WHERE t.indexable = 1
GROUP BY poet_id, type
ORDER BY n DESC;

-- Tekster med både trykt og opført dato:
SELECT t.text_id, t.title
FROM text t
JOIN event e1 ON e1.text_id = t.text_id AND e1.event_type = 'printed'
JOIN event e2 ON e2.text_id = t.text_id AND e2.event_type = 'performed';

-- Opdater status for ændrede filer siden sidste build:
SELECT source_file, sha1, datetime(updated_at/1000, 'unixepoch') AS updated_at
FROM source_file_hash
ORDER BY updated_at DESC;
```

## Note
- Denne database skal kun bruges til intern analyse (CLI/rapporter), ikke eksponeres direkte i frontend-API.

## Færdig SQL til forespørgslen
```sql
SELECT t.text_id
FROM text t
JOIN text_content c ON c.text_id = t.text_id
WHERE NOT EXISTS (SELECT 1 FROM event e WHERE e.text_id = t.text_id)
  AND lower(c.normalized_text) REGEXP '([0-9]|[1-9][0-9]|3[01])\\.?[ ]+((januar|jan|februar|feb|marts|mars|mar|april|apr|maj|juni|jun|juli|jul|august|aug|september|sept|sep|oktober|okt|november|nov|december|decbr|dec)\\.?)[ ]+[12][0-9][0-9][0-9]'
ORDER BY t.text_id;
```
