# Andersen: Digte (1854), bind XV–XVI — status

Arbejdet med issue #2319 er ikke færdigt. Denne rapport dokumenterer det
forberedende arbejde og den konkrete blokering. `fdirs/andersen/1854.xml` er
beholdt uændret, fordi maskinel OCR alene ikke kan bruges som facsimile facit,
og fordi de påkrævede to visuelle korrekturer ikke kan gennemføres i denne
session.

## Kilde

Den anvendte kilde er Det Kgl. Biblioteks farvedigitalisering:

- [Digitalisering af bind XV–XVI](https://www.kb.dk/e-mat/dod/115208016110-color.pdf)
- 441 PDF-sider; ingen brugbar tekstlayer.
- PDF'en er kopieret til `facsimiles/andersen/1854.pdf` og renderet til
  `facsimiles/andersen/1854/000.jpg`–`440.jpg` med tilhørende thumbnails.

## Sidekort

Filnavnene er nulbaserede; PDF-siderne er enbaserede.

| Indhold | Trykte sider | PDF-sider | Facsimilefiler |
| --- | --- | --- | --- |
| Omslag, forblade, titelblad, indhold | — | 1–15 | `000`–`014` |
| *Digte, Første Deel* / bind XV | 1–211 | 16–226 | `015`–`225` |
| Mellemblade, titelblad, indhold til anden del | — | 227–237 | `226`–`236` |
| *Digte, Anden Deel* / bind XVI | 1–198 | 238–435 | `237`–`434` |
| Blanke efterblade | — | 436–441 | `435`–`440` |

Følgende scannede sider er næsten eller helt blanke: `001`–`004`, `006`,
`008`, `010`, `014`, `226`, `228`, `230`, `232` og `435`–`440`. De ser ud til at
være blanke versos, mellemblade eller efterblade, ikke dokumenterede mangler i
trykket. Det kræver visuel bekræftelse før endelig registrering af sideskift.

## Nuværende dækning i XML

`fdirs/andersen/1854.xml` har `status="incomplete"` og 72 `<text>`-poster.
Alle 72 `source/@pages`-angivelser hører til bind XV og dækker tilsammen kun 64
trykte sider, fra s. 1 til s. 191.

Trykte sider i bind XV uden nogen tekstpost:

`3-16 22-30 33 36 40-42 44-48 50-53 56-58 67 70 73 79 81-85 88 92-106 111-112 117 119 126-143 145-149 155-189 192-211`

Hele bind XVI, trykt s. 1–198, mangler som tekstposter. De 64 dækkede sider i
bind XV betyder desuden ikke i sig selv, at alle tekster på disse sider er
registreret; det kræver en visuel gennemgang mod indholdsfortegnelserne og
sidebillederne.

## Udført i denne session

- Læste `docs/style-guide.md` og den relevante specialdokumentation.
- Oprettede worktree `/Users/b015677/src/kalliope-worktrees/andersen-digte-1854`
  fra `origin/master` på branch `andersen-digte-1854`.
- Kørte `tools/ocr-environment`; Kraken, ocrmypdf, Ghostscript, uv og pipx er
  ikke installeret. pdftoppm, pdftotext, ImageMagick og Tesseract er
  tilgængelige.
- Hentede og gemte kilde-PDF'en og genererede alle 441 facsimilebilleder og
  thumbnails.
- Kørte `prepare-fraktur-ocr` på hele facsimilesættet. Bundle-valideringen er
  `valid` med 0 fejl; fuld genkendelse blev ikke kørt, fordi de 40
  eksempelkørsler alene tog omkring 10 minutter.
- Kørte to Tesseract-pass på alle 441 sider: `frk --psm 3` og `dan --psm 6`.
  Resultaterne ligger i `/var/folders/my/k6lrj36n6rz77rdtzz3rnl5w0000gp/T/opencode/andersen1854/tsv/`.
- Byggede et sideinventar med linjeoplysninger og kontaktark i samme
  midlertidige mappe.
- Søgte i OCR-teksten efter »Trykfejl«, »Rettelse« og »Errata« uden fund; det
  er ikke en visuel konstatering af, at der ikke findes et rettelsesark.

## Blokering

Denne model kan ikke modtage billedinput. Både direkte læsning af
facsimilebilleder og en delegationsbaseret visuel gennemgang fejlede med
`This model does not support image input.`

Det blokerer:

- den påkrævede side-for-side-læsning af alle 441 facsimilesider;
- visuel afgørelse af verslinjer, strofegrænser, indryk, afsnitsgrænser og
  sideskift;
- opdagelse og registrering af et eventuelt trykt rettelsesark;
- første og anden korrektur, herunder den uafhængige anden korrektur;
- sætning af `korrektur2` og `status="complete"` med korrekturattest.

Ingen af disse ting er blevet simuleret eller attesteret på OCR-grundlag.

## Næste skridt

1. En session eller agent med billedinput skal gennemgå alle 441 facsimilesider
   og indholdsfortegnelserne visuelt.
2. Transskribér de manglende tekster med facsimilet som facit; OCR-output er kun
   støtte. Bevar eksisterende tekst-id'er og variantrelationer.
3. Registrer kilde, sideintervaller, interne sideskift og eventuelt rettelsesark;
   gennemfør to korrekturer og attestation før `status="complete"`.

## Validering

- `make test`: exitkode 0; 152 af 153 testsuiter bestået, 2.781 tests bestået,
  9 tests sprunget over. Kommandoen skrev advarslen `fatal: Needed a single
  revision`, men afsluttede uden fejl.
- `git diff --check`: bestået efter oprettelsen af denne rapport.
- Ingen XML-ændringer, ingen commit af værkdata og ingen PR med færdigstatus.
