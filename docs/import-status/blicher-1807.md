# Ossians Digte: importstatus for #1825

Status 18. oktober 2026: **begge bind er indsat og korrekturlæst**.
Brugeren har leveret to færdigt oprettede og beskårne titelblade, afklaret
tekststederne og godkendt commit, push og merge. Blichers værk er `complete`.

## Kilde og omfang

- Værk: `fdirs/blicher/1807.xml`, *Ossians Digte*, 1807–1809.
- [KB's katalogpost](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122889916105763).
- [PDF](https://www.kb.dk/e-mat/dod/115408047875.pdf), 605 sider.
- PDF'ens SHA-256:
  `7f4236e99808eed0bcd1b7fa152b62716a78f3eacf8da445090741369a736db1`.
- Katalogposten angiver Den Wahlske Boghandling, [1807-09], 1–2 i ét bind,
  omtrykt titelblad uden år og eksemplaret `54,-322 8°`.
- Titelbladene på PDF-siderne 6 og 330 bekræfter titel, oversætter, bind, København,
  forlag og trykker. Ingen af dem har trykt årstal. Den strukturerede kilde
  bevarer KB's datering `[1807-09]`; værkets årsspænd er `1807-1809`.

XML'en indeholder 41 tekstposter: 35 oversatte tekster/sange og seks
paratekster, fordelt i syv sektioner. Tilegnelse, begge fortaler,
personliste, anmærkning til Goel og hele navneregisteret er medtaget.
Trykte indholdsfortegnelser, blanke blade og indbindingsdele er gennemgået
og klassificeret, men ikke oprettet som selvstændige tekster.

| PDF-sider | Indhold |
| --- | --- |
| 1–9 | Digitaliseringsblad, indbinding, titelblad og tilegnelse |
| 10–35 | Fortaler |
| 36–37 | Første dels indholdsfortegnelse |
| 38–161 | Første binds tekster før Fingal |
| 162–163 | Fingal-afsnitstitel og blank verso |
| 164–329 | Fingal og første binds sidste tekster |
| 330–333 | Andet binds titelblad og indholdsfortegnelse |
| 334–576 | Andet binds digte og anmærkninger |
| 577–598 | Navneregister |
| 599 | Rettelsesark for begge bind |
| 600–605 | Blanke blade, forsats og bagbind |

Alle 605 facsimilebilleder med thumbnails er genereret og synkroniseret.
Filnavnene er nulbaserede: PDF-side 6 er `005.jpg`.

## OCR og korrektur

Miljøkontrol og et fuldt verificeret Fraktur-bundle er gennemført.
Den eksisterende Kraken-installation er bevaret og afprøvet; transskriptionen
bygger på direkte billedlæsning med to friske Tesseract-passager som hjælp.
PDF'ens eksisterende tekstlag er alene brugt diagnostisk.

Producentgennemgangen er efterfulgt af fuld, uafhængig visuel korrektur.
Reviewerne har ikke kontrolleret deres egne produktionstekster. Den samlede
slutjournal dækker samtlige 605 fysiske sider uden huller: henholdsvis 272,
240 og 93 sider i tre uafhængige reviewers intervaller. Alle accepterede
rettelser er genkontrolleret. Prosagrænser, indryk, afstande, overskrifter,
noter, spatiering og kursiv er kontrolleret; kilden har ingen egentlige
versblokke. XML'en har `korrektur1,korrektur2,kilde,side`, `pagebreaks`
og en modelattest.

Rettelsesarkets 43 angivelser er kontrolleret mod de konkrete tryksteder.
40 rettelser er indført med `footnote type="errata"`; tre kræver ingen
ændring i dette eksemplar. Arket er registreret i værkhovedet og er aldrig
oprettet som en tekstpost. OCR-fejllæsninger af blandt andet Cona, hælder og
Mos er afklaret ved ny bogstavsammenligning.

## Dokumenterede kildeforhold

- Brugeren har afklaret læsningerne på tryksiderne 13, 28, 83, 112 og 148.
  Teksttab fra et hul på s. 11–12 er suppleret efter Blichers *Samlede
  Skrifter*, bd. 1, Gyldendalske Boghandel, Nordisk Forlag, København, 1920,
  s. 32–33. Den fysiske bog er citeret i teksthovedet. Der er ingen resterende
  `[ulæseligt]`-markeringer.
- Fejlpagineringerne XVIV/XXVIV i fortalen og 011, 30, 164 i de arabiske
  sideforløb er bevaret eller tydeliggjort med logisk sidetal i kantede parenteser.
- Manglende, ombyttede og gentagne notehenvisninger er forklaret i de
  konkrete teksthoveder. Uankrede noter er bevaret som kildenoter uden
  opfundne henvisninger i brødteksten.
- Cath-lodas sange deler slutnoter. De dækkende sideintervaller og de
  nødvendige, lokale undtagelser fra den simple sideoptælling er dokumenteret.
  Titelfodnoters egne sideskift er bevaret i deres særskilte tekststrømme.
- Registerets hængende indryk kan ikke gengives med den aktuelle
  prosamodel. Opslagene er separate afsnit uden førstelinjeindryk;
  den redaktionelle note er fjernet efter brugerens ønske. De to frie
  forklaringsafsnit på PDF-side 585 har deres trykte førstelinjeindryk.
- Afslutningen af *Ossians sidste Sang* er forbundet med den senere,
  versificerede *Ossians Svanesang* via en præcis note, ikke som en variant
  af hele teksten. De engelske originaler er nu indsat i
  `fdirs/macpherson/1773.xml` fra Sacred Texts, og Blichers 35 oversatte
  tekster/sange er forbundet med de konkrete engelske tekster.

## Titelblade og engelske originaler

Brugerens to færdigbehandlede JPEG-filer er indsat uændret som
`1807-bind1-p1.jpg` og `1807-bind2-p1.jpg` med fuld transskription.
De erstatter de tidligere scratch-kandidater, som ikke bestod automatisk QA.
Der er ikke foretaget yderligere billedbehandling af brugerens filer.

Sacred Texts' digtdel omfatter 22 digte i 36 tekstposter, herunder Cath-lodas
tre duaner, Fingals seks og Temoras otte bøger. Den digitale udgave bygger
på Boston-trykket fra Phillips, Sampson & Company, 1851, et genoptryk af
1773-udgaven. Værk-id og værkår er 1773; den anvendte trykte kilde er 1851.
Krediteringen er bevaret. De indledende afhandlinger er ikke indført,
og den engelske værkpost står derfor som `incomplete`. Brugeren har
udtrykkeligt fravalgt ny korrekturlæsning af den engelske tekst. Udgaven er
ikke dokumenteret som det konkrete eksemplar, Blicher benyttede.

Den tomme duplet `blicher/1814a` er fjernet; den fulde udgave ligger i
`blicher/1814`.

Browserforbindelsen var desuden utilgængelig. Det statiske build,
visningsdata og den lokale servers genererede indholdsfortegnelse er
kontrolleret; en visuel browserkontrol er ikke attesteret.

De otte kildebekræftede OCR-kandidater er lokalt undtaget fra deres konkrete
kvalitetsregler på de berørte tekster. En ufiltreret rapport og alle
kildeafgørelser er bevaret i scratch.

Scratch med OCR, sidejournaler, findings og billedkandidater ligger uden for
repositoryet. De er ikke en del af PR'en.
