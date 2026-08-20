# Alma/Z39.50 discovery (KB-facsimiler)

Værktøjet finder mulige, endnu uregistrerede KB-facsimiler for Kalliopes
digtsamlinger. Det læser digtere og værker direkte fra det versionsmærkede
korpus i `public/api/v1/`; ingen særskilt målfil skal vedligeholdes.

## Brug

Find facsimiler for én digter:

```sh
node tools/alma-z3950/cli.js --poet-id baggesen
```

Find facsimiler for hele korpusset:

```sh
node tools/alma-z3950/cli.js --all
```

Vælg præcis én af `--poet-id <id>` og `--all`. Kun værker med typen `poetry`
undersøges. Hver forespørgsel kombinerer værktitel, digterens efternavn og
udgivelsesår; forlag indgår ikke, fordi det ikke er et stabilt felt i det
offentlige korpusdatasæt.

Begge outputfiler skrives altid. Standardstierne er:

- `/tmp/alma-z3950-<poet-id>.ndjson` og `/tmp/alma-z3950-<poet-id>.md` for én digter
- `/tmp/alma-z3950-all.ndjson` og `/tmp/alma-z3950-all.md` for hele korpusset

Stierne kan tilsidesættes med `--jsonl-output <sti>` og `--report <sti>`.
NDJSON-filen indeholder både permalink og konkrete PDF-URL’er i kandidatens
`pdfUrls`; rapporten viser PDF-URL’er under hvert fund, når MARC-posten angiver
dem.

Kørsel kræver netadgang og YAZ-værktøjet `yaz-client` i `PATH`:

```sh
brew install yaz            # macOS
sudo apt install yaz        # Debian/Ubuntu
```

Værktøjet forbinder som standard til `kbdk-kgl.alma.exlibrisgroup.com:1921/45KBDK_KGL`.
Host, port og database kan overskrives med `KALLIOPE_KB_Z3950_HOST`,
`KALLIOPE_KB_Z3950_PORT` og `KALLIOPE_KB_Z3950_DB`.

## Matchning og verifikation

Automatisk stærkt match kræver titelmatch, et sikkert efternavnsmatch,
digitaliseringssignaler og online-verifikation. Et navn alene er aldrig nok.
Kandidater uden entydig online-evidens bliver markeret `needs-review`.

Et KB-permalink er ikke i sig selv en PDF. `pdfUrls` indeholder kun de fulde
PDF-adresser, som forekommer i MARC-postens elektroniske links.
