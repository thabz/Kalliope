# Hauch: Poetiske Arbejder (1929)

Hele bind III af *Udvalgte Skrifter* er indført i
`fdirs/hauch/1926-udvalgte-skrifter-3.xml`. Det eksisterende værk-id er
bevaret. Titelbladet daterer bindet til 1929; 1926 er begyndelsesåret for
udgivelsen af bind I–III og indgår i den lokale kildemappes navn.

## Kilde og omfang

Carsten Hauch: *Udvalgte Skrifter. III. Poetiske Arbejder*, udgivet af
Poul Schjærff. København: Holbergselskabet af 23. September,
J. Jørgensen & Co. Bogtrykkeri, 1929.

Kilden er de 337 oprindelige JPEG-facsimiler i
`/Volumes/Alma/ADL-facsimiler/Hauch, Carsten/1926 - Poetiske Arbejder/hauch03val/`.
[KB's digitale udgave](https://tekster.kb.dk/text/adl-texts-hauch03val-root)
identificerer samme bind.
[KB's rettighedsoversigt](https://tekster.kb.dk/pages/adl-overview-copyright)
angiver udgaven `hauch03val` som FRI.

Alle kildebilleder er inventeret. Forbladene efterfølges af I–XXVIII og
1–299 uden manglende tryksider. To identiske billeder er blanke versosider,
ikke en dubleret tekstside. De leverede billeder er gråtoner; der er ikke
anvendt en særskilt sort-hvid PDF i stedet for en foreliggende farvekilde.
En PDF er samlet uden rekomprimering af de oprindelige JPEG-filer og brugt
til repositoryets almindelige facsimilebygning. PDF'ens 300 dpi er en
arbejdsindstilling, ikke dokumentation for bogens fysiske mål.

Facsimilerne er publiceret som `hauch/adl-hauch03val`, med nulbaserede
filnavne `000.jpg`–`336.jpg`. Der er 293 interne sideskift med `facs` samt
`<pagebreaks/>`. Den semantiske sidejournal har 350 tekst/side-rækker på
317 forskellige fysiske sider. Titelblade, blanke sider og den trykte
indholdsfortegnelse er med i facsimilet, men er ikke selvstændige tekster.

## Indhold og struktur

Værket har 57 tekstposter:

- Poul Schjærffs indledning, I–XXVIII.
- *Søstrene paa Kinnekullen*: personliste, tre akter og Hauchs efterskrift,
  s. 3–94. Dramaets skift mellem prosa, vers, sang og regibemærkninger er
  bevaret. Efterskriften har ingen trykt overskrift og har derfor en
  redaktionelt markeret katalogtitel.
- *Valdemar Atterdag. Et romantisk Digt*, s. 97–187: én tekst med 29
  indre afdelinger, ikke et skuespil.
- 44 udvalgte digte, s. 191–276. De eksisterende id'er
  `hauch2005052808` og `hauch2005052509` er bevaret; deres tekst er også
  genlæst mod denne udgave.
- Seks poster med udgiverens bemærkninger, litteraturoversigt, tre grupper
  noter og tekstrettelser, s. 277–297.

De 105 poesi-blokke rummer tilsammen 5.263 verslinjer. *Frederiksborg*
har to blokke i samme tekstpost, adskilt ved trykkets indre delingsstreg.
De 183 poster i *Tekstrettelser* er transskriberet som udgiverens
tekstkritiske apparat. De beskriver allerede foretagne indgreb i forhold
til tidligere tryk og manuskripter og er ikke et rettelsesark til dette
bind. Derfor er værkets rettelsesarkstatus `none`.

## Transskription og uafhængig kontrol

Der er lavet frisk dansk Tesseract-OCR med både PSM 3 og PSM 6 på alle
337 kildebilleder i deres oprindelige opløsning. Kraken med den eksisterende
`german_print`-model er afprøvet, men gav dårligere resultater på dette
Antiqua-tryk, især ved danske bogstaver. ADL's eksisterende tekst og andre
Kalliope-udgaver har ikke været transskriptionsgrundlag.

Alle relevante sider er læst direkte mod billedet ved transskriptionen
og igen af en anden session. Slutkontrollen blev fordelt på tre
uafhængige sessioner med modellen `gpt-6.1-sol`, reasoning effort `high`;
ingen session slutkontrollerede sit eget producerede interval.
De har kontrolleret ordlyd, tegn, overskrifter, prosaafsnit,
førstelinjeindryk, afsnitsafstande, verslinjer, strofer, relative indryk,
kursiv og spatiering. Tretten konkrete fund blev rettet og genkontrolleret.
Kandidatregistrene bevarer også afviste falske positiver.

Titelbladet fra kildebillede 0005 er beskåret til
`public/images/hauch/1926-udvalgte-skrifter-3-p1.jpg`, uden opskalering og
uden indgreb i trykt indhold. Geometri og beskæring er kontrolleret med
status `pass`, også af en anden session. Der foreligger ingen selvstændig
kunstnerisk forside til registrering som p2.

## Redaktionelle valg og metadata

Ved fire sideskift kan den lodrette strofeafstand ikke måles direkte:
*Sløret*, s. 227/228; *Sang af Bajazet*, s. 235/236; *Bekiendelse*,
s. 237/238; *Pleiaderne*, s. 265/266. Der er ikke tilføjet en ny
strofegrænse alene på grund af sideskiftet. Det er et konservativt valg
ud fra de synlige sider, ikke en påstand om skjult trykafstand.

Kildebekræftede særheder er bevaret, herunder »fra den. Tid« s. 233,
»Hasel« s. 251, »dise Smaa« s. 264, »milde Kang« s. 270 og »méd« s. 275.
Schjærffs note s. 289 kalder »Hasel« en trykfejl for »Hassel«; noten er
gengivet, mens hovedteksten følger denne udgaves tryk. »Paa det det kunde
rygtes« s. 166 er også bekræftet i trykket; den snævre testundtagelse for
gentagne naboord dækker dette sted.

Der er indsat 42 variantforbindelser efter sammenligning af hele teksterne.
De dækker også øvrige forekomster gennem eksisterende variantgrupper.
En kandidat mellem hele *Valdemar Atterdag* og den særskilt registrerede
første afdeling *Falken* er afvist som variantrelation mellem helhed og
del; forbindelsen er i stedet forklaret i en tekstnote.

Tre frie oversættelser/bearbejdelser er forbundet med allerede indførte
originaler: Goethes *Wandrers Nachtlied II* og *In tausend Formen* samt
Claudius' *Abendlied*. Kildens noter og de konkrete originaltekster er
sammenholdt. Sikre fulde datoer for begivenheder, opførelse og udgivelse
er udskilt som metadata; årstal er ikke udvidet til opdigtede fulde datoer.

Udgiveren Poul Christian Schjærff er oprettet som personen `schjaerff`,
med kildebelagte livsdata og uden digterstatus. Der er ikke fundet en
brugbar biografi i de undersøgte leksika eller et sikkert identificeret,
anvendeligt portræt. Det negative biografiresultat er dokumenteret i
`info.xml`.

## Understøttende værktøjsrettelser

RELAX NG tillader nu det allerede dokumenterede og renderede `<sub>` i
almindelig tekst, så indledningens historiske brøkdato kan bevares.
Sideinventar og historisk OCR-audit håndterer også en personliste i
`<front>` uden `<body>`. Begge tilfælde har målrettede regressionstests.
De oprindelige importrettelser ændrede ikke visningskoden. Den efterfølgende
rettelse af billedtekster er beskrevet nedenfor.

## Kontroller

XML-schema, tekstkvalitet, almindelig OCR-rapport, historisk OCR-audit,
semantisk sideaudit, helværksanalyse med OCR-geometri, variantkontrol,
tekstønskekontrol og facsimilekontrol indgår i slutkontrollen.
Den almindelige OCR-rapport har ingen kandidater. Facsimilekontrollen
bestod med 650 facsimiler og 1.300 kontroller, inklusive den offentlige
`000.jpg` for dette bind. De målrettede schema- og audit-tests bestod med
121 tests. `make test` bestod med 141 testsuiter og 2.511 tests;
ni tests er sprunget over af repositoryets eksisterende konfiguration.
Det frosne reviewcheckpoint samler sidejournal, alle kandidatdispositioner
og de 105 visuelle strukturkontroller. GitHub CI fremgår af PR'en.

## Efterfølgende redaktionel gennemgang

Schjærffs noter er også anbragt ved de relevante tekster: 36 tekstnoter og
111 fodnoter. Afsnittet *Noter* er bevaret uændret. Hovedteksterne er
sammenlignet med den gennemgåede import efter fjernelse af de nye fodnoter;
ordlyd og struktur er uændret. Henvisninger i noterne har fået interne links,
herunder til de nu indførte tekster *Wandrers Sturmlied* og Horats' Ode I, VII.

*Aftensang* har overtaget id'et `hauch1842a3` og den tidligere redaktionelle
note; import-id'et er bevaret som alias. Efter flytningen af *Naturforskeren*
til *Iris* (1819) er Hauchs tomme `andre.xml` slettet. Overflødige serienoter
er fjernet, og sikre begivenhedsdatoer er tilføjet ved Mynsters død,
Frederiksborgs brand og naturforskermødets åbning.

Hermansens *Krageflokke* er registreret og vist ved Hostrups *Krager*.
Originalsiden dokumenterer, at illustrationen stod til Thor Langes
*Gaaet bort* i *Ude og Hjemme*, 2. april 1882, s. 321. Forbindelsen til
Hostrups digt er fortsat usikker og fremgår af en redaktionel note.

Indrykning omkring XML-billedtekster og billednoter trimmes nu før
HTML-konverteringen. Værk- og tekstcache genopbygges ved ændringer i
billedparseren. En regressionstest kontrollerer billedtekst og billednote;
browserkontrollen bekræftede billedtekst uden ekstra mellemrum.

Efter integration af seneste `master` bestod `make test` med 143 testsuiter
og 2.533 tests; ni eksisterende tests er sprunget over.
