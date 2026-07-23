.DEFAULT_GOAL := help

COMPOSE ?= docker compose
POETS ?=

.PHONY: help elasticsearch build-static build-static-force-reload \
	build-facsimiles extract-facsimiles reextract-facsimiles \
	sync-facsimiles sync-wikidata app status

help:
	@printf '%s\n' \
		'make elasticsearch              Start Elasticsearch' \
		'make build-static              Byg statiske data' \
		'make build-static-force-reload Byg statiske data uden cachede build-data' \
		'make build-facsimiles          Udtræk facsimiler og byg thumbnails' \
		'make extract-facsimiles        Udtræk sider fra nye facsimile-PDF’er' \
		'make reextract-facsimiles      Erstat tidligere udtrukne facsimile-sider' \
		'make sync-facsimiles           Synkroniser facsimiler til webserveren' \
		'make sync-wikidata             Synkroniser metadata fra Wikidata' \
		'make app                       Byg og start appen' \
		'make status                    Vis status for Docker Compose-services'

elasticsearch:
	$(COMPOSE) up -d elasticsearch

build-static: elasticsearch
	$(COMPOSE) --profile build build static-builder
	$(COMPOSE) --profile build run --rm static-builder

build-static-force-reload: elasticsearch
	$(COMPOSE) --profile build build static-builder
	$(COMPOSE) --profile build run --rm static-builder npm run build-static-force-reload

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
