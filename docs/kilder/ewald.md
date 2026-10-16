# Kilder til Johannes Ewalds eksisterende digte

Kildekontrol 16. oktober 2026, udført til [#1967](https://github.com/thabz/Kalliope/issues/1967).
Udgangspunktet er det genererede korpus med `built_at: 2026-10-16T07:24:04.468Z`:
106 tekstposter, heraf 83 i `andre.xml`, otte i `1770.xml`, `1771.xml` og
`1779.xml`, syv i *Vingesus*, syv i antologier og én i `p1780.xml`.
Kildearven er efterprøvet i de berørte XML-filer. De 88 DSL-tekster er samlet i
`ewald/1969` med underbind `1969-1` til `1969-6`, efter samme model som
`aarestrup/1976`. Bind VI er foreløbig en bibliografisk post uden tekster.
Digtenes id'er, ordlyd og sidehenvisninger er bevaret ved flytningen.
*Philet* og de seks sange fra *Fiskerne* beholder deres oprindelige
udgivelsesår i teksternes noter. De tidligere værkbeholdere
`1770.xml` og `1779.xml` er erstattet af deres placering i bind II og III;
interne henvisninger er opdateret.

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

Alle syv facsimile-PDF'er kunne hentes. PDF'erne har en indledende portalside,
som ikke er en trykt bogside. KB's `/text/…-root.pdf` er derimod en sat digital
tekstgengivelse og bruges ikke som billeder af trykket.

Ved denne kontrol var KB's nedskalerede IIIF-billeder skæve og delvis afskårne.
De originale billeder på `/full/full/0/default.jpg` var intakte. Kalliopes
facsimiler er derfor dannet fra disse originalbilleder og nedskaleret lokalt.
Bind II's annoncerede `ewald4fm011` gav ingen billedfil; det er ikke en af de
anvendte tekstsider. Dette blad er ikke med i facsimileudvalget.

Bind V's tekstkritiske afsnit, de relevante afsnit i VI og *Tillæg 1969* er
undersøgt som støtte til udgavevalget. Tillægget indeholder tre supplerende
tekster med variantapparat; ingen af dem skal indsættes for at kildebelægge de
91 eksisterende tekstposter. Der er ikke fundet et særskilt rettelsesark i de
anvendte sideudvalg. Dette er ikke en erklæring om fuld sidegennemgang af alle
seks bind, og der er ikke tilføjet `<errata status="none"/>` eller
`<pagebreaks/>` til værkerne.

*Til Sielen* bevarer Kielberg/Ravn-udgaven. Dens trykte titelblad angiver
*Udvalgte digte*, Esther Kielberg og Kim Ravn, DSL/Borgen; kolofonen har © 1998,
ISBN 87-21-00969-4. Den eksisterende indtastningsnote angiver ligeledes 1998.
KB's portalmetadata siger 1999. Det dokumenterede 1998-år og s. 96–100 er derfor
bevaret; portalens årstal er ikke brugt til at omdatere indtastningskilden.
[KB's tekst og sidebilleder](https://tekster.kb.dk/text/adl-texts-ewald02dkval-root#idm140323883550288)
og [udgivernes tekstkritiske redegørelse](https://tekstnet.dk/resources/ewald-j_udvalgte-digte_epi/).

## Facsimileudvalg og sidemapping

Der er seks særskilte billedserier. De er **sideudvalg**, ikke fuldstændige
bogdigitaliseringer: titelblade og kolofoner samt alle sider i de anvendte
tekstintervaller. Hver tekst har derfor eksplicit `facsimile-pages`; et fælles
offset ville være forkert. `pages` angiver altid trykte sidetal.

| Billedserie | Antal billeder | Medtagne trykte tekstsider |
| --- | ---: | --- |
| `ewald-ss-1969-1-udvalg` | 33 | 87–88, 98–103, 125–127, 134–138, 266–267 |
| `ewald-ss-1969-2-udvalg` | 48 | 1–3, 13–27, 46, 114–116, 144–145, 177, 191–203 |
| `ewald-ss-1969-3-udvalg` | 93 | 85–93, 99, 104–105, 109, 115–145, 155–156, 164–165, 182, 187–188, 205–206, 213, 221–230, 254–258, 263–265, 313–316, 319–325 |
| `ewald-ss-1969-4-udvalg` | 14 | 366–367 |
| `ewald-ss-1969-5-udvalg` | 48 | 1, 33–34, 40, 44–46, 48–49, 87–99, 108, 151–154, 157–158, 160, 191, 193–195, 203–206, 210–212, 215–216, 221–222 |
| `ewald-udvalgte-digte-1998-udvalg` | 7 | 96–100 |

## Konkordans

**Verificeret** betyder, at tekstens identitet, valgte tekstgrundlag og
start-/slutside er kontrolleret. Det betyder ikke to nye fulde
korrekturgennemgange. **Anden udgave** betegner en bevaret, konkret dokumenteret
kilde. Der er ingen uidentificerede DSL-kandidater i nedenstående liste.

For de to antologikilder uden ny scanning er side-/adgangsstatus angivet
særskilt. DSL-henvisningerne dér er referencehenvisninger og er ikke overført
til deres `<source>`.

| Tekst-id | Titel / førstelinje | Placering | DSL-bind og trykte sider | Valgt kilde / status | Digital kilde | Facsimilesider i udvalget |
| --- | --- | --- | --- | --- | --- | --- |
| `ewald2005052115` | Tanker ved Salig Hr. Ulrich Friderich Suhms Grav | `ewald/1969-5` | V, 221–222 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 47–48 |
| `ewald1999082207` | Fragment / Før Kunsten kom var Pragt og Orden | `ewald/1969-5` | V, 40 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 7 |
| `ewald1999082208` | Fragment / Lær mig | `ewald/1969-5` | V, 40 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 7 |
| `ewald1999082209` | Fragment / Er det kun Lyst som viise glædes ved | `ewald/1969-5` | V, 44 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 8 |
| `ewald2002030501` | Da den høysalige Konge blev udført | `ewald/andre` | I, 101–103 | Gyldendals Bibliotek, Dansk Lyrik I, s. 63–65; anden udgave | Ikke verificeret | — |
| `ewaldandrea0` | Fragment / Indhyllet i mig Selv og taus og Mørk som du | `ewald/1969-5` | V, 48–49 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 11–12 |
| `ewald1999021802` | Paaskrift paa en Kaffekande | `ewald/1969-5` | V, 212 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 44 |
| `ewald1999021803` | Aftenen. Et Fragment (II) | `ewald/1969-5` | V, 191 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 34 |
| `ewaldandrea5` | Vinteren, et Fragment | `ewald/1969-5` | V, 194–195 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 36–37 |
| `ewaldandrea6` | Vers / Min Bendsen naar Englernes Ild | `ewald/1969-5` | V, 49 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 12 |
| `ewald1999082201` | Den fornuftige Datter | `ewald/1969-3` | III, 221 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s221) | 65 |
| `ewald1999082202` | Versemageren | `ewald/1969-3` | III, 221 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s221) | 65 |
| `ewald1999021801` | Natte-Tanker | `ewald/1969-5` | V, 87–89 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 13–15 |
| `ewaldandrea2` | Til Sielen. En Ode | `ewald/andre` | III, 259–262 | Udvalgte digte, 1998, s. 96–100; anden udgave | [KB](https://tekster.kb.dk/text/adl-texts-ewald02dkval-root#idm140323883550288) | 3–7 |
| `ewald1999030202` | I Abrahamsons Stambog | `ewald/1969-5` | V, 33–34 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 5–6 |
| `ewaldandrea1` | Poenitenten. Et Fragment | `ewald/1969-5` | V, 193–194 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 35–36 |
| `ewald1999022201` | Poenitenten. En Ode | `ewald/1969-3` | III, 254–256 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s254) | 75–77 |
| `ewald1999022202` | Følelser ved den Hellige Nadvere | `ewald/1969-3` | III, 257–258 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s257) | 78–79 |
| `ewald1999120701` | Morgen-Sang | `ewald/1969-5` | V, 205–206 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 40–41 |
| `ewald1999022001` | Død og Dom | `ewald/1969-5` | V, 153–154 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 29–30 |
| `ewald2000062904` | Fragment / Skjønt Himlen taug og Dagens Hersker smiilte | `ewald/1969-5` | V, 154 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 30 |
| `ewald1999022003` | Impromptu | `ewald/1969-5` | V, 1 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 4 |
| `ewald2005052103` | Gratulation da Seigr. Peder Huulegaard | `ewald/1969-3` | III, 319–322 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s319) | 87–90 |
| `ewald2000070102` | Tanker i Anledning af Hr. Hans Ebbesen... | `ewald/1969-1` | I, 87–88 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald03val-root#s87) | 16–17 |
| `ewald2001071102` | Sørge-Sange i Christiansborgs Slots-Kirke | `ewald/1969-1` | I, 98–103 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald03val-root#s98) | 18–23 |
| `ewald2005052108` | I Anledning af Hr. Palludan og Jfr. Lønborg's Mariage | `ewald/1969-1` | I, 134–135 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald03val-root#s134) | 27–28 |
| `ewald2000062901` | Tanker i Anledning af Frøken Sophia Dorthea v. Holstein's Dødsfald | `ewald/1969-1` | I, 125–127 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald03val-root#s125) | 24–26 |
| `ewald2001070801` | Sørge-Digt over Frue Rahbek | `ewald/1969-1` | I, 136–138 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald03val-root#s136) | 29–31 |
| `ewald2005052114` | Tanker da Arveprinds Frederik Giennemgik Smaa-Koppernes Indpodning | `ewald/1969-1` | I, 266–267 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald03val-root#s266) | 32–33 |
| `ewald2005052104` | Tanker i Anledning af Sr. Huulgaards dødelige Afgang | `ewald/1969-3` | III, 323–325 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s323) | 91–93 |
| `ewald2005052111` | Ode til Printz Friderich, da Han fornyede sin Daabes Pagt | `ewald/1969-2` | II, 1–3 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s1) | 11–13 |
| `ewald2005052112` | Over Hr. Hermanny | `ewald/1969-2` | II, 16–18 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s16) | 17–19 |
| `ewald2001062403` | Til Cecilia Wormstrup | `ewald/1969-5` | V, 45–46 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 9–10 |
| `ewald2001070802` | Et Glimt fra Tiden ind i Evigheden | `ewald/1969-2` | II, 13–15 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s13) | 14–16 |
| `ewald2000062902` | Ønske til Jomfrue Cecilia Wormstrup, paa Hendes Fødsels-dag | `ewald/1969-2` | II, 46 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s46) | 29 |
| `ewald2005112901` | Recitativ og Aria | `ewald/1969-2` | II, 114 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s114) | 30 |
| `ewald2005052101` | Cantata for Raadhuus-Strædets Concert | `ewald/1969-5` | V, 203 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 38 |
| `ewaldandrea3` | Da jeg var syg | `ewald/1969-2` | II, 115–116 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s115) | 31–32 |
| `ewald2005052109` | Klage-Sang af en Bekiendt ved Hr. Haagensens Grav | `ewald/1969-2` | II, 144–145 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s144) | 33–34 |
| `ewald2005052113` | Over M. Th** | `ewald/1969-5` | V, 210–211 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 42–43 |
| `ewald2005052105` | I Anledning af Hans Excellence Hr. Grev Haxthausens Afgang fra Søe Etaten | `ewald/1969-2` | II, 194 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s194) | 39 |
| `ewald1999021805` | Taarer ved Herr Frederik von Arnsbachs Grav | `ewald/1969-2` | II, 191–193 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s191) | 36–38 |
| `ewald2002122003` | En Passions-Sang [Stabat Mater] | `ewald/1969-2` | II, 195–196 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s195) | 40–41 |
| `ewald2000062903` | Paa Kongens Fødsels-Dag | `ewald/1969-2` | II, 177 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s177) | 35 |
| `ewald1999022004` | Haab og Erindring | `ewald/1969-2` | II, 197–201 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s197) | 42–46 |
| `ewald2001062406` | Til Herr Berling og Jfr. Godiche | `ewald/1969-2` | II, 202–203 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s202) | 47–48 |
| `ewaldandrea4` | Rungsteds Lyksaligheder | `ewald/1969-3` | III, 88–90 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s88) | 14–16 |
| `ewald2001062404` | Over Andreas Schyth | `ewald/1969-5` | V, 91–94 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 17–20 |
| `ewald2001062402` | Over Johannes Kinast | `ewald/1969-5` | V, 89–91 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 15–17 |
| `ewald1999030201` | Til Hr. Find og Jfr. Lund | `ewald/1969-5` | V, 215–216 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 45–46 |
| `ewald1999022203` | Til Jomfrue Anna Hedevig Jacobsen | `ewald/1969-5` | V, 204 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 39 |
| `ewaldandrea8` | Klage-Sang over Skiødehunden: Maske | `ewald/1969-3` | III, 119–124 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s119) | 28–33 |
| `ewald2000070901` | Nytaarsdigt til en Fader (I) | `ewald/1969-5` | V, 97–98 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 23–24 |
| `ewald2000070902` | Nytaarsdigt til en Fader (II) | `ewald/1969-5` | V, 98–99 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 24–25 |
| `ewald2001081802` | Nytaarsdigt til en Moder | `ewald/1969-5` | V, 94–97 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 20–23 |
| `ewald2001062401` | Aftenen | `ewald/1969-5` | V, 151–153 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 27–29 |
| `ewald2000070103` | Epigram | `ewald/1969-5` | V, 160 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 33 |
| `ewald2001071101` | I Anledning af den Sal. Mad. Jacobsens Dødsfald | `ewald/1969-3` | III, 85–87 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s85) | 11–13 |
| `ewald1999092201` | Til Generalinde Elisabeth Moltke | `ewald/1969-5` | V, 157–158 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 31–32 |
| `ewald2005052110` | Ode til Arve-Prindsen, den 11. October 1776 | `ewald/1969-3` | III, 91–93 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s91) | 17–19 |
| `ewald2000063002` | Vers paa et Sølv Skildt | `ewald/1969-3` | III, 99 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s99) | 20 |
| `ewald1999030204` | Eselet og Bonden | `ewald/1969-3` | III, 117–118 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s117) | 26–27 |
| `ewald2001082401` | Fragment / Svulmende Vellyst, du som mit Bryst af Leer | `ewald/1969-5` | V, 108 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewal07tom-root) | 26 |
| `ewald2000063003` | Tanker ved Graven af den unge Jens Sanderschov | `ewald/1969-3` | III, 104–105 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s104) | 21–22 |
| `ewald2005052118` | Ved en Fest paa Kronprindsens Fødselsdag | `ewald/1969-3` | III, 125–126 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s125) | 34–35 |
| `ewald2005052119` | Indskrifter ved Festen | `ewald/1969-3` | III, 126 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s126) | 35 |
| `ewald2005052106` | I Anledning af Hendes Kongelige Majestæts Dronning Juliana Maria høie Fødsels-Fest | `ewald/1969-3` | III, 135–137 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s135) | 44–46 |
| `ewald2005052107` | Indskrift ved en Fest i samme Anledning | `ewald/1969-3` | III, 138 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s138) | 47 |
| `ewald2000063001` | Sang i Anledning af Kongens Fødselsdag 1778 | `ewald/1969-3` | III, 109 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s109) | 23 |
| `ewaldandrea7` | Aftenen. Et Fragment | `ewald/1969-3` | III, 116 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s116) | 25 |
| `ewald1999081401` | Et hengivent Ønske | `ewald/1969-3` | III, 115 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s115) | 24 |
| `ewald1999081402` | Under Frue Caroline Walthers Portrait | `ewald/1969-3` | III, 127 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s127) | 36 |
| `ewald2001070101` | Indføds-Retten | `ewald/1969-3` | III, 128–134 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s128) | 37–43 |
| `ewald2000070101` | Fra et brev til moderen | `ewald/1969-4` | IV, 366–367 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald06val-root#s366) | 13–14 |
| `ewald2005051802` | Cantate ved Jubileet den 11 May 1779 i Anledning af Universitetets Indvielse for 300 Aar siden | `ewald/1969-3` | III, 143–145 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s143) | 52–54 |
| `ewald2002122001` | Cantate opført ved Universitetets sædvanlige Høitidelighed i Anledning af Kongens Fødselsdag 1779 | `ewald/1969-3` | III, 141–142 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s141) | 50–51 |
| `ewald2001062405` | Til Hans Kongelige Høihed Arveprinds Frederik | `ewald/1969-3` | III, 263–265 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s263) | 80–82 |
| `ewald1999082206` | Det nye Aar 1779 | `ewald/1969-3` | III, 139–140 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s139) | 48–49 |
| `ewald2002122002` | En aandelig Sang | `ewald/1969-3` | III, 222–228 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s222) | 66–72 |
| `ewald1999021804` | Claus Rimers Gravskrift | `ewald/1969-3` | III, 221 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s221) | 65 |
| `ewald2005052117` | Til min M** paa hans Broders Fødselsdag | `ewald/1969-3` | III, 313–315 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s313) | 83–85 |
| `ewald1999030203` | Til min M*** | `ewald/1969-3` | III, 229–230 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s229) | 73–74 |
| `ewaldandrea9` | Udrust dig, Helt fra Golgatha | `ewald/1969-3` | III, 316 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s316) | 86 |
| `ewald2000070104` | Philet en Fortælning | `ewald/1969-2` | II, 19–27 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald04val-root#s19) | 20–28 |
| `ewald2001081801` | Hedningernes Frelse | `ewald/1771` | II, 182–190 | Den danske lyrik I, 1963; anden udgave, sidetal og scanning uafklaret | Ikke verificeret | — |
| `ewald1999082203` | Arioso / En Bonde seer fra Ploven | `ewald/1969-3` | III, 155–156 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s155) | 55–56 |
| `ewald1999082204` | Arioso / En Søemand, med et modigt Bryst | `ewald/1969-3` | III, 164–165 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s164) | 57–58 |
| `ewald1999082205` | Arie / Naar Syd-Vinden kuler | `ewald/1969-3` | III, 182 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s182) | 59 |
| `ewlad1999022205` | Romance / Kong Christjan stoed ved høien Mast | `ewald/1969-3` | III, 187–188 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s187) | 60–61 |
| `ewald1999022204` | Romance / Liden Gunver vandrer som helst i Qveld | `ewald/1969-3` | III, 205–206 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s205) | 62–63 |
| `ewald1999022002` | Romance / En Edder-Fugl var haardt i Klemme | `ewald/1969-3` | III, 213 | DSL 1969; verificeret | [KB](https://tekster.kb.dk/text/adl-texts-ewald05val-root#s213) | 64 |

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

De syv tekster i `ewald/1985-vingesus` og teksten i `ewald/p1780` er ikke ændret
eller blevet tilskrevet DSL-udgaven. Fuld import af de seks bind, komplettering
af *Fiskerne* eller *Adskilligt* og nye korrekturattester ligger uden for denne
kildekontrol. #992 og #1821 bevarer deres selvstændige afgrænsninger.

De resterende adgangsopgaver er at skaffe den konkrete 1963-udgave af
*Den danske lyrik* med sidetal til *Hedningernes Frelse* samt scanning og
fuldstændig udgaveidentifikation af *Gyldendals Bibliotek, Dansk Lyrik*, bind I.
Der er ikke indsat gættede årstal, sidetal eller facsimiler til disse to udgaver.

Disse to adgangsopgaver følges i [#1969](https://github.com/thabz/Kalliope/issues/1969).
