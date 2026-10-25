# Smaa Kalamiteter (1915): afventer valg af facsimilerækkefølge

Importen til issue #1885 er ikke færdig. Der er endnu ikke oprettet værk-XML
eller publiceret facsimiler. Kildekontrollen den 25. oktober 2026 fandt
ombyttede sider i begge angivne KB-PDF'er, ikke et dokumenteret sidegab.

## Kilde

Thorkil Barfod: *Smaa Kalamiteter. Spøgefulde Episoder paa Vers og Prosa*,
Gyldendalske Boghandel · Nordisk Forlag, Kjøbenhavn og Kristiania, 1915.
Titel og udgivelsesoplysninger er kontrolleret på PDF-side 8, titelbladet.

- [KB-katalogpost](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122620172405763)
- [Farve-PDF](https://www.kb.dk/e-mat/dod/115208018995-color.pdf), 187 PDF-sider.
  SHA-256: `e3fae9ee88c65a0edd4a61e8bc7cefbaa5aba11ffe427d57024d6acb8bed58ec`.
- [Sort-hvid-PDF](https://www.kb.dk/e-mat/dod/115208018995-bw.pdf), 187 PDF-sider.
  SHA-256: `1005c7dd96212a8401d3a8097de760b42c8b284076971102e0022b40de1a4d8c`.

## Dokumenteret rækkefølgefejl

PDF-sidetal nedenfor er enbaserede. Facsimilefilnavnene er de forventede,
nulbaserede navne ved udtræk uden omordning; filerne er ikke publiceret.
Kantede parenteser angiver sider uden trykt sidetal, placeret ud fra de
tilstødende sidetal og tekstens fortsættelse.

| Trykt side | PDF-side i begge filer | Facsimilefil |
| --- | --- | --- |
| 64 | 69 | `068.jpg` |
| [65] | 72 | `071.jpg` |
| [66], blank | 73 | `072.jpg` |
| [67], Kærlighedens Vikariat | 70 | `069.jpg` |
| [68], blank | 71 | `070.jpg` |
| 69–70 | 76–77 | `075.jpg`–`076.jpg` |
| 71–72 | 74–75 | `073.jpg`–`074.jpg` |
| 73–74 | 80–81 | `079.jpg`–`080.jpg` |
| [75]–76 | 78–79 | `077.jpg`–`078.jpg` |
| 77–78 | 84–85 | `083.jpg`–`084.jpg` |
| [79]–80 | 82–83 | `081.jpg`–`082.jpg` |
| 81 | 86 | `085.jpg` |

Den korrekte læserækkefølge for PDF-siderne 70–85 er således:

```text
72,73,70,71,76,77,74,75,80,81,78,79,84,85,82,83
```

PDF-side 72 afslutter *San Antonio*. Det lille »5« nederst er en arksignatur,
ikke sidetal. PDF-side 78 fortsætter køkkenscenen fra trykt side 74 med
»Da var hendes Tanker paa Grydernes Bund!«. PDF-side 82 fortsætter hjemrejsen
fra side 78 med »Saa rejste jeg hjem som en nedbrudt Mand.«.

En separat reviewers visuelle kontrol af trykt side 63–85 bekræftede
ombytningerne i begge PDF-versioner og fandt ikke manglende sider i dette
udsnit. Dette er ikke en erklæring om fuld tekstkorrektur.

## Konsekvens for importen

Den trykte tekstorden kræver faldende facsimilenumre flere steder i
*Kærlighedens Vikariat*. `docs/xml-work-format.md` kræver, at numeriske
`pb/@facs` ikke falder inden for samme facsimilekilde. Et enkelt
`facsimile-pages-offset` kan heller ikke beskrive ombytningerne.
Undtagelsen `pagebreak-count` ophæver ikke rækkefølgekravet.

Der er derfor forelagt et valg mellem:

1. En dokumenteret afledt facsimilekopi med de eksisterende sider i korrekt
   rækkefølge, mens de hentede original-PDF'er bevares uændrede. Den præcise
   mapping mellem original og afledt kopi skal følge importen.
2. Bevarelse af KB's PDF-rækkefølge og først tilføjelse af understøttelse for
   en eksplicit sidemapping i Kalliopes format, visning og validering.

Ingen af løsningerne er gennemført. Der må ikke indsættes opdigtet tekst,
skjules ombytninger med en testundtagelse eller angives fuld korrekturstatus.

## Udført og udestående

Korpusopslaget viste ingen eksisterende udgave under `barfod/1915`.
Der er foretaget en visuel oversigtsgennemgang af farve-PDF'en og en særskilt
kontrol af det ombyttede område. Titelbladet er identificeret, og en lokal
geometrisk behandlet kandidat har bestået titelbladsværktøjets QA. Kandidaten
er ikke indsat i repositoryet.

Efter valg af facsimilerækkefølge resterer det fulde dokumenterede sideinventar,
transskription af alle vers, prosatekster og dedikationen, to fulde
korrekturgennemgange, kontrol for rettelsesark, typografi og sidegrænser,
variantkontrol, metadata, billeder, rendering og publicering af facsimiler.
Arbejdsbilleder og OCR-grundlag er lokale arbejdsfiler og indgår ikke i PR'en.
