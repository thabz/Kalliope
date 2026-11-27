# Minerva 1787, bind 7–10

Versudvalget til [#2401](https://github.com/thabz/Kalliope/issues/2401)
er indsat i `fdirs/tidsskrifterdk/1787-minerva.xml`. Indlagte plancher er
udeladt efter brugerens beslutning. Brugeren foretager selv facsimile-upload
senere og har accepteret, at manglende serverfiler kan holde CI rødt.

| Bind | Hæfter | Farveskanning fra University of Michigan | Billeder | Tekster |
| --- | --- | --- | ---: | ---: |
| 7 | Januar–marts | [Google Books](https://books.google.dk/books?id=dGE3AAAAMAAJ), HathiTrust `mdp.39015065142732` | 440 | 8 |
| 8 | April–juni | [Google Books](https://books.google.dk/books?id=ZFc3AAAAMAAJ), HathiTrust `mdp.39015065142757` | 432 | 5 |
| 9 | Juli–september | [Google Books](https://books.google.dk/books?id=slc3AAAAMAAJ), HathiTrust `mdp.39015065142724` | 384 | 12 |
| 10 | Oktober–december | [Google Books](https://books.google.dk/books?id=OVk3AAAAMAAJ), HathiTrust `mdp.39015065142948` | 470 | 13 |

De 38 tekstposter omfatter alle identificerede komplette digte i udvalget,
herunder indlejrede vers og latinske indskrifter. Messiade-prøven på
s. 129–159 er medtaget i hele Minerva-trykkets omfang. Alle 1.726
billedpositioner er bevaret; XML-facsimilefilnavne er nulbaserede, mens
`facsimile-pages` er enbaseret. Fire beskårne, kontrollerede titelblade er
indsat. Årsværket bevarer `incomplete`, fordi prosaen ikke er importeret.

## Afgrænsning

- Prosa, anmeldelsesstof, historiske artikler og korte citater er udeladt.
  Det gælder bl.a. *Scipio*, *Syvald*, *Damon* og *John Thral*.
- Den spanske sang i bind 8, s. 188–189, angives som begyndelsen efterfulgt
  af »osv.« og er derfor ikke et komplet digt.
- De komplette latinske indskrifter i bind 8, s. 37 og 127, og bind 9,
  s. 267 og 271, er medtaget. Det andet latinske citat på s. 271 slutter
  med »&c.« og er udeladt som fragment.
- De to komplette vers i *Fridlef og Hiarne-Skiald*, bind 9, s. 297 og
  314, er udskilt som tekstposter; gravdigtets latinske kildefodnote er bevaret.
- *Stambøgers Oprindelse*, bind 10, s. 83–84, er medtaget trods fraværet
  i den foreløbige importliste. Den latinske Gerner-gravskrift s. 456 er
  prosa. De korte citater ved s. 66, 172, 206, 223, 226 og 437–438 er
  ikke selvstændige, komplette digte.
- Noderne til *Roserne* på s. 93–94 i bind 9 findes i facsimileserien;
  de er ikke transskriberet som musiknotation.

## Rettelsesark og sidetal

Rettelserne i bind 7, s. 370–371, bind 8, s. 127 og 159, og bind 9,
s. 374, er gennemgået. De vedrører prosa eller tidligere årgange.
Bind 10s upaginerede indholdsfortegnelse retter første linje af
*Ragnhild*: »Østerdal« erstatter »Guldbrands Dal«. Rettelsen er indført
med rettelsesarkskommentar, og alle ark er registreret i værkhovedet.

I *Climene* er s. 221 trykt som 212; `pb` bevarer fejltrykket og angiver
`corrected-n="221"`. *Til Ideal* begynder på den fejltrykte s. 187
(bibliografisk s. 263); `source/@first-n` bevarer 187. Afvigelserne er
forklaret i tekstnoter. Øvrige fejltrykte sidetal i udeladt prosa er ikke
omsat til tekstmarkører.

## Forfattere og relationer

[Nyerups Minerva-register](https://www.kb.dk/e-mat/dod/130020877678.pdf)
er kontrolleret for navne og oversættelser. *De Vornede* registreres under
Pram, som registeret angiver, selv om teksten senere er optaget i Ribers
*Samlede Digte* (1803). Forbindelsen til denne variant er bevaret og
attributionsforskellen forklaret. *De Frigivne* er Ribers oversættelse;
*Najaderne* er Prams efter Dalin. Kendte originalforfattere er forbundet
med oversættelsesmetadata. Sikre varianter af bl.a. Baggesens *Emma*,
*Roserne*, *Orpheus og Eurydice*, Buchholms moderdigt og Rahbeks
Frederikshaldsvise er forbundet med eksisterende tekster.

Hans Christian Bunkeflod, Bendix Djurhuus Prahl og Hans Pontoppidan er
oprettet med livsdata og hele kildekontrollerede biografier. Bunkeflods
og Prahls artikler er fra DBL 1, bind III, s. 253–254, og bind XIII,
s. 262–264. Hans Pontoppidan findes ikke som personopslag i de undersøgte
DBL 1–2-registre eller Salmonsen 2, supplementet og Den nye Salmonsen;
supplementets »H. Pontoppidan« er Henrik. Derfor er reservekilden
[Ehrencron-Müller, bind VI (1929), s. 336–338](https://runeberg.org/hemforf/6/0346.html)
brugt. Dens rettelse af Minerva-registerets fejlagtige tilskrivning af
Messiade-prøven til Johan Ludvig Christian Pontoppidan er kontrolleret
på s. 338. Oversættelsen er Hans Pontoppidans.

Der er registreret syv blankværker for dokumenterede væsentlige udgivelser
og senere udgaver. Ingen videnskabelig standardudgave eller sikkert
forfatterautoriseret samlet slutudgave er identificeret. Bunkeflods
1801-udgave er dokumenteret i Dansk Forfatterleksikon, og Pontoppidans
1776-udgave i Ehrencron-Müller; autorisation hævdes ikke. Prahls biografi
navngiver ingen større digtsamling, som kan registreres sikkert.
Portrætsøgninger gav ingen sikkert dokumenterede, anvendelige portrætter
af de tre personer. Der er derfor ikke oprettet tomme portrætfiler.

## Korrektur og usikkerhed

Alle inkluderede tekstsider er læst direkte mod farveskanningerne under
transskriptionen og igen i en anden session. Rettelser er genkontrolleret.
Tesseract-varianter med forskellig sideinddeling understøtter kontrollen;
Kraken var ikke installeret i det kontrollerede OCR-miljø. Vers, fysiske
ombrydninger, blanke strofeafstande, afsnitsindryk, signaturer, kildens
fodnoter og typografi er kontrolleret særskilt. Lange fortløbende versafsnit
er ikke opdelt i strofer efter metrisk gæt.

På s. 359 i *Najaderne* er et ord efter »Hun m« beskadiget i det valgte
tryk. Det står som `m[ulæseligt]`; ingen anden udgaves ordlyd er indsat.
Dette er et konkret resterende tekststed til brugerens vurdering.
Anonyme signaturer F., P. O. R. og L. H. er ikke identificeret ved gæt.

Den maskinelle side- og strukturaudit samt dens sideinventar, fundregister,
OCR-geometri og uafhængige kandidatdispositioner ligger i arbejdsbundtet
uden for Git. Flere bind genbruger de samme numeriske billedfilnavne;
slutcheckpointet udføres derfor særskilt for hvert bind, sammen med en
ufiltreret helværksanalyse af den samlede XML.

## Facsimiler til manuel upload

Arbejdsbundtet ligger lokalt i `/private/tmp/minerva1787`.
`facsimiles/1787-minerva-07` til `facsimiles/1787-minerva-10` indeholder
originale farve-JPEG'er med bevarede indeks og projektets genererede
thumbnails i `t/`. Der er ikke udført upload. XML peger allerede på disse
fire facsimile-id'er. Upload skal derfor ske før facsimilerne kan vises på
sitet og eventuelle serverkontroller kan blive grønne.

## Slutkontroller

- `make test`: exitkode 0; 152 testsuiter og 2.791 tests bestået, 9 tests sprunget over.
- Statisk build: gennemført uden Elasticsearch-opdatering.
- XML/RELAX NG, biografier, interne id'er og relationer samt `git diff --check`: bestået.
- Tekstønskeregister: ingen fejl; Pontoppidans utrykte *Helten Jens Kofod* er registreret som ønske.
- Ufiltreret helværksanalyse: 39 poesiblokke og 3.741 verssegmenter; alle kandidater disponeret.
- Fraktur-ordaudit: alle 2.638 kandidater afklaret mod de kildekontrollerede sider.
- Fire semantiske sideaudits og fire uafhængige, frosne slutcheckpoints: bestået.
- Facsimiler: 1.726 originaler og 15.534 thumbnails klargjort; upload er overladt til brugeren.
