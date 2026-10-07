.DEFAULT_GOAL := help

COMPOSE ?= docker compose
POETS ?=

.PHONY: help test elasticsearch build-static build-static-force-reload profile-build-static build-sqlite sqlite \
	build-facsimiles extract-facsimiles reextract-facsimiles \
	sync-facsimiles sync-wikidata app status

help:
	@printf '%s\n' \
		'make test                       Kør hele testsuiten' \
		'make elasticsearch              Start Elasticsearch' \
		'make build-static              Byg statiske data' \
		'make build-static-force-reload Byg statiske data uden cachede build-data' \
		'make profile-build-static      Profilér fuldt static-build; gem profil og log i caches/profiles' \
		'make build-sqlite              Byg valgfrit lokalt SQLite-indeks' \
		'make sqlite                    Åbn SQLite-databasen i en SQL-session' \
		'make build-facsimiles          Udtræk facsimiler og byg thumbnails' \
		'make extract-facsimiles        Udtræk sider fra nye facsimile-PDF’er' \
		'make reextract-facsimiles      Erstat tidligere udtrukne facsimile-sider' \
		'make sync-facsimiles           Synkroniser facsimiler til webserveren' \
		'make sync-wikidata             Synkroniser metadata fra Wikidata' \
		'make app                       Byg og start appen' \
		'make status                    Vis status for Docker Compose-services'

test:
	npm test

elasticsearch:
	$(COMPOSE) up -d --wait elasticsearch

build-static: elasticsearch
	$(COMPOSE) --profile build build static-builder
	$(COMPOSE) --profile build run --rm --no-deps static-builder

build-static-force-reload: elasticsearch
	$(COMPOSE) --profile build build static-builder
	$(COMPOSE) --profile build run --rm --no-deps static-builder npm run build-static-force-reload

profile-build-static: SHELL := /bin/bash
profile-build-static: elasticsearch
	@set -euo pipefail; \
	mkdir -p caches/profiles; \
	profileDirectory=$$(mktemp -d caches/profiles/run-XXXXXX); \
	echo "Profil og buildlog: $$profileDirectory"; \
	/usr/bin/time -p $(COMPOSE) --profile build build static-builder \
		2>&1 | tee "$$profileDirectory/image-build.log"; \
	$(COMPOSE) --profile build run --rm --no-deps static-builder \
		node --cpu-prof --cpu-prof-dir="/app/$$profileDirectory" \
		tools/build-static.js --force-reload 2>&1 | tee "$$profileDirectory/build.log"

build-sqlite:
	$(COMPOSE) --profile build build static-builder
	$(COMPOSE) --profile build run --rm --no-deps \
		-e KALLIOPE_SKIP_ELASTICSEARCH=true \
		-e KALLIOPE_SKIP_IMAGE_THUMBNAILS=true \
		static-builder npm run build-sqlite

sqlite:
	@test -f caches/kalliope.sqlite || (echo 'Mangler caches/kalliope.sqlite; kør først make build-sqlite' >&2; exit 1)
	sqlite3 caches/kalliope.sqlite

build-facsimiles:
	$(COMPOSE) --profile facsimiles run --rm --build facsimile-builder npm run build-facsimiles -- all

extract-facsimiles:
	$(COMPOSE) --profile facsimiles run --rm --build facsimile-builder npm run build-facsimiles -- extract

reextract-facsimiles:
	$(COMPOSE) --profile facsimiles run --rm --build facsimile-builder npm run build-facsimiles -- reextract

sync-facsimiles:
	./tools/sync-facsimiler.sh

sync-wikidata:
	$(COMPOSE) --profile tools run --rm --build wikidata-sync $(POETS)

app:
	$(COMPOSE) up --build -d app

status:
	$(COMPOSE) ps
