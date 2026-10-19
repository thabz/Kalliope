# Oprydning i Ambrosius Stubs »Andre digte«

Gennemgang 16. oktober 2026 af de 32 tekstposter i `fdirs/stub/andre.xml`.
Udgangspunktet er brugerens redaktionelle beslutning: kildefrie tekster kan
slettes, når de ikke afviger væsentligt fra en allerede indført tekst i
1771-udgaven eller Kromans *Digte* (1972). Målet er at tømme `andre.xml`.

Kandidater er først fundet i det genererede korpusdatasæt. Derefter er hele
teksternes ordlyd sammenholdt i de konkrete XML-filer `andre.xml`, `1771.xml`,
`1972-1.xml` og `1972-2.xml`. Det er en sammenligning af eksisterende
transskriptioner, ikke en ny korrektur mod facsimilerne eller en identifikation
af de kildefrie teksters oprindelige udgaver.

28 kildefrie poster er sammenlagt med eksisterende tekster. Hvert slettet id er bevaret som `aliases`
på erstatningen. Variantrelationer er rettet til de faktiske erstatnings-id'er;
relationer til selve erstatningsteksten er fjernet. Interne teksthenvisninger
i Molbechs *Ambrosius* (1877), hans »Andre digte« og Stubs biografi er
rettet til de kanoniske erstatnings-id’er. Bibelhenvisninger er bevaret
på erstatningerne, og de eksisterende kilde- og korrekturangivelser er uændrede.

## Slettede dubletter

| Gammelt id | Erstatning | Værk | Vurdering |
| --- | --- | --- | --- |
| `stub2005072001` | `stub2026101227` | 1972, I | Sammenlagt efter brugerens udtrykkelige beslutning. Afvigelser som »Stiil/Piil« og »Lumskheds/Stoltheds« er dokumenteret nedenfor; Kromans tekst bevares. |
| `stubgudeligea2` | `stub2019061403` | 1771 | Samme tre strofer; mindre stave- og ordafvigelser. |
| `stubgudeligea3` | `stub2019061404` | 1771 | Samme ordlyd; tegnsætning og opsætning varierer. |
| `stubgudeligea4` | `stub2026101329` | 1972, II | Det længere digt findes i del I, og den afvigende slutstrofe er allerede bevaret i del II. Sammenlagt med denne samlede tekstpost. |
| `stubgudeligea5` | `stub2019061406` | 1771 | Samme ordlyd; strofetal og opsætning varierer. |
| `stubgudeligea8` | `stub2026101347` | 1972, II | Samme digt; »hastigt/hastig« og »Glædes/Glædens«. Erstatningen har også bibelsk indledning. |
| `stub1999080201` | `stub2019061413` | 1771 | Samme seks strofer; enkelte ordafvigelser, bl.a. »spendt/stemt«. |
| `stubmoralskea0` | `stub2019061409` | 1771 | Samme ordlyd; I/J og tegnsætning varierer. |
| `stubmoralskea3` | `stub2026101270` | 1972, I | Hele digtet svarer til del I, inklusive »aldrig« og »god Forstand«; del II er en yderligere version. |
| `stubmoralskea4` | `stub2019061417` | 1771 | Samme tre strofer; I/J og »faa/faae«. |
| `stubmoralskea5` | `stub2026101314` | 1972, II | Hele digtet svarer til erstatningens del I; del II er en yderligere version. |
| `stubmoralskea6` | `stub2019061422` | 1771 | Samme ordlyd; tegnsætning og opsætning varierer. |
| `stubmoralskea7` | `stub2019061416` | 1771 | Samme ordlyd; opsætning varierer. |
| `stubmoralskea11` | `stub2019061421` | 1771 | Samme ordlyd; opsætning varierer. |
| `stubmoralskea12` | `stub2019061424` | 1771 | Samme otte linjer med mindre omstilling i »Dog dette var … for meget loved/lovet«. |
| `stubmoralskea13` | `stub2026101239` | 1972, I | Samme seks linjer; ortografi og talnotation varierer. Oplysningen om Rantzau og Kændtler findes også i erstatningen. |
| `stubmoralskea14` | `stub2019061426` | 1771 | Erstatningen indeholder også linjen »Af Fire Ducater blev Krøblingen stærk«; resten har samme ordlyd. |
| `stubmoralskea17` | `stub2026101260` | 1972, I | Hele digtet svarer til del I med forskellig stavning af Stockfleth; del II er en yderligere version. |
| `stubmoralskea20` | `stub2026101253` | 1972, I | Samme to linjer; mindre ordafvigelser, bl.a. »til Lands/paa Land«. |
| `stubmoralskea21` | `stub2003010507` | 1972, I | Sammenlagt efter brugerens beslutning om at tømme `andre.xml`; de ældre læsemåder er dokumenteret nedenfor. |
| `stubmoralskea29` | `stub2026101250` | 1972, I | Samme digt som del I med få ordafvigelser, bl.a. »slige/Sandheds Piller«; erstatningen bevarer også del II. |
| `stubmoralskea32` | `stub2026101255` | 1972, I | Samme ti linjer; enkelte afvigelser som »flæde/fæle« og »mine/dine Børster«. |
| `stubmoralskea34` | `stub2026101309` | 1972, II | Sammenlagt efter brugerens beslutning om at tømme `andre.xml`; de ældre læsemåder er dokumenteret nedenfor. |
| `stubmoralskea39` | `stub2026101307` | 1972, II | Samme ordlyd som del I; del II er en yderligere version. |
| `stubmoralskea40` | `stub2026101229` | 1972, I | De fire linjer indgår sidst i den fulde gravindskrift, s. 153; mindre ord- og staveafvigelser. |
| `stubmoralskea41` | `stub2003010502` | 1972, I | Versene indgår i den fulde gravindskrift; »Ærespagt/Ægte Pagt« og ortografi afviger. |
| `stubmoralskea42` | `stub2026101311` | 1972, II | De seks verslinjer indgår i den fulde gravindskrift; »det/dete« afviger. |
| `stubmoralskea45` | `stub2026101315` | 1972, II | Samme fem strofer med mindre ord- og staveafvigelser. |

## Afslutning

Alle 32 oprindelige poster er håndteret: 28 er sammenlagt med eksisterende
tekster, tre er flyttet til de rette forfattere eller den anonyme samling,
og én er flyttet til Fonsmarks *Samlede Digte* (1961). `stub/andre.xml` er
derfor tømt og fjernet. Den tomme værkpost `stub/ovs.xml`, »Oversættelser«,
er også fjernet efter brugerens ønske.

Alle gamle tekst-id'er er bevaret som tekst-id eller alias. Noter,
bibelhenvisninger og bidragsoplysninger er bevaret på de flyttede tekster
eller erstatningerne. Kromans tekster er ikke omskrevet til de tidligere
kildefrie versioners ordlyd.

## Efterkontrol i Kromans indledning og tekstkritiske noter

På brugerens opfølgende spørgsmål er de ti foreløbigt bevarede poster også
undersøgt i KB's digitale gengivelse af hele 1972-udgaven, inklusive indledning
og noter. Det gav yderligere to sikre dubletter: `stubmoralskea3` svarer til
del I af `stub2026101270`, og `stubmoralskea40` svarer til afslutningen af
`stub2026101229`. De er medtaget i sammenlægningerne ovenfor.

Tre af de tilbageværende poster er udtrykkeligt afvist som Stub-digte i
Kromans indledning. De kan derfor ikke flyttes ind som digte af Stub i denne
udgave:

- `stubmoralskea1`, »To Bønneskrifter«: Kroman identificerer forfatteren som
  Christen Møller Friis, senere adlet de Tuxen, og afviser teorien om, at navnet
  er Stubs pseudonym. Se [bind I, s. 60–62](https://tekster.kb.dk/text/adl-texts-stub01val-root#s60).
- `stubmoralskea43`, gravskriften over Cramohns hustru: Kroman afviser
  Stub-tilskrivningen uden at navngive en anden forfatter. Se
  [bind I, s. 58–59](https://tekster.kb.dk/text/adl-texts-stub01val-root#s58).
- `stubmoralskea44`, gravskriften over Adolphine Christine Rostgaard:
  Kroman angiver Baltzar Sechmann som forfatter med henvisning til Ny kgl.
  Sml. 487,2°. Se [bind I, s. 58–59](https://tekster.kb.dk/text/adl-texts-stub01val-root#s58).

De øvrige fem findes allerede som digtværker i 1972-udgaven. Undersøgelsen af
deres konkrete tekstversioner og kildegrundlag gav følgende resultater:

| Gammelt id | Allerede indført tekst i 1972 | Resultat af efterkontrollen |
| --- | --- | --- |
| `stub2005072001` | `stub2026101227`, I, s. 148–149 | Noten til nr. 27 dokumenterer Brix' ændringsforslag »Stiil«, »Ved« og »Lumskheds«. De er redaktionelle ændringer, ikke Kromans hovedtekst. »Aag« er heller ikke hovedtekstens »Aand«. [S. 149](https://tekster.kb.dk/text/adl-texts-stub01val-root#s149). |
| `stubgudeligea4` | `stub2026101329`, II, s. 71–72 | Kroman trykker det længere digt og den alternative slutstrofe særskilt som I og II. Noten til nr. 99 omtaler desuden tidligere rettelser. En sammenskrivning til den gamle posts form er ikke dokumenteret som Kromans tekst. [S. 71–72](https://tekster.kb.dk/text/adl-texts-stub02val-root#s71). |
| `stub2002020101` | `stub2026101328`, II, s. 68–69 | Digtet er allerede indført, men den gamle post har Fonsmarks 1961-udgave som eksplicit kilde og må ikke ommærkes til Kroman. [S. 68–69](https://tekster.kb.dk/text/adl-texts-stub02val-root#s68). |
| `stubmoralskea21` | `stub2003010507`, I, s. 119–120 | Noten til nr. 21 identificerer »500de« og »udspiilet« som læsemåder i Chr. Stubs 1780-udgave, nr. 66, s. 121 (kilde C). Det er et konkret spor til en anden udgave, ikke grundlag for at ændre Kromans hovedtekst. [S. 120](https://tekster.kb.dk/text/adl-texts-stub01val-root#s120). |
| `stubmoralskea34` | `stub2026101309`, II, s. 23 | Noten til nr. 79, s. 23–24, beskriver Brix' ombytning af slutlinjernes »gav/tog«. »Vel-stand« findes ikke i Kromans hovedtekst, der har »Vel gift«. [S. 23–24](https://tekster.kb.dk/text/adl-texts-stub02val-root#s23). |

`stubgudeligea4` er efterfølgende sammenlagt med `stub2026101329`, fordi den
afvigende slutning allerede er bevaret i samme posts del II.
`stub2005072001` er efter brugerens udtrykkelige beslutning sammenlagt med
`stub2026101227`. Efter brugerens efterfølgende beslutning om at flytte alle
resterende poster er også `stubmoralskea21` og `stubmoralskea34` sammenlagt
med deres 1972-tekster. Alle fire gamle id'er er aliaser på erstatningerne.

`stub2002020101` er flyttet med uændret id, brødtekst, bidragsnote og
kvalitetsflag til [`fdirs/stub/1961.xml`](../../fdirs/stub/1961.xml).
Fonsmarks *Samlede Digte* er registreret som et ufuldstændigt værk med den
eksisterende kilde fra 1961 og s. 11–12. Kilden er struktureret på værkniveau,
og teksten arver den med sit oprindelige sideinterval. Dette er en flytning
af den eksisterende tekst, ikke en ny transskription af hele udgaven.

## Flytning af tidligere Stub-tilskrivninger

Efter brugerens udtrykkelige beslutning er de tre poster flyttet uden at
ændre tekst-id'er, brødtekst eller korrekturstatus. Hver post har en note om,
at den tidligere har været tilskrevet Stub, og at tilskrivningen er afvist,
med henvisning til Kromans trykte udgave uden eksterne links i noten.
Der er ikke tilføjet en gættet transskriptionskilde;
Kroman-henvisningen dokumenterer forfattertilskrivningen.

| Tekst-id | Ny placering | Forfatter |
| --- | --- | --- |
| `stubmoralskea1` | [`fdirs/tuxenc/andre.xml`](../../fdirs/tuxenc/andre.xml) | Christian de Tuxen, tidligere Christen Møller Friis |
| `stubmoralskea43` | [`fdirs/anonym1700dk/andre.xml`](../../fdirs/anonym1700dk/andre.xml) | Anonym, 1700-tallet |
| `stubmoralskea44` | [`fdirs/sechmann/andre.xml`](../../fdirs/sechmann/andre.xml) | Baltzar Sechmann |

Alle tre modtagermapper er nye og har `info.xml`; samlingen for anonyme danske
digte fra 1700-tallet følger de eksisterende samlinger for 1600- og
1800-tallet. Tuxens fødsels- og dødsår, 1713 og 1792, følger Kroman, bind I,
s. 61–62. Sechmanns fulde navn Balthasar Jørgensen Sechmann, dåb i Christiania
22. oktober 1680 og død 11. februar 1746 følger
[Wibergs præstehistorie, Ålborg Budolphi, nr. 14](https://wiberg-net.dk/9-11-Aalb.Bud.htm).
Datoen i 1680 registreres som dåb, ikke fødsel.
