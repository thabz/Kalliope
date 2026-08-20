# Alma/Z39.50 discovery (KB-facsimiler)

Denne pakke indeholder et minimalt reproducerbart flow til at finde uopdagede KB-facsimiler for danske digtere:

- Z39.50/PQF-forespørgsel med dokumenterede Bib-1-attributter:
  - titel (`1003`)
  - forfatter (**efternavn**) (`1004`) som målretning efter KB-workflow
  - år (`31`)
  - "digitalisering" (`1016`)
- MARC-udtræk fra hits med fokus på Alma-E/online-signaler
- Rekonstrueret facsimile-permalink per hit
- Matchning med styrke-signaler (ikke baseret på navn alene)
- Cache af online-svar for at undgå unødige gentagne forespørgsler

Standardafvikling er pilotbaseret med tre digtere i `fixtures/pilot-targets.json`.

## Brug i praksis

```sh
node tools/alma-z3950/cli.js \
  --targets tools/alma-z3950/fixtures/pilot-targets.json \
  --jsonl-output /tmp/alma-z3950.ndjson \
  --report /tmp/alma-z3950-report.md
```

Scope-eksempler:

- `--scope all` (standard): alle mål.
- `--scope one --poet-id winther` eller `--scope one --index 2`: ét mål.
- `--scope slice --slice 0:2`: udsnit af mållisten (end eksklusiv).

Kørsel kræver netadgang og YAZ-værktøjet `yaz-client` i `PATH`:

```sh
brew install yaz            # macOS
sudo apt install yaz        # Debian/Ubuntu
```

Værktøjet forbinder som standard til den Alma-server, der er dokumenteret i
issue #1579: `kbdk-kgl.alma.exlibrisgroup.com:1921/45KBDK_KGL`. Host, port og
database kan overskrives med henholdsvis `KALLIOPE_KB_Z3950_HOST`,
`KALLIOPE_KB_Z3950_PORT` og `KALLIOPE_KB_Z3950_DB`.

Cachelagret bruges til at reducere gentagne forespørgsler til KB.

## Udfaldsformat

CLI'en producerer to lag:

- maskin-output i NDJSON, én linje pr. mål (`--jsonl-output`)
- kort kort rapport i markdown (`--report`)

Maskin-linjerne indeholder pr. mål:

- poet-id og titel
- match-status / confidence
- bedste hit (`best`)
- alle kandidater i `candidates`, herunder `queryHit` og `provenance`

## Matching- og verifikationspolitik

`evaluateMatch` kræver som minimum:

- kendt titelmatch
- entydig efternavns-match mod MARC-authorfelt
- stærke digitaliseringssignaler (`Alma-E` eller digital link)
- og verifikation af online-tilgængelighed

`queryHit.verification` og kandidatniveau'et indeholder:

- `status`: `verified`, `needs-review` eller `missing`
- `reason`: fx `marc-permalink-and-vis-online` eller `online-evidence-incomplete`
- `expectedPermalink`: den afledte permalinkkandidat
- `source`: `marc`

Når verifikationen ikke kan fuldføres fra MARC/PNX, forbliver kandidaten `needs-review` med begrundet årsag.

## Matchregler

Automatisk match kræver tydelig titelmatch og stærke signaler:

- Alma-E
- elektronisk link
- supplerende publikationshints (år/publisher/beskrivelse)

Forfatternavn alene kan aldrig udløse et match. Et tydeligt efternavn-signal er indgående i `strong-match`.

## Udviklernoter

- `index.js` indeholder domænelogik, parser og rapportering.
- `z3950-client.js` styrer `yaz-client` over stdin/stdout og udtrækker MARCXML.
  - manglende YAZ giver installationsvejledning for macOS og Debian/Ubuntu.
  - timeout, retry og exponential backoff ved transient fejl (`ENOTFOUND`, `ETIMEDOUT`, `ECONNRESET` m.fl.).
- `cli.js` understøtter:
  - `--scope all|one|slice`
  - `--poet-id`, `--index`, `--slice`
  - `--force-reload` for at ignorere cache.
