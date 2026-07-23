# Kalliopes portraits.xml-format

Dette er et internt overblik over `fdirs/<id>/portraits.xml`.
Filen beskriver portrætter, som vises på biografisider og bruges til kvadratiske social
portraits. Portrætter kan også genbruges fra andre XML-filer via `portrait="digter/pN"`.

Se også `docs/style-guide.md` for de generelle regler om billedplacering og GitHub-sprog.

## Grundstruktur

```xml
<?xml version="1.0" encoding="UTF-8"?>
<pictures>
  <picture src="p3.jpg" primary="true" square-src="p3-square.jpg" year="1822">
    Heinrich Christoph Kolbe: <i>Goethe</i>, 1822, olie på lærred.
  </picture>
  <picture artwork="thorvaldsen/1836-schiller"/>
</pictures>
```

Roden er altid `<pictures>`, og hvert portræt er et `<picture>`.

Buildet kræver:

- mindst ét `<picture primary="true">`
- højst ét primært portræt
- mindst ét portræt med `square-src`, fordi der skal kunne laves social portrait

## Lokale portrætter

Den mest almindelige form er et lokalt billede i `public/images/<id>/`:

```xml
<picture src="p1.jpg" primary="true" square-src="p1-square.jpg" year="1793">
  Ludovike Simanowiz (1759-1827): <i>Friedrich Schiller</i>, mellem 1793 og 1794.
</picture>
```

Attributter:

- `src`: filnavn under `public/images/<id>/`.
- `primary="true"`: markerer portrættet som det primære på biografisiden.
- `square-src`: kvadratisk fil under `public/images/<id>/`, brugt til social portrait.
- `year`: år eller årinterval for billedet.
- `museum`: museums-id fra `content/museums.xml`.
- `objid`, `invnr`, `wikidata`: bruges til remote museum-link.
- `clip-path`: CSS clip-path til beskæring.

`src`-billedet skal være en billedfil, typisk `.jpg`, og thumbnails genereres under
`public/images/<id>/t/`.

## Artwork-portrætter

Et portræt kan pege på et artwork i stedet for at gentage billedmetadata:

```xml
<picture artwork="kroyer/1900-brandes-1" />
```

`artwork` har formen:

- `<kunstner-id>/<picture-id>` for `fdirs/<kunstner-id>/artwork.xml`
- `kunst/<picture-id>` for globale billeder i `content/artwork.xml`

Når `artwork` bruges, hentes billedsti, billedtekst, museum, note og kunstnerdata fra
artwork-posten.

Det er især nyttigt når samme billede både skal være kunstværk og portræt.

## Portrait-reference

Efter picture-reference-mekanismen kan andre XML-filer referere til et portræt:

```xml
<picture portrait="hugo/p3" />
```

Dette peger på et lokalt portræt i `fdirs/hugo/portraits.xml`.

Praktisk form:

- `portrait="digter/p1"` peger på `src="p1.jpg"`.
- `portrait="digter/p3"` peger på `src="p3.jpg"`.

Portrætter, som selv er `artwork`, registreres ikke som lokale portrait keys på samme måde.
Brug i så fald hellere den samme `artwork="..."` direkte.

## Billedtekst og noter

Den enkle form er tekst direkte i `<picture>`:

```xml
<picture src="p2.jpg">
  Nadar: <i>Victor Hugo</i>, fotografi.
</picture>
```

Hvis billedtekst og note skal adskilles, kan man bruge:

```xml
<picture src="p1.jpg">
  <description>
    Kunstner: <i>Titel</i>, år.
  </description>
  <picture-note>
    Ekstra bemærkning om billedet.
  </picture-note>
</picture>
```

Indholdet køres gennem samme inline XML-rendering som andre billedtekster, så fx `<i>`,
`<a poet="...">` og lignende kan bruges.

## Museumsdata

Lokale portrætter kan få eksternt museumslink via attributter:

```xml
<picture src="p1.jpg"
         museum="npg"
         objid="1234"
         invnr="NPG 1234"
         year="1880">
  Billedtekst.
</picture>
```

Typiske attributter:

- `museum`: id fra `content/museums.xml`.
- `objid`: objekt-id hos museet.
- `invnr`: inventarnummer.
- `wikidata`: Wikidata-id.

Remote URL bygges i `tools/build-static/museums.js`.

## Square portraits

`square-src` bruges til at skabe:

```text
public/images/<id>/social/<id>.jpg
```

Regler:

- Hvis `portraits.xml` findes, skal mindst et billede have `square-src`.
- Det første fundne `square-src` bruges.
- `square-src` er normalt en manuelt beskåret kvadratisk fil, fx `p1-square.jpg`.

Eksempel:

```xml
<picture src="p1.jpg" primary="true" square-src="p1-square.jpg">
  ...
</picture>
```

## Primary

Der må kun være ét primært portræt:

```xml
<picture src="p1.jpg" primary="true" square-src="p1-square.jpg">...</picture>
```

`primary` påvirker rækkefølge/visning på biografisiden. Hvis ingen eller flere har
`primary="true"`, fejler buildet.

## Registrering i collected.artwork

Lokale portrætter fra `portraits.xml` registreres også i `collected.artwork` med nøgler som:

```text
portrait/<id>/p1.jpg
```

Portrait-referencer accepterer både `portrait/<id>/p1` og `portrait/<id>/p1.jpg` internt,
så XML kan skrive:

```xml
<picture portrait="spenser/p1" />
```

## Kendte faldgruber

- `primary="true"` skal findes præcis én gang.
- Mindst ét billede skal have `square-src`.
- `artwork="..."` skal pege på et kendt artwork-id.
- Lokale `src`-billeder skal ligge i `public/images/<id>/`.
- `square-src` skal også ligge i `public/images/<id>/`.
- `museum` skal være et kendt museums-id for at give meningsfuldt link.
- Ukendte attributter på `<picture>` er build-fejl. Brug fx `museum`, `invnr` og
  `year`; gamle stavefejl som `musem`, `invbr` og `yaer` må ikke genindføres.

## Nyttige eksempler

- `fdirs/goethe/portraits.xml`: flere lokale portrætter og square portrait.
- `fdirs/brandes/portraits.xml`: blanding af lokale portrætter og artwork.
- `fdirs/steffens/portraits.xml`: portræt udelukkende via artwork.
- `fdirs/hugo/portraits.xml`: lokalt portræt, som også genbruges fra keyword-data.
- `fdirs/luther/portraits.xml`: Cranach-billede via `kunst/cranach-luther`.
