# Danfana 1816–1817: dokumenteret omslagsmangel

Brugeren har den 22. oktober 2026 udtrykkeligt godkendt: »Fortsæt uden
majomslaget«. Importen til #1985 fortsætter med denne afgrænsede undtagelse
fra PDF-skillens stopregel. Omslagets ordlyd rekonstrueres ikke.

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
slutstrofe på side 469. De skal indføres ved de relevante tekststeder.
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
*Gaade-Kampen* og *Til Danfanas Læsere*. Det giver foreløbig 73
tekstforekomster i hæfterne. Importen er ikke færdig.

Alle 1114 facsimilesider og tilhørende miniaturebilleder er genereret og
synkroniseret. Den offentlige facsimilekontrol er gennemført uden fejl.
De ti bevarede hæfteomslag er tilføjet som titelbladsbilleder. Beskæringen
bevarer hele den bevarede trykte ramme; automatiske beskæringsforslag, der skar i
rammen, er forkastet. Majomslaget er udeladt efter brugerens godkendelse.

Januars fire tidligere tekstforekomster og oktoberhæftets 30 tidligere
forekomster er uafhængigt gennemgået mod tekstsiderne. Fundene om ordlyd,
typografi og præcise sideskift er rettet og genkontrolleret. De nye
januar- og februartekster er også særskilt uafhængigt korrekturlæst. Dette er ikke en
færdiggodkendelse af hele januar- eller oktoberhæftet.

To læsninger i de eksisterende tekster kan ikke fuldt genkontrolleres:
»suser« i *Ode til Sommerfuglene*, side 13, og »Jesu Christi« i *Elegie*,
side 66. Både den sort-hvide scanning og farveudgaven af samme eksemplar
har udviskede bogstaver. De eksisterende læsninger bevares med udtrykkelige
usikkerhedsnoter; der er ikke rekonstrueret tekst fra en anden udgave.
Farvekilde: <https://www.kb.dk/e-mat/dod/130017630319-color.pdf>.

De resterende hæftetekster, alle relevante trykte rettelser og den samlede
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
