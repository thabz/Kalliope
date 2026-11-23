# Kilder og korrektur til H.A. Brorsons eksisterende tekster

Kontrolleret 16. oktober 2026 til [#1968](https://github.com/thabz/Kalliope/issues/1968).
Udgangspunktet er de 133 Brorson-poster i det genererede korpus fra
14. oktober 2026 (`built_at: 2026-10-14T16:12:50.152Z`; tekstfilens SHA-256
`923c6363361a70e4652b13ba1520f876a97b48cb927d24c6b90f5190c63f440b`).
Listen omfatter også de to forekomster i *Danske Kirke-Psalmer* (1835).
Alle 133 gamle tekst-URL'er bevares. Der er efter arbejdet 142 kanoniske poster:
130 Koch-tekster, ti særskilte 1732-versioner og to antologibearbejdelser.

## Udgave og struktur

Hans Adolph Brorson: *Samlede Skrifter*, ved L. J. Koch, udgivet af Det Danske
Sprog- og Litteraturselskab under tilsyn af Paul Diderichsen og Ejnar Thomsen,
København: O. Lohses Forlag, Eftf. Tryk: Missionstrykkeriet, Kbhvn., v/ O. Sibbuhr.
Titelblade og tilgængelige kolofoner er kontrolleret; trykkeroplysningen er
også bekræftet i [DSL's bibliografi](https://www.ronlev.dk/bibliotek/0151.pdf).

| Bind | År | Digital tekst hos KB | Kalliopes fotografiske PDF | Billeder | Offset |
| --- | ---: | --- | --- | ---: | ---: |
| I | 1951 | [Troens rare Klenodie, 1.–2. del](https://tekster.kb.dk/text/adl-texts-brorson01-root) | [PDF](https://kalliope.org/facsimiles/brorson/1951-1.pdf) | 409 | 28 |
| II | 1953 | [Troens rare Klenodie, 3.–7. del og tillæg](https://tekster.kb.dk/text/adl-texts-brorson02val-root) | [PDF](https://kalliope.org/facsimiles/brorson/1951-2.pdf) | 442 | 10 |
| III | 1956 | [Svane-Sang, Lissabon, mindre digte og prosa](https://tekster.kb.dk/text/adl-texts-brorson03grval-root) | [PDF](https://kalliope.org/facsimiles/brorson/1951-3.pdf) | 546 | 4 |

Hovedværket `brorson/1951` har tre selvstændige underværker `1951-1`–`1951-3`.
Inddelingen følger Kochs dele og underafsnit, herunder de to parter af
*Troens Grund*. Alle fire værkposter har `status="incomplete"`, fordi det er
udvalg af udgaven. `1739` og `1765` er bevaret som tomme historiske værkposter
med oprindelige titler, år og henvisninger. `andre` bevarer sit værklink som
henvisningsbeholder for bind III.

Koch redegør i I, s. XVII–XXI, for tekstgrundlaget: hovedteksten til
*Troens rare Klenodie* følger overvejende fjerde udgave (1752), med udgiverens
rettelser. Den må ikke betegnes som en transskription af førstetrykket fra
1739. De ti eksisterende tekster fra *Nogle Jule-Psalmer* (1732) bevarer
ordlyden og egne id'er efter brugerens valg; ti nye Koch-versioner er indsat
og variantforbundet. Koch I, s. IX, dokumenterer 1732-trykkets bibliografi.
Der er ikke opfundet sidetal eller facsimilehenvisninger til det oprindelige
1732-tryk, og de gamle versioner får ikke nye korrekturattester.

Antologiens to Brorson-tekster er dokumenterede bearbejdelser, ikke rene
Koch-gengivelser. *Skabelsen* (»Op al den Ting«) optager ifølge udgiveren
Grundtvigs rettelser; *David og Goliat* indeholder både grundtvigske og
udgiverens egne ændringer. Deres oprindelige noter, ordlyd og
1835-kilde bevares. Nye noter identificerer Koch-forlægget; variantforbindelserne
forbinder konkrete versioner. Andre forfattere i antologien er ikke ændret.

Den identiske dobbeltregistrering af *Nu Verdens Rige* er samlet under
`brorson2002101404`, Koch nr. 347 / Svane-Sang LXIV. Det gamle id
`brorson2002112914` (tidligere fejlagtigt LXVI) er alias, så den gamle URL
stadig fører til teksten. Ingen selvstændig tekstversion er fjernet.

## Komplette billedserier og sidemapping

Alle 1.397 tilgængelige billeder i KB's tre billedindeks er hentet fra
billedserverens originale IIIF-JPEG'er, kontrolleret som læsbare billeder og
bevaret i indeksrækkefølge. Der er komplette PDF'er, fortløbende JPEG'er fra
`000.jpg` og thumbnails for hvert bind. De er synkroniseret til Kalliopes
facsimileserver, også for sider som endnu ikke indgår i tekstudvalget.

KB's `/text/…-root.pdf` er en nysat digital tekst, ikke fotografier. Portalens
`/catalog/…/facsimile.pdf` bruger små billeder og en ekstra portalside.
Kalliopes PDF'er er i stedet samlet tabsfrit fra KB's fulde originalbilleder
(ca. 3510 × 5542 pixels, 600 dpi). Portalsider indgår ikke.

Bind I har 28 indledende billeder og trykte sider 1–381; bind II har ti
indledende billeder og sider 1–432; bind III har fire indledende billeder og
sider 1–542. Trykt arabisk side *n* svarer til enbaseret billednummer *n* +
offset i tabellen, og til JPEG-nummer *n* + offset − 1. Romersk paginerede
indledninger kontrolleres efter billednummer, ikke denne arabiske mapping.
De tre titelbladsbilleder kommer fra `002.jpg`; opretning, beskæring og
geometrisk QA er bestået, og den trykte ordlyd er transskriberet i XML.

Afgrænsning: DSL's bibliografi anfører et særskilt meloditillæg på 12 sider,
og bind III's indholdsliste siger, at det medfølger. Det løse tillæg findes
ikke i KB's tre billedserier og er ikke med i disse PDF'er. Alle billeder i
de tre serier er med; dette er ikke en påstand om, at et separat bilag eller
et eventuelt uaffotograferet blankt slutblad findes i digitaliseringen.

## Korrektur og redaktionelle valg

Alle 130 Koch-tekster har fået to fulde, særskilte visuelle gennemgange mod
fotografierne: ordlyd, ortografi, tegnsætning, overskrifter, vers, strofer,
indryk, kursiv, spatiering og interne sideskift. Anden gennemgang er udført
i uafhængige reviewersessioner. OCR og geometri er brugt til at finde
kandidater, ikke som erstatning for direkte læsning. Alle maskinkandidater
og fund er afklaret mod billederne.

| Bind | Tekster | Relevante trykte sider, unikke pr. bind | Verslinjer | Interne sideskift |
| --- | ---: | ---: | ---: | ---: |
| I | 35 | 121 | 2912 | 96 |
| II | 23 | 88 | 1933 | 70 |
| III | 72 | 119 | 2503 | 105 |

Sideantallene angår de inkluderede tekster, ikke en korrekturattest af alle
1.397 bogsider. Hertil kommer kontrol af titelblade, indholdsfortegnelser,
relevante udgiverredegørelser og rettelsesafsnittet. Kun de 130 Koch-tekster
får `korrektur1,korrektur2,kilde,side` og bindene `<pagebreaks/>`.

Blandt de væsentlige rettelser er fire manglende vers i nr. 208, strofer der
manglede i nr. 314 og 324, sammenføring af fysisk ombrudte vers, kor- og
rollebetegnelser, indryk og sideskift før strofenumre. *Lissabon* har 380 vers
i ni hovedafsnit; Simeon-teksten har 24 fortløbende vers. Forkert kursiv fra
den første gennemgang er rettet efter direkte zoomkontrol i den anden.
Usædvanlige, men sikre tryklæsninger er bevaret, blandt andet »On lyset«
(I, s. 304), »øjeblik« (I, s. 330) og »Bøst« (III, s. 120; med note).
Gentagelser som »Opstanden opstanden«, »ævig ævig«, »mange mange« og
»lenge lenge« er kontrolleret mod trykket og bevaret.

*Rettelser og tilføjelser*, III, s. 532–534, er gennemgået. Ingen sikker
rettelse i listen kræver en emendation af de inkluderede hovedtekster.
Seks relevante diskussioner er dokumenteret ved de konkrete tekster:
I 312 »siele«/forslaget »mæle«; II 45 »kom morgen dog«/»morgen dag«;
II 48 »din«/forslaget »min himmeldrue«; II 75 »sin fodspor«/»sit«;
II 103 »for alting«/»i alting«; II 217 »kommer«/»kummer«.
De sikre hovedlæsninger er bevaret. XML's nye `errata status="reviewed"`
registrerer en gennemgået liste uden at opfinde rettelser; `applied` kræver
fortsat faktiske `footnote type="errata"`-rettelser.

## Dækningshuller

Denne opgave tilretter det eksisterende korpus. Den er ikke en fuld import
af Kochs udgave eller dens kommentar- og variantapparat. De eksisterende
tekster har alle et sikkert match. Følgende huller er kortlagt særskilt:

*Troens rare Klenodie*: 58 af H.A. Brorsons 274 nummererede salmer er med.
De 216 manglende numre er:

2–3, 12–16, 21–26, 28, 30–32, 34–39, 41–44, 48–52, 54–56, 58–62,
64–70, 72–76, 80, 82–86, 88–90, 92–97, 99–103, 105–106, 108–111,
113–127, 129, 132–144, 147–148, 150–155, 157–158, 160–167, 169–171,
173–182, 184, 186–190, 194–207, 209–213, 215–217, 219–228, 230–244,
246–254, 258–270, 272–274.

Tillæggets nr. 275–283 er brødrenes salmer og tælles ikke som manglende
H.A. Brorson-tekster. Af *Svane-Sang*s 69 salmer, nr. 284–352, mangler kun
nr. 351, *O blide Stad* (III, s. 121–123). Nr. 353, *Gaaer det, min Skiebne*,
er indsat som den særskilte efterfølgende tekst hos Koch (s. 125–127).

Bind III's indholdsliste viser desuden manglende lejlighedsdigte til Niels
Vedel (s. 205), Johann Herrmann Schrader (209), kongeparret på Christiansborg
(212), J. L. v. Holstein (to nytårsdigte, 215), Peter Sønderborg (221),
Frederik V (223) og kirkeindvielsen i Kolding (227), flere almanaktekster
(229–234, bortset fra Simeon), hundredårsfesten for enevælden (235) og
G. F. v. Holsteins datter (237). De præcise afgrænsninger må kontrolleres ved
en senere fuld import; sidetallene her er startsteder.

Prosa og større tillæg mangler ligeledes: Svane-Sang-prædikenen (129–173),
*Vita* (fra 244), *Guds Kirckes Iubelfryd* (269–317), fortalerne (fra 319)
og den latinske *De Vexillo Ecclesiae* (333–354). Den efterfølgende danske
oversættelse (355–379) skal ved en eventuel import registreres efter sin egen
ophavssituation. Udgivernes indledninger, filologiske og vershistoriske
redegørelser samt apparater er redaktionelt materiale, ikke automatisk nye
selvstændige Brorson-værker. En optælling af digitale tekstblokke må derfor
ikke bruges som antal manglende digte.

## Samlet matchliste

Listen fastholder de 133 oprindelige forekomster. »Bevaret« betyder særskilt
historisk tekstversion/bearbejdelse, med variantforbindelse til den angivne
Koch-tekst. Alle andre poster er tilrettet efter det angivne Koch-sted.
Sidetal er trykte sidetal, inklusive fortsættelsessider.

| Oprindeligt id | Tidligere værk | Koch-bind og sider | Resultat |
| --- | --- | --- | --- |
| `brorson1732a0` | `brorson/1732` | I, 27–29 | Bevaret 1732; Koch-version `brorson2026101601` |
| `brorson1732a1` | `brorson/1732` | I, 29–32 | Bevaret 1732; Koch-version `brorson2026101602` |
| `brorson1732a2` | `brorson/1732` | I, 32–35 | Bevaret 1732; Koch-version `brorson2026101603` |
| `brorson1732a3` | `brorson/1732` | I, 35–37 | Bevaret 1732; Koch-version `brorson2026101604` |
| `brorson1732a4` | `brorson/1732` | I, 37–40 | Bevaret 1732; Koch-version `brorson2026101605` |
| `brorson1732a5` | `brorson/1732` | I, 40–42 | Bevaret 1732; Koch-version `brorson2026101606` |
| `brorson1732a6` | `brorson/1732` | I, 42–44 | Bevaret 1732; Koch-version `brorson2026101607` |
| `brorson1732a7` | `brorson/1732` | I, 59–61 | Bevaret 1732; Koch-version `brorson2026101608` |
| `brorson1732a8` | `brorson/1732` | I, 62–64 | Bevaret 1732; Koch-version `brorson2026101609` |
| `brorson1732a9` | `brorson/1732` | I, 148–151 | Bevaret 1732; Koch-version `brorson2026101610` |
| `brorson1739a0` | `brorson/1739` | I, 13–17 | Tilrettet, samme id |
| `brorson1739a1` | `brorson/1739` | I, 24–26 | Tilrettet, samme id |
| `brorson1739a10` | `brorson/1739` | I, 132–135 | Tilrettet, samme id |
| `brorson1739a11` | `brorson/1739` | I, 159–160 | Tilrettet, samme id |
| `brorson1739a12` | `brorson/1739` | I, 172–177 | Tilrettet, samme id |
| `brorson1739a2` | `brorson/1739` | I, 56–59 | Tilrettet, samme id |
| `brorson1739a3` | `brorson/1739` | I, 64–66 | Tilrettet, samme id |
| `brorson1739a4` | `brorson/1739` | I, 79–82 | Tilrettet, samme id |
| `brorson1739a5` | `brorson/1739` | I, 85–89 | Tilrettet, samme id |
| `brorson1739a6` | `brorson/1739` | I, 97–100 | Tilrettet, samme id |
| `brorson1739a7` | `brorson/1739` | I, 114–118 | Tilrettet, samme id |
| `brorson1739a8` | `brorson/1739` | I, 127–129 | Tilrettet, samme id |
| `brorson1739a9` | `brorson/1739` | I, 129–132 | Tilrettet, samme id |
| `brorson1739b0` | `brorson/1739` | I, 199–202 | Tilrettet, samme id |
| `brorson1739b1` | `brorson/1739` | I, 217–219 | Tilrettet, samme id |
| `brorson1739b10` | `brorson/1739` | I, 330–331 | Tilrettet, samme id |
| `brorson1739b11` | `brorson/1739` | I, 375–378 | Tilrettet, samme id |
| `brorson1739b2` | `brorson/1739` | I, 220–222 | Tilrettet, samme id |
| `brorson1739b3` | `brorson/1739` | I, 223–227 | Tilrettet, samme id |
| `brorson1739b4` | `brorson/1739` | I, 231–233 | Tilrettet, samme id |
| `brorson1739b5` | `brorson/1739` | I, 254–256 | Tilrettet, samme id |
| `brorson1739b6` | `brorson/1739` | I, 267–271 | Tilrettet, samme id |
| `brorson1739b7` | `brorson/1739` | I, 288–291 | Tilrettet, samme id |
| `brorson1739b8` | `brorson/1739` | I, 302–304 | Tilrettet, samme id |
| `brorson1739b9` | `brorson/1739` | I, 312–317 | Tilrettet, samme id |
| `brorson1739c0` | `brorson/1739` | II, 5–10 | Tilrettet, samme id |
| `brorson1739c1` | `brorson/1739` | II, 10–13 | Tilrettet, samme id |
| `brorson1739c2` | `brorson/1739` | II, 45–46 | Tilrettet, samme id |
| `brorson1739c3` | `brorson/1739` | II, 46–49 | Tilrettet, samme id |
| `brorson1739c4` | `brorson/1739` | II, 55–58 | Tilrettet, samme id |
| `brorson1739d0` | `brorson/1739` | II, 74–75 | Tilrettet, samme id |
| `brorson1739d1` | `brorson/1739` | II, 79–80 | Tilrettet, samme id |
| `brorson1739d2` | `brorson/1739` | II, 113–115 | Tilrettet, samme id |
| `brorson1739d3` | `brorson/1739` | II, 135–139 | Tilrettet, samme id |
| `brorson1739d4` | `brorson/1739` | II, 144–147 | Tilrettet, samme id |
| `brorson1739d5` | `brorson/1739` | II, 163–166 | Tilrettet, samme id |
| `brorson1739e0` | `brorson/1739` | II, 167–171 | Tilrettet, samme id |
| `brorson1739e1` | `brorson/1739` | II, 171–174 | Tilrettet, samme id |
| `brorson1739e2` | `brorson/1739` | II, 214–218 | Tilrettet, samme id |
| `brorson1739e3` | `brorson/1739` | II, 231–234 | Tilrettet, samme id |
| `brorson1739e4` | `brorson/1739` | II, 240–244 | Tilrettet, samme id |
| `brorson1739f0` | `brorson/1739` | II, 270–274 | Tilrettet, samme id |
| `brorson1739f1` | `brorson/1739` | II, 316–319 | Tilrettet, samme id |
| `brorson1739g0` | `brorson/1739` | II, 343–346 | Tilrettet, samme id |
| `brorson1739g1` | `brorson/1739` | II, 346–350 | Tilrettet, samme id |
| `brorson1739g2` | `brorson/1739` | II, 350–352 | Tilrettet, samme id |
| `brorson1765a0` | `brorson/1765` | III, 31–32 | Tilrettet, samme id |
| `brorson1765a1` | `brorson/1765` | III, 33–34 | Tilrettet, samme id |
| `brorson1765a10` | `brorson/1765` | III, 63 | Tilrettet, samme id |
| `brorson1765a11` | `brorson/1765` | III, 64–65 | Tilrettet, samme id |
| `brorson1765a12` | `brorson/1765` | III, 65–67 | Tilrettet, samme id |
| `brorson1765a13` | `brorson/1765` | III, 69–70 | Tilrettet, samme id |
| `brorson1765a14` | `brorson/1765` | III, 71–73 | Tilrettet, samme id |
| `brorson1765a15` | `brorson/1765` | III, 79–81 | Tilrettet, samme id |
| `brorson1765a16` | `brorson/1765` | III, 81–83 | Tilrettet, samme id |
| `brorson1765a17` | `brorson/1765` | III, 86–89 | Tilrettet, samme id |
| `brorson1765a18` | `brorson/1765` | III, 93–96 | Tilrettet, samme id |
| `brorson1765a19` | `brorson/1765` | III, 96–97 | Tilrettet, samme id |
| `brorson1765a2` | `brorson/1765` | III, 35–36 | Tilrettet, samme id |
| `brorson1765a20` | `brorson/1765` | III, 105–108 | Tilrettet, samme id |
| `brorson1765a21` | `brorson/1765` | III, 111–113 | Tilrettet, samme id |
| `brorson1765a22` | `brorson/1765` | III, 117–118 | Tilrettet, samme id |
| `brorson1765a23` | `brorson/1765` | III, 120–121 | Tilrettet, samme id |
| `brorson1765a24` | `brorson/1765` | III, 123–125 | Tilrettet, samme id |
| `brorson1765a3` | `brorson/1765` | III, 40–41 | Tilrettet, samme id |
| `brorson1765a4` | `brorson/1765` | III, 45–46 | Tilrettet, samme id |
| `brorson1765a5` | `brorson/1765` | III, 46–48 | Tilrettet, samme id |
| `brorson1765a6` | `brorson/1765` | III, 48–49 | Tilrettet, samme id |
| `brorson1765a7` | `brorson/1765` | III, 51–52 | Tilrettet, samme id |
| `brorson1765a8` | `brorson/1765` | III, 54–56 | Tilrettet, samme id |
| `brorson1765a9` | `brorson/1765` | III, 61–63 | Tilrettet, samme id |
| `brorson1999113001` | `brorson/andre` | III, 233–234 | Tilrettet, samme id |
| `brorson2002093001` | `brorson/1765` | III, 32–33 | Tilrettet, samme id |
| `brorson2002093002` | `brorson/1765` | III, 34–35 | Tilrettet, samme id |
| `brorson2002100101` | `brorson/1765` | III, 36–37 | Tilrettet, samme id |
| `brorson2002100102` | `brorson/1765` | III, 37–40 | Tilrettet, samme id |
| `brorson2002100103` | `brorson/1765` | III, 41–43 | Tilrettet, samme id |
| `brorson2002100104` | `brorson/1765` | III, 43–45 | Tilrettet, samme id |
| `brorson2002100105` | `brorson/1765` | III, 125–127 | Tilrettet, samme id |
| `brorson2002100501` | `brorson/1765` | III, 97–98 | Tilrettet, samme id |
| `brorson2002100502` | `brorson/1765` | III, 98–99 | Tilrettet, samme id |
| `brorson2002100503` | `brorson/1765` | III, 99–100 | Tilrettet, samme id |
| `brorson2002100504` | `brorson/1765` | III, 100–101 | Tilrettet, samme id |
| `brorson2002100505` | `brorson/1765` | III, 102 | Tilrettet, samme id |
| `brorson2002100506` | `brorson/1765` | III, 102–103 | Tilrettet, samme id |
| `brorson2002100507` | `brorson/1765` | III, 103–104 | Tilrettet, samme id |
| `brorson2002100508` | `brorson/1765` | III, 104–105 | Tilrettet, samme id |
| `brorson2002100601` | `brorson/1765` | III, 49–50 | Tilrettet, samme id |
| `brorson2002100602` | `brorson/1765` | III, 50 | Tilrettet, samme id |
| `brorson2002100603` | `brorson/1765` | III, 52–53 | Tilrettet, samme id |
| `brorson2002100604` | `brorson/1765` | III, 53–54 | Tilrettet, samme id |
| `brorson2002100605` | `brorson/1765` | III, 56–57 | Tilrettet, samme id |
| `brorson2002100606` | `brorson/1765` | III, 57–58 | Tilrettet, samme id |
| `brorson2002100607` | `brorson/1765` | III, 59–60 | Tilrettet, samme id |
| `brorson2002100608` | `brorson/1765` | III, 60–61 | Tilrettet, samme id |
| `brorson2002100609` | `brorson/1765` | III, 63–64 | Tilrettet, samme id |
| `brorson2002100610` | `brorson/1765` | III, 67–68 | Tilrettet, samme id |
| `brorson2002100611` | `brorson/1765` | III, 68–69 | Tilrettet, samme id |
| `brorson2002101401` | `brorson/1765` | III, 108–109 | Tilrettet, samme id |
| `brorson2002101402` | `brorson/1765` | III, 109–111 | Tilrettet, samme id |
| `brorson2002101403` | `brorson/1765` | III, 113–115 | Tilrettet, samme id |
| `brorson2002101404` | `brorson/1765` | III, 115–116 | Tilrettet, samme id |
| `brorson2002112901` | `brorson/1765` | III, 70–71 | Tilrettet, samme id |
| `brorson2002112902` | `brorson/1765` | III, 73–75 | Tilrettet, samme id |
| `brorson2002112903` | `brorson/1765` | III, 76 | Tilrettet, samme id |
| `brorson2002112904` | `brorson/1765` | III, 77 | Tilrettet, samme id |
| `brorson2002112905` | `brorson/1765` | III, 77–78 | Tilrettet, samme id |
| `brorson2002112906` | `brorson/1765` | III, 78–79 | Tilrettet, samme id |
| `brorson2002112907` | `brorson/1765` | III, 83–84 | Tilrettet, samme id |
| `brorson2002112908` | `brorson/1765` | III, 84–85 | Tilrettet, samme id |
| `brorson2002112909` | `brorson/1765` | III, 85–86 | Tilrettet, samme id |
| `brorson2002112910` | `brorson/1765` | III, 89–90 | Tilrettet, samme id |
| `brorson2002112911` | `brorson/1765` | III, 90–91 | Tilrettet, samme id |
| `brorson2002112912` | `brorson/1765` | III, 91–92 | Tilrettet, samme id |
| `brorson2002112913` | `brorson/1765` | III, 92–93 | Tilrettet, samme id |
| `brorson2002112914` | `brorson/1765` | III, 115–116 | Alias til `brorson2002101404` |
| `brorson2002112915` | `brorson/1765` | III, 118–120 | Tilrettet, samme id |
| `brorson2011081101` | `brorson/1739` | II, 102–105 | Tilrettet, samme id |
| `brorson2026082363` | `antologierdk/1835` | I, 217–219 | Bevaret bearbejdelse; Koch-forlæg variantforbundet |
| `brorson2026082396` | `antologierdk/1835` | III, 81–82 | Bevaret bearbejdelse; Koch-forlæg variantforbundet |
| `brorsonandrea0` | `brorson/andre` | III, 187–202 | Tilrettet, samme id |
| `brorsonandrea1` | `brorson/andre` | III, 207–208 | Tilrettet, samme id |
| `brorsonandrea2` | `brorson/andre` | II, 390–394 | Tilrettet, samme id |
