# Minerva 1790: tekstimport stoppet ved kildehul

Opgaven følger #2404 og afgrænsningen i #2091: digte og øvrige
versbidrag fra bind 19–22 skal samles i `fdirs/tidsskrifterdk/1790-minerva.xml`
med særskilte kilder pr. bind. Prosa og omslagsdigte er fravalgt som
selvstændige tekster; hele bindene skal stadig gennemgås for versbidrag.

Status pr. 25. november 2026: kildeundersøgelse udført; ingen tekstimport.
Den eksisterende bibliografiske XML fra #2390 er bevaret uændret.
Ingen nye tekster, titelbladsbilleder eller facsimiler er publiceret.
Der er ikke udført OCR eller tekstkorrektur.

## Fundne primærkilder

| Bind | Periode | Konkret digitalisering | Kontrol og begrænsning |
| --- | --- | --- | --- |
| 19 | Januar–marts 1790 | [Google Books, l1w3AAAAMAAJ](https://books.google.com/books?id=l1w3AAAAMAAJ) · [HathiTrust, mdp.39015065142930](https://hdl.handle.net/2027/mdp.39015065142930) | Sideindeks hentet; alle PA1–PA436 findes. Ingen visuel sidegennemgang eller komplethedsattest. |
| 20 | April–juni 1790 | [Google Books, SF03AAAAMAAJ](https://books.google.com/books?id=SF03AAAAMAAJ) · [HathiTrust, mdp.39015065143094](https://hdl.handle.net/2027/mdp.39015065143094) | Sideindeks hentet; alle PA1–PA452 findes. Ingen visuel sidegennemgang eller komplethedsattest. |
| 21 | Juli–september 1790 | [Google Books, mV03AAAAMAAJ](https://books.google.com/books?id=mV03AAAAMAAJ) · [HathiTrust, mdp.39015065143086](https://hdl.handle.net/2027/mdp.39015065143086) | Sideindeks hentet og fire billeder undersøgt; Google-id'er afviger fra trykte sidetal. Fuld pagination og billedfølge er ikke kontrolleret. |
| 22 | Oktober–december 1790 | [Google Books, m143AAAAMAAJ](https://books.google.com/books?id=m143AAAAMAAJ) · [HathiTrust, mdp.39015065143078](https://hdl.handle.net/2027/mdp.39015065143078) | Sideindeks hentet; billederne ved PA21 og PA24 bekræfter manglende trykt s. 22–23. |

Google Books-kilderne er fundet ved opslag på Michigan-stregkoderne fra
HathiTrust-henvisningerne i
[5. årgangs oversigt](https://uforbederlig.dk/tidsskrifter/Minerva-5aarg.htm)
og [6. årgangs oversigt](https://uforbederlig.dk/tidsskrifter/Minerva-6aarg.htm).
Der er ikke hentet PDF'er til disse bind. Indeksernes tilstedeværelse af
PA-id'er er ikke dokumentation for billedernes indhold eller fuldstændighed.

## Bekræftet kildehul i bind 22

[PA21 viser trykt s. 21](https://books.google.com/books?id=m143AAAAMAAJ&pg=PA21).
Det umiddelbart følgende billede i den ordnede sideliste,
[PA24, viser trykt s. 24](https://books.google.com/books?id=m143AAAAMAAJ&pg=PA24).
Trykt s. 22–23 mangler således mellem billederne.

De to billeder står på enbaserede skanningspositioner 29 og 30 i Googles
sideliste, som begynder ved PP1. Det er indekspositioner, ikke PDF-sidetal
eller publicerede facsimilefilnavne.

Begge nabosider indeholder prosa i oktoberhæftets indledende tale.
[Årgangsoversigten](https://uforbederlig.dk/tidsskrifter/Minerva-6aarg.htm)
registrerer denne på s. 1 og næste artikel på s. 23. Den manglende s. 23
kan ikke kontrolleres, og eventuelle vers på de manglende sider kan ikke
udelukkes eller rekonstrueres ud fra indholdsfortegnelsen. Der er ikke
indsat tekst fra en anden udgave.

## Indeksafvigelser i bind 21

Som del af samme kontrol blev følgende billeder undersøgt:

- [PA60](https://books.google.com/books?id=mV03AAAAMAAJ&pg=PA60)
  viser trykt s. 60; næste billede
  [PA63](https://books.google.com/books?id=mV03AAAAMAAJ&pg=PA63)
  viser trykt s. 61. Fraværet af PA61–PA62 i indekset er derfor ikke
  i sig selv et bekræftet hul i den trykte pagination.
- [PA271](https://books.google.com/books?id=mV03AAAAMAAJ&pg=PA271)
  viser trykt s. 271; næste billede
  [PA274](https://books.google.com/books?id=mV03AAAAMAAJ&pg=PA274)
  viser en figurplade uden trykt sidetal. Fraværet af PA272–PA273
  kan ikke fortolkes uden yderligere billedkontrol.

Bindets fulde mapping mellem Google-id'er og trykte sider udestår.
Der hævdes hverken komplethed eller yderligere sikre sidehuller i bind 21.

## Søgning efter erstatningssider

- De to årgangsoversigter identificerer de konkrete HathiTrust-eksemplarer.
  Google Books-parallellen til bind 22 er identificeret via samme
  Michigan-stregkode. Den selvstændige HathiTrust-billedadgang blev forsøgt
  ved `babel.hathitrust.org/cgi/pt?id=mdp.39015065143078&seq=30`, men
  svarede HTTP 403. Billedernes indhold dér er derfor ikke kontrolleret.
- Internet Archives katalogsøgning `title:minerva AND year:1790` gav
  ingen resultater. Det er resultatet af denne konkrete søgning,
  ikke bevis for at andre skanninger ikke findes.
- Nasjonalbibliotekets katalog-API blev undersøgt med `q=Minerva`,
  `mediatype:tidsskrift`, `seriestitle:Minerva` og datointervallet
  1790-01-01–1790-12-31. Resultatet var nul hæfter.

## Hvorfor importen er stoppet

`pdf-to-kalliope` kræver stop af videre OCR, transskription og korrektur,
så snart en manglende facsimileside opdages, indtil kildehullet er løst.
De fravalgte omslagsdigte er ikke årsagen til stoppet. Reglen gælder
også, når de kendte nabosider er prosa uden for tekstudvalget.

## Udestående

1. Agent: fremskaf og verificér trykt s. 22–23 fra bind 22,
   oktober–december 1790, fra samme historiske tryk, eller en komplet
   alternativ skanning. HathiTrust kan undersøges selvstændigt, hvis
   billedadgangen bliver tilgængelig.
2. Agent: efter lukning af kildehullet udføres fuldt sideinventar for
   alle fire bind, inklusive pagination, indholdsfortegnelser,
   vers i prosa og rettelsesark. Afvigelserne i bind 21 afklares
   direkte mod billederne.
3. Agent: importér årets aftalte udvalg i den eksisterende årgangsfil,
   kontrollér attributioner og varianter, behandl titelblade og publicér
   verificerede facsimiler.
4. Agent: gennemfør begge fulde korrekturer, audits og tests før
   færdigstatus.

Ingen tekst-, struktur-, typografi- eller variantkontrol er afsluttet,
og der findes intet korrekturcheckpoint for årgangen. Rapporten er
status for en stoppet import, ikke en leveret tekstårgang.
