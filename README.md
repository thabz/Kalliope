[![CI](https://github.com/thabz/Kalliope/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/thabz/Kalliope/actions/workflows/ci.yml)

## Kalliope installation lokalt

1. Installer [NodeJS](https://nodejs.org/en/).
2. Hent din kopi af Kalliope på [GitHub](https://github.com/thabz/Kalliope.git) enten som zip-fil eller, bedre, som en git-clone.
3. Åbn en terminal (Terminal.app på Mac, PowerShell på Windows eller hvad som helst på Linux) og find mappen med din kopi af Kalliope.
4. Udfør derefter følgende trin (hvoraf nogle kan tage lang tid)

```shell
npm install
npm run build
npm run build-static
npm run start
```

Hvis alt lykkes, kan din egen kopi af Kalliope nu ses på http://localhost:3000/.

Hvis du nu retter i en XML-fil, f.eks. under `/fdirs/`, skal `npm run build-static` udføres igen, hvorefter ændringen kan ses i browseren. `npm run build-static` udføres meget hurtigt anden gang man kører den, da kun ændrede xml-filer behandles.

### Docker

Du kan også køre Kalliope med Docker og Elasticsearch:

Først skal `docker` være installeret og tilgængelig i din terminal:

- På Mac kan du installere [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  eller bruge [Colima](https://github.com/abiosoft/colima) sammen med Docker CLI:
  `brew install colima docker docker-compose`.
- På Linux skal du installere Docker Engine og Compose-plugin'et via din distributions
  pakkehåndtering eller Dockers installationsvejledning.

Start derefter Docker-daemonen:

- Med Docker Desktop: åbn Docker Desktop og vent til Docker kører.
- Med Colima:

```shell
colima start
```

Første gang skal de statiske data bygges, før appen startes:

```shell
docker compose up -d elasticsearch
docker compose --profile build build static-builder
docker compose --profile build run --rm static-builder
docker compose up --build app
```

Det starter appen på `http://localhost:3001`. Elasticsearch kører kun på
Docker-netværket og er ikke eksponeret på hosten.

Efter ændringer i XML-filer under `data/` eller `fdirs/` skal builderen køres igen:

```shell
docker compose --profile build run --rm static-builder
```

Hvis din Docker-installation stadig bruger den gamle Compose-klient, kan du bruge:

```shell
docker-compose up -d elasticsearch
docker-compose --profile build build static-builder
docker-compose --profile build run --rm static-builder
docker-compose up --build app
```

På Colima kan første statiske build godt kræve mere RAM end standardopsætningen, især under thumbnail-generering. Docker-opsætningen kører fire thumbnails ad gangen som standard (`KALLIOPE_THUMBNAIL_CONCURRENCY=4`), men holder sharp/libvips per-billede concurrency lav (`KALLIOPE_SHARP_CONCURRENCY=1`) og bruger en lille sharp-cache (`KALLIOPE_SHARP_CACHE_MEMORY=64`) for at spare hukommelse. Hvis containeren alligevel bliver killed under `build-static`, så prøv at starte Colima med mere hukommelse og kør builderen igen:

```shell
colima stop
colima start --cpu 4 --memory 8 --disk 60
docker compose --profile build run --rm static-builder
```

Hvis du vil bygge thumbnails hurtigere og har rigeligt RAM, kan concurrency hæves:

```shell
KALLIOPE_THUMBNAIL_CONCURRENCY=8 docker compose --profile build run --rm static-builder
```

`KALLIOPE_THUMBNAIL_CONCURRENCY` styrer hvor mange billeder der behandles samtidig. `KALLIOPE_SHARP_CONCURRENCY` styrer hvor mange libvips worker-tråde sharp bruger per billede.

### Faksimile generering

Kræver `pdfimages` som er del af `poppler` pakken.

## Kalliope installation på server

### Install

```shell
mkdir ~/home/jec/Sites
cd ~/home/jec/Sites
git checkout ...
npm run build
```

### systemd

```shell
sudo cp ~/home/jec/Sites/tools/kalliope.service /etc/systemd/system
sudo systemctl daemon-reload
sudo systemctl enable kalliope.service
```

Now Kalliope should start on system start (after nginx). Test with

```
sudo systemctl start kalliope # To et
```
