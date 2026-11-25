# Minerva 1791: tekstimport stoppet ved kildehuller

Opgaven følger #2405 og afgrænsningen i #2091: digte og øvrige
versbidrag i bind 23–26 samles i `fdirs/tidsskrifterdk/1791-minerva.xml`,
med særskilte kilder pr. bind. Omslagsdigte er udtrykkeligt fravalgt.

Status pr. 25. november 2026: kildeundersøgelse udført; ingen tekstimport.
Der er ikke oprettet XML, titelbladsbilleder eller publicerede facsimiler.
Der er ikke kørt OCR eller udført tekstkorrektur. Den bibliografiske
registrering fra #2390 er bevaret uændret.

## Fundne primærkilder

| Bind | Periode | Konkret digitalisering | Kontrol og begrænsning |
| --- | --- | --- | --- |
| 23 | Januar–marts 1791 | [Internet Archive, Minerva_Bind_23_1791.pdf](https://archive.org/download/minerva-bind-23-1791/Minerva_Bind_23_1791.pdf) | PDF hentet: 465 sider, 473.139.119 bytes. De første 14 PDF-sider er visuelt gennemset som kildeidentifikation, herunder titelblad på PDF-side 3. Ingen fuld sidegennemgang eller komplethedsattest. |
| 24 | April–juni 1791 | [Google Books, 2F83AAAAMAAJ](https://books.google.com/books?id=2F83AAAAMAAJ) · [HathiTrust, mdp.39015065143060](https://hdl.handle.net/2027/mdp.39015065143060) | Google Books-sideindeks hentet og otte billeder visuelt kontrolleret omkring fire sidehuller; se nedenfor. |
| 25 | Juli–september 1791 | [Google Books, 1G45AAAAMAAJ](https://books.google.com/books?id=1G45AAAAMAAJ) · [HathiTrust, mdp.39015065142914](https://hdl.handle.net/2027/mdp.39015065142914) | Kun sideindeks undersøgt. Alle PA1–PA438 findes som side-id'er; dette dokumenterer ikke billedindhold eller fuldstændighed. |
| 26 | Oktober–december 1791 | [Google Books, tWA3AAAAMAAJ](https://books.google.com/books?id=tWA3AAAAMAAJ) · [HathiTrust, mdp.39015065143052](https://hdl.handle.net/2027/mdp.39015065143052) | Kun sideindeks undersøgt. Alle PA1–PA504 findes som side-id'er; dette dokumenterer ikke billedindhold eller fuldstændighed. |

Google Books-kilderne er identificeret ved opslag på de konkrete
Michigan-stregkoder fra HathiTrust-henvisningerne i
[6. årgangs oversigt](https://uforbederlig.dk/tidsskrifter/Minerva-6aarg.htm)
og [7. årgangs oversigt](https://uforbederlig.dk/tidsskrifter/Minerva-7aarg.htm).
HathiTrust-billederne kunne ikke hentes i denne undersøgelse; en selvstændig
kontrol dér er derfor ikke udført.

## Dokumenterede sidehuller i bind 24

Googles `click3`-sideindeks er sammenholdt med selve billedernes trykte
sidetal. Følgende billedpar står umiddelbart efter hinanden i indeksets
ordnede sideliste. De angivne skanningspositioner er enbaserede i denne
liste, ikke PDF-sidetal; der er ikke hentet en PDF til bind 24.

| Manglende trykte sider | Billede før hullet | Billede efter hullet | Skanningspositioner før/efter |
| --- | --- | --- | --- |
| 52–53 | [PA51: trykt s. 51](https://books.google.com/books?id=2F83AAAAMAAJ&pg=PA51) | [PA56: trykt s. 54](https://books.google.com/books?id=2F83AAAAMAAJ&pg=PA56) | 59 / 60 |
| 184–185 | [PA183: trykt s. 183](https://books.google.com/books?id=2F83AAAAMAAJ&pg=PA183) | [PA186: trykt s. 186](https://books.google.com/books?id=2F83AAAAMAAJ&pg=PA186) | 187 / 188 |
| 338–339 | [PA337: trykt s. 337](https://books.google.com/books?id=2F83AAAAMAAJ&pg=PA337) | [PA340: trykt s. 340](https://books.google.com/books?id=2F83AAAAMAAJ&pg=PA340) | 339 / 340 |
| 348–349 | [PA347: trykt s. 347](https://books.google.com/books?id=2F83AAAAMAAJ&pg=PA347) | [PA350: trykt s. 350](https://books.google.com/books?id=2F83AAAAMAAJ&pg=PA350) | 347 / 348 |

Googles side-id PA56 viser altså trykt s. 54. Det er ikke forsvarligt at
bruge PA-tallet som trykt sidetal eller beregne facsimilefiler alene derfra.
Indeksets fravær af PA52–PA55 er ikke dokumentation for fire manglende
trykte sider; det visuelt konstaterede spring er s. 51 til 54.

S. 51 er i den prosaartikel, der begynder som »En Tale«; s. 54 indleder
»Tanker om de Lærdes Befordringer i Staten«. S. 183 og 186 vedrører
aprilhæftets historiske stof. S. 337 og 340 samt s. 347 og 350 er i
junihæftets filosofiske prosa. Hvad der præcist står på de manglende blade,
herunder eventuelle hele versbidrag, kan ikke afgøres fra de bevarede
nabosider. Der er ikke rekonstrueret tekst fra indholdsfortegnelsen.

## Søgning efter erstatningssider

- [Dansk Forfatterleksikons Minerva-opslag](https://danskforfatterleksikon.dk/1850p/p142364.htm)
  og de to årgangsoversigter er undersøgt for alternative digitaliseringer.
  De henviser til HathiTrust, Nasjonalbiblioteket og det supplerende
  Internet Archive-bind 23.
- Internet Archives katalogsøgning `title:minerva AND year:1791` gav ét
  resultat: `minerva-bind-23-1791`. Den fandt ikke et alternativ til bind 24.
  Dette er resultatet af den konkrete søgning, ikke bevis for at et andet
  digitaliseret eksemplar ikke findes.
- Nasjonalbibliotekets katalog-API er undersøgt med `q=Minerva`,
  `mediatype:tidsskrift`, `seriestitle:Minerva` og datointervallet
  1785-01-01–1810-12-31. Begge resultatsider blev hentet: 67 hæfter,
  ingen med udgivelsesår 1791. En særskilt søgning afgrænset til 1791
  gav heller ingen resultater.

## Hvorfor importen er stoppet

`pdf-to-kalliope` kræver stop af videre OCR, transskription og korrektur,
så snart en manglende facsimileside opdages, indtil kildehullet er løst.
Denne regel gælder også, når de kendte nabosider er prosa, der ellers
udelades fra tekstudvalget. De fravalgte omslagsdigte er ikke årsagen til
stoppet.

## Udestående

1. Agent: find og verificér billeder af trykt s. 52–53, 184–185, 338–339
   og 348–349 i bind 24, april–juni 1791, fra samme historiske tryk.
   Alternativt fremskaffes en komplet skanning af bindet. HathiTrust kan
   undersøges selvstændigt, hvis billedadgangen bliver tilgængelig.
2. Agent: efter lukning af kildehullerne udføres hele sideinventaret for
   alle fire bind, inklusive indholdsfortegnelser, vers i prosa, pagination
   og rettelsesark. De øvrige bind er endnu ikke fuldt gennemgået.
3. Agent: importér årets aftalte tekstudvalg, kontrollér attributioner og
   varianter, behandl titelblade og publicér verificerede facsimiler.
4. Agent: gennemfør begge fulde korrekturer, de krævede audits og tests,
   før XML kan mærkes komplet og import-PR'en gøres klar.

Der foreligger ingen afsluttet tekst-, struktur-, typografi- eller
variantkontrol og intet korrekturcheckpoint. Denne rapport er en
kildebaseret status for en stoppet import, ikke en leveret Minerva-årgang.
