# Kilder til Johannes Ewalds eksisterende digte

Kildekontrol 16. oktober 2026, udført til [#1967](https://github.com/thabz/Kalliope/issues/1967).
Udgangspunktet er det genererede korpus med `built_at: 2026-10-16T07:24:04.468Z`:
106 tekstposter, heraf 83 i `andre.xml`, otte i `1770.xml`, `1771.xml` og
`1779.xml`, syv i *Vingesus*, syv i antologier og én i `p1780.xml`.
Kildearven er efterprøvet i de berørte XML-filer. De 88 DSL-tekster er samlet i
`ewald/1969` med underbind `1969-1` til `1969-6`, efter samme model som
`aarestrup/1976`. Bind VI har komplet facsimile, men endnu ingen transskriberede tekster.
Digtenes id'er, ordlyd og sidehenvisninger er bevaret ved flytningen.
*Philet* og de seks sange fra *Fiskerne* beholder deres oprindelige
udgivelsesår i teksternes noter. De tidligere værkbeholdere
`1770.xml` og `1779.xml` bevares som tomme værkposter for de faktiske
udgivelser fra 1770 og 1779, med noter der henviser til DSL-teksterne i bind
II og III. De eksisterende værklinks bevares.

DSL's udgave er valgt som tekstgrundlag for 88 eksisterende tekstposter efter
identifikation og sammenligning med trykket. Det er et redaktionelt kildevalg;
den oprindelige indtastningsudgave er ikke dermed historisk dokumenteret.
De dokumenterede andre udgaver til *Til Sielen*, *Da den høysalige Konge blev
udført* og *Hedningernes Frelse* bevares. Dermed har alle 91 berørte tekster en
bibliografisk kilde. De 90 manglende kildefelter i #1912's Ewald-gruppe er
registreret; kilde- og sidetalskontrol er ikke en ny fuld korrektur.
Teksternes kvalitetsmærker er bevaret. Den samlede 1969-udgave og dens underbind
er markeret `incomplete`, fordi kun udvalgte tekster er indsat.

## Udgaver og digital adgang

Titelblade, kolofoner og filadgang er kontrolleret. Originaludgavens forlag er
Gyldendalske Boghandel, Nordisk Forlag, København. Det benyttede fotografiske
optryk er 2. oplag, Gyldendal, København, 1969, udført af Villadsen og
Christensen. Bind I–V betegnes uændrede fotografiske optryk; bind VI har
forbeholdet »bortset fra Tillæg 1969«.

| Bind | Første udgivelsesår | Udgivere | KB's digitale udgave | Facsimile-PDF |
| --- | --- | --- | --- | --- |
| I | 1914 | Hans Brix og V. Kuhr | [KB](https://tekster.kb.dk/text/adl-texts-ewald03val-root) | [PDF](https://tekster.kb.dk/catalog/adl-texts-ewald03val-root/facsimile.pdf) |
| II | 1915 | Hans Brix og V. Kuhr | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root) | [PDF](https://tekster.kb.dk/catalog/adl-texts-ewald04val-root/facsimile.pdf) |
| III | 1916 | Hans Brix og V. Kuhr | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root) | [PDF](https://tekster.kb.dk/catalog/adl-texts-ewald05val-root/facsimile.pdf) |
| IV | 1919 | V. Kuhr og S. Pallis | [KB](https://tekster.kb.dk/text/adl-texts-ewald06val-root) | [PDF](https://tekster.kb.dk/catalog/adl-texts-ewald06val-root/facsimile.pdf) |
| V | 1920 | Svend Aage Pallis under medvirkning af Niels Møller | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | [PDF](https://tekster.kb.dk/catalog/adl-texts-ewal07tom-root/facsimile.pdf) |
| VI | 1924 | Svend Aage Pallis under medvirkning af Niels Møller | [KB](https://tekster.kb.dk/text/adl-texts-ewal08tom-root) | [PDF](https://tekster.kb.dk/catalog/adl-texts-ewal08tom-root/facsimile.pdf) |
| Tillæg | 1969 | Erik M. Christensen | [KB](https://tekster.kb.dk/text/adl-texts-ewal09tom-root) | [PDF](https://tekster.kb.dk/catalog/adl-texts-ewal09tom-root/facsimile.pdf) |

De seks binds titelbladsbilleder `1969-1-p1.jpg` til `1969-6-p1.jpg` viser
1969-optrykkets titelblade, den tredje billedside i hvert komplet facsimile.
De er fremstillet fra KB's originalbilleder, geometrisk kontrolleret og
beskåret med den fulde bogside bevaret. Den trykte ordlyd er transskriberet
på hvert `<picture type="titlepage">`; udgivelsesåret fremgår af kolofonerne.

Alle syv facsimile-PDF'er kunne hentes. PDF'erne har en indledende portalside,
som ikke er en trykt bogside. KB's `/text/…-root.pdf` er derimod en sat digital
tekstgengivelse og bruges ikke som billeder af trykket.

Ved denne kontrol var KB's nedskalerede IIIF-billeder skæve og delvis afskårne.
De originale billeder på `/full/full/0/default.jpg` var intakte. Kalliopes
facsimiler er derfor dannet fra disse originalbilleder og nedskaleret lokalt.
Bind II's annoncerede `ewald4fm011` findes ikke hos billedserveren og er heller
ikke et ekstra blad i KB's PDF. Den ugyldige indeksreference er udeladt;
bindets ti indledende blade og samtlige trykte sider 1–376 er med.

Bind V's tekstkritiske afsnit, de relevante afsnit i VI og *Tillæg 1969* er
undersøgt som støtte til udgavevalget. Tillægget indeholder tre supplerende
tekster med variantapparat; ingen af dem skal indsættes for at kildebelægge de
91 eksisterende tekstposter. Ved udvidelsen til komplette facsimiler er bind I's trykte
*Rettelser til I. Bind*, s. 383–384, gennemgået. Den relevante rettelse i
*Sørge-Digt over Frue Rahbek*, s. 138, linje 4, er indført som
`Din<footnote type="errata">Din] din</footnote>`. Rettelseslisten er registreret
med `<errata>` i bind I; ingen af dens øvrige rettelser rammer de indsatte
tekstintervaller. Dette er ikke en erklæring om fuld tekstkorrektur af alle
seks bind, og der er ikke tilføjet `<pagebreaks/>` eller nye korrekturattester.

*Til Sielen* bevarer Kielberg/Ravn-udgaven. Dens trykte titelblad angiver
*Udvalgte digte*, Esther Kielberg og Kim Ravn, DSL/Borgen; kolofonen har © 1998,
ISBN 87-21-00969-4. Den eksisterende indtastningsnote angiver ligeledes 1998.
KB's portalmetadata siger 1999. Det dokumenterede 1998-år og s. 96–100 er derfor
bevaret; portalens årstal er ikke brugt til at omdatere indtastningskilden.
[KB's tekst og sidebilleder](https://tekster.kb.dk/text/adl-texts-ewald02dkval-root#idm140323883550288)
og [udgivernes tekstkritiske redegørelse](https://tekstnet.dk/resources/ewald-j_udvalgte-digte_epi/).

## Komplette facsimiler og sidemapping

De otte billedserier dækker samtlige 2.778 tilgængelige bogsider i KB's
billedindeks: alle seks DSL-bind, tillægget og DSL/Borgens digtudvalg.
Titelblade, kolofoner, forord, tekst, noter og blanke sider bevares i den
oprindelige rækkefølge. Portalsider fra tekst-PDF'er indgår ikke.

Som hos `aarestrup/1976` svarer én serie til ét bind med en komplet PDF,
fortløbende JPEG-filer fra `000.jpg` og thumbnails. Værkkildens
`facsimile-pages-offset` omsætter trykte sidetal til enbaserede billednumre.
Digtene behøver derfor kun `<source pages="…"/>`; nye digte kan henvises til
alle bogens sider uden at udvide eller omnummerere serien. Bibliografiske
kilder og digtenes trykte sideintervaller er bevaret.

| Billedserie | Antal billeder | Trykte sider / sidemapping |
| --- | ---: | --- |
| `1969-1` | 399 | 15 indledende blade + s. 1–384; offset 15 |
| `1969-2` | 386 | 10 indledende blade + s. 1–376; offset 10 |
| `1969-3` | 335 | 10 indledende blade + s. 1–325; offset 10 |
| `1969-4` | 401 | 12 indledende blade + s. 1–389; offset 12 |
| `1969-5` | 391 | 16 indledende blade + s. 1–375; offset 16 |
| `1969-6` | 562 | 16 indledende blade + s. 1–546; offset 16 |
| `1969-6-tillaeg` | 13 | Tillæg 1969, s. 1–13; offset 0 |
| `1998-udvalgte-digte` | 291 | KB's fortløbende billedserie 1–291; offset 0 |

Tillægget er registreret som en særskilt navngiven kilde i bind VI. Det er
ikke oprettet som en selvstændig tekstpost. Der tilføjes ingen nye
korrekturattester ved udvidelsen af billedserierne.

## Konkordans

**Verificeret** betyder, at tekstens identitet, valgte tekstgrundlag og
start-/slutside er kontrolleret. Det betyder ikke to nye fulde
korrekturgennemgange. **Anden udgave** betegner en bevaret, konkret dokumenteret
kilde. Der er ingen uidentificerede DSL-kandidater i nedenstående liste.

For de to antologikilder uden ny scanning er side-/adgangsstatus angivet
særskilt. DSL-henvisningerne dér er referencehenvisninger og er ikke overført
til deres `<source>`.

| Tekst-id | Titel / førstelinje | Placering | DSL-bind og trykte sider | Valgt kilde / status | Digital kilde | Facsimilesider i hele bindet |
| --- | --- | --- | --- | --- | --- | --- |
| `ewald2005052115` | Tanker ved Salig Hr. Ulrich Friderich Suhms Grav | `ewald/1969-5` | V, 221–222 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 237–238 |
| `ewald1999082207` | Fragment / Før Kunsten kom var Pragt og Orden | `ewald/1969-5` | V, 40 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 56 |
| `ewald1999082208` | Fragment / Lær mig | `ewald/1969-5` | V, 40 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 56 |
| `ewald1999082209` | Fragment / Er det kun Lyst som viise glædes ved | `ewald/1969-5` | V, 44 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 60 |
| `ewald2002030501` | Da den høysalige Konge blev udført | `ewald/andre` | I, 101–103 | Gyldendals Bibliotek, Dansk Lyrik I, s. 63–65; anden udgave | Ikke verificeret | — |
| `ewaldandrea0` | Fragment / Indhyllet i mig Selv og taus og Mørk som du | `ewald/1969-5` | V, 48–49 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 64–65 |
| `ewald1999021802` | Paaskrift paa en Kaffekande | `ewald/1969-5` | V, 212 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 228 |
| `ewald1999021803` | Aftenen. Et Fragment (II) | `ewald/1969-5` | V, 191 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 207 |
| `ewaldandrea5` | Vinteren, et Fragment | `ewald/1969-5` | V, 194–195 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 210–211 |
| `ewaldandrea6` | Vers / Min Bendsen naar Englernes Ild | `ewald/1969-5` | V, 49 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 65 |
| `ewald1999082201` | Den fornuftige Datter | `ewald/1969-3` | III, 221 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s221) | 231 |
| `ewald1999082202` | Versemageren | `ewald/1969-3` | III, 221 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s221) | 231 |
| `ewald1999021801` | Natte-Tanker | `ewald/1969-5` | V, 87–89 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 103–105 |
| `ewaldandrea2` | Til Sielen. En Ode | `ewald/andre` | III, 259–262 | Udvalgte digte, 1998, s. 96–100; anden udgave | [KB](https://tekster.kb.dk/text/adl-texts-ewald02dkval-root#idm140323883550288) | 96–100 |
| `ewald1999030202` | I Abrahamsons Stambog | `ewald/1969-5` | V, 33–34 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 49–50 |
| `ewaldandrea1` | Poenitenten. Et Fragment | `ewald/1969-5` | V, 193–194 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 209–210 |
| `ewald1999022201` | Poenitenten. En Ode | `ewald/1969-3` | III, 254–256 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s254) | 264–266 |
| `ewald1999022202` | Følelser ved den Hellige Nadvere | `ewald/1969-3` | III, 257–258 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s257) | 267–268 |
| `ewald1999120701` | Morgen-Sang | `ewald/1969-5` | V, 205–206 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 221–222 |
| `ewald1999022001` | Død og Dom | `ewald/1969-5` | V, 153–154 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 169–170 |
| `ewald2000062904` | Fragment / Skjønt Himlen taug og Dagens Hersker smiilte | `ewald/1969-5` | V, 154 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 170 |
| `ewald1999022003` | Impromptu | `ewald/1969-5` | V, 1 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 17 |
| `ewald2005052103` | Gratulation da Seigr. Peder Huulegaard | `ewald/1969-3` | III, 319–322 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s319) | 329–332 |
| `ewald2000070102` | Tanker i Anledning af Hr. Hans Ebbesen... | `ewald/1969-1` | I, 87–88 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald03val-root#s87) | 102–103 |
| `ewald2001071102` | Sørge-Sange i Christiansborgs Slots-Kirke | `ewald/1969-1` | I, 98–103 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald03val-root#s98) | 113–118 |
| `ewald2005052108` | I Anledning af Hr. Palludan og Jfr. Lønborg's Mariage | `ewald/1969-1` | I, 134–135 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald03val-root#s134) | 149–150 |
| `ewald2000062901` | Tanker i Anledning af Frøken Sophia Dorthea v. Holstein's Dødsfald | `ewald/1969-1` | I, 125–127 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald03val-root#s125) | 140–142 |
| `ewald2001070801` | Sørge-Digt over Frue Rahbek | `ewald/1969-1` | I, 136–138 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald03val-root#s136) | 151–153 |
| `ewald2005052114` | Tanker da Arveprinds Frederik Giennemgik Smaa-Koppernes Indpodning | `ewald/1969-1` | I, 266–267 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald03val-root#s266) | 281–282 |
| `ewald2005052104` | Tanker i Anledning af Sr. Huulgaards dødelige Afgang | `ewald/1969-3` | III, 323–325 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s323) | 333–335 |
| `ewald2005052111` | Ode til Printz Friderich, da Han fornyede sin Daabes Pagt | `ewald/1969-2` | II, 1–3 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s1) | 11–13 |
| `ewald2005052112` | Over Hr. Hermanny | `ewald/1969-2` | II, 16–18 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s16) | 26–28 |
| `ewald2001062403` | Til Cecilia Wormstrup | `ewald/1969-5` | V, 45–46 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 61–62 |
| `ewald2001070802` | Et Glimt fra Tiden ind i Evigheden | `ewald/1969-2` | II, 13–15 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s13) | 23–25 |
| `ewald2000062902` | Ønske til Jomfrue Cecilia Wormstrup, paa Hendes Fødsels-dag | `ewald/1969-2` | II, 46 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s46) | 56 |
| `ewald2005112901` | Recitativ og Aria | `ewald/1969-2` | II, 114 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s114) | 124 |
| `ewald2005052101` | Cantata for Raadhuus-Strædets Concert | `ewald/1969-5` | V, 203 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 219 |
| `ewaldandrea3` | Da jeg var syg | `ewald/1969-2` | II, 115–116 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s115) | 125–126 |
| `ewald2005052109` | Klage-Sang af en Bekiendt ved Hr. Haagensens Grav | `ewald/1969-2` | II, 144–145 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s144) | 154–155 |
| `ewald2005052113` | Over M. Th** | `ewald/1969-5` | V, 210–211 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 226–227 |
| `ewald2005052105` | I Anledning af Hans Excellence Hr. Grev Haxthausens Afgang fra Søe Etaten | `ewald/1969-2` | II, 194 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s194) | 204 |
| `ewald1999021805` | Taarer ved Herr Frederik von Arnsbachs Grav | `ewald/1969-2` | II, 191–193 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s191) | 201–203 |
| `ewald2002122003` | En Passions-Sang [Stabat Mater] | `ewald/1969-2` | II, 195–196 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s195) | 205–206 |
| `ewald2000062903` | Paa Kongens Fødsels-Dag | `ewald/1969-2` | II, 177 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s177) | 187 |
| `ewald1999022004` | Haab og Erindring | `ewald/1969-2` | II, 197–201 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s197) | 207–211 |
| `ewald2001062406` | Til Herr Berling og Jfr. Godiche | `ewald/1969-2` | II, 202–203 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s202) | 212–213 |
| `ewaldandrea4` | Rungsteds Lyksaligheder | `ewald/1969-3` | III, 88–90 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s88) | 98–100 |
| `ewald2001062404` | Over Andreas Schyth | `ewald/1969-5` | V, 91–94 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 107–110 |
| `ewald2001062402` | Over Johannes Kinast | `ewald/1969-5` | V, 89–91 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 105–107 |
| `ewald1999030201` | Til Hr. Find og Jfr. Lund | `ewald/1969-5` | V, 215–216 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 231–232 |
| `ewald1999022203` | Til Jomfrue Anna Hedevig Jacobsen | `ewald/1969-5` | V, 204 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 220 |
| `ewaldandrea8` | Klage-Sang over Skiødehunden: Maske | `ewald/1969-3` | III, 119–124 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s119) | 129–134 |
| `ewald2000070901` | Nytaarsdigt til en Fader (I) | `ewald/1969-5` | V, 97–98 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 113–114 |
| `ewald2000070902` | Nytaarsdigt til en Fader (II) | `ewald/1969-5` | V, 98–99 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 114–115 |
| `ewald2001081802` | Nytaarsdigt til en Moder | `ewald/1969-5` | V, 94–97 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 110–113 |
| `ewald2001062401` | Aftenen | `ewald/1969-5` | V, 151–153 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 167–169 |
| `ewald2000070103` | Epigram | `ewald/1969-5` | V, 160 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 176 |
| `ewald2001071101` | I Anledning af den Sal. Mad. Jacobsens Dødsfald | `ewald/1969-3` | III, 85–87 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s85) | 95–97 |
| `ewald1999092201` | Til Generalinde Elisabeth Moltke | `ewald/1969-5` | V, 157–158 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 173–174 |
| `ewald2005052110` | Ode til Arve-Prindsen, den 11. October 1776 | `ewald/1969-3` | III, 91–93 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s91) | 101–103 |
| `ewald2000063002` | Vers paa et Sølv Skildt | `ewald/1969-3` | III, 99 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s99) | 109 |
| `ewald1999030204` | Eselet og Bonden | `ewald/1969-3` | III, 117–118 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s117) | 127–128 |
| `ewald2001082401` | Fragment / Svulmende Vellyst, du som mit Bryst af Leer | `ewald/1969-5` | V, 108 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 124 |
| `ewald2000063003` | Tanker ved Graven af den unge Jens Sanderschov | `ewald/1969-3` | III, 104–105 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s104) | 114–115 |
| `ewald2005052118` | Ved en Fest paa Kronprindsens Fødselsdag | `ewald/1969-3` | III, 125–126 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s125) | 135–136 |
| `ewald2005052119` | Indskrifter ved Festen | `ewald/1969-3` | III, 126 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s126) | 136 |
| `ewald2005052106` | I Anledning af Hendes Kongelige Majestæts Dronning Juliana Maria høie Fødsels-Fest | `ewald/1969-3` | III, 135–137 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s135) | 145–147 |
| `ewald2005052107` | Indskrift ved en Fest i samme Anledning | `ewald/1969-3` | III, 138 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s138) | 148 |
| `ewald2000063001` | Sang i Anledning af Kongens Fødselsdag 1778 | `ewald/1969-3` | III, 109 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s109) | 119 |
| `ewaldandrea7` | Aftenen. Et Fragment | `ewald/1969-3` | III, 116 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s116) | 126 |
| `ewald1999081401` | Et hengivent Ønske | `ewald/1969-3` | III, 115 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s115) | 125 |
| `ewald1999081402` | Under Frue Caroline Walthers Portrait | `ewald/1969-3` | III, 127 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s127) | 137 |
| `ewald2001070101` | Indføds-Retten | `ewald/1969-3` | III, 128–134 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s128) | 138–144 |
| `ewald2000070101` | Fra et brev til moderen | `ewald/1969-4` | IV, 366–367 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald06val-root#s366) | 378–379 |
| `ewald2005051802` | Cantate ved Jubileet den 11 May 1779 i Anledning af Universitetets Indvielse for 300 Aar siden | `ewald/1969-3` | III, 143–145 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s143) | 153–155 |
| `ewald2002122001` | Cantate opført ved Universitetets sædvanlige Høitidelighed i Anledning af Kongens Fødselsdag 1779 | `ewald/1969-3` | III, 141–142 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s141) | 151–152 |
| `ewald2001062405` | Til Hans Kongelige Høihed Arveprinds Frederik | `ewald/1969-3` | III, 263–265 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s263) | 273–275 |
| `ewald1999082206` | Det nye Aar 1779 | `ewald/1969-3` | III, 139–140 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s139) | 149–150 |
| `ewald2002122002` | En aandelig Sang | `ewald/1969-3` | III, 222–228 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s222) | 232–238 |
| `ewald1999021804` | Claus Rimers Gravskrift | `ewald/1969-3` | III, 221 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s221) | 231 |
| `ewald2005052117` | Til min M** paa hans Broders Fødselsdag | `ewald/1969-3` | III, 313–315 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s313) | 323–325 |
| `ewald1999030203` | Til min M*** | `ewald/1969-3` | III, 229–230 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s229) | 239–240 |
| `ewaldandrea9` | Udrust dig, Helt fra Golgatha | `ewald/1969-3` | III, 316 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s316) | 326 |
| `ewald2000070104` | Philet en Fortælning | `ewald/1969-2` | II, 19–27 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s19) | 29–37 |
| `ewald2001081801` | Hedningernes Frelse | `ewald/1771` | II, 182–190 | Den danske lyrik I, 1963; anden udgave, sidetal og scanning uafklaret | Ikke verificeret | — |
| `ewald1999082203` | Arioso / En Bonde seer fra Ploven | `ewald/1969-3` | III, 155–156 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s155) | 165–166 |
| `ewald1999082204` | Arioso / En Søemand, med et modigt Bryst | `ewald/1969-3` | III, 164–165 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s164) | 174–175 |
| `ewald1999082205` | Arie / Naar Syd-Vinden kuler | `ewald/1969-3` | III, 182 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s182) | 192 |
| `ewlad1999022205` | Romance / Kong Christjan stoed ved høien Mast | `ewald/1969-3` | III, 187–188 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s187) | 197–198 |
| `ewald1999022204` | Romance / Liden Gunver vandrer som helst i Qveld | `ewald/1969-3` | III, 205–206 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s205) | 215–216 |
| `ewald1999022002` | Romance / En Edder-Fugl var haardt i Klemme | `ewald/1969-3` | III, 213 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s213) | 223 |

## Andre forekomster og afgrænsning

De syv antologitekster er medtaget i variantkontrollen, men beholder deres
historiske antologiudgaver. *Alnaturens Glæde* er et bearbejdet uddrag med en
allerede registreret henvisning til `ewald1999030201`; det er ikke en ny fuld
variant. *En brav Mands Eftermæle* er et uddrag af Arnsbach-digtet, og
*Sørgekantate over Frederik den femte* udelader de bibelske kor. Der oprettes
ikke fulde variantrelationer for disse uddrag. De eksisterende relationer fra
sangene i *Fiskerne* er bevaret.

| Tekst-id | Antologi | Titel | Trykte sider |
| --- | --- | --- | --- |
| `ewald20260823143` | `antologierdk/1835` | Alnaturens Glæde | 196-197 |
| `ewald20260823172` | `antologierdk/1835` | Sømandssang | 262-263 |
| `ewald20260823221` | `antologierdk/1835` | Sørgekantate over Frederik den femte | 399-400 |
| `ewald2026082335` | `antologierdk/1835` | Edderfuglen | 31 |
| `ewald2026082381` | `antologierdk/1835` | Sømandssang | 96-97 |
| `ewald2026082393` | `antologierdk/1835` | En brav Mands Eftermæle | 113 |
| `ewald2026090601` | `antologierdk/1881` | Dansk Nationalsang | 64-66 |

De syv tekster i `ewald/1985-vingesus` bevarer deres eksisterende ordlyd og
sidetal. Den gentagne fritekstkilde er omsat til én struktureret værkkilde
med Johannes Ewald som forfatter, Keld Zeruneith som udgiver, København,
Hans Reitzels Forlag og 1985; teksternes tomme `<source pages="…"/>` arver
denne bibliografi. `ewald/p1780` får en struktureret kilde til Johannes
Ewalds *Samtlige Skrifter*, København, 1780, efter den eksisterende note
om forordets oprindelse. Der er ikke tilføjet gættede bind- eller sidetal.
Ingen af disse tekster tilskrives DSL-udgaven. Fuld transskription af de seks bind, komplettering
af *Fiskerne* eller *Adskilligt* og nye korrekturattester ligger uden for denne
kildekontrol. #992 og #1821 bevarer deres selvstændige afgrænsninger.

De resterende adgangsopgaver er at skaffe den konkrete 1963-udgave af
*Den danske lyrik* med sidetal til *Hedningernes Frelse* samt scanning og
fuldstændig udgaveidentifikation af *Gyldendals Bibliotek, Dansk Lyrik*, bind I.
Der er ikke indsat gættede årstal, sidetal eller facsimiler til disse to udgaver.

Disse to adgangsopgaver følges i [#1969](https://github.com/thabz/Kalliope/issues/1969).
