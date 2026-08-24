# Poetisk formanalyse

Mappen samler Kalliopes reproducerbare analyser af digtes struktur, rim,
metrik, stavelsestal og poetiske form. Den normale, skrivebeskyttede indgang er:

```sh
npm run poetic-form -- <digt-id>
```

Kommandoen finder digtet og viser alle delanalyser samt den samlede
formklassifikation. Den ændrer ikke XML.

## Underliggende værktøjer

Værktøjerne nedenfor har med vilje ikke selvstændige scripts i `package.json`.
De køres direkte med Node, når analyser skal skrives, undersøges eller trænes.

### Struktur

```sh
node tools/poetic-form/analyse-structure.js --dry-run
node tools/poetic-form/analyse-structure.js --work oehlenschlaeger/1803.xml --debug
node tools/poetic-form/analyse-structure.js --only-missing
```

Understøttede valg: `--work`, `--debug`, `--dry-run` og `--only-missing`.

### Rim

```sh
node tools/poetic-form/analyse-rhyme.js --dry-run
node tools/poetic-form/analyse-rhyme.js --poet oehlenschlaeger --debug
node tools/poetic-form/analyse-rhyme.js --work oehlenschlaeger/1803.xml --min-confidence 0.80
```

Understøttede valg: `--poet`, `--work`, `--min-confidence`, `--debug`,
`--dry-run`, `--only-missing` og `--refresh`. `--poet` og `--work` kan ikke
bruges samtidig. `--refresh` erstatter en eksisterende automatisk rimanalyse.

### Metrik

```sh
node tools/poetic-form/analyse-metre.js --dry-run
node tools/poetic-form/analyse-metre.js --poet oehlenschlaeger --debug
node tools/poetic-form/analyse-metre.js --work oehlenschlaeger/1803.xml --min-confidence 0.80
```

Understøttede valg: `--poet`, `--work`, `--min-confidence`, `--debug`,
`--dry-run` og `--only-missing`. Eksisterende `<metre>` overskrives ikke.

### Stavelsestal

```sh
node tools/poetic-form/analyse-syllables.js --dry-run
node tools/poetic-form/analyse-syllables.js --poet oehlenschlaeger --debug
node tools/poetic-form/analyse-syllables.js --work oehlenschlaeger/1803.xml --min-confidence 0.80
```

Understøttede valg: `--poet`, `--work`, `--min-confidence`, `--debug`,
`--dry-run` og `--only-missing`. Eksisterende `<syllables>` overskrives ikke.

### Poetisk form

```sh
node tools/poetic-form/analyse-form.js --dry-run --debug
node tools/poetic-form/analyse-form.js --form ottava-rima --min-confidence 0.80
node tools/poetic-form/analyse-form.js --find blank-verse
node tools/poetic-form/analyse-form.js --only-missing
```

Understøttede valg: `--poet`, `--work`, `--form`, `--find`,
`--min-confidence`, `--debug`, `--dry-run` og `--only-missing`. Uden `--form`
gemmes alle sikre former. `--find` er altid skrivebeskyttet. Eksisterende
`<form>` overskrives ikke.

De understøttede former er `sonnet`, `terza-rima`, `ottava-rima`,
`rime-royal`, `ballad-stanza`, `distich`, `quatrain`, `blank-verse` og
`knittelvers`. Sonetter kan desuden få undertyperne `petrarchan-sonnet` og
`shakespearean-sonnet`.

### Træning og evaluering af rimmodellen

```sh
node tools/poetic-form/train-rhyme-model.js
node tools/poetic-form/evaluate-rhyme.js --from-year=1881 --to-year=1920
node tools/poetic-form/evaluate-rhyme.js --bootstrap
```

Evalueringen understøtter `--from-year`, `--to-year`, `--min-stanzas` og
`--bootstrap`. Træningen skriver den komprimerede model til
`data/rhyme/corpus-model.json.gz` i denne mappe. Modellens korpusvalg og metode
er beskrevet i [data/rhyme/README.md](data/rhyme/README.md).

## Filer

- `poetic-form.js` er den offentlige, samlede rapportkommando.
- `analyse-*.js` er CLI-værktøjer, som læser eller opdaterer værk-XML.
- `*-analysis.js` indeholder de rene analysefunktioner.
- `rhyme-corpus.js`, `rhyme-model.js`, `train-rhyme-model.js` og
  `evaluate-rhyme.js` vedligeholder den korpuslærte rimmodel.
- `data/rhyme/` indeholder modeldata og modelspecifik dokumentation.
