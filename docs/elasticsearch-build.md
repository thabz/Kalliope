# Elasticsearch i static-build

Indekseringen har sin egen tilstand i `caches/elasticsearch/`, adskilt fra
`files-sha.json` og tekstbyggerens checkpoints. Derfor kan et gemt tekstbuild
ikke få en efterfølgende kørsel til at overse søgeændringer efter en afbrudt
eller utilgængelig Elasticsearch-opdatering.

## Løbende dokumentopbygning

`elastic-documents.js` producerer ét søgedokument ad gangen. Den eksisterende
array-hjælper bevares til afgrænsede kald, men produktion bruger iteratoren.
Også et enkelt stort værk opdeles løbende. Digter- og nøgleordsdokumenter
produceres tilsvarende løbende.

`elastic-stream.js` afsender en bulk ved enten antal- eller bytegrænsen og
venter på plads, inden flere dokumenter produceres. Konfiguration:

| Miljøvariabel | Standard | Betydning |
| --- | ---: | --- |
| `KALLIOPE_ELASTICSEARCH_BULK_SIZE` | 500 | Maksimalt antal dokumenter pr. bulk |
| `KALLIOPE_ELASTICSEARCH_BULK_BYTES` | 8.388.608 | Maksimal NDJSON-payload pr. bulk, inklusive actionlinjer og linjeskift |
| `KALLIOPE_ELASTICSEARCH_CONCURRENCY` | 1 | Maksimalt antal samtidige bulk requests |

Et enkelt dokument over bytegrænsen afvises med id, størrelse og vejledning om
at øge grænsen. Dokumentet opdeles ikke, fordi det ville ændre søgekontrakten.
Der beholdes højst `concurrency × bulkSize + 1` dokumentobjekter: aktive bulks,
den aktuelle buffer og højst ét dokument som byte-lookahead. Byteforbruget for
disse objekters serialiserede payload er højst
`concurrency × bulkBytes + største dokument`, mens JSON-strenge til aktive
HTTP-requests og klientens svar kommer oveni. Der oprettes ikke et samlet
korpusarray eller et array med alle chunks.

For virtuelle antologier grupperes tekstmetadata efter kildefil **inden for
hver forfatters virtuelle værk**. En kilde parses én gang pr. gruppe, og
tekst-id'er slås op i gruppens DOM. Når gruppen er færdig, frigives referencerne
til DOM-træet. Samme publikation kan fortsat parses for flere forskellige
forfattere samt for sit fysiske værk. Der er ingen global DOM-cache.

XML-parseren materialiserer fortsat ét helt kildedokument. Hukommelsesforbruget
omfatter derfor det største DOM-træ, eksisterende `collected`-metadata og
snapshotdata ud over de begrænsede bulkbuffere. Indekseringen er ikke en
SAX-parser og lover ikke konstant hukommelse uafhængigt af største kildefil.

## Inkrementel tilstand og genoptagelse

Checkpointets filnavn afhænger af Elasticsearch-URL og indeksnavn. Tilstanden
har en versionsmærket formatfingerprint, fælles nøgleordsmetadata, digter- og
værksignaturer, teksternes ejerskab og tidligere kildehashes.

Kildehashes genbruges kun ved uændret device, inode, størrelse, mtime og ctime
med nanosekundsfelter. Manglende filer, nye filer og ændrede eller usikre
fingeraftryk genlæses. Metadata-genbrug forudsætter filsystemets normale
opdatering af ctime/identitet; grov tidsopløsning, lagerfejl uden metadataændring
og snapshotgendannelse kan skjule ændringer. `--force-reload` eller
`KALLIOPE_ELASTICSEARCH_FORCE_REBUILD=true` genopbygger altid indekset fra XML.

En fuld genopbygning logges med en eller flere årsager:

- Eksplicit force-reload, force-rebuild eller udvalgte digtere.
- Ændret digterudvalg, manglende indeks eller manglende/ugyldigt checkpoint.
- En tidligere opdatering er markeret ufærdig.
- Ændret indeksformat, mapping eller dokumentafhængigheder.
- Ændrede fælles nøgleordsmetadata, inklusive sletninger og omdirigeringer.

Formatversionen, xmldom-versionen og mapping-funktionen indgår sammen med `elastic-documents.js`,
`xml.js`, `anthologies.js`, `work-cache.js`, `keyword-taxonomy.js`, `helpers.js`
og `bible-abbr.js`. Afhængighederne omfatter dokumentudtræk, tekstnormalisering,
relationer og nøgleordsfortolkning. `helpers.js` er en konservativ afhængighed:
også en uvedkommende ændring dér kan udløse en genopbygning. Transport-,
batching- og logændringer i `elastic.js`/`elastic-stream.js` og ændringer af
request-timeouts udløser ikke i sig selv en genopbygning. Ved nye semantiske
afhængigheder skal listen eller formatversionen opdateres.

Andre ændringer behandles inkrementelt: ændret digtermetadata erstatter
vedkommendes dokumenter; berørte værker erstattes; forsvundne værker og digtere
slettes eksplicit. Tekst-id'er og antologiernes `index_entry` bevares. Ændret
tekstejerskab indgår i værksignaturerne, også når selve XML-filen er uændret.

Før første ændring i indekset skrives et atomisk checkpoint med `pending=true`.
Tilstanden bliver først ajour efter alle sletninger, alle bulks og refresh.
Et afbrudt build eller en delvis fejl medfører fuld genopbygning ved næste
kørsel. Det er bevidst konservativt: en fejl kan koste en ekstra fuld
indeksering, men efterlader ikke en delvis opdatering markeret som færdig.
En utilgængelig server før første skrivning bevarer det gamle checkpoint og
springes normalt over; med `skipUnavailable=false` fejler kaldet i stedet.

Bulkfejl, delvise delete-fejl, versionskonflikter og refresh med fejlede shards
afvises. Aktive requests afsluttes, før en fejl returneres. Checkpoints skrives
med atomisk rename; der er ingen fsync-garanti ved strømsvigt. Tilstanden
forudsætter én skriver pr. indeks og en betroet lokal cache.

## Statistik og sammenlignelige målinger

Loggen viser opbygning for hver 500 dokumenter og afsendelse efter hver bulk.
Slutstatistikken indeholder valgte værker, unikke parsekilder, antal DOM-loads,
dokumenter, NDJSON-bytes, requests, maksimale buffere samt tider for snapshot,
dokumentopbygning og afsendelse. DOM-loads tæller også et forsøg på at indlæse
en manglende kilde; måleværktøjets parserinstrumentering tæller vellykkede
DOM-parsninger af `<kalliopework>`.

`buildMs` summerer tid i iteratoren, og `sendMs` summerer tid omkring
bulk-klientkald. Parallel afsendelse kan overlappe; brug `elapsedMs` til
samlet vægtid. Heap, RSS og Linux-cgroupens aktuelle hukommelsesforbrug samples
ved start/slut, hver 500 dokumenter og ved afsluttede requests. Samplede
maksima er ikke garanterede absolutte peaks. Cgroup-feltet er `null`, når
platformen ikke tilbyder det; det omfatter hele cgroupen. Måleværktøjet viser
desuden processens faktiske højeste RSS fra `process.resourceUsage()`.

Forbered én sammenhængende `collected`-cache fra samme checkout:

```shell
KALLIOPE_SKIP_ELASTICSEARCH=true KALLIOPE_SKIP_IMAGE_THUMBNAILS=true node tools/build-static.js
```

Mål i separate processer med samme cache og konfiguration:

```shell
KALLIOPE_ELASTICSEARCH_CONCURRENCY=1 node tools/measure-elasticsearch.js --live --index kalliope-benchmark-lokal
```

`--live` sletter/genopretter kun det udtrykkeligt valgte indeks under det
reserverede `kalliope-benchmark-`-præfiks. Uden `--live` bruges en drænet modtager,
som måler opbygning, serialisering og backpressure uden Elasticsearch-I/O.
Disse to måleformer bruger adskilte checkpoints. `--module FIL` kan vælge den
tidligere `elastic.js`, gemt ved siden af sine oprindelige afhængigheder;
`--cache-dir MAPPE` vælger et andet konsistent cachegrundlag.

Opvarm begge versioner først, og gentag derefter mindst tre gange skiftevis
før/efter uden andre builds/tests kørende. Begge versioner genopretter samme
benchmark-indeks ved fuld måling. Sammenlign dokumentantal, payloadbytes og
SHA-256 over sorterede dokument-id'er og deres JSON-indhold. `--incremental`
tester derefter en uændret kørsel. Eksisterende søgeregressioner kontrollerer
desuden rigtige søgeresultater mod Elasticsearch.

En lokal måling kan ikke omsættes direkte til serverens historiske 217 sekunder
eller dens samlede cgroup-peak på 3,37 GiB. Sammenlign på samme maskine og
adskil hele static-buildets hukommelse fra selve indeksmålingen.
