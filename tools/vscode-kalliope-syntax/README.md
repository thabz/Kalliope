# Kalliope-extension til VS Code

Extensionen giver syntaksfremhævning til Kalliopes `old2kalliope`-filer og kan
vise facsimilesider ved siden af et værk-XML, mens teksten redigeres.

Syntaksen vælges automatisk for `.txt`-filer, hvis første linje begynder med
`KILDE:`. Facsimilevisningen bruges i værkfiler under
`fdirs/<digter>/<værk>.xml`.

## Installation

Kør installationsscriptet fra roden af Kalliope-repositoriet:

```sh
tools/install-vscode-kalliope-syntax.sh
```

Scriptet opretter et symbolsk link fra VS Codes extension-mappe til
workspace-versionen:

```text
~/.vscode/extensions/thabz.kalliope-syntax
  -> tools/vscode-kalliope-syntax
```

Genstart derefter VS Code. Man kan også vælge `Developer: Reload Window` i
kommandopaletten. Åbn hele Kalliope-repositoriet som workspace, så extensionen
kan finde den lokale `facsimiles`-mappe og bruge indstillingerne i
`.vscode/settings.json`.

Installationsscriptet skal normalt kun køres én gang pr. maskine. Fordi
installationen er et symbolsk link, bliver ændringer i extensionens kildekode
tilgængelige efter `Developer: Reload Window`; den skal ikke geninstalleres.

## Vis en facsimile

1. Åbn en værkfil under `fdirs/<digter>/<værk>.xml`.
2. Placér cursoren inde i det ønskede `<text>`- eller `<prose>`-element.
3. Åbn kommandopaletten med `⇧⌘P` på macOS eller `Ctrl+Shift+P` på Linux og
   Windows.
4. Vælg `Kalliope: Vis facsimile for aktuelt digt`.

Facsimilen åbnes i et panel ved siden af XML-editoren. Når panelet er åbent,
opdateres det automatisk, når cursoren flyttes til en anden tekst. Panelet kan
lukkes som en almindelig editorfane.

Extensionen finder siderne ud fra tekstens `<head><source>` og værkets
`<workhead><source>`. Normalt beregnes facsimilesiden fra `pages` og
`facsimile-pages-offset`. En eksplicit `facsimile-pages`-attribut bruges, når
tryksidens nummer ikke kan beregnes direkte, eksempelvis ved romertal.

## Lokale og eksterne billeder

Extensionen leder først efter lokale billeder i denne struktur:

```text
facsimiles/<digter>/<facsimile-id>/000.jpg
facsimiles/<digter>/<facsimile-id>/001.jpg
...
```

Hvis en lokal side ikke findes, forsøger extensionen som standard at hente den
fra `https://kalliope.org/static/facsimiles`.

Følgende indstillinger kan ændres i VS Codes settings:

- `kalliope.facsimiles.localRoot`: Lokal rodmappe; standard er `facsimiles` i
  workspace-roden.
- `kalliope.facsimiles.remoteBaseUrl`: Basis-URL til eksterne facsimiler.
- `kalliope.facsimiles.autoUpdate`: Om panelet automatisk følger cursoren;
  standard er `true`.

## Fejlfinding

Hvis kommandoen ikke findes, så kontrollér, at installationsscriptet er kørt,
og genindlæs VS Code med `Developer: Reload Window`.

Hvis panelet viser en forklaring i stedet for et billede, så kontrollér:

- at filen ligger under `fdirs/<digter>/`;
- at cursoren står i et `<text>`- eller `<prose>`-element;
- at teksten har et `<head><source>`;
- at værkets source har `facsimile` og om nødvendigt
  `facsimile-pages-offset`;
- at `pages` eller `facsimile-pages` indeholder et gyldigt numerisk sidetal.

## Syntaksfarver

Kalliope-workspacet indeholder `.vscode/settings.json` med tokenfarver til
`old2kalliope`-grammatikken. Teksthovedkommandoer som `T:`, `F:` og
tekstniveauets `DIGTER:` bruger scopet `keyword.other.header.text.kalliope`,
mens værkhovedkommandoer bruger `keyword.other.header.work.kalliope`.
`DIGTER:` umiddelbart under `SEKTION:` bruger det særskilte scope
`keyword.other.header.section.kalliope`.

VS Code indlæser ikke vilkårlige extensions direkte fra en workspace-mappe.
Derfor er installationsscriptet nødvendigt, selv om extensionens kildekode
ligger i repositoriet.
