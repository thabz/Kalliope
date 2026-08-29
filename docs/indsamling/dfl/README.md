# Dansk Forfatterleksikon

Dette er det bevarede DFL-arbejdslag. `authors.json` indeholder de høstede
forfatterobservationer, og `works.json` indeholder titelobservationerne.

DFL’s rå HTML-cache ligger under
`tools/data/indsamling/dfl/raw/`. Manifestet registrerer disse cachekilder, så
de ikke skal hentes eller parses igen, før formatet ændrer sig.

## Hentning

DFL’s hovedliste blev hentet fra
`https://danskforfatterleksikon.dk/1850/sk1850forf.htm`. Titelindexet blev
hentet fra
`https://danskforfatterleksikon.dk/1850/sk1850tit.htm`, og de 29 alfabetiske
titelarkiver blev hentet fra de links, som indexet angiver. Forfatteropslag
blev hentet fra de konkrete links i forfatterlisten og cachet lokalt.

Hentningen er begrænset til de kendte indexer og linkede opslag. Den følger
ikke ukontrolleret links uden for dette afgrænsede sæt. `npm run
candidate-register` genbruger som standard de lokale caches. Brug `npm run
candidate-register -- --fetch` for at hente kilderne igen, eventuelt med
`--all-author-pages` for alle DFL-opslag.

## Begrænsning

DFL’s titelposter er bibliografiske observationer. De er ikke i sig selv en
endelig afgørelse af personidentitet, dansk sprog eller rettighedsstatus.

## Felter og problemer

Forfatterobservationer bruger DFL-id/URL, originalt navn, alternative
navneformer samt fødsels- og dødsdata, når de findes. Titelobservationer bruger
titel, år, litterær type, sprog og forfatterrelationer.

DFL dækker dansk skønlitteratur og dramatik til og med 1975, men en DFL-
forfatterpost er ikke nødvendigvis en verificeret dansk digter. Der kan være
pseudonymer, varianter, placeholders og poster med ufuldstændige datoer.

## Skjulte personposter

Når hele personopslagsauditten er kørt, kan dokumenterede, manglende DFL-
digtere oprettes som skjulte redaktionelle personposter:

```sh
npm run candidate-register -- --fetch --all-author-pages
npm run import-hidden-dfl-poets -- --dry-run
npm run import-hidden-dfl-poets
```

Importen kræver et stabilt DFL-id, bevarer id'et i `info.xml` og udelader
eksisterende Kalliope-match samt opslag, som auditen klassificerer som roller
eller placeholders. En person er kun importegnet, når DFL både dokumenterer
digte og enten placerer personen på listen for dansk originalsprog eller
registrerer personen som oversætter af fremmedsprogede digte i den danske
bibliografi. DFL's sprogfelt er værkets originalsprog; oversættere knyttet til
digte med dansk originalsprog behandles derfor som oversættere ud af dansk og
importeres ikke alene på det grundlag. Udenlandske
originalforfattere, som kun optræder via en dansk oversættelse, udelades. Rene
navnegrupper uden DFL-id importeres ikke, fordi navn alene ikke er
tilstrækkeligt identitetsbevis. De nye poster bruger
`country="un"` og `hidden="true"`, indtil landegrupperingen er verificeret,
og de er redaktionelt beriget og godkendt til offentlig visning.
