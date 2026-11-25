# Poetiske Oversættelser af Fremmedes Mesterdigte, 2. stykke (1802) — stoppet import

Importen for #2433 er stoppet, fordi det eneste verificerede facsimile ikke
indeholder hele udgaven. Der er ikke oprettet værk-XML, tekster, titelbladsbilleder
eller facsimiler.

## Kilde og omfang

- Direkte farve-PDF fra KB:
  [130002483239-color.pdf](https://www.kb.dk/e-mat/dod/130002483239-color.pdf),
  167 PDF-sider, SHA-256
  `f7904883990a1f34c66c89516c90b6e68f5ae0f9ca0c1a9d322224b87801bcf4`.
- PDF'ens egen KB-forside (PDF-side 1) angiver
  »Homers Ilias : 1. Sang«, »Kbh., [1802]« og omfanget **44, 108 s.** og nævner
  i forfatterfeltet både Baggesens hexameteroversættelse, Seidelins tre sange og
  »Anacreons 3die og 20de Ode; fordansket af C. Pram«.
- [Digital værkpost](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99123869997905763)
  og [fysisk antologipost](https://soeg.kb.dk/permalink/45KBDK_KGL/1pioq0f/alma99122315734005763)
  angiver henholdsvis 44, 108 sider og 115 sider. [Dansk
  Forfatterleksikon](https://danskforfatterleksikon.dk/1850/sk1850aar1802.htm)
  registrerer alle tre oversættere under serien »Poetiske Oversættelser af
  Fremmedes Mesterdigte, 2«.

Sideinventar (PDF-sider, foreløbigt og kun baseret på PDF'ens tekstlag):

| PDF-sider | Indhold |
| --- | --- |
| 1–7 | KB-forside, blanke blade, biblioteksblad og forblade |
| 8 | Titelblad: *Homers Ilias. Første Sang. Fordansket i Hexametrer af J. Baggesen* |
| 9–10 | Biblioteksstempel og forblad |
| 11–51 | Baggesens første sang, trykt s. 4–44 |
| 52–53 | Blanke blade |
| 54 | Titelblad: Seidelins *Ilias*, første sang |
| 56 | *Indhold af første Sang* (indholdsoversigt, ikke egen tekst) |
| 58–87 | Seidelins første sang |
| 88–89 | Titelblad og blad til anden sang |
| 90 | *Indholder af anden Sang* |
| 92–135 | Seidelins anden sang, trykt til s. 79 |
| 136–137 | Titelblad og blad til tredje sang |
| 138 | *Indhold af tredje Sang* |
| 140–163 | Seidelins tredje sang, sidste trykte side 108 på PDF-side 163 |
| 164–167 | Blanke blade/bind |

## Dokumenteret kildekløft

- PDF'en slutter efter Seidelins tredje sang på trykt s. 108 (PDF-side 163).
  De følgende fire PDF-sider er blanke. Hverken PDF'ens tekstlag eller de
  kontrollerede sideoverskrifter viser Prams Anakreon-oder. De tolv sider i
  PDF'en uden tekstlag (2, 5, 7, 55, 89, 135, 137, 139 og 164–167) er
  yderligere kontrolleret med frisk Tesseract-OCR af de renderede sider; alle
  tolv er uden læsbar tekst.
- KB's metadata for netop denne digitalisering nævner Prams tredje og tyvende
  Anakreon-ode, og den fysiske katalogpost angiver et andet omfang (115 sider).
  Det digitaliserede eksemplar kan derfor ikke dokumentere antologien som
  komplet. Forskellen må ikke uden videre regnes som præcis syv manglende sider.
- Prams oversættelser findes i [udvalgte digteriske arbejder, bind 4,
  1824–1829](https://www.kb.dk/e-mat/dod/130023278732-bw.pdf), men det er en
  anden udgave og må ikke bruges til at udfylde facsimilekløften i 1802-trykket.

## Udført kontrol

- PDF'en er hentet fra det verificerede KB-link; sidetal og SHA-256 er kontrolleret.
- Alle 167 PDF-sider er registreret i et foreløbigt sideinventar ud fra
  PDF'ens eksisterende tekstlag. Tekstlaget er kun brugt til diagnosticering og
  identifikation af titelblade, paginering og den afsluttende side, ikke som
  transskriptionsgrundlag.
- Der er søgt efter Pram/Anakreon i hele tekstlaget; kun KB-forsiden (PDF-side 1)
  giver treff. De tolv sider uden tekstlag er kontrolleret med en frisk
  Tesseract-pass (dansk, PSM 3) af 150 dpi-renderinger; alle er blanke.
- Ingen trykt rettelse er observeret i tekstlaget, men dette er **ikke** en
  visuel rettelsesarkskontrol.

## Ikke udført

- Frisk OCR og transskription af nogen side.
- Visuel kontrol af facsimilesider, titelblad, verslinjer, strofer, indryk,
  typografi eller rettelsesark. Denne session kan ikke læse billeder eller PDF'er
  som modelinput; sidebilleder kan kun gengives som filer, ikke inspiceres.
- Værk- eller tekstforekomster, metadata, kildehenvisninger, billeder,
  korrekturer, helværksanalyser, variantkontrol, XML-validering og test af et
  importeret værk.

## Kræves for at genoptage

1. Et komplet facsimile af **samme 1802-udgave**, herunder de sider i Prams
   tredje og tyvende Anakreon-ode, som mangler i 130002483239-color.pdf. Kilder
   med et andet omfang eller en anden udgave løser ikke kløften.
2. Afklaring hos KB af hvorfor digitalposten angiver 44, 108 sider, mens den
   fysiske post angiver 115 sider, og om et andet eksemplar er digitaliseret.
3. En model- eller agent-session med billedinput til den påkrævede visuelle
   sidegennemgang, titelbladsbehandling og de to fulde korrekturer.
4. Koordinering med den åbne Minerva-PR #2391/#2407 (`seidelinh`) og med de
   eksisterende Baggesen-forekomster fra 1807, før person- og variantrelationer
   oprettes.
