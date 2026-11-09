# Nytaarsgave 1806: import standset ved kildetab

Arbejdet vedrører #2027 under #1879. Den 9. november 2026 blev der fundet
fysisk afskåret tekst i den angivne digitalisering. Årgangen er **ikke
transskriberet eller færdigkorrekturlæst**. Bibliografiregistreringen i
`fdirs/antologierdk/1806-nytaarsgave.xml` forbliver tom og `incomplete`.

## Kilder

- [KB's samlede katalogpost for Nytaarsgave](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122352753405763).
- [Farve-PDF, 11520800316b-color.pdf](https://www.kb.dk/e-mat/dod/11520800316b-color.pdf):
  261 PDF-sider; SHA-256
  `56a7c3cb53bb4d92569f1f255afb2f580f0cd759fabffe6dc322978ff213b90b`.
- [Alternativ sort-hvid-PDF, 11520800316b-bw.pdf](https://www.kb.dk/e-mat/dod/11520800316b-bw.pdf):
  261 PDF-sider; SHA-256
  `77baa61d58e07a73cba2987c9296204128af438f76129ca235a417f138fbba8e`.
  Dette er linket i katalogposten. Hovedissuets filnavn med `_bw.pdf`
  returnerede HTTP 404 ved kontrollen.

## Dokumenteret kildekløft

På **trykt side 197, PDF-side 202, facsimilefil `201.jpg`** er venstre kant
af tekstblokken uden for scanningen. Flere begyndelsesglyffer er delvis
fraværende ved billedets venstre grænse. Det præcise omfang af eventuelle helt
manglende bogstaver kan ikke bestemmes uden rekonstruktion. Problemet ses
både i farveudgavens originale, indlejrede sidebillede og i sort-hvid-udgavens sidebillede; det skyldes derfor
ikke vores udtræk, en OCR-fejl eller den hvide margin omkring billedet i PDF'en.
Den alternative digitalisering leverer ikke den manglende tekst.

Det berører prosaen i **»Waldemar og Gertrud«**, der begynder på trykt side
125 og fortsætter i prosa efter versene på side 153. På side 197 kan problemet
lokaliseres ved linjen med »Din Flamme udslukket?« og linjen med
»de haandfaste Svende vente.«: begyndelsesglyfferne i disse linjer er
afskåret ved billedkanten. Fragmenterne identificerer placeringen; de er ikke
rekonstruktioner af de manglende linjebegyndelser.

| Trykt side | PDF-side | Facsimilefil | Kontrol |
| --- | --- | --- | --- |
| 195 | 200 | `199.jpg` | Meget snæver venstrekant; kræver særskilt kontrol ved genoptagelse. |
| 196 | 201 | `200.jpg` | Siden før den sikkert konstaterede beskæring. |
| 197 | 202 | `201.jpg` | Dele af begyndelsesglyffer fysisk afskåret i begge PDF'er. |
| 198 | 203 | `202.jpg` | Næste side i den fortløbende paginering. |

Der mangler ikke et helt sidetal i rækken. Det er **manglende billedindhold på
en eksisterende side**, som gør facsimilet ufuldstændigt. Sidetalskontrol alene
ville derfor fejlagtigt godkende kilden. Importen er standset ved kildekløften;
den manglende tekst må ikke udfyldes fra gæt, OCR eller en anden udgave.

## Udført kontrol og begrænsninger

- OCR/PDF-miljøet blev kontrolleret med `tools/ocr-environment`.
- Alle 261 PDF-sider blev undersøgt i sideoversigter, og de trykte sidetal
  1–247 blev kontrolleret i rækkefølge. Titelbladet ligger på PDF-side 4
  (`003.jpg`); registret på PDF-side 253–257.
- Tre andre sessioner udførte uafhængig kildeinventering. Intervallerne
  PDF 1–88 og 89–176 blev gennemgået uden konstaterede sidehuller;
  sidste interval blev standset ved fundet på PDF 202. Kontrollen omfattede
  sidebilleder og udvalgte tekstovergange, ikke fuld tekstkorrektur.
- Farve- og sort-hvid-billedet af side 197 blev sammenholdt i læsbar størrelse.
- Fraktur-OCR-forberedelse blev forsøgt, men benchmarken afsluttede med
  »Spejder-OCR fejlede for page-0006.png«. Der foreligger intet valideret
  OCR-bundle, ingen transskription og ingen korrekturattest.
- Ingen titelbladsbilleder, faksimileaktiver eller OCR-filer er tilføjet eller
  publiceret. Komplet rettelsesarkskontrol og tekstinventar er ikke afsluttet.

## Validering

`make test` afsluttede med exitkode 0: 145 testsuiter og 2.556 tests bestået;
én suite og ni tests sprunget over. Ingen transskription er valideret med dette
resultat; ændringen består alene af denne statusrapport.

## Genoptagelse

Der skal først findes en **ubeskåret gengivelse af side 197 fra samme
1806-udgave**, helst en ny farvescanning fra KB. Kontrollér også side 195 og
nabosiderne for yderligere afskæring. De to allerede undersøgte PDF'er er
ikke tilstrækkelige til at løse kildekløften.

Når kilden er komplet, genoptages det fulde side- og tekstinventar, frisk OCR,
transskription, metadata- og forfatterkontrol, variantkontrol, titelbladsarbejde
og to fulde korrekturgennemgange. Udgivelsesåret skal stadig verificeres
særskilt fra årgangsbetegnelsen 1806. KB's samlede katalogpost og årgangens
konkrete farvefaksimile skal begge indgå i den endelige kildeangivelse.
