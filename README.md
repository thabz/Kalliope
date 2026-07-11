[![CI](https://github.com/thabz/Kalliope/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/thabz/Kalliope/actions/workflows/ci.yml)

# Kalliope

## Udvikling og tekstredigering lokalt

Brug denne arbejdsgang når du udvikler på appen eller redigerer tekster i
`fdirs/` og `data/`.

Krav:

- Node.js 20 eller nyere
- Docker, hvis Elasticsearch skal køres lokalt via Compose

Installer afhængigheder:

```shell
npm install
```

Start Elasticsearch på `localhost:9200`:

```shell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d elasticsearch
```

Byg de statiske data og start appen:

```shell
npm run build-static
npm run dev
```

Appen kører på http://localhost:3000/.

Når du ændrer XML-filer i `fdirs/` eller `data/`, skal de statiske data bygges
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

Sæt sync-målet i `.env`. Start evt. med `.env.example`:

```shell
KALLIOPE_FACSIMILE_RSYNC_TARGET=jec@10.0.0.5:/Volumes/Alma/Faksimiler
```

Udtræk sider fra nye PDF'er:

```shell
docker compose --profile facsimiles run --rm --build facsimile-builder npm run build-facsimiles -- extract
```

Overskriv eksisterende output for fundne PDF'er:

```shell
docker compose --profile facsimiles run --rm --build facsimile-builder npm run build-facsimiles -- reextract
```

Kør hele kæden med udtrækning, thumbnails og sync:

```shell
docker compose --profile facsimiles run --rm --build facsimile-builder npm run build-facsimiles -- all
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
docker compose up -d elasticsearch
docker compose --profile build build static-builder
docker compose --profile build run --rm static-builder
```

Byg og genstart appen:

```shell
docker compose up --build -d app
```

Tjek at containerne kører:

```shell
docker compose ps
```

Ved større dataændringer kan static-buildet køres med fuld reload:

```shell
docker compose --profile build run --rm static-builder npm run build-static-force-reload
```
