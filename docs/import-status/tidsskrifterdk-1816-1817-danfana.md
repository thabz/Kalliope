# Danfana 1816–1817: igangværende tekstimport

Brugeren har den 22. oktober 2026 udtrykkeligt godkendt: »Fortsæt uden
majomslaget«. Importen til #1985 fortsætter med denne afgrænsede undtagelse
fra PDF-skillens stopregel. Omslagets ordlyd rekonstrueres ikke.

## Hæftevis færdiggørelse fra 23. oktober 2026

Hæfterne færdiggøres ét ad gangen, med særskilt commit, push og grøn GitHub
CI efter hvert hæfte. Rækkefølgen vælges praktisk. Sessionen med januar og februar er afsluttet.
Brugeren har derefter bestilt de næste tre hæfter: marts, april og maj 1816.
Hvert hæfte færdiggøres og publiceres med grøn CI, før arbejdet går videre.

Januar 1816 er færdigkontrolleret med alle 11 tekstposter, 85 interne
sideskift og uafhængig kilde-, struktur- og typografikontrol. De 95 fysiske
tekstsider er dækket; den blanke trykte side 18 er særskilt registreret.
Thieles sidste tekstside er trykt 38, logisk 58, og har præcis
facsimilereference `064.jpg`. Alle 49 kandidater fra helværksanalysen er
afklaret med individuelle kildedispositioner. Variantkontrollen gav ingen
uafklarede kandidatpar og ingen dataproblemer. Heibergs eksisterende
variantrelation bevares.

De to beskadigede legacy-læsninger »suser« (side 13) og »Jesu Christi«
(side 66) bevares med deres præcise usikkerhedsnoter. Slutdispositionen
bekræfter dokumentationen af kildeskaden, ikke de udviskede bogstaver.
Ingen tekst er rekonstrueret. Heibergs gamle rettelsesnote »Proteus] Protens«
er bevaret som historisk oplysning og præciseret: trykket har »Proteus«.
Odededikationens festdag 28. oktober 1815 er også registreret som
begivenhedsdato. Titelbladets eksisterende, rammebevarende JPEG matcher
billed-QA'ens godkendte SHA-256.

Januar har `status="complete"`, alle tekstposter har
`korrektur1,korrektur2,kilde,side`, og den uafhængige korrektur er attesteret.
Aktuel test-, checkpoint-, commit- og CI-status føres i PR #2012.
Alle hæfter efter august er fortsat `incomplete`; deres tidligere
delkontroller nedenfor er ikke afsluttende godkendelser.

Februar 1816 er ligeledes færdigkontrolleret med alle 12 tekstposter og
91 interne sideskift: 85 i hovedteksterne og seks i fortsatte originalnoter.
97 tekstsideforekomster dækker alle 96 fysiske tekstsider uden huller;
de to selvstændige digte på side 183 deler samme facsimileside.
Alle 21 poesiblokke samt prosaafsnit, mottoer, overskrifter og typografi
er omfattet af den uafhængige kontrol. Mottoets førsteord i
*Gaade-Kampen* er rettet fra »Eet« til trykkets »Let«. I tre tidligere
tekstposter er 74 linjers lange streger og citationstegn rettet efter
konkret sidekontrol; originale og redaktionelle noters indhold er uændret.

De dokumenterede legacy-skader i »Strøetankernes« (147), den islandske
linje (176) og »spørger du, „hvor« (185) bevares med præcise noter.
Dokumenterede ældre emendationer, herunder »kildrer« for »smager«, bevares
udtrykkeligt som emendationer og fremstilles ikke som sikre kildelæsninger.
Dateringen 20.–21. januar 1816 er fortsat et interval i kildeteksten og noten;
intet enkelt døgn er opfundet som metadata. Variantkontrollen gav ingen
uafklarede kandidatpar eller dataproblemer. Februars titelblads-JPEG matcher
den godkendte rammebevarende billed-QA. Hæftet har `status="complete"`,
`korrektur1,korrektur2,kilde,side`, `<pagebreaks/>`, ingen relevante rettelsesark
og modelattest. Slutcheckpoint, tests og GitHub CI dokumenteres i PR #2012.



## Kilde og konkret mangel

- KB: <https://www.kb.dk/e-mat/dod/130017630319-bw.pdf>, januar–juni 1816,
  603 PDF-sider.
- PDF-side 403 (`402.jpg`) viser trykt side 384, slutningen af aprilhæftet.
- PDF-side 404 (`403.jpg`) begynder direkte med *Thora. Første Sang*,
  logisk side 385 (uden trykt sidetal på begyndelsessiden).
- Der er intet majomslag mellem disse sider. Dette stemmer med den allerede
  beskrevne mangel i #1985. Omslagets ordlyd kan ikke dokumenteres herfra.

## Sidekontrol

Alle 603 sider i første PDF og alle 511 sider i anden PDF er visuelt
inventeret i særskilte reviewersessioner. Der er ikke fundet yderligere
manglende eller duplikerede tekstsider. Dette inventar er en kilde- og
strukturkontrol, ikke en fuldstændig ordlydskorrektur.

Anden kilde: <https://www.kb.dk/e-mat/dod/130017630327-bw.pdf>.

Trykte rettelser findes i første PDF på siderne 206 og 499 samt i anden
PDF på siderne 107 og 307. Rettelsen på PDF-side 499 gælder en dobbelttrykt
slutstrofe på side 469. Begge rettelser fra PDF-side 206 er indført med typed erratafodnoter
i marts; de øvrige rettelser skal fortsat indføres ved de relevante tekststeder.
Henvisningen til side 376 på sidste rettelsesark gælder med visuelt belæg
side 276 (»Stene« → »Straa«).

Originale pagineringsfejl må ikke forveksles med kildehuller: første PDF
side 65 er trykt 38, logisk 58; PDF-side 494 er trykt 465, logisk 475.
Anden PDF springer trykt 116 over mellem PDF-side 127 (115) og 128 (117),
men teksten fortsætter ubrudt.

## Supplerende kilde

En søgning efter supplerende digitaliseringer fandt ikke et anvendeligt
majomslag. Internet Archives titelsøgning gav nul resultater; Google Books’
metadata-API svarede HTTP 429. Dette er ikke bevis for, at et andet eksemplar
ikke findes. Et senere fund kan supplere omslaget uden nye tekstforekomster.


## Igangværende tekstimport

63 eksisterende tekstforekomster fra samme fysiske udgave er flyttet til
hæfterne med deres id’er og redaktionelle noter bevaret. Nye kladder i
januarhæftet omfatter *Maanedskriftets Bestemmelse*, *Fiendtlige
Fredspræliminarier*, Weyses *Ïo* samt Thieles samlede gådeforklaring med
motto, indledningssonet, 77 oktaver og slutsonet. Februarkladderne omfatter desuden Jessens *Gaaden*,
*Gaade-Kampen* og *Til Danfanas Læsere*. Marts har nu også
*Til Danfanas Læsere*, *Apologie for min Vidspilde*, *Sjællandsk Trøst*
og *Litterariske Nyheder* (side 284–288).
Desuden er hele *Heautontheorumenos eller Spøgelset i Kerteminde*
(side 215–241) og *Kritisk Vurdering … Ludlams Hule* (242–283) indsat.
Med majs syv, junis 11, julis seks og augusts 13 nye tekstforekomster er der 150 tekstforekomster i hæfterne.
Importen af hele årgangen er ikke færdig.

Alle 1114 facsimilesider og tilhørende miniaturebilleder er genereret og
synkroniseret. Den offentlige facsimilekontrol er gennemført uden fejl.
De ti bevarede hæfteomslag er tilføjet som titelbladsbilleder. Beskæringen
bevarer hele den bevarede trykte ramme; automatiske beskæringsforslag, der skar i
rammen, er forkastet. Majomslaget er udeladt efter brugerens godkendelse.

Januars fire tidligere tekstforekomster og oktoberhæftets 30 tidligere
forekomster er uafhængigt gennemgået mod tekstsiderne. Fundene om ordlyd,
typografi og præcise sideskift er rettet og genkontrolleret. De nye
januar- og februartekster er også særskilt uafhængigt korrekturlæst. Januar er efterfølgende færdiggjort som beskrevet ovenfor; oktoberhæftet
er fortsat ikke færdiggodkendt.

To læsninger i de eksisterende tekster kan ikke fuldt genkontrolleres:
»suser« i *Ode til Sommerfuglene*, side 13, og »Jesu Christi« i *Elegie*,
side 66. Både den sort-hvide scanning og farveudgaven af samme eksemplar
har udviskede bogstaver. De eksisterende læsninger bevares med udtrykkelige
usikkerhedsnoter; der er ikke rekonstrueret tekst fra en anden udgave.
Farvekilde: <https://www.kb.dk/e-mat/dod/130017630319-color.pdf>.

De resterende hæftetekster fra september og frem, de resterende relevante trykte rettelser og den samlede
slutkontrol mangler fortsat. Værkerne har derfor status `incomplete`, og
PR’en er fortsat en kladde.

Januarhæftets 85 interne sideskiftemarkører er kontrolleret med de konkrete
facsimilefilnavne, og `<pagebreaks/>` er registreret. Den fulde testkørsel
`make test` er bestået under arbejdet; slutkontrol og CI-godkendelse af hele
importen udestår fortsat.

De ni tidligere tekstforekomster i januar–marts 1817 er gennemgået mod alle
28 relevante facsimilesider. Ordlyd, typografi og 20 interne sideskift er rettet
og uafhængigt genkontrolleret; alle 23 kandidater fra den ufiltrerede
strukturkontrol af ti poesiblokke er afklaret. De øvrige tekster i hæftet
mangler stadig.

Tekstkvalitetskontrollens 11 kandidater i Thieles og Jessens gådedigte er
genkontrolleret mod trykket. De kildebelagte sammentryk og Thieles gentagne
»det det« er bevaret med præcise noter og navngivne regelundtagelser på
de to tekstposter. Kontrollen består derefter uden tekstkvalitetsfejl.

De første tre nye martstekster er særskilt uafhængigt gennemgået, og konkrete
rettelser er genkontrolleret. Apologien har 344 vers; strofebrud, indryk og
14 interne sideskift er kontrolleret. Epigrammet har syv vers med kildebelagte
indryk. Variantkontrollen gav ingen kandidatpar for de fem martsforekomster
med førstelinje; den korte prosameddelelse har efter projektets regel ingen
førstelinjemetadata.

Tre ord i Apologien (side 208, 210 og 213) og ét i epigrammets sidste vers
(side 214) er delvis beskadigede. De står som `[ulæseligt]` med konkrete
metadata-noter; ingen af læsemåderne er rekonstrueret. Desuden er 20 konkrete
ord- og tegnrettelser i februars tidligere forekomster indført og uafhængigt
genkontrolleret. Februars videre korrektur omfatter 65 hovedtekst-sideskift,
originale fodnoter med egen paginering, prosa, mottoer og typografi.
Gamle redaktionelle noter og udtrykkelige emendationer bevares. De ni
tidligere februarforekomsters 66 geometrikandidater er alle individuelt
afklaret mod trykket; 12 poesiblokke har særskilte strukturregistre. Hæftet
har nu 91 præcise interne sideskift, inklusive noternes egne sideskift.

Februars scanning har desuden beskadigede bogstaver i »Strøetankernes« på
side 147, den islandske linje »Fell Døgg í diúpa Dalí!« på side 176 og
»spørger du, „hvor« på side 185. Farveudgaven viser de samme skader.
De eksisterende læsninger bevares med konkrete usikkerhedsnoter; det
læselige n i »Strøetankernes« er tilføjet.

Marts’ *Litterariske Nyheder* er transskriberet fra alle fem facsimilesider
med den lange originalnote, fire præcise sideskift og det afsluttende
femlinjede citat. Begge friske OCR-pass og siderne er læst i en særskilt
reviewersession. To delvis udviskede ord på side 287 er markeret
`[ulæseligt]` og beskrevet i tekstens metadata.

De tre tidligere martsforekomster på side 193–199 er også uafhængigt
gennemgået: 12 konkrete rettelsesfund er verificeret, herunder to ord, fem
sideskift, originalnoter, citatmarkører og indryk. Alle 29 kandidater fra
den nye ufiltrerede martsanalyse er afklaret mod kilden. De syv indlagte
martstekster var dermed visuelt gennemgået før de to længere tekster.

Begge længere martstekster er nu også indsat og uafhængigt kontrolleret.
Drømmespillet bevarer indre titelblad, dedikation, prolog, Drømmen,
Gaaden i Drømmen med Chor, epilog og moral som en samlet sektion. De fem
verseblokke har 66, 133, 326, 44 og 8 vers; den lange, fysisk ombrudte linje
på side 227 er ét vers. Seks delvis beskadigede ord står som `[ulæseligt]`.

Ludlam-artiklens 42 sider bevarer 16 originale fodnoter og 43 sideskift
(41 i hovedteksten og to i fortsatte noter), prosastykker, sangcitater og
dramatisk dialog. Otte beskadigede ord er markeret `[ulæseligt]`. Fire
konkrete ordrettelser er uafhængigt genkontrolleret efter indsættelsen.

Marts indeholder nu 15 tekstposter og én sektion med alle hæftets tekstdele.
Alle 42 kandidater i den ufiltrerede strukturkontrol af 17 poesiblokke er
individuelt afklaret mod kilden. Hæftets 88 interne sideskift er kontrolleret
med de præcise facsimilefilnavne. Variantkontrollen er gentaget. Den senere
afsluttende kontrol og dispositionen af de 20 beskadigede ord er beskrevet
i afsnittet »Marts 1816: afsluttende hæftekontrol« nedenfor.

April har desuden fået 26 nye tekstforekomster på side 289–339, herunder
*Fandens Abestreger*, Horaz-oversættelsen, *Medynksskrivelse*, *Smaa Flyvedigte*,
*Rude og Potte* og *Til mit nattegamle Føl*. De to tidligere aprildigte er
indflettet på deres fysiske plads i *Smaa Flyvedigte* med bevarede id’er og
redaktionelle noter. Ni konkrete korrekturfund i disse to tekster er
uafhængigt verificeret efter rettelse. De 28 indlagte aprilteksters 48
geometrikandidater er individuelt afklaret; de to beskadigede ord i
*Medynksskrivelse* er markeret og beskrevet. Den lange aprilartikel og den
korte afsluttende meddelelse er også indsat og særskilt gennemgået. Variantkontrollen gav ingen
kandidatpar for de 28 forekomster med førstelinje. Hele testpakken består.

April indeholder nu alle hæftets 30 tekstposter. Den 46 sider lange
*Kritisk Vurdering … Nøiere Betragtning* bevarer 45 hovedtekst-sideskift og
syv i fortsatte originalnoter. Titelhierarki, 24 normale prosaindryk uden
falske blanklinjer og de to korte slutmeddelelsers ordlyd er kontrolleret.
Alle 83 kandidater i den ufiltrerede analyse af 76 poesiblokke er individuelt
afklaret. To falske strofebrud ved side 374 og 375 er fjernet efter direkte
kildekontrol. Artiklen har to beskadigede ord ud over de to i Medynksskrivelse;
de er markeret uden rekonstruktion. Den senere slutkontrol er beskrevet
i afsnittet »April 1816: afsluttende hæftekontrol« nedenfor.


## Marts 1816: afsluttende hæftekontrol

Alle 15 tekstposter er færdigkontrolleret. De 101 tekstsideforekomster dækker
97 fysiske tekstsider: den upaginerede læsermeddelelse og side 193–288.
Alle 17 poesiblokke, prosaafsnit, originalnoter, overskrifter og typografi
er omfattet af den uafhængige kildekontrol. 88 interne sideskift har præcise
facsimilefilnavne, og `<pagebreaks/>` er registreret. Alle 42 kandidater fra
den ufiltrerede helværksanalyse er afklaret. Undertitlen »i Læseverdenen.«
har fået sit trykte slutpunktum; det samme gælder sektionsundertitlen
»Spøgelset i Kerteminde.«. Begge rettelser fra PDF-side 206 er indført
med typed erratafodnoter, og rettelsesarket er registreret i værkhovedet.

De 20 beskadigede ord i de nye martsforekomster bevares som `[ulæseligt]`
med præcise noter. Slutdispositionen godkender dokumentationen af kildeskaden,
ikke en rekonstrueret læsemåde. Ældre redaktionelle noter er bevaret.
Den gentagne variantkontrol gav ingen uafklarede kandidatpar eller
dataproblemer; titelblads-JPEG'en matcher den godkendte rammebevarende
billed-QA. Hæftet har nu `status="complete"`,
`korrektur1,korrektur2,kilde,side` på alle tekstposter og modelattest.
Slutcheckpoint, tests og GitHub CI dokumenteres i PR #2012.


## April 1816: afsluttende hæftekontrol

Slutkontrollen omfatter alle 30 tekstposter, 76 poesiblokke, 85 interne
sideskift med præcise facsimilefilnavne samt prosa,
originalnoter, overskrifter og typografi. Den gentagne variantkontrol gav
ingen uafklarede kandidatpar eller dataproblemer. Tre afsluttende kommaer
er fjernet fra katalogtitlerne efter titelreglen; undertitlernes trykte
tegnsætning bevares. »Epistlerne ti Fru Professorinde O******« bevares som
trykt. Horazoversættelsen er forbundet med `horats` via den dokumenterede
mekanisme for originaler, der endnu ikke findes i Kalliope.

De fire beskadigede ord på side 298, 299, 341 og 344 bevares som
`[ulæseligt]` med præcise noter. Ingen læsemåde er rekonstrueret.
Titelblads-JPEG'en matcher den godkendte rammebevarende billed-QA.
Rettelsesarket på PDF-side 499 vedrører side 469 i maj; april har ingen
relevante trykte rettelser og registreres med `<errata status="none"/>`.

Alle 83 kandidater fra den ufiltrerede helværksanalyse er afklaret mod
facsimilet. Den lange kritikartikels verscitater er desuden genåbnet og
strukturkontrolleret under slutreviewet. Hæftet har nu `status="complete"`,
`korrektur1,korrektur2,kilde,side` på alle tekstposter, `<pagebreaks/>` og
modelattest. Slutcheckpoint, tests og GitHub CI dokumenteres i PR #2012.


## Maj 1816: afsluttende hæftekontrol

Kun majfilen er genindført fra den bevarede stash. Juni- og julikladderne
forbliver i stashen og indgår ikke i denne etape. Maj har alle ni tekstposter:
*Thoras* to første sange samt de syv nye *Protaphium*, *Correx med en Trumf
paa*, *Til Kiøbenhavn*, *Til Sangerinden, Minna Becker*, *Elegie*,
*Kritisk Vurdering … Tredie og sidste Betragtning* og *Til Boreas*.

De 48 manglende interne sideskift i de to eksisterende *Thora*-sange er
indsat med konkrete facsimilefilnavne. Elegiens parentetiske undertitel er
opdelt efter dens tre trykte linjer; det fysisk delte ord »Afskedsdigt«
er samlet uden linjeskiftebindestreg.

Rettelsen fra PDF-side 499 (trykt 480) vedrører den dobbelttrykte slutstrofe
på side 469. Den overflødige gentagelse er udeladt og dokumenteret med
`<footnote type="errata">∅] …</footnote>`; arket er registreret i værkhovedet.
Majomslaget udelades fortsat efter brugerens udtrykkelige godkendelse.

En udeladt verslinje i *Thoras* første sang på side 391 er indsat efter
direkte kildekontrol: »Sagde han, nu har jeg bierget mit Kul. En Pibe Tobak nu«.
Konkrete ord-, tegn- og versrettelser samt 14 kildebelagte tankestreger er
indført og uafhængigt genkontrolleret. Kildens særlige punktummer i
»skyndende sig. og« (396) og »de ti. Kulsække« (401) bevares som trykt,
ligesom pronomenet »han« i »som han spiiste« (404). Ældre redaktionelle
noter bevares særskilt. Kritikartiklens afsluttende ornament på side 478
gengives ikke som en selvstændig tekstblok.

Tolv dokumenterede fremhævelser i *Thora* gengives som fed, opret skrift
frem for kursiv. Den delvis beskadigede legacy-læsning »Grimkul« på side 433
bevares med en udtrykkelig kildeusikkerhedsnote. Der er intet belæg for at
normalisere de fem foreløbige forslag om to i stedet for fire mellemrum.
På side 402 er det større indryk ved »Lumskelig smiled …« derimod målt
til cirka halvanden gang naboversets, og gengives med seks mod fire
mellemrum. To resterende citatpar er gengivet med egentlige anførselstegn.

*Thoras* første sang har 339 vers og anden sang 297. Den første sangs
indledende 11 vers slutter ved et fysisk sideskift uden positivt belæg for
strofeafstand; den tidligere blanklinje er fjernet. Den tidligere
reviewoptælling på 338 var forkert; det afsluttende geometrimatch dækker
alle 339 henholdsvis 297 vers.

Alle ni tekstposter har nu `korrektur1,korrektur2,kilde,side`, og hæftet
har `status="complete"`, `<pagebreaks/>`, registreret rettelsesark og
modelattest. 55 poesiblokke, 92 interne sideskift, prosaafsnit, originalnoter,
typografi og overskrifter er omfattet af den uafhængige kontrol.
Alle 86 oprindelige *Thora*-fund er afsluttet: 79 verificerede og syv
afviste. Kritikartiklens 32 sider, inklusive de 24 tidligere ukontrollerede,
er nu fuldt uafhængigt gennemgået. Ordet efter »det fortalte Dødsfald«
på side 474 forbliver `[ulæseligt]` med præcis note. Variantkontrollen
gav ingen uafklarede kandidatpar eller dataproblemer. Slutcheckpoint,
tests og GitHub CI dokumenteres i PR #2012.

Det samlede slutreview dækker 97 tekstsideforekomster på alle 96 fysiske
tekstsider samt rettelsesarket som særskilt inventarrække. Alle 42
strukturkandidater og 1382 OCR-kandidater er afklaret med konkret
uafhængig kildeevidens. 1541 fund er afsluttet uden åbne eller blot rettede
punkter. Sideauditen har ingen fejl.


## Farvefacsimiler og målrettet ordkontrol, 24. oktober 2026

Efter brugerens anvisning er begge publicerede facsimilesæt genudtrukket
fra KB's `130017630319-color.pdf` (603 sider) og
`130017630327-color.pdf` (511 sider), inklusive alle 10026 miniaturebilleder.
De eksisterende facsimile-id’er og sidemappingen er bevaret. Alle 1114 sider
er sammenholdt med det hidtidige sæt; de 19 svage billedmatch er visuelt
kontrolleret og er samme fysiske sider. Kildehenvisningerne i de 11 hæfter
peger nu på farve-PDF’erne.

Kun de 31 tidligere problematiske ord er derefter genundersøgt med
farveudsnit og nærmeste sammenhæng. Ingen ny OCR eller fuld tekstkorrektur
er kørt. Ti sikre læsninger er krydskontrolleret og indført:

- Marts: »indianske« (210), »Sværmerier« (228), »Mig« (232),
  »aandelige« (242), »Bomulds-« (243), »Læseren« (260), »Mand« (281)
  og »uforbedrelig« (287). Kommaet efter den tidligere markering før
  »øvende« er fjernet: trykket har »Mig øvende, med Overmod i Bringen,«.
- April: trykkets »Gudle« (298) og »Eenaftenslæsningen« (341).
  Formen »Gudle« er ikke normaliseret.

Seks noter er begrænset til de tilbageværende usikre steder. Marts har
nu 12 og april to `[ulæseligt]`-markeringer. De øvrige problematiske
læsninger i januar, februar og maj kan fortsat ikke genkontrolleres
bogstav for bogstav og bevares med deres usikkerhedsnoter. I alt er
21 af de 31 problemsteder fortsat usikre. Ingen læsning er rekonstrueret
fra en anden udgave, forventet ordlyd eller OCR.


## Juni 1816: afsluttende kontrol mod farve-PDF

Juni er indsat med alle 12 tekstposter på s. 481–576: *Thora*, tredje til
femte sang, samt de ni tekster under *Sommerdigte*. 11 forekomster er nye;
*De atten Eller* beholder sit eksisterende id og sine noter. Thieles
*Til sin Psyche* har egen forfatterangivelse. Hæftet omfatter 97
tekstsideforekomster på 96 fysiske sider, 24 poesiblokke og 85 interne
sideskift. Hæftet har `status="complete"`, begge korrekturflag og modelattest.

Den autoritative kilde er KB's farve-PDF
<https://www.kb.dk/e-mat/dod/130017630319-color.pdf>. Alle 96 tekstsider er
fuldt genlæst mod denne kilde i uafhængige reviewersessioner; en tidligere
sort-hvid-gennemgang bruges alene som hjælp. Alle ord, vers, strofer,
indryk, overskrifter, originalnoter og typografiske fremhævelser er
sammenholdt med farvesiderne. To friske OCR-pass, PSM 3 og 6, er kørt på
samtlige 96 farvesider, og den afsluttende helværksanalyse bruger deres
farvebaserede geometri. Den tidligere læsning »betalende« på s. 484 er
trukket tilbage; farvekilden viser »befalende«.

Junis titelblads-JPEG er udskiftet med farve-PDF'ens indlejrede billede.
Hele kildens ramme bevares uden opskalering; det automatiske forslag om at
beskære i den venstre ramme er ikke anvendt. Billed-QA har status `pass`.
Titelbladets ordlyd og bibliografiske oplysninger er visuelt kontrolleret.
Alle 1114 facsimilesider, 10026 miniaturebilleder og begge PDF-filer er
kontrolleret mod farveudgaverne, både i den lokale facsimilemappe og ved
checksum-sammenligning med serveren. Der er ingen afvigelser.

27 ordmarkeringer bevarer `[ulæseligt]`, fordi den fulde ordform ikke kan
læses sikkert i farvekilden: *Thora* III på s. 487, 496 og 497 (fire),
IV på s. 503, 506, 514, 515, 517 og 518 (ni), V på s. 525, 526, 535 og
538 (ti), *Digtarterne* på s. 544 og 551 (to), *Ode* på s. 553 (ét)
og *Til sin Psyche* på s. 576 (ét). Teksthovedernes noter angiver de
konkrete sider. Den tidligere uunderbyggede slutning »Lunde,« på s. 576
er erstattet af en helordsmarkør uden tilføjet tegnsætning. Ingen manglende
bogstaver er rekonstrueret.

Trykkets »lidt lidt igien ti sig selv« på s. 527 og »Er det det samme« på
s. 549 bevares med præcise noter og afgrænsede tekstkvalitetsundtagelser.
»Til Fru H********« er forbundet som variant med det senere tryk
`baggesen2002112628`; egen ordlyd og struktur følger fortsat juni 1816.
*Den døende Harpeklang* registrerer Baggesen som forfatter til den endnu
ikke indsatte tyske original; kildens egen note og majhæftets elegi
dokumenterer relationen. Et afsluttende ornament på s. 552 er udeladt.

Reviewmateriale og frosset checkpoint ligger i
`/tmp/danfana-1985/final-june-peer/`, med de tre uafhængige reviewområder
`final-june-thora34/`, `final-june-thora5/` og `final-june-summer/`.
De 38 aktuelle strukturkandidater og 987 OCR-signaler er individuelt
dispositioneret med direkte kildeevidens. Den semantiske sideaudit,
variantkontrollen, tekstkvalitetskontrollen, XML-valideringen og `make test`
er gennemført; endelig commit- og CI-status føres i PR #2012.
Juli og senere hæfter forbliver uafsluttede og er ikke ændret her.


## CI-integration med master efter juni

Master er flettet ind efter juni-committen. Fire endnu ikke mergede
Danfana-id’er kolliderede med de allerede publicerede id’er i
*Nytaarsgave 1792*. Danfanas `baggesen2026102201`–`baggesen2026102204`
er derfor flyttet til `baggesen20261022101`–`baggesen20261022104`.
De 63 oprindelige legacy-id’er og Nytaarsgavens publicerede id’er er bevaret.
Ingen tekst, side, note eller korrekturattest er ændret ved id-rettelsen.

Det afsluttende komma i Thieles januartitel er fjernet fra titelmetadata
efter den gældende titelregel; den diplomatiske brødtekst er uændret.


## Juli 1816: fuld kontrol mod farve-PDF

Juli er færdiggjort efter grøn CI for juni og master-integrationen på
`adfd55874` (run `40175760705`). Arbejdet fortsætter direkte på
`tidsskrifter-danfana` efter brugerens anvisning, ét hæfte ad gangen og
med grøn CI før det næste. Den midlertidige juni-PR #2043 er lukket.

Alle syv tekstposter er indsat og kontrolleret: *Thora* VI–VIII,
*Til min Thora*, *Den nyeste skiønne Litteratur*, det eksisterende
*Riim-Trøstebrev* og prosameddelelsen *Seneste Parnassiske Nyhed*.
Seks forekomster er nye. Den eksisterende teksts id og redaktionelle noter
bevares. Hæftet har 101 tekstsideforekomster på alle 100 fysiske
tekstsider, syv poesiblokke og 94 præcise interne sideskift. De tre
*Thora*-sange har 301, 289 og 401 fortløbende heksametre uden blanke
strofeskel. Falske skel ved sideskift er fjernet efter kildekontrol;
kildens indrykkede fortælleafsnit bevares med fire mellemrum.

Den autoritative kilde er KB's farve-PDF
<https://www.kb.dk/e-mat/dod/130017630327-color.pdf>, PDF-sider 8–107.
Den første tekstside er unummereret og registreres bibliografisk som s. 1;
facsimilelinket åbner på `007.jpg`, og der er ikke indsat en kunstig
sideskiftemarkør ved tekstens begyndelse. Alle sider er fuldt genlæst
mod farvekilden i uafhængige reviewersessioner. To friske farvebaserede
OCR-pass, PSM 3 og 6, dækker alle 100 sider og leverer slutanalysens
geometri. Første producentgennemgang og tidligere delreviews er bevaret
som historik; sort-hvid-OCR er ikke autoritativ for slutlæsningerne.

Rettelsesarket nederst på s. 100, PDF107 (`106.jpg`), er kontrolleret og
registreret som `errata applied`, aldrig som tekstpost. Alle tre rettelser
på s. 26 og 43 er indført med typed errata-fodnoter. Fodnoternes højresider
følger de faktiske oprindelige vers: s. 26 har ikke det ekstra komma,
som rettelsesarket citerer, og »blidt« på s. 43 er med lille begyndelsesbogstav
i versets sammenhæng. Sletningen af »om hans« på næste vers er markeret
med `∅] om hans`.

*Riim-Trøstebrev* har fået sine otte manglende sideskift. De 35 kildebelagte
rettelser af streger og citationstegn er genkontrolleret; Arlauds
redaktionelle note er ordret bevaret. De to oprindelige trykte noter er
ordret transskriberet som fodnoter uden trykte markører, herunder trykkets
»Skiemtedigt« på s. 99. Titel og de tre følgende undertitellinjer følger
rubrikkerne på s. 91 uden sammenlægning. Det latinske Horats-motto i
*Den nyeste skiønne Litteratur* er mærket `lang="la"`, og personen er
registreret som nøgleord. Trykkets »De de« i undertitlen på s. 79 bevares
med præcis note og afgrænset tekstkvalitetsundtagelse.

19 helordsmarkeringer bevarer `[ulæseligt]` efter farvekontrollen:
*Thora* VI s. 1, 8 og 22 (fire), VII s. 33 (én), VIII s. 51, 54, 56,
60, 63, 66 og 73 (ti) samt *Den nyeste skiønne Litteratur* s. 86 (fire).
De konkrete sidenoter står i teksthovederne. På s. 33 og 54 kan o/ø i
»Skoster«/»Skøster« ikke afgøres sikkert; de to tryksteder er ikke udfyldt
ud fra hinanden. På s. 51 er førsteglyffen i den tidligere kladdes
»leiforme« usikker mellem f og langt s; ordet er ikke erstattet af en
form gættet ud fra betydningen. På s. 73 er det sikkert læselige
selvstændige »i« indført mellem to usikre ordsteder. Ingen manglende
bogstaver er rekonstrueret.

Julis titelblad er udskiftet med farve-PDF'ens indlejrede billede. Det er
rettet 1,16 grader op uden opskalering og uden beskæring i den trykte
ramme; billed-QA har status `pass`. Ordlyd og bibliografiske oplysninger er
visuelt kontrolleret. De allerede publicerede farvefacsimiler og alle
miniaturebilleder er bevaret med uændrede side-id’er; den fulde
checksum-kontrol fra juni gælder fortsat for de samme filer.

Alle 38 aktuelle strukturkandidater og 1257 OCR-signaler er individuelt
dispositioneret. Fundregisteret har 1396 afsluttede poster: 100 verificerede,
1295 afviste og én tilbagetrukket. Alle poesiblokke har visuelle registre,
og både prosa, motto, originalnoter og typografi er omfattet. Den semantiske
sideaudit dækker 101 forekomster med nul fejl. Variantkontrollen har ingen
åbne kandidater eller dataproblemer. XML, tekstkvalitetskontrol og `make test`
er gennemført; endeligt checkpoint, commit og CI dokumenteres i PR #2012.
Hæftet har begge korrekturflag, modelattest og `status="complete"`.

Slutreview og frosset checkpoint: `/tmp/danfana-1985/final-july-peer/`.
Uafhængige reviewområder: `final-july-thora67/`, `final-july-thora8/` og
`final-july-other/`. August og senere hæfter er ikke ændret i denne session.


## Efterkorrektur af juni og juli 1816

Thora-sangene er samlet i ikke-linkbare sektioner med særskilte
indholdsfortegnelsestitler. Sommerdigte-sektionens id er fjernet, og
henvisningen »S. 444« i noten til »Den døende Harpeklang« linker til majhæftets
»Elegie«. Kalliopes egne noter og rettelsesfodnoter er markeret med
`editorial="true"`; kildens egne noter er bevaret uden markøren.

Efter brugerens rettelser er noternes sidetal ajourført. De sidste syv
`[ulæseligt]` i Thora er derefter afklaret med støtte i *Jens Baggesens danske
Værker*, anden udgave ved August Baggesen, bind VIII, C. A. Reitzel,
Kjøbenhavn, 1846: »natlige« (s. 227), »blødende« (s. 272), »Didkomst«
(s. 275), »Ringen«, »slænge den« og »Klæben« (s. 280). De relevante
bogstavrester og linjer er sammenholdt med Danfanas farvefacsimile,
henholdsvis s. 518 samt s. 60, 66 og 73; Danfanas øvrige stavning,
tegnsætning og verslinjer er bevaret. Opslagene er visuelt kontrolleret i
brugerens lokale PDF *Danske Værker - Bind 07-08.pdf*; den er hentet fra
Google Books, id `hDQYAAAAYAAJ`.

To ulæselige steder på s. 86 i »Den nyeste skiønne Litteratur« er fortsat
markeret; teksten er ikke lokaliseret i den senere udgave ved denne kontrol.
De er ikke udfyldt ved gæt ud fra sammenhængen.


## August 1816: kildekontrol 26. oktober 2026

August omfatter nu 15 tekstposter: 13 nye og de to bevarede forekomster
`baggesen2002121004` og `baggesen2002121005`. Juliane Marie Jessen er
forfatter til *Til Udgiveren af Danfana* og *Til Phæbus*; de øvrige tekster
har Baggesen som forfatter. Hæftet har 14 vers-/dramatekster og én prosatekst
med tre nummererede meddelelser. *Merkur og Sosia* har 675 vers og
*Spring over Molbækken* 37. Én originalnote indeholder desuden tre vers.

Kilden er KB's farve-PDF `130017630327-color.pdf`, PDF-side 112–207,
facsimile `111.jpg`–`206.jpg`: 96 fysiske tekstsider og 99
tekstsideforekomster. Hvert tekststed er gennemlæst i producentens og en
uafhængig reviewersession. Der er 84 interne sideskift med præcise
facsimilefilnavne, herunder `philo<pb/>sophiske` i den sidste meddelelse.
Det trykte spring fra 115 til 117 bevares uden et opdigtet side-116-blad.
Originalnoter, talerangivelser, regibemærkninger, versombrydninger, indryk,
motto og typografi er kontrolleret mod siderne. Prosatekstens tre afsnit og
dens titelnoter følger trykkets ordlyd og afstande. Horats-mottoet har
`lang="la"`; det tyske *Gut Freund!* og citater på latin, græsk og fransk
er sprogmarkeret. Jessens henvisning til *Gaaden* linker til den konkrete
februarforekomst `jessen2026102201`.

Begge friske OCR-pass, PSM 3 og 6, dækker alle 96 farvesider og har
individuelle kommando- og kildehashregistre. Det eksisterende
Fraktur-forberedelsesbundle er verificeret. Den ufiltrerede helværksanalyse
omfatter alle 15 poesiblokke, inklusive originalnotens vers. Alle 56 strukturkandidater og 1283 OCR-signaler er individuelt afsluttet.
Det samlede fundregister indeholder 1405 poster: 58 verificerede rettelser,
1342 afviste signaler og fem tilbagetrukne forslag. Alle 15 blokke har
eksplicitte visuelle strofe- og indrykningsregistre.

Augusts titelblad er genudtrukket fra farvekildens indlejrede 300-ppi-billede
og rettet 1,38 grader op. Automatisk beskæring, der fjernede trykt ramme,
er forkastet. Hele kildens bevarede ramme og sidemarginer er bevaret uden
opskalering; billed-QA har `pass`. Alle 96 offentlige tekstfacsimiler er
hentet igen og matcher farvekildefilerne byte for byte. De allerede
publicerede facsimile-id'er er uændrede. Begge rettelsesark, PDF-side 107 og 307,
er kontrolleret og registreret som `reviewed`: ingen rettelse berører
august. Seks allerede indførte rettelser i marts, maj og juli er mekanisk
flyttet fra de nu ulovlige rettelsesfodnoter til inline-XML-kommentarer med
samme venstre- og højrelæsemåder; ingen ordlyd er ændret ved konverteringen.

### Bevarede usikkerheder og redaktionelle valg i august

- *Hymne til Urania*, `baggesen2026102602`, side 125 (`135.jpg`): navnet i
  »Den store [ulæseligt], leed, som Theoretiker« kan ikke sikkert skelnes
  mellem en fuldt trykt navneform og et navn med udeladelsesprikker. Forslagene
  »Carstens« og »C..stens« er ikke indført som sikre læsninger.
- *Merkur og Sosia*, `baggesen2026102608`, side 179 (`189.jpg`): to ord i
  »Mig, [ulæseligt] [ulæseligt] —« forbliver markeret. Den første navneforms
  slutvokal og et beskadiget bogstav i det næste ord kan ikke afgøres sikkert.
  På side 185 (`195.jpg`) står endnu et helt ord efter »eet Beviis endnu paa«
  markeret. Ingen af de tre ord er udfyldt fra en anden udgave eller fra
  forventet mening.
- De synlige strofemellemrum i *Hymne til Urania* er bevaret. De fysiske
  sideskift skjuler mulig afstand mellem sekslinjede enheder; der er ikke
  indsat nye blanklinjer alene ud fra metret. Den registrerede følge er
  `6,12,6,12,6,12,6,12,6,12,6,12,6`. Samme forsigtige princip giver
  `30,15,15,15` i *Selskabs-Perial*: overgangen mellem side 145 og 146 kan
  skjule et mellemrum mellem de første to femtenlinjede enheder.
- Trykkets `n..tligen` og `Fomahand` i Urania samt `fo Nyn`, `Vers’ts` og
  `no'` i *De tolv Skaaler* er bevaret efter billedkontrol. De kildebelagte
  gentagelser »Himles Himles« og »Bom Bom« har afgrænsede undtagelser fra
  tekstkvalitetsreglen på deres egne tekstposter.
- De seks eksisterende emendationer i *Til Antigone* og *Til Broder
  Dannemand* er bevaret med synlige redaktionelle noter. Trykkets egne
  fodnoter står uden Kalliope-mærkning.

Brugeren skal fortsat vurdere de fire markerede ord/navne og de skjulte
strofegrænser samt kontrollere titelbladet og foretage stikprøver. Disse
brugeropgaver er ikke godkendt på brugerens vegne. September 1816 og senere
hæfter er ikke færdiggjort i dette arbejde; den samlede PR forbliver en kladde.

Slutreview: `/tmp/danfana-august-2012/`, med de uafhængige områder `a/`, `b/`
og `c/`. Worktree: `tidsskrifterdk-august-1816`.

Lokal slutvalidering: `make test` bestået med 132 suites og 2203 tests
(én suite og ni tests sprunget over); XML/RELAX NG, tekstkvalitet og
`git diff --check` består. Den semantiske sideaudit har 99 forekomster og
nul fejl. Variantkontrollen har 14 søgbare tekster, ingen kandidatpar og
ingen dataproblemer. August har `status="complete"`, begge korrekturflag,
`<pagebreaks/>` og modelattest. Den samlede import er fortsat ufuldstændig.
Brugeren har gennemgået ændringen og godkendt commit og push. Commit- og
GitHub CI-status for august føres i PR #2012. Slutcheckpointet er oprettet
og verificeret i `/tmp/danfana-august-2012/checkpoint.json`.


## September 1816 — afsluttet kildekontrol

Septemberhæftet er indsat med ti tekstposter af Baggesen og en overordnet
Abracadabra-sektion. Det omfatter *Tempelsang*, *Asalkoranen*, de tre dramatiske
samtaler *Provst Sæmund den Ungres*, *Ellemoseloven* og *As-Kløver-Troen*,
tre deltitelblade med mottoer samt *Forfatterens Anmærkning* og *Oplysning om de Ti*.
Tempelsang er forbundet som variant med `baggesen2002102903` fra 1819;
den nye tekst er transskriberet fra septembertrykket, ikke kopieret fra varianten.

Kilden er farve-PDF'en `130017630327-color.pdf`, PDF-side 208–307, facsimile 207–306,
trykte sider 197–292 samt omslag og indholdsblade. Alle 100 fysiske sider har
producent- og uafhængige reviewregistreringer. De 95 tekstsider har 85 interne
sideskift; den fejlnummererede side 267 er gengivet som `n="269 [267]"` med
facsimile 281. Ingen fysisk side mangler. Prosaens afsnit, førstelinjeindryk og
mellemrum er kontrolleret direkte; de 24 poesiblokke inklusive fodnote og
indlejrede vers har særskilte visuelle strofe- og indrykningsregistre.

Fire rettelser fra rettelsesarket på PDF-side 307 er indført med inlinekommentarer:
*Forgabelsen* to gange på 257, *I-sig-selv-Forgabelse* på 266 og *Straa* på 276.
Arkets 376 er en trykfejl for 276. Rettelsesarket på PDF-side 107 er også kontrolleret;
dets rettelser på 26 og 43 berører ikke september. Begge ark er registreret.

Titelbladet er hentet fra farvekilden, roteret 0,38 grader og bevaret uden
opskalering eller retouchering; billed-QA er `pass`. Kildens stavning
*Kjøbenhavn* er kontrolleret og bevaret i metadata og titelbladstransskription.
Alle 100 offentlige farvefacsimiler er hentet igen og matcher kildefilerne
byte for byte. Sæmunds eksplicitte facsimileinterval er 224–247.

### Kildeskader og valg i september

- `baggesen2026102616`, side 211/facs 225: to beskadigede ord i »Daraussen fra
  med [ulæseligt] Runer« og »Da de her [ulæseligt] der — tilrede« forbliver
  markeret som hele ord.
- `baggesen2026102621`, side 281/facs 295: det beskadigede ord efter
  »Asenutidens Opdragelse, eller« er markeret som ulæseligt.
- `baggesen2026102622`, side 283/facs 297: ordet efter »uden mindste legemlig«
  er markeret som ulæseligt. Ingen læsning er rekonstrueret.
- Kildebelagte særformer som *Mæv's*, *Jafnhærs*, *Virt ver* og *Løveals Rasen*
  bevares. Den kompakte række »HerrEen—HerrTo—HerrTre—HerrFire—Fem—« på 218
  adskiller sig fra den særskilte, mellemrumssatte række med »Fem!« på 222.
- *OldenSkallen*, circumflexformerne *târ* og *lâr*, »det det« på 280 og
  gentagelsen »være være« over 291–292 er kildebelagte. Tekstkvalitetsrapportens
  ni signaler er derfor gennemgåede kildeformer; de er ikke automatisk rettet.

Brugeren skal fortsat vurdere de fire markerede ord og foretage stikprøver.
Oktober 1816 og senere hæfter færdiggøres ved senere bestilling; årgangens
samlede PR forbliver en kladde. September har `complete`, begge korrekturflag,
`pagebreaks` og attest. Reviewmaterialet ligger i
`/tmp/danfana-september-2012/consolidated/`; worktree er
`tidsskrifterdk-september-korrektur-1816`.

Septembers slutvalidering: `make test` består med 132 suites og 2212 tests
(én suite og ni tests sprunget over). XML/RELAX NG og `git diff --check` består;
semantisk sideaudit: 95 sider og nul fejl. Alle 48 strukturkandidater,
1288 OCR-signaler og ni særskilte tekstkvalitetssignaler er individuelt
afsluttet. Fundregisteret har 1420 poster: 67 verificerede, 1351 afviste og
to tilbagetrukne; ingen åbne eller blot rettede fund.
Brugeren har gennemgået ændringen og godkendt commit og push. Commit og
GitHub CI-status føres i PR #2012. Frosset slutcheckpoint er oprettet og
verificeret i `/tmp/danfana-september-2012/checkpoint.json`.
