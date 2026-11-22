# De gamle Eddadigte (1932): importstatus

Arbejdet vedrører issue #2259. Værket er en **ufærdig import** med alle 36
opførte digte; der er ikke attesteret fuld facsimilekorrektur.

## Kilder og omfang

- Finnur Jónsson (udgiver): *De gamle Eddadigte*, G. E. C. Gads Forlag,
  København, 1932. Titelbladet er kontrolleret visuelt.
- Digital transskription: [Heimskringla](https://heimskringla.no/wiki/De_gamle_Eddadigte).
  De konkrete sider krediteres ved hvert digt; versionsnumre står i XML-kommentarer.
- Kontrol-PDF: [Septentrionalia](https://www.septentrionalia.net/etexts/eddadigte.pdf),
  386 PDF-sider. Trykt side 1 er PDF-side 15 (offset +14).
- Ingen OCR er kørt. PDF'ens allerede eksisterende tekstlag er alene brugt som
  hjælp til kildekontrol. Digtteksten er hentet fra Heimskringla.
- Forord V–XV, danske kommentarer, kritiske bemærkninger 343–359 og registre
  360–371 er udeladt efter issuets afgrænsning. Indholdsfortegnelsen står på
  sidste PDF-side ([372]). Oldnordisk rammeprosa og versrelaterede trykte
  fodnoter er medtaget.
- Webannoncer og navigation er udeladt. Der er ikke fundet selvstændige nyere
  bidrag i de udtrukne digtdele. Heimskringlas
  [krediteringsønske](https://heimskringla.no/wiki/Opphavsrett) er fulgt.

## Udført kontrol og redaktionelle valg

- Indholdsfortegnelsens 36 digte, rækkefølge og nedenstående sideintervaller
  er visuelt afstemt med PDF'ens sidste side.
- Titelbladet er behandlet med `prepare-kalliope-titlepage`; geometrisk QA bestod.
  Der er ingen retouchering eller opskalering.
- Heimskringlas efterstillede stjerner repræsenterer trykkets lille sats.
  De er omsat til `<small>` efter visuel kontrol i Vǫluspǫ́, Vafþrúðnismǫ́l,
  Þrymskviða og Hamðismǫ́l. Øvrige anvendelser kræver fuld sidekontrol.
- Vǫluspǫ́ 65 står i trykkets fodnote til strofe 64; den er bevaret som
  fodnote og ikke indsat i hovedteksten. Det samme gælder den alternative
  strofe 34 i fodnoten til 35.
- Tre kildeprosastykker er fejlagtigt gråmarkeret som kommentarer på nettet:
  Grímnismǫ́l (»Geirrøðr konungr sat«), Skírnismǫ́l (»Skírnir reið«) og
  Vǫlundarkviða (»Níðuðr konungr gaf«). De er medtaget som prosa.
- Goðrúnarkviða I 22, s. 267: Heimskringlas `BrynhiIdar` er rettet til
  trykkets `Brynhildar` efter visuel kontrol; rettelsen er dokumenteret i XML.
- Fjǫlsvinnsmǫ́l 38, s. 179, har lakunepunkter før et komma. Den lokale
  `space-before-comma`-undtagelse bevarer det kildebekræftede forhold.
- `is` følger Kalliopes eksisterende sprogkode for oldnordiske/oldislandske
  eddatekster; Finnur Jónsson er udgiver, og forfatterskabet er anonymt.
- 1932-udgaven og den eksisterende 1787-udgave står direkte på værklisten for
  samlingen *Den ældre Edda*.
  Bogens indholdsfortegnelse har ikke selv overskrifter for gude-/heltedelen;
  der er derfor ikke opfundet sådanne sektionsoverskrifter.
- Þrymskviða er forbundet som variant med teksten fra 1787. Fem tekster hos
  Gjellerup er forbundet med originaler: Vafthrudnesmál, Grimnesmál,
  Vegtamskvide, Thrymskvadet og Sangen om Hárbard. Gjellerups 32 strofer i
  Thrymskvadet svarer til 1932-udgavens 34, idet 5+6 og 25+26 er samlet.
  Grimnesmál omordner store dele i tematiske tillæg. Relationerne identificerer
  digtene; de hævder ikke, at Gjellerup har benyttet udgaven fra 1932.

## Resterende agentarbejde før færdigstatus

1. Gennemgå samtlige relevante facsimilesider visuelt mod XML, inklusive
   diakritik, usikre læsninger, tegnsætning, versnumre, talerlabels,
   prosagrænser, indryk og lille sats. Foreløbige stikprøver er ikke en fuld korrektur.
2. Kortlæg alle fysiske sideskift inde i teksterne og indsæt korrekte `<pb>`.
   Publicér komplette facsimiler via projektets normale værktøjer, hvis de
   skal integreres i Kalliopes billedviser; de eksterne PDF-links virker
   allerede med konkrete startsideankre. Der er endnu ingen `<pagebreaks/>`-attest.
3. Gennemgå hele PDF'en visuelt for rettelsesark. Der er intet særskilt ark i
   indholdsfortegnelsen, men det er ikke tilstrækkeligt til `errata status="none"`.
4. Afklar alle kandidater fra `analyze-whole-work.js` mod facsimilet; den første
   analyse er kørt, men kandidaterne er ikke alle gennemgået.
5. Udfør uafhængig anden korrekturgennemgang, genkontrollér fund, og tilføj
   først derefter kvalitetsflag og korrekturattest. Bevar `status="incomplete"`
   indtil kravene er opfyldt.
6. Sammenhold Gjellerups Havamál og Vølvens Spaadom med den konkrete udgaves
   omordninger og udeladelser, før der oprettes yderligere oversættelsesrelationer.

## Digtinventar

Tekst-id'er har præfikset `eddadigte20261120` og det to-cifrede nummer nedenfor.
Siderne inkluderer bogens tilhørende kommentarer; kommentarer er ikke digttekst.

| Nr. | Titel | Trykte sider | Heimskringla-version |
| --- | --- | --- | --- |
| 01 | Vǫluspǫ́ | 1-20 | [kilde](https://heimskringla.no/./index.php?title=V%C7%ABlusp%C7%AB%CC%81&oldid=60155) |
| 02 | Hávamǫ́l | 21-52 | [kilde](https://heimskringla.no/./index.php?title=H%C3%A1vam%C7%AB%CC%81l&oldid=65514) |
| 03 | Vafþrúðnismǫ́l | 53-62 | [kilde](https://heimskringla.no/./index.php?title=Vaf%C3%BEr%C3%BA%C3%B0nism%C7%AB%CC%81l&oldid=65549) |
| 04 | Grímnismǫ́l | 63-73 | [kilde](https://heimskringla.no/./index.php?title=Gr%C3%ADmnism%C7%AB%CC%81l&oldid=65576) |
| 05 | Skírnismǫ́l | 74-81 | [kilde](https://heimskringla.no/./index.php?title=Sk%C3%ADrnism%C7%AB%CC%81l&oldid=61093) |
| 06 | Hárbarðsljóð | 82-90 | [kilde](https://heimskringla.no/./index.php?title=H%C3%A1rbar%C3%B0slj%C3%B3%C3%B0_(FJ)&oldid=65608) |
| 07 | Hymiskviða | 91-99 | [kilde](https://heimskringla.no/./index.php?title=Hymiskvi%C3%B0a_(FJ)&oldid=65633) |
| 08 | Lokasenna | 100-113 | [kilde](https://heimskringla.no/./index.php?title=Lokasenna_(FJ)&oldid=57712) |
| 09 | Þrymskviða | 114-119 | [kilde](https://heimskringla.no/./index.php?title=%C3%9Erymskvi%C3%B0a_(FJ)&oldid=71189) |
| 10 | Vǫlundarkviða | 120-130 | [kilde](https://heimskringla.no/./index.php?title=V%C7%ABlundarkvi%C3%B0a&oldid=65752) |
| 11 | Alvíssmǫ́l | 131-138 | [kilde](https://heimskringla.no/./index.php?title=Alv%C3%ADssm%C7%AB%CC%81l&oldid=65717) |
| 12 | Baldrs draumar | 139-142 | [kilde](https://heimskringla.no/./index.php?title=Baldrs_draumar_(FJ)&oldid=65692) |
| 13 | Hyndluljóð | 143-150 | [kilde](https://heimskringla.no/./index.php?title=Hyndlulj%C3%B3%C3%B0_(FJ)&oldid=61007) |
| 14 | Vǫluspǫ́ hin skamma | 151-153 | [kilde](https://heimskringla.no/./index.php?title=V%C7%ABlusp%C7%AB%CC%81_hin_skamma&oldid=57716) |
| 15 | Rígsþula | 154-164 | [kilde](https://heimskringla.no/./index.php?title=R%C3%ADgs%C3%BEula_(FJ)&oldid=60981) |
| 16 | Gróttasǫngr | 165-170 | [kilde](https://heimskringla.no/./index.php?title=Gr%C3%B3ttas%C7%ABngr&oldid=66062) |
| 17 | Grógaldr | 171-174 | [kilde](https://heimskringla.no/./index.php?title=Gr%C3%B3galdr_(FJ)&oldid=57718) |
| 18 | Fjǫlsvinnsmǫ́l | 174-181 | [kilde](https://heimskringla.no/./index.php?title=Fj%C7%ABlsvinnsm%C7%AB%CC%81l&oldid=61087) |
| 19 | Vǫlsungakviða (Helg. hund. I) | 182-194 | [kilde](https://heimskringla.no/./index.php?title=V%C7%ABlsungakvi%C3%B0a&oldid=65789) |
| 20 | Helgakviða Hjǫrvarðssonar | 195-206 | [kilde](https://heimskringla.no/./index.php?title=Helgakvi%C3%B0a_Hj%C7%ABrvar%C3%B0ssonar&oldid=65774) |
| 21 | Vǫlsungakviða hin forna (Helg. hund. II) | 207-221 | [kilde](https://heimskringla.no/./index.php?title=V%C7%ABlsungakvi%C3%B0a_hin_forna_(Helg._hund._II)&oldid=65815) |
| 22 | Grípisspǫ́ | 222-231 | [kilde](https://heimskringla.no/./index.php?title=Gr%C3%ADpissp%C7%AB%CC%81&oldid=65834) |
| 23 | Reginsmǫ́l | 232-239 | [kilde](https://heimskringla.no/./index.php?title=Reginsm%C7%AB%CC%81l&oldid=65857) |
| 24 | Fáfnismǫ́l | 239-248 | [kilde](https://heimskringla.no/./index.php?title=F%C3%A1fnism%C7%AB%CC%81l&oldid=65872) |
| 25 | Sigrdrífumǫ́l | 249-257 | [kilde](https://heimskringla.no/./index.php?title=Sigrdr%C3%ADfum%C7%AB%CC%81l&oldid=65282) |
| 26 | Sigurðarkviða hin meiri (Brot) | 258-262 | [kilde](https://heimskringla.no/./index.php?title=Sigur%C3%B0arkvi%C3%B0a_hin_meiri_(Brot)&oldid=65896) |
| 27 | Goðrúnarkviða (I) | 263-268 | [kilde](https://heimskringla.no/./index.php?title=Go%C3%B0r%C3%BAnarkvi%C3%B0a_(I)&oldid=65913) |
| 28 | Sigurðarkviða hin skamma | 269-282 | [kilde](https://heimskringla.no/./index.php?title=Sigur%C3%B0arkvi%C3%B0a_hin_skamma&oldid=69312) |
| 29 | Helreið | 283-285 | [kilde](https://heimskringla.no/./index.php?title=Helrei%C3%B0&oldid=64957) |
| 30 | Goðrúnarkviða hin forna (II) | 286-295 | [kilde](https://heimskringla.no/./index.php?title=Go%C3%B0r%C3%BAnarkvi%C3%B0a_hin_forna_(II)&oldid=65975) |
| 31 | Goðrúnarkviða (III) | 296-298 | [kilde](https://heimskringla.no/./index.php?title=Go%C3%B0r%C3%BAnarkvi%C3%B0a_(III)&oldid=65369) |
| 32 | Oddrúnargrátr | 299-304 | [kilde](https://heimskringla.no/./index.php?title=Oddr%C3%BAnargr%C3%A1tr&oldid=68376) |
| 33 | Atlakviða | 305-313 | [kilde](https://heimskringla.no/./index.php?title=Atlakvi%C3%B0a_(FJ)&oldid=69365) |
| 34 | Atlamǫ́l | 314-331 | [kilde](https://heimskringla.no/./index.php?title=Atlam%C7%AB%CC%81l&oldid=66025) |
| 35 | Goðrúnarhvǫt | 332-336 | [kilde](https://heimskringla.no/./index.php?title=Go%C3%B0r%C3%BAnarhv%C7%ABt&oldid=65412) |
| 36 | Hamðismǫ́l | 337-342 | [kilde](https://heimskringla.no/./index.php?title=Ham%C3%B0ism%C7%AB%CC%81l&oldid=66048) |
