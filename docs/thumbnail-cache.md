# Thumbnail-cache

`build-static` bygger billeder fra `public/images` og `public/kunst` med uændrede
filnavne, URL'er, størrelser og JPEG-indstillinger. Trinnet bruger ikke den globale
filcache til at afgøre, om et billede er færdigt. `--force-reload` ændrer derfor
ikke thumbnail-kontrollen.

## Normal kontrol og fuld integritetskontrol

Normal kontrol genbruger tidligere SHA-256-hashes, når filens identitet og
metadata er uændrede: device, inode, størrelse samt mtime og ctime med
nanosekunders præcision. Der foretages stadig et stat-opslag for hver kilde og
hvert output. Manglende eller ændrede fingeraftryk medfører indholdslæsning;
ukendt device/inode deaktiverer metadata-genbrug. En berørt kilde hashes én gang,
og uændret indhold med ændret mtime medfører ikke genkodning. Samme størrelse og
bevaret mtime er utilstrækkeligt til et cachehit: ctime og filidentitet skal også
være uændrede.

Kontrollen forudsætter, at filsystemet opdaterer ctime/filidentitet ved normale
filskrivninger og erstatninger. Nanosekundsfelter garanterer ikke filsystemets
faktiske tidsopløsning: grov opløsning eller gendannelse af både indhold og
metadata fra et snapshot kan skjule ændringer. Sletninger opdages altid.
Metadata alene kan heller ikke opdage lagerfejl, som ændrer indhold uden at
ændre metadata, eller en manipuleret cache, der indeholder forkerte hashes. Cachefilerne er lokal,
betroet build-tilstand. Efter mistanke om lagerfejl eller ved behov for fuld
kontrol køres:

```shell
node tools/build-static.js --verify-image-thumbnails --timings
```

Alternativt sættes `KALLIOPE_VERIFY_IMAGE_THUMBNAILS=true`; miljøvariablen gælder
også ved direkte kald til `buildThumbnails`, inklusive facsimilebyggeren.
Fuld kontrol læser og hasher alle kilder og output med matchende
genereringsnøgle, uanset metadata, og reparerer manglende og beskadigede output.
Output med forkert genereringsnøgle bliver genkodet direkte. Kontrollen kræver
fortsat troværdige tidligere hashes; fjern cachetilstanden og genbyg fra
verificerede kilder, hvis selve cachen er beskadiget eller utroværdig.

## Tilstand og genoptagelse

- `caches/thumbnails/<outputsti-hash>.json` er det eksisterende checkpoint pr.
  output med genereringsnøgle og indholdshash. Det skrives kun efter et færdigt
  output og bruges også af gamle builds.
- `caches/thumbnail-state/<billedrod-hash>.json` er et versionsmærket manifest
  med verificerede hashes, fingeraftryk og genereringsnøgler. Ét manifest pr.
  billedrod erstatter de mange receipt-læsninger under normal kontrol.
- Manglende, ældre eller ulæseligt manifest falder tilbage til receipts og fuld
  indholdskontrol. Gyldige eksisterende billeder genbruges uden genkodning.
  Manglende eller ulæselige receipts medfører genkodning, når manifestet heller
  ikke dokumenterer outputtet.
- Billeder, receipts og manifester publiceres med atomisk rename af midlertidige
  filer. Et manifest publiceres først, når alle opgaver for roden er færdige.
  Afbrydes bygget før dette, kan nyere receipts dokumentere de allerede færdige
  output, også ved ændret kilde eller generator. Delvise billeder godkendes
  ikke. Dette er genoptagelse efter procesafbrydelse, ikke en fsync-garanti ved
  strømsvigt. Efter SIGKILL kan midlertidige filer blive liggende; de bruges ikke
  som output eller cache.
- Genereringsnøglen inkluderer kildehash, `resize-image.js`, Sharp-versioner,
  bredde og format. Andre ændringer i XML-/HTML-hjælpefunktioner invaliderer
  ikke billederne.

`KALLIOPE_THUMBNAIL_CONCURRENCY` styrer den fælles kodningsgrænse på tværs af
billedrødder (standard 1, Docker Compose bruger 4). Hver rod har højst dette
antal opgaver under behandling eller ventende på grænsen; der oprettes ikke
promises for alle output. Kildelisten og manifestet vokser med antallet af filer,
men billedbuffere og opgavekø gør ikke.

## Målinger

Trinnet logger fremdrift for både kontrollerede og genererede billeder.
Statistik returneres til kalderen og vises af `tools/measure-thumbnails.js`,
men udskrives ikke i det normale build-output. Statistikken indeholder kildeantal, cachehits, genererede
output og reparationer (en delmængde af genererede output med allerede matchende
genereringsnøgle), receipt-/manifestlæsninger, billedhash-læsninger og bytes.
`receiptReads` og `manifestReads` tæller læseforsøg, inklusive manglende filer;
Bytes tæller kun læst indhold. `readBytes` summerer billedhash-, receipt- og
manifestbytes. Generatorens lille kodefil og Sharps native læsninger under
kodning indgår ikke. Tallene angiver
læste payload-bytes, ikke fysiske disklæsninger eller operativsystemets sidecache.

`scanMs` måler scanning og sortering. `checkMs` summerer synkront kontrolarbejde,
`encodeMs` summerer tid omkring kodning, og `checkpointMs` måler publicering af
tilstand. Kodningstider kan overlappe ved parallelitet; brug `elapsedMs` til
samlet vægtid. `maxInFlight` tæller højeste antal igangværende/ventende opgaver
for roden.

Sammenlign på samme maskine med samme billeder og opvarmet thumbnail-cache i
en separat scratch-mappe, som indeholder `public/images` og `public/kunst`:

```shell
KALLIOPE_THUMBNAIL_CONCURRENCY=4 node tools/measure-thumbnails.js /absolut/scratch-mappe
```

Kommandoen bygger thumbnails i scratch-mappen og viser tid, højeste proces-RSS
og målte fil-læsninger. Første kørsel opvarmer eller migrerer cachen; mål mindst
tre efterfølgende kørsler i separate processer. Som valgfrit andet argument kan
man angive stien til det tidligere `helpers.js`-modul. Det skal stadig ligge ved
sine oprindelige afhængigheder. Dermed kan før/efter bruge samme tællere og
identiske billedfiler. Eftermålingen skal have nul genererede output, samme
antal cachehits og uændrede outputchecksums. Serverens mekaniske disk kan give
andre tider end en lokal SSD; sammenlign ikke direkte med en anden maskines
historiske buildtid.
