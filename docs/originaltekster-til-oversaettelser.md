# Originaltekster til oversættelser

Denne vejledning er den autoritative arbejdsgang, når en originaltekst skal
opspores, udvælges, indsættes og forbindes med en oversættelse i Kalliope.
Målet er at dokumentere den konkrete tekstversion, som oversættelsen bygger på
eller med sikkerhed svarer til. Det er ikke tilstrækkeligt at finde samme
abstrakte digtværk.

## Krav til identifikationen

Opret kun en oversættelsesrelation, når originalen kan identificeres sikkert.
Sammenhold som minimum titel eller førstelinje, tekstens omfang, strofe- og
linjestruktur samt karakteristiske formuleringer. Forfatter- og titelmatch alene
er ikke bevis for, at den rette version er fundet.

Hvis den præcise original ikke kan identificeres, bevares eller oprettes den
eksisterende markering med `note/@unknown-original-by`, når originalforfatteren
er kendt. Opret ikke en omtrentlig relation til en beslægtet, ældre eller mere
tilgængelig version.

## Valg af tekstversion og kilde

Vælg i denne rækkefølge:

1. Den trykte udgave eller det konkrete eksemplar, som oversætteren dokumenteret
   har benyttet.
2. Den nærmeste samtidige trykte udgave før oversættelsen, som indeholder samme
   tekstlige form.
3. En troværdig videnskabelig eller institutionel digital udgave, men kun når en
   dokumenteret søgning ikke har fundet en egnet trykt kilde.

Den ældste udgave har ingen automatisk forrang. En senere redaktionel eller
moderniseret tekst må ikke bruges som erstatning, hvis den afviger fra den
version, oversættelsen kan bygge på.

Kontrollér bibliografiske oplysninger mod titelblad, kolofon,
bibliotekskatalog eller en tilsvarende autoritativ kilde. Hvis valget kræver
ekstern søgning, skal PR-beskrivelsen kort angive de undersøgte kataloger og
udgaver, fravalgte kandidater og begrundelsen for den valgte version.

## Repræsentation i korpus

En identificeret trykt publikation oprettes normalt som et selvstændigt
Kalliope-værk hos originalforfatteren. Medtag kun de transskriberede tekster og
sæt værket til `status="incomplete"`, hvis publikationen ikke er indført
komplet. Brug `$add-kalliope-work` til selve værkindsættelsen og desuden
`$pdf-to-kalliope`, hvis en komplet scannet PDF skal transskriberes.

Forbind oversættelsen med den konkrete originaltekst gennem den gældende
oversættelsesrelation, normalt en `<xref type="translation" poem="..."/>` i en
note. Relationens mål skal være tekst-id'et for den valgte tekstforekomst, ikke
blot forfatteren eller et vilkårligt tryk af samme digt.

Eksisterende relationer migreres ikke automatisk. Ret dem kun, når opgaven og
kildegrundlaget giver belæg for en mere præcis relation.

## Kildeangivelse

En trykt kilde citeres i rækkefølgen:

> Forfatter: *Titel*, redaktør og bind når relevant, forlag, udgivelsessted, år.

Brug den trykte publikations titelblad og kolofon som grundlag. Sidetal angives
i `source/@pages`; et stabilt link til en digitalisering angives i
`source/@href`. Titlen må ikke omsluttes af et eksternt `<a>`-element. Rendereren
viser selv den lille klikbare linkpil fra `href`.

For et almindeligt publikationsværk står den fulde bibliografiske kilde i
`<workhead>`, mens hvert digt peger på kilden og angiver sider:

```xml
<workhead>
  <title>Publikationens titel</title>
  <year>1850</year>
  <source href="https://example.org/stabil-digitalisering">
    Forfatter: <i>Publikationens titel</i>, Udgiver, Forlag, By, 1850.
  </source>
</workhead>
...
<source pages="12-13"/>
```

I `andre.xml` må der ikke stå en kilde i `<workhead>`. Den fulde kilde skal stå
direkte i hvert berørt digts `<head>`, også når flere digte bruger samme kilde:

```xml
<source href="https://example.org/stabil-digitalisering" pages="226-228">
  Forfatter: <i>Publikationens titel</i>, Udgiver, Forlag, By, 1850.
</source>
```

Interne Kalliope-links som `<a poet="...">` må fortsat bruges i en
kildeangivelse. Et `<source>` må derimod ikke indeholde `<a href="...">`; det
eksterne link skal ligge i `source/@href`.

Brug `<source>` til kildeproveniens. En `<note>` må ikke bruges som erstatning
med formuleringen »Teksten følger ...«. Bevar kun selvstændige tekstkritiske
eller historiske oplysninger som noter.

## Kontrol før aflevering

Kontrollér før review og PR, at:

- tekst og version er sikkert identificeret mod den valgte kilde;
- den valgte trykte udgave følger prioriteringen ovenfor;
- den fulde citation og sidetallene er kontrolleret;
- `andre.xml` har kilden på hvert digt og ikke i `<workhead>`;
- eksterne kildelinks alene bruger `source/@href`;
- oversættelsesrelationen peger på den konkrete originaltekst;
- den oprindelige ortografi, tegnsætning, versdeling og strofestruktur er
  bevaret;
- hele repositoryets testpakke består.
