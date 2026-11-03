# Rosenblade (1818): kildegrundlag og importstatus

Status 3. november 2026: Hele antologien er indført og korrekturlæst to gange
mod facsimilet, med uafhængig slutkontrol. Værket er registreret som komplet
i `fdirs/antologierdk/1818-rosenblade.xml` med kvalitetsflag og modelattester.

## Udgave og omfang

*Rosenblade. Samlede af J. M. Thiele.* Kjøbenhavn: Forlagt af Brødrene
Thiele, 1818. Trykt i Thieles Bogtrykkerie.

[KB's digitale katalogpost](https://soeg.kb.dk/permalink/45KBDK_KGL/1o797oc/alma99122531811205763)
identificerer en digitalisering fra 2014 af eksemplaret `52,-54 8°` med
omfanget `[12], 155, [1] s., noder`. Postens beskrivelse, »Vis online« og
PDF-link er verificeret i katalogets brugerflade.

Facsimilet har 12 upaginerede forblade fra titelblad til halvtitlens verso.
Dermed understøtter sideinventaret KB's `[12]` frem for de `[8]`, som
[Dansk Forfatterleksikon](https://www.danskforfatterleksikon.dk/1850tit/0089/sknr89731.htm)
angiver. Værket registreres som en selvstændig antologi fra 1818; titelblad,
KB-post og Forfatterleksikon dokumenterer ikke en fortløbende årgangsserie.

## Et dokumenteret og løst kildehul

[KB-PDF'en](https://www.kb.dk/e-mat/dod/11520800361D.pdf) havde ved hentning
3. november 2026 177 sider og 25.904.260 bytes. Den springer direkte fra
trykside 141 på PDF-side 158 til trykside 144 på PDF-side 159. Hullet ligger
midt i Søtofts *Magnetismen*. Importen blev først stoppet efter
`pdf-to-kalliope`-skillens regel om manglende facsimilesider.

Hullet er siden løst med faktiske billeder af tryksiderne
[142](https://books.google.com/books?id=27UYVHipzecC&pg=PA142) og
[143](https://books.google.com/books?id=27UYVHipzecC&pg=PA143) fra Google Books,
bind `27UYVHipzecC`. Den alternative digitaliserings titelblad er set direkte
og bekræfter samme titel, samler, forlag, trykkested og år 1818. Begge
manglende tekstsider er læst visuelt. Der er ikke rekonstrueret tekst fra
OCR, erindring eller en anden udgave.

Det publicerede facsimile er sammensat af KB-PDF'en med de to Google-billeder
indsat efter KB-PDF-side 158. De oprindelige kildefiler er bevaret uændret.
Sammensætningen er oplyst i værkets læserrettede kildenote.

| Materiale | SHA-256 |
| --- | --- |
| Original KB-PDF | `9bce42649bc35c3348492138dfd19afeba8d59df987e610dfff86c67e4778f97` |
| Google, s. 142 | `531cb97cf2f84b811a961a073dea85066b46e80dc0045d24e7968a18fdb9af5c` |
| Google, s. 143 | `1d5616958a6a6812ad7634e8a7b81fd4e36cd6e9918cc4b64fff9c560b73169d` |
| Sammensat PDF, 179 sider | `d4d587b21fd0a9d4442cc5b7374bcb74055fb40b24ae66439af008c48aab4a1f` |

## Sideinventar og billeder

Alle nedenstående PDF-sider gælder det sammensatte facsimile. Billedfilnavne
er nulbaserede; PDF-side 20 er `019.jpg`.

| PDF-sider | Indhold |
| --- | --- |
| 1–5 | KB's digitaliseringsblad, indbinding og blanke blade |
| 6–9 | Titelblad, blank verso, tilegnelse og blank verso |
| 10–13 | Ét usigneret indledningsdigt med fire sonetter |
| 14–15 | Indholdsfortegnelse |
| 16–17 | Halvtitel og blank verso |
| 18–172 | Tryksider [1]–155, inklusive dramatiske titelblade og rolleliste |
| 173 | Kolofon |
| 174 | Nodebilag til »Hyrdens Morgensang« |
| 175–179 | Blanke blade og indbinding |

Titelbladet er `1818-rosenblade-p1.jpg`; geometrisk QA er bestået med
rotation 0,18°, uden opskalering eller stempelfjernelse. Der er ingen særskilt
grafisk forside. `p3` og `p4` er de to dramatiske titelblade; `p5` er nodebladet.
Nodebladets fem egentlige nodesystemer er komplette, også sammenholdt med
Google Books' PT2. KB-billedets smalle foldrest i venstre kant er bevaret.

De 179 facsimilebilleder og 1.611 thumbnails er genereret med repositoryets
facsimileværktøj og synkroniseret. Den offentlige `000.jpg` er kontrolleret
med HTTP 200. Der er ikke fundet noget trykt rettelsesark ved sidegennemgangen.

## Tekster, personer og relationer

XML'en indeholder 55 tekstposter og tre grupperende sektioner. Tilegnelse,
indledningsdigt, dramaer, eventyr og indlagte vers er medtaget. Indholdsregister,
kolofon og indbinding er ikke oprettet som litterære tekster. Nodebladet er
knyttet til sin sang som billede.

- Indledningsdigtets fire sonetter er kildebestemt til Thiele ved den senere
  optagelse som »Rosenblade« I–IV i *Vragstykker af et Digterskib* (1848).
  Her bevares én tekst, fordi 1818-trykket ikke har delnumre eller andre sikre
  tekstgrænser mellem siderne. Noten forbinder den med de fire senere afsnit;
  der oprettes ikke et misvisende variantlink fra hele forløbet til kun én del.
- Poul Martin er registreret som Poul Martin Møller.
- Signaturen C. P. Wilster bevares uden automatisk identitetsmatch.
  »Gaade« er tekstligt sammenholdt med Christian Wilsters *Digtninger* (1827),
  s. 3–4; den konkrete senere version er linket i en note. Navneafvigelsen og
  ophavet til »Sonet / til den sexaarige Emma« er fortsat usikre.
- »Svanhvide« forbliver anonym. En senere optagelse i Thieles samlinger af
  folkeeventyr er ikke i sig selv belæg for individuelt forfatterskab.
- Staffeldts eksisterende id `staffeldt2001052705` er bevaret og flyttet fra
  `andre.xml` til antologien med frisk facsimilebaseret tekst, bevaret kredit
  og den præcise kildehenvisning *Rosenblade*, 1818, s. 122–123.
- Sikkert dokumenterede senere tekstversioner er forbundet efter tekstlig
  sammenligning. Eksisterende udgavers brødtekst er ikke brugt til at oprette
  den nye transskription.
- »Kong Svegder« er forbundet med Geijers »Swegder« fra *Iduna* (1811).
  »Sonet af Mendoza« er forbundet med den allerede indsatte spanske sonet,
  som Cervantes-udgaven fører under Diego Mendoza de Barros. Forfatterleksikons
  tilskrivning til Diego Hurtado de Mendoza er ikke overført ukritisk.

Staffeldt-digtets mulige forlæg er ikke sikkert identificeret. *Danske Studier*
1945, s. 93, note 3, henviser til John Carr og en anmeldelse fra 1818, mens
*Driewerf zalig Noorden* peger på en beslægtet tekst af Katharina
Bilderdijk-Schweickhardt og diskuterer et muligt fælles forlæg. Carrs
»Verses on an Autumnal Leaf« i *Poems* (1809) er ikke et sikkert tekstmatch.
Der er derfor ikke indsat en udokumenteret original eller oversættelsesrelation.

## Simon Meisling

Meisling er oprettet med kildebekræftede persondata og hele S. B. Thriges
biografi fra *Dansk biografisk Lexikon*, 1. udgave, bind 11 (1897), s. 237–238.
Artiklen er kontrolleret mod begge facsimilesider. Fødselsdatoen følger
DBL3/Wikidata, 6. oktober 1787; DBL1's alternative 7. (eller 6.) oktober
bevares i den diplomatiske biografitekst.

*Munkelist* og oversættelsen af *Æneiden* er registreret som bibliografiske
blankværker. *Munkelist*s titelblad viser 1813, selv om den digitale KB-post
angiver 1818 og DBL1-biografien nævner 1812. Værkets metadata følger
selve titelbladet; biografiens historiske ordlyd er bevaret. Den undersøgte
KB-katalogsøgning gav ingen dokumenteret videnskabelig eller forfatterautoriseret
samlet digtudgave af Meisling.

Portrætsøgningen fandt en lille karikatur på Commons (182 × 295 pixels,
ukendt kunstner, kildeangivelse til KB). Den er ikke indført som repræsentativt
portræt; der er ikke oprettet en tom portrætfil.

## Korrektur og kontrolgrundlag

Der er lavet et valideret Fraktur-bundle med 300-DPI-billeder og distribuerede
benchmark-sider, supplerende Kraken-læsninger samt to friske Tesseract-passager
(PSM 3 og 6) på alle relevante sider. PDF'ens eksisterende tekstlag er kun
brugt diagnostisk. Producentgennemgangen og den uafhængige slutkorrektur er afsluttet. De tre
slutreviewere er roteret til andre kildeintervaller end deres egne kandidater.

Scratch med kildefiler, OCR, sidejournaler, findings, strukturanalyser og
billed-QA ligger under `/tmp/rosenblade-1818/` og indgår ikke i repositoryet.
Det er midlertidigt; de stabile kildehenvisninger og checksums ovenfor gør
kildegrundlaget identificerbart.

Den afsluttende kontrol omfatter 179 fysiske sider, 161 semantiske sider og
57 poesiblokke med 2.612 verslinjer. Alle interne sideskift er angivet med
106 præcist placerede `pb`-markører; `pagebreaks` og `errata status="none"` er
registreret. Alle prosaafsnits grænser, indryk og afstande samt alle
verslinjer, strofer, indryk, overskrifter og fremhævelser er sidekontrolleret.

*Elskovsvandren*, s. 73, læses »Blomsteraa«. Både KB- og Google-eksemplaret
har en lav trykplet efter sidste a; ingen selvstændig s-kontur kan bekræftes.
Den læselige ordform er bevaret uden rekonstruktion af en hypotetisk
beskadiget type. Tryksærheder som »Det et saa nylig« og »Hædersblod« er
kontrolleret visuelt og ikke rettet efter forventet betydning.

## Slutvalidering

- Semantisk sideaudit: 161 sider, ingen problemer.
- Sidebaseret historisk OCR-profil: alle 2.031 aktuelle kandidat-id'er gennemgået.
- Helværksanalyse uden tekstfilter: alle 125 kandidater har kildebelagt disposition
  (51 strofe-/linjekandidater, 65 indrykningskandidater, 9 manuelle geometrikontroller).
- Alle 57 poesiblokke har uafhængigt observerede strofelængder, indryk og
  komplette lister over visuelt kontrollerede facsimilesider.
- Samlet findings-register: 2.395 poster; 163 verified, 43 withdrawn og
  2.189 rejected. Ingen åbne eller kun rettede fund. Historiske og erstattede
  kandidat-id'er er bevaret.
- Almindelig OCR-rapport: ingen kandidater.
- Variantkontrol: den eneste resterende kandidat er indledningsdigtet over
  for første senere sonet; den er afvist som helhed/del-relation. Ingen warnings.
- Person-editorial: ingen fejl og ingen nye ønskematch fra importen.
- Facsimilekontrol: 619 værkfacsimiler og 1.238 offentlige billeder kontrolleret.
- `make test`: exitkode 0; 139 testsuiter og 2.347 tests bestået (1 suite og 9 tests oversprunget efter repositoryets konfiguration).
