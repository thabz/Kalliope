# Dansk Forfatterleksikon

Dansk Forfatterleksikon er grundstammen i Kalliopes interne liste over digtere
og værker, som kan plukkes ind i korpusset senere. Listen ligger i to kompakte,
versionsstyrede filer:

- `tools/data/indsamling/register/kommende-digtere.jsonl`
- `tools/data/indsamling/register/kommende-vaerker.jsonl`

Hver linje er et selvstændigt JSON-objekt. Person- og værk-id'er er
kildeneutrale; DFL-id og URL bevares under `identifiers` og `sources`.
Livsdata og autoritets-id'er fra Lex, GND, VIAF og Wikidata bevares på
personposten med feltprovenance og eventuelle konflikter.

DFL's rå HTML-cache ligger lokalt under
`tools/data/indsamling/dfl/raw/`, så en normal synkronisering kan køres helt
offline.

## Hentning og synkronisering

DFL's hovedliste hentes fra
`https://danskforfatterleksikon.dk/1850/sk1850forf.htm`. Titelindekset hentes
fra `https://danskforfatterleksikon.dk/1850/sk1850titel.htm`, og de
alfabetiske titelarkiver hentes fra dets links. Forfatteropslag hentes for de
personer, som de udvalgte digtposter henviser til.

Hentningen er afgrænset til disse indekser, titelarkiver og forfatteropslag.
Den følger ikke ukontrolleret links.

```sh
npm run sync-upcoming-poets
npm run sync-upcoming-poets -- --fetch
```

Den første kommando bruger kun cachen. `--fetch` opdaterer DFL-cachen først.
En fejl i et enkelt opslag afbryder ikke kørslen, og den tidligere cache
bevares. Registerfilerne skrives atomisk og deterministisk.

Synkroniseringen fletter nye DFL-oplysninger ind efter bedste evne. Den
overskriver ikke eksisterende, ikke-tomme værdier og sletter aldrig automatisk
personer eller værker. Redaktionelle felter og kildemæssig berigelse i JSONL-
filerne er derfor sikre ved senere kørsler. Ændringer gennemgås med `git diff`.

## Begrænsning

DFL's titelposter er bibliografiske observationer. De er ikke i sig selv en
endelig afgørelse af personidentitet, dansk sprog eller rettighedsstatus.

Personposterne bruger foretrukket navn, alternative navneformer, livsdata,
autoritets-id'er, kilder og relationer til værkposterne. Værkposterne bruger
titel, år, type, sprog, kilder og relationer til en eller flere personer.

DFL dækker dansk skønlitteratur og dramatik til og med 1975, men en DFL-
forfatterpost er ikke nødvendigvis en verificeret dansk digter. Der kan være
pseudonymer, varianter, placeholders og poster med ufuldstændige datoer.
