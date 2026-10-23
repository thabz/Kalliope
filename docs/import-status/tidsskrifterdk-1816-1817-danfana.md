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
Alle hæfter efter marts er fortsat `incomplete`; deres tidligere
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
Det giver foreløbig 113 tekstforekomster i hæfterne. Importen er ikke færdig.

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

De resterende hæftetekster fra maj og frem, alle relevante trykte rettelser og den samlede
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
de er markeret uden rekonstruktion. Hæftet forbliver `incomplete`.


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
