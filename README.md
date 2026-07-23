[![CI](https://github.com/thabz/Kalliope/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/thabz/Kalliope/actions/workflows/ci.yml)

# Kalliope

## Udvikling og tekstredigering lokalt

Brug denne arbejdsgang når du udvikler på appen eller redigerer tekster i
`fdirs/` og `content/`.

Krav:

- Node.js 20 eller nyere
- Docker, hvis Elasticsearch skal køres lokalt via Compose
- Make til genvejene omkring Docker Compose

Installer afhængigheder:

```shell
npm install
```

Start Elasticsearch på `localhost:9200`:

```shell
make elasticsearch
```

Byg de statiske data og start appen:

```shell
npm run build-static
npm run dev
```

Appen kører på http://localhost:3000/.

Når du ændrer XML-filer i `fdirs/` eller `content/`, skal de statiske data bygges
igen:

```shell
npm run build-static
```

Hvis cachede build-data driller, kan hele static-buildet tvinges igennem:

```shell
npm run build-static-force-reload
```

Kør testene før større ændringer eller pull requests:

```shell
npm test
```

## Facsimile-generering

Facsimiler bygges i en separat Docker Compose-service. Læg PDF'er i
`facsimiles/<poet>/<work>.pdf`; mappen er lokal og committes ikke.

Sync køres fra hosten, så containeren ikke får adgang til lokale SSH-nøgler.

Udtræk sider fra nye PDF'er:

```shell
make extract-facsimiles
```

Overskriv eksisterende output for fundne PDF'er:

```shell
make reextract-facsimiles
```

Kør hele kæden med udtrækning og thumbnails:

```shell
make build-facsimiles
```

PDF-udtræk bruger som standard `KALLIOPE_FACSIMILE_EXTRACTOR=auto`, som
udtrækker sikre indlejrede JPEG-sidebilleder med `pdfimages` og renderer resten
med `pdftoppm`. Sæt `KALLIOPE_FACSIMILE_EXTRACTOR=pdftoppm` for kun at rendere
med `pdftoppm`, eller justér fallback-opløsningen med
`KALLIOPE_FACSIMILE_RENDER_DPI` (default `300`).

Upload derefter fra hosten til `jec@10.0.0.5:/Volumes/Alma/Faksimiler`:

```shell
./tools/sync-facsimiler.sh
```

## Deploy på prod og opdatering af prod

Produktionen køres med Docker Compose. Prod-serveren bygger appen, bygger de
statiske data og opdaterer Elasticsearch.

Log ind på prod-serveren og gå til repoet.

Hent seneste kode:

```shell
git pull --ff-only
```

Byg og kør static-builderen:

```shell
make build-static
```

Byg og genstart appen:

```shell
make app
```

Tjek at containerne kører:

```shell
make status
```

Ved større dataændringer kan static-buildet køres med fuld reload:

```shell
make build-static-force-reload
```
