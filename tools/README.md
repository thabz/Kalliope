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
make build-facsimiles
```

Selve værktøjet accepterer `extract`, `reextract`, `thumbnails` eller `all`.
Make-targets findes også til `extract` og `reextract`. Se
[facsimileafsnittet i projektets README](../README.md#facsimile-generering) for
den fulde arbejdsgang.

### OCR-kandidater

`report-ocr-candidates.js` finder sandsynlige OCR-fejl i XML-filer. Uden
filargumenter gennemgås de relevante versionsstyrede filer:

```sh
npm run report-ocr-candidates
npm run report-ocr-candidates -- fdirs/digter/vaerk.xml
```

### Tekstkvalitetskontrol

`check-text-quality` kører alle tekstkvalitetskontroller (OCR-kandidater + linje-regler) i én kommando og returnerer et stabilt output.

```sh
npm run check-text-quality
npm run check-text-quality -- fdirs/digter/vaerk.xml
```

Med JSON-output:

```sh
node tools/check-text-quality.js --json
```

Kontrollen kan afgrænses til tekster fra en bestemt dato og til værker med en
PDF-facsimile som kilde:

```sh
npm run check-text-quality -- --min-date 2018-01-01
npm run check-text-quality -- --facsimile-only
npm run check-text-quality -- --min-date=2018-01-01 --facsimile-only
```

`--min-date` medtager tekster, hvis datoen i tekst-id'et er lig med eller senere
end den angivne dato. Tekst-id'er uden en gyldig dato medtages ikke. Datoen i et
id som `winther2018081001` er `2018-08-10`. `--facsimile-only` medtager kun
værkfiler, hvor mindst én `<source>` refererer til en fil med endelsen `.pdf`.

### Salmonsen-biografier

`report-salmonsen-biographies.js` viser fremdriften for biografier til
udenlandske digtere. Positive fund registreres af digterens `bio.xml`, mens
kontrollerede negative fund ligger i
`data/salmonsen-biography-status.json`.
Den fulde redaktionelle arbejdsgang er beskrevet i
[Salmonsen-biografier](../docs/salmonsen-biographies.md).

```sh
npm run report-salmonsen-biographies
npm run report-salmonsen-biographies -- --check
npm run report-salmonsen-biographies -- --next 12
```

Den sidste kommando udskriver digter-id, navn og landekode for næste bølge.
Statusfilen skal kun opdateres af bølgens koordinator, efter arbejdsagenternes
resultater er samlet.

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

`txt2xml.rb` konverterer Kalliopes kompakte tekstformat til værk-XML og
skriver resultatet til standard output:

```sh
ruby tools/txt2xml.rb input.txt > output.xml
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
make sync-wikidata
make sync-wikidata POETS="DIGTER-ID [DIGTER-ID ...]"
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
server, der er angivet i scriptet. Inden synkronisering sættes lokale mapper til
`755` og filer til `644`. `rsync` overfører derefter rettighederne, så
webserveren også kan læse nye facsimiler oprettet af Docker.

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
