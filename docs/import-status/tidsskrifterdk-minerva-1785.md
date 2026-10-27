# Minerva 1785: import standset ved manglende septemberomslag

Opgaven omfatter digtene i de første tre hæfter af *Minerva*, juli, august
og september 1785, samt oprettelse af tidsskriftet under `tidsskrifterdk`.
Importen er standset før transskription og XML-oprettelse: det fundne
facsimile mangler septemberhæftets omslag, som indeholdt to digte.

## Kilder

- *Minerva, et Maanedskrift. Første Bind*. Kiøbenhavn, trykt hos Johan
  Frederik Schultz, 1785. [KB's katalogpost](https://soeg.kb.dk/permalink/45KBDK_KGL/1pioq0f/alma99122755202305763)
  beskriver tidsskriftet fra første hæfte, juli 1785. De undersøgte
  KB-poster gav ikke adgang til en digitalisering af dette bind.
- Brugeren har godkendt en verificeret skanning af samme tryk fra en anden
  samling. University of Michigans eksemplar findes hos
  [HathiTrust, mdp.39015065142955](https://babel.hathitrust.org/cgi/pt?id=mdp.39015065142955)
  og [Google Books, h143AAAAMAAJ](https://books.google.dk/books?id=h143AAAAMAAJ).
  Titelbladet er visuelt verificeret; katalogtitlen *Maanedskriftet Ny
  Minerva* må ikke erstatte den trykte titel *Minerva*.
- Den hentede Google-PDF har 361 sider. HathiTrust har 360 billeder af samme
  eksemplar; Google-PDF'en har en ekstra indledende informationsside.
  Google-PDF-side 6 svarer således til HathiTrust-sekvens 5, titelbladet.
  PDF'ens SHA-256 er
  `4cfbd76cea0322e433a08eac12f1c9ace9b0a9267e952bd0fa66b406da4c12a2`.
- Rasmus Nyerup: *Almindeligt Register over Maanedsskriftet Minerva fra
  dets Begyndelse med Julii Maaned 1785 til det 18de Aarhundredes Udgang*.
  Kjøbenhavn, Johan Frederik Schultz, 1801.
  [KB's digitalisering](https://www.kb.dk/e-mat/dod/130020877678.pdf).

## Den dokumenterede mangel

Nyerups opslag »Baggesen, Jens« begynder på trykt side 13 (PDF-side 28).
Efter henvisninger til 1785, senest *Constance* i september, fortsætter
opslaget øverst på trykt side 14 (PDF-side 29):

> To Epigrammer om Ballings Aarstider paa Omslaget af September-Hæftet.

Begge registersider er kontrolleret direkte som billeder. De to epigrammer
er dermed en del af opgavens omfang. Deres titler og ordlyd er ikke
fastlagt ud fra primærtrykket.

Hele bindets 361 PDF-sider er gennemset på kontaktark, også i en uafhængig
kontrol. Ingen oprindelige hæfteomslag er bevaret i skanningen. PDF-side
233 viser augusts trykte side 116, hvorefter PDF-side 234 begynder
septemberhæftet. Bindets slutning består af indholdsfortegnelse,
subskribentliste, blanke blade, forsats og bagbind; septemberomslaget
findes heller ikke dér.

De manglende omslagssider er unummererede. Der kan derfor ikke angives et
manglende trykt sideinterval eller et eksisterende facsimilefilnavn for
dem. De tilstødende tekstsider er lokalt gengivet som `232.jpg` og
`233.jpg` i det genererede Google-facsimile (nulbaserede filnavne).

Julihæftets tilsyneladende spring fra trykt side 2 til 5 er særskilt
undersøgt. Ordfortsættelse og kustoder viser sammenhængende tekst; dette
spring er ikke dokumentation for et kildehul.

## Arbejde udført før standsningen

- Kildeeftersøgning hos KB og kontrol af det alternative eksemplars tryk.
  Søgninger hos HathiTrust, Google Books, Internet Archive og
  Nasjonalbiblioteket gav ikke et andet verificeret facsimile med omslaget.
  Det udelukker ikke, at et sådant eksemplar findes.
- Foreløbig lokalisering af 21 digtposter i hæfternes hovedtekst, inklusive
  de to bidrag med overskriften *Brevvexling*, som er på vers. Dette er
  ikke en afsluttet tekst- eller strukturkontrol. De to omslagsepigrammer
  kommer derudover.
- Et trykt rettelsesafsnit er fundet på augusts side 116 (PDF-side 233).
  Rettelserne skal genkontrolleres og indføres ved en senere import.
- 100 foreløbigt udvalgte digtsider blev gengivet ved 300 DPI til
  OCR-forberedelse. Forberedelseskørslen fejlede ved spejder-OCR og gav
  ikke et færdigt valideret OCR-bundle. Udvalget var foreløbigt; sidste
  side af *Klokkeren*, august side 83, skal også medtages ved genoptagelse.
- Titelbladet blev udtrukket og en oprettet/beskåret kandidat bestod
  titelblads-skillens billed-QA. Kandidaten er kun en lokal arbejdsfil.
- Alle 361 facsimilebilleder blev genereret lokalt. De er ikke publiceret.

Der er ikke skrevet digttransskriptioner, oprettet Minerva-værker eller
tilføjet korrekturmarkeringer. Ingen OCR-, PDF- eller billedarbejdsfiler
indgår i ændringen. OCR, transskription og korrektur er standset efter
fundet, som krævet i `pdf-to-kalliope`-skillens regel om manglende
facsimilesider.

## Genoptagelse

Der behøves læselige billeder af septemberhæftets oprindelige omslag fra
samme tryk, inklusive alle sider med de to epigrammer. Et andet eksemplar
kan supplere omslaget, når hæfte og tryk er verificeret. Senere
Baggesen-udgaver eller eksisterende transskriptioner kan ikke udfylde
kildehullet.

Derefter skal inventaret afsluttes, frisk OCR produceres og alle digte
transskriberes og korrekturlæses mod de relevante sider. Tidsskrift og
hæfter skal oprettes, forfattere og relationer kontrolleres, rettelsesarket
behandles, og normale metadata-, titelblads-, facsimile- og slutkontroller
gennemføres. Importen er fortsat ufuldstændig.

Lokalt arbejdsmateriale ligger i `/tmp/minerva-1785/`: kilde-PDF,
`pdf-preview/`, `publication-inventory.jsonl`, register-PDF og billederne
`register-reference-028.jpg` og `register-reference-029.jpg`.
Arbejdsfilerne er ikke permanente kilder og er ikke en del af PR'en.
