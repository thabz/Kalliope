# Dubletaudit for skjulte DFL-personer

Audit gennemført 2026-08-29 for de 2.410 skjulte DFL-personer i PR #1642.

## Metode

- Sammenlign først med det offentlige persondatasæt i
  `public/api/v1/poets.jsonl.gz`.
- Brug derefter de eksisterende `info.xml`-navneformer til kontrol af
  fuldnavn, dåbsnavn, pseudonym og andre dokumenterede alternativer.
- Betragt identisk DFL-id eller autoritets-id som sikkert match.
- Betragt identisk eller kompatibelt navn sammen med identiske fødsels- og
  dødsår som sikkert match.
- Betragt identisk fuldt navn uden konfliktende livsdata som en potentiel
  dublet, der kan flettes efter brugerens beslutning.
- Flet aldrig på efternavn eller et enkelt sammenfaldende år alene.

De konkrete fletningsbeslutninger og deres evidenstype ligger i
`docs/indsamling/dfl/duplicate-merges.json`.

## Resultat

- Undersøgte nye DFL-personer: 2.410
- Flettede DFL-dubletter: 23
- Flyttede tomme DFL-værker: 125
- Resterende skjulte DFL-personer: 2.387
- Fil-id-kollisioner under flytning: 0
- Resterende overlap på DFL-id: 0

Et samlet Wikidata Query Service-opslag på egenskaben P12386 fandt en
Wikidata-post for 814 af de 2.387 resterende DFL-id'er. Sammenligning af deres
Wikidata-, VIAF- og GND-id'er med eksisterende Kalliope-personer gav 0
autoritetsbaserede dubletpar.

## Afvist navnelighed

`dfl-hfrederikhorn` blev ikke flettet med `winkel-horn`. DFL-posten Frederik
Horn har livsdata 1708-1781, mens Frederik Winkel-Horn, født Frederik Horn, har
livsdata 1756-1837. Det identiske navn er derfor ikke identitetsbevis.

## Begrænsninger

Wikidata havde ikke en P12386-relation for 1.573 af de resterende poster.
Fravær af et autoritetsmatch er ikke bevis for, at en dublet ikke findes.
Navnevarianter uden livsdata eller autoritets-id skal derfor fortsat behandles
i manuelle batches. De bevarede poster må ikke flettes automatisk på navn
alene, når der findes datokonflikter eller flere plausible personer.

Det samlede Wikidata-opslag brugte denne forespørgsel mod
`https://query.wikidata.org/sparql`:

```sparql
SELECT ?person ?dflId ?birth ?death ?viaf ?gnd WHERE {
  ?person wdt:P12386 ?dflId.
  OPTIONAL { ?person wdt:P569 ?birth. }
  OPTIONAL { ?person wdt:P570 ?death. }
  OPTIONAL { ?person wdt:P214 ?viaf. }
  OPTIONAL { ?person wdt:P227 ?gnd. }
}
```
