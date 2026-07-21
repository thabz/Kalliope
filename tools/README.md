# Værktøjer

Kommandoerne i denne mappe køres normalt fra roden af Kalliope-repositoriet.
Installer projektets Node-afhængigheder med `npm install`, før JavaScript-
værktøjerne bruges. Den overordnede udviklings-, build- og facsimilearbejdsgang
er beskrevet i [projektets README](../README.md).

## Build, facsimiler og OCR-rapportering

### Statisk build

`build-static.js` bygger API-data, indeks, sitemap, thumbnails og
Elasticsearch-data ud fra XML-filerne. Brug npm-kommandoerne:

```sh
npm run build-static
npm run build-static-force-reload
```

Filerne i `build-static/` og `libs/` er interne JavaScript-moduler. De skal ikke
køres direkte.

### Facsimiler

`build-facsimiles.js` udtrækker sider fra PDF-filer og bygger thumbnails. Den
anbefalede arbejdsgang bruger Docker Compose, så Poppler-afhængighederne findes
i et ensartet miljø:

```sh
docker compose --profile facsimiles run --rm --build facsimile-builder \
  npm run build-facsimiles -- all
```

Kommandoen accepterer `extract`, `reextract`, `thumbnails` eller `all`. Se
[facsimileafsnittet i projektets README](../README.md#facsimile-generering) for
den fulde arbejdsgang.

### OCR-kandidater

`report-ocr-candidates.js` finder sandsynlige OCR-fejl i XML-filer. Uden
filargumenter gennemgås de relevante versionsstyrede filer:

```sh
npm run report-ocr-candidates
npm run report-ocr-candidates -- fdirs/digter/vaerk.xml
```

## Redaktionelle værktøjer

### Opret digtere, værker og tekster

De tre hjælpeværktøjer ændrer filer direkte og skal køres fra repository-roden:

```sh
ruby tools/add-poet.rb
ruby tools/add-work.rb DIGTER-ID VAERK-ID
ruby tools/add-poem.rb DIGTER-ID [VAERK-ID]
```

`add-poet.rb` spørger interaktivt efter persondata. `add-work.rb` opretter et
værk og føjer det til digterens `info.xml`. `add-poem.rb` tilføjer en tom tekst
til det angivne værk; standardværket er `andre`.

`add-poet.rb` og `add-work.rb` kræver Ruby-pakken Nokogiri. `add-poem.rb` kan
også kræve Nokogiri, hvis det først skal oprette `andre.xml` via `add-work.rb`.
Formaterne er dokumenteret i [personformatet](../docs/xml-info-format.md) og
[værkformatet](../docs/xml-work-format.md).

### Konvertér redaktionel tekst til XML

`old2kalliope.rb` konverterer Kalliopes kompakte tekstformat til værk-XML og
skriver resultatet til standard output:

```sh
ruby tools/old2kalliope.rb input.txt > output.xml
```

Køres scriptet uden et filargument, udskriver det en tom skabelon.

### Ryd Fraktur-OCR

`fraktur-ocr-cleanup.rb` er et specialiseret filter med historiske
erstatningsregler til dansk Fraktur-OCR. Det ændrer ikke inputfilen, men skriver
resultatet til standard output:

```sh
ruby tools/fraktur-ocr-cleanup.rb input.txt > output.txt
```

Reglerne er brede og ordnede; gennemgå derfor outputtet manuelt, før det bruges
som kildetekst.

## Synkronisering

### Wikidata

`sync-wikidata.rb` opdaterer eksterne identifikatorer i digternes `info.xml`.
Kør det anbefalet i værktøjscontaineren:

```sh
docker compose run --rm wikidata-sync
docker compose run --rm wikidata-sync DIGTER-ID [DIGTER-ID ...]
```

Uden digter-id'er behandles alle mapper i `fdirs/`. Lokal kørsel med Ruby
kræver Nokogiri. Se [dokumentationen af eksterne
identifikatorer](../docs/xml-info-format.md#identifiers).

### Facsimiler

`sync-facsimiler.sh` synkroniserer den lokale `facsimiles/`-mappe til den
konfigurerede Kalliope-server:

```sh
./tools/sync-facsimiler.sh
```

Scriptet bruger SSH og rsync fra værtsmaskinen og forudsætter adgang til den
server, der er angivet i scriptet.

## Editorintegrationer

`vscode-kalliope-syntax/` indeholder Kalliopes VS Code-extension med
syntaksfarvning og facsimilevisning. `install-vscode-kalliope-syntax.sh`
installerer workspace-versionen som et symbolsk link:

```sh
./tools/install-vscode-kalliope-syntax.sh
```

Se [extensionens README](vscode-kalliope-syntax/README.md) for brug og
konfiguration.

`vim-kalliope-syntax/` indeholder syntaksfarvning og filtypedetektion til Vim.
Installationen er beskrevet i [Vim-integrationens
README](vim-kalliope-syntax/README.md).
