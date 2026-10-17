# Ossians Digte: forundersøgelse til #1825

Status 17. oktober 2026: **ufærdig import**. Ingen værkstekst er indsat eller
korrekturlæst. Der er ikke påvist en kildekløft ved de undersøgte steder;
rapporten er ikke en attest for hele skanningens fuldstændighed.

## Kilde og metadata

- Eksisterende værk: `fdirs/blicher/1807.xml`, fortsat `status="incomplete"`.
- [KB's katalogpost](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122889916105763).
- [PDF](https://www.kb.dk/e-mat/dod/115408047875.pdf), 605 PDF-sider.
- SHA-256 for den undersøgte PDF:
  `7f4236e99808eed0bcd1b7fa152b62716a78f3eacf8da445090741369a736db1`.
- KB's offentlige PNX-metadata beskriver digitaliseringen som »Digitalisering
  2013 af udgaven: Kbh.: <<Den >>Wahlske Boghandling, [1807-09] (1-2 i 1 bd.).«
  Posten angiver »Med omtrykt titelblad uden år.« og eksemplaret `54,-322 8°`.
  Metadata indeholder samme PDF-link som ovenfor.
- Titelbladene på PDF-side 6 og 330 angiver *Ossians Digte*, oversat af
  Steen Steensen Blicher, Første/Andet Bind, Kjøbenhavn, den Wahlske
  Boghandling og Andreas Seidelin. De har intet trykt årstal.

Værkpostens titel og kilde er opdateret efter disse oplysninger. Årstallet
`1807,1809` er bevaret; der er ikke indført en ny datering ud fra de omtrykte
titelblade.

## Foreløbig sidekortlægning

PDF-siderne er enbaserede. Facsimilefilnavne nedenfor følger projektets
nulbaserede konvention; der er endnu ikke publiceret facsimilebilleder.

| PDF-sider | Indhold |
| --- | --- |
| 1–5 | Digitaliseringsblad, bind og forsats |
| 6 | Første binds titelblad |
| 8 | Tilegnelse til Wilhelm v. Harbou |
| 10–35 | Fortale |
| 36–37 | Første dels indholdsfortegnelse |
| 38–329 | Første binds arabisk paginerede del, s. 1–292 |
| 330 | Andet binds titelblad |
| 332–333 | Anden dels indholdsfortegnelse |
| 334–576 | Andet binds tekster og anmærkninger, s. 1–243 |
| 577–598 | Navne-register, s. 244–265 |
| 599 | Rettelsesark for begge dele (`598.jpg`) |
| 600–605 | Blanke blade, forsats og bind |

Alle PDF-sider er set i miniatureoversigter. Dette er en indledende
layoutkontrol, ikke en fuld læsning af hver side. PDF'ens eksisterende tekstlag
er kun brugt diagnostisk til at finde mistankesteder; det er ikke et
transskriptionsgrundlag.

En separat session har kontrolleret følgende steder direkte mod billederne:

- PDF 161–164: s. 124 efterfølges af *Fingal*-halvtitel, blank verso og
  *Første Sang*. Der mangler ikke tekst ved de unummererede sider 125–127.
- PDF 334–340: *Temora* begynder på den unummererede første side, efterfulgt
  af s. 2–7. Afvigende tal i tekstlaget er OCR-fejl.
- PDF 371–376: pagineringen er 38, 39, fejltrykt 30, 41, 42, 43.
  PDF 373 (`372.jpg`) svarer til s. 40; slutordet »Han« fortsættes på
  PDF 374 med »udstrakte sin Haand«. Det er ikke et manglende opslag.
- PDF 599 indeholder rettelser til både første og anden del.

## Titelblade og OCR

Begge titelblade er udtrukket fra PDF'ens indlejrede billeder i deres
oprindelige opløsning. `prepare-kalliope-titlepage` er kørt med analyse,
foreslået rotation/beskæring og QA. Begge resultater er `manual-review`:
første binds kandidat overskrider grænserne for højre kant, top og bund;
andet binds kandidat overskrider grænserne for højre kant og top.
Ingen kandidat er lagt i `public/images/`.

OCR/PDF-miljøet er kontrolleret med `tools/ocr-environment`; den eksisterende
Kraken-installation er bevaret. Fraktur-forberedelsen er afbrudt under
300-DPI-renderingen; der foreligger endnu ikke et færdigt, verificeret
OCR-bundle eller en OCR-baseret transskription. Forberedelsen skal køres færdig
ved genoptagelse. Ingen OCR-filer eller PDF-billeder er medtaget her.

## Resterende arbejde

Alle punkter nedenfor er fortsat agentarbejde i #1825:

- Færdiggør og verificér sideinventaret mod læsbare billeder, herunder
  sidetalsafvigelser, alle tekstgrænser og samtlige anmærkninger.
- Færdiggør frisk OCR med mindst to strategier og indsæt hele teksten i XML,
  inklusive fortale, tilegnelse, navne-register og øvrig relevant paratekst.
- Indarbejd rettelsesarket; registrér det som `errata` og mærk rettelserne
  efter XML-formatet. Arket skal ikke være en selvstændig tekstpost.
- Afklar titelbladenes billedbehandling, og tilføj godkendte billeder med
  fuldstændige titelbladstransskriptioner.
- Registrér præcise sideskift, kildesider, personer og oversættelsesrelationer;
  gennemgå værkets variantkandidater.
- Gennemfør første fulde korrektur og en uafhængig anden gennemgang, inklusive
  prosaafsnit, vers, indryk, typografi og noter; genkontrollér alle rettelser.
- Gennemfør slutcheckpoint, facsimilepublicering og renderingskontrol.

Der er ikke tilføjet kvalitetsflag, korrekturattest eller `pagebreaks`-erklæring.
Opgaven må ikke markeres løst på grundlag af denne forundersøgelse.
