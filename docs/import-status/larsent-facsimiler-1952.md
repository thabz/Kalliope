# Thøger Larsens facsimiler: status for #1952

Kontrolleret 15. oktober 2026. Arbejdet er en delvis løsning af
[#1952](https://github.com/thabz/Kalliope/issues/1952); de manglende
scanninger og korrekturgennemgange er fortsat udestående.

## Udgaverne fra 1895–1914

De seks eksisterende værkkilder er struktureret med forfatter, titel,
udgivelsessted, forlag, originalår og KB's digitale Alma-id. *Vilde Roser*
bevarer titelbladets pseudonym Thøger Underbjerg, knyttet til `larsent`.
*Jord* bevarer titelbladets stavemåde Christian Sönderby's Boghandel.
*Det Fjerne* er rettet fra 1905 til titelbladets MDCCCCVII, 1907.

| XML | Digital KB-post | Facsimile-id | Billedantal før → efter | Offset | Titelblad | Første tekstside → billede |
| --- | --- | --- | --- | --- | --- | --- |
| `1895.xml` | [99122436780605763](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122436780605763) | `115408012025_color` | 84 → 82 | 10 | `006.jpg` | 1 → `010.jpg` |
| `1904.xml` | [99122436594205763](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122436594205763) | `115308074941_color` | 82 → 80 | 8 | `008.jpg` | 5 → `012.jpg` |
| `1905.xml` | [99122436855805763](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122436855805763) | `115308074956_color` | 76 → 74 | 6 | `008.jpg` | 5 → `010.jpg` |
| `1907.xml` | [99122935163405763](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122935163405763) | `115308074978_color` | 76 → 74 | 4 | `008.jpg` | 9 → `012.jpg` |
| `1912.xml` | [99122436957605763](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122436957605763) | `11530807498A_color` | 126 → 124 | 6 | `010.jpg` | 9 → `014.jpg` |
| `1914.xml` | [99122436591605763](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122436591605763) | `11530807499D_color` | 142 → 140 | 6 | `008.jpg` | 9 → `014.jpg` |

Billedantallene er målt på de eksisterende billedserier, ikke på de
nuværende KB-PDF'er. De gamle lokale PDF'er har to indledende KB-sider,
som billedserierne udelader. De hidtidige antal medregnede disse sider.

Alle 574 sammenhængende JPEG-filer fra `000.jpg` til den sidste side og
alle 574 tilhørende `t/NNN-w250.jpg` svarede HTTP 200 med
`Content-Type: image/jpeg`. Den næste nummererede JPEG efter hver serie
svarede HTTP 404. De seks farve-PDF-links i KB's `delivery.link` svarede
HTTP 200 med `Content-Type: application/pdf`.

Kontrollen kan gentages med HTTP HEAD på
`https://kalliope.org/facsimiles/larsent/<facsimile-id>/NNN.jpg` og
`https://kalliope.org/facsimiles/larsent/<facsimile-id>/t/NNN-w250.jpg`.
De registrerede offsets betyder, at filnummeret er trykt sidetal plus
`offset` minus én. Der er ikke udskiftet eller synkroniseret nye billeder.

KB's originale udgavebeskrivelser og PDF-links er kontrolleret via
`https://soeg.kb.dk/primaws/rest/pub/pnxs/L/alma<id>?vid=45KBDK_KGL:KGL&lang=da`.
Browserkontrollen af »Vis online« kunne ikke udføres: browserforbindelsen
returnerede ingen tilgængelig browser.

### Tekstgrundlag og kontrollens grænse

Titelbladene og de første digtsider er læst visuelt. Sidetallene på de sidste
repræsenterede tekstsider er også kontrolleret: 69, 62, 57, 61, 101 og 116.
De eksisterende 144 tekstposters indhold er maskinelt sammenholdt med frisk
OCR fra de registrerede sideintervaller som kontrol af udgavematch og
opslag. OCR-sammenligningen er kandidatfinding, ikke fuld korrektur.
Teksternes id'er, brødtekst, sidetal og variantrelationer er bevaret.

Der er endnu ikke udført to fulde visuelle korrekturgennemgange af de seks
samlinger. Ingen af dem har `<pb>` eller `<pagebreaks/>`; alle interne
sideskift skal stadig registreres efter `docs/facsimile-korrektur.md`.
Der er ikke tilføjet nye korrekturflag, modelattester eller erklæringer om
fravær af rettelsesark. Fuld sidekontrol for rettelsesark og kvalitetskontrol
af de eksisterende titelbladsbilleder og deres transskriptioner udestår.

### Manglende sider og digt i Dagene

KB-serien viser trykt s. 57 på `062.jpg`, derefter en blank side på
`063.jpg` og trykt s. 61 på `064.jpg`. Siderne 58–59 med
»Kræ-Tammesen i Vorherres Haand« mangler. Digtet står i indholdsfortegnelsen
på `066.jpg`, men findes ikke i `1905.xml`. Værket er derfor ændret til
`status="incomplete"` med en synlig forklaring.

[Internet Archives Dagene](https://archive.org/details/dagene1905larsenthger)
er en konkret alternativ kildekandidat: metadata angiver digitalisering ved
Kim Byvald, litteraturlink.dk, 2010, bearbejdet til IA i 2011. Postens
`dagene1905larsenthger_text.pdf` er tilgængelig og har 68 PDF-sider; OCR-laget
indeholder det manglende digt på PDF-sider 60–61 (trykt s. 58–59).
Forsiden med 1905, Hvidehus Boglade og Vejle samt de trykte sider 58–59 er
visuelt kontrolleret. Digtet findes på billederne; en kildebaseret
transskription, to korrekturgennemgange og en konkret kildehenvisning i XML
udestår stadig. KB-seriens offset 6 gælder de hidtil inkluderede digte til
og med s. 57; det må ikke bruges ukritisk på trykkets efterfølgende sider.

## De senere samlinger

Disse poster er genlæst i KB's offentlige PNX-API. Ingen returnerede et
`delivery.link`. En katalogpost uden fillink dokumenterer ikke adgang til en
scanning og kan ikke tilskrives de eksisterende tekster som verificeret kilde.

| Værk | KB-post | Resultat og næste skridt |
| --- | --- | --- |
| *I Danmarks Navn* (1920) | [99122867053705763](https://soeg.kb.dk/permalink/45KBDK_KGL/1pioq0f/alma99122867053705763) | Trykt udgave, Gyldendal, 68 sider. Skaf scanning og kontrollér tekstversionen. |
| *Blishønsene* (1921) | [99125875533005763](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99125875533005763) | Digitalisering 2024 af Lemvig Bogtrykkeri, 1921, 15 sider, illustreret; eksemplar `53,-358-8°`. `Alma-E`, men ingen fillinks og `displayedAvailability: Not available`. Afklar filadgang hos KB før transskription. |
| *Vejr og Vinger* (1923) | [99122450433405763](https://soeg.kb.dk/permalink/45KBDK_KGL/1pioq0f/alma99122450433405763) | Lemvig: Atlantis' Forlag, 77 sider. Skaf scanning med forfatterens tegninger og vignetter. |
| *Limfjords-Sange* (1925) | [99122450440905763](https://soeg.kb.dk/permalink/45KBDK_KGL/1pioq0f/alma99122450440905763) | Trykt udgave, 76 sider. Skaf scanning og kontrollér tekstversionen. |
| *Søndengalm* (1926) | [99122660558505763](https://soeg.kb.dk/permalink/45KBDK_KGL/1pioq0f/alma99122660558505763) | København: Gyldendal, 138 sider. Skaf scanning og kontrollér tekstversionen. |
| *Trækfuglevej* (1927) | [99122196730605763](https://soeg.kb.dk/permalink/45KBDK_KGL/1pioq0f/alma99122196730605763) | Trykt udgave, 183 sider. Skaf scanning og kontrollér både digte og prosa. |

Supplerende websøgninger på forfatter, titel og PDF samt Internet Archives
`advancedsearch.php` med `creator:("Thøger Larsen")` gav ingen hentbar scanning
af disse seks udgaver. IA-søgningen gav *Dagene* og lydoptagelser.

Google har poster for [Vejr og Vinger](https://books.google.com/books?id=vIE_AAAAIAAJ),
[Limfjords-Sange](https://books.google.com/books?id=CL0OAQAAIAAJ) og
[Søndengalm](https://books.google.com/books?id=6xwRAQAAMAAJ). De tilhørende
Google Play-poster markedsfører gratis e-bøger, men Books-responserne i denne
session angav `has_scanned_text: false` og `can_download_pdf: false`.
Google Books API returnerede desuden HTTP 429 med overskredet dagskvote.
Disse fund er adgangsspor, ikke verificerede facsimiler.

Der er ikke sendt henvendelser eller bestilt digitalisering. Næste eksterne
skridt er at afklare KB's eksisterende digitalisering af *Blishønsene* og
undersøge adgang til Google-kandidaterne. Hvis der ikke kan skaffes offentlige
scanninger, skal en digitaliseringsbestilling af de fem øvrige trykte udgaver
afklares særskilt. Først med billederne kan sidetal, facsimile-id, billedantal,
offsets og tekstversioner registreres forsvarligt i XML'en.

*Sapfos Digte*, *Rubaiyat* og `andre.xml` er fortsat særskilte opfølgninger
som beskrevet i #1952 og #940. Ingen af dem har fået en kilde fra de seks
tidlige samlinger.
