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
candidate-register -- --offline --all-author-pages` genbruger de lokale caches.

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
