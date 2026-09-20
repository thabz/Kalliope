# Arbejdserfaringer fra værkimport og korrektur

Disse eksempler bevarer begrundelser, som skal hjælpe næste opgave. Læs de
relevante afsnit ved titelbladsarbejde (ERF-001), indrykning (ERF-002),
OCR-tvivl (ERF-003), aflevering (ERF-004) og titelfodnoter (ERF-005).
Formatguiden og de aktuelle skills fastlægger reglerne; historiske løsninger
kan være erstattet. PR-beskrivelser dokumenterer rapporteret kontrol, men er
ikke i sig selv en ny efterprøvning af kildesiderne.

## ERF-001: Titelblade

**Dokumenteret:** [PR #1660](https://github.com/thabz/Kalliope/pull/1660)
omsatte tidligere billedrettelser til en skill med geometri og QA.
[PR #1661](https://github.com/thabz/Kalliope/pull/1661) fjernede det interaktive
godkendelsesled og forbedrede håndteringen af mørke hjørnerester.

**Erfaring:** Når et billedproblem går igen, skal forbedringen afprøves i
værktøjet, så næste billede får gavn af den. En manuelt rettet slutfil viser
ikke alene, at arbejdsgangen er forbedret. Et bestået resultat går videre
uden rutinemæssig brugerbekræftelse.

**Grænse og gældende grundlag:** Forkert side eller utilstrækkelig opløsning
kræver en bedre kilde, ikke mere beskæring. `manual-review` er ikke et bestået
resultat og må ikke føre til overskrivning eller en automatisk anmodning om
brugerens godkendelse. Følg [titelbladsstandarden](titelbladsbilleder.md) og
[skillens faste før/efter-eksempler](../.codex/skills/prepare-kalliope-titlepage/references/evaluation-examples.md).
Den tidligere visuelle godkendelsesprocedure i #1660 er erstattet af #1661.

## ERF-002: Indrykning

**Dokumenteret:** [PR #1662](https://github.com/thabz/Kalliope/pull/1662)
rettede 121 forekomster i 13 værkfiler og håndhævede indrykning efter `<pb>`.
[PR #1694](https://github.com/thabz/Kalliope/pull/1694) nulstillede overflødig
grundindrykning i 310 tekster og tilføjede en generel kontrol.

**Erfaring:** Undersøg, om en gentagen layoutfejl kan beskrives præcist og
fanges af en eksisterende eller forbedret kontrol. Ved sideskift tilhører
mellemrummene verset på den nye side; fælles grundindrykning skal skelnes fra
linjernes relative indrykning.

**Grænse og gældende grundlag:** Disse tests beviser ikke, at den relative
indrykning svarer til trykket. OCR og regelmæssige strofemønstre er spor til
undersøgelse, ikke facit. Følg [XML-formatguiden](xml-work-format.md) og
[facsimilekorrekturen](facsimile-korrektur.md); eksisterende kontroller ligger i
`__tests__/corpus/pagebreaks.test.js` og `__tests__/corpus/poem-lines.test.js`.

## ERF-003: Flur og flux

**Dokumenteret:** [PR #1696](https://github.com/thabz/Kalliope/pull/1696),
commit `ecfa1ba1a3f7058884e90935f689263818ee0a10`, rettede 12 tekststeder efter
facsimilekontrol. Frakturens `x` i `flux` var blevet læst som `r`. Rettelsen
omfattede også Thaarups dublerede førstelinjemetadata. Ægte forekomster af
`Flur`, blandt andet i tyske tekster, blev bevaret.

**Erfaring:** En plausibel sproglig forklaring på et mærkeligt ord er ikke
kildebelæg. Undersøg trykkets bogstavform og sammenhæng; kontrollér også
metadata, som gentager den rettede tekst.

**Grænse og gældende grundlag:** `flur` er en mulig kontrolkandidat, ikke en
global erstatningsregel. Bevar en tydeligt trykt form, også når den virker
usædvanlig. Følg grundreglen i [facsimilekorrekturen](facsimile-korrektur.md).
Hypotesen er, at dette eksempel kan forebygge lignende bortforklaringer;
effekten på senere agentarbejde er endnu ikke målt.

## ERF-004: Korrekturansvar og færdigstatus

**Dokumenteret:** [PR #867](https://github.com/thabz/Kalliope/pull/867)
overlod 398 relevante tekstsiders visuelle korrektur til brugeren trods
beståede tests. [PR #1671](https://github.com/thabz/Kalliope/pull/1671)
indførte krav om to gennemgange og korrekturattester.
[PR #1702](https://github.com/thabz/Kalliope/pull/1702) dokumenterer senere
gennemgang af Daugaards 419 facsimilebilleder og genkontrol af fund;
[PR #1701](https://github.com/thabz/Kalliope/pull/1701) dokumenterer Hastes
tilsvarende slutkorrektur.

**Erfaring:** Rutinekontrol, inklusive visuel korrektur, er agentarbejde.
En opgave bliver ikke færdig af, at den manglende korrektur sættes under
»Bruger«. Afklar selv det, kilden og reglerne kan afgøre; fremlæg kun reelle
redaktionelle beslutninger til brugerens skøn.

**Grænse og gældende grundlag:** Manglende reviewer eller kildeadgang er en
blokering, som skal oplyses. Bevar kladdestatus, indtil kravene i
[facsimilekorrekturen](facsimile-korrektur.md) og PDF-skillen er opfyldt.
CI kontrollerer attest og kvalitetsmærker ved første overgang til `complete`;
den efterprøver ikke selv læsningen. Brugerens tilladelse til commit og push
følger fortsat `AGENTS.md` og er adskilt fra korrekturansvaret.

## ERF-005: Titelfodnoter

**Dokumenteret:** [PR #821](https://github.com/thabz/Kalliope/pull/821)
flyttede Hastes titelnoter til tekstniveau på grund af buildets begrænsning.
[PR #1712](https://github.com/thabz/Kalliope/pull/1712) indførte understøttelse
af titelfodnoter og flyttede de kildebekræftede noter tilbage.

**Erfaring:** En teknisk nødløsning skal genvurderes, når begrænsningen
forsvinder. Det generelle forbud mod titelmarkup i OCR-lærebogen er erstattet;
genindfør ikke denne regel med henvisning til den gamle løsning.

**Grænse og gældende grundlag:** Tilladte titelfodnoter er ikke tilladelse til
vilkårlig markup. Følg [XML-formatguidens feltregler](xml-work-format.md#text-head).
Fodnoten hører til digtvisningen og må ikke slippe ud i navigation eller indeks.
Parser- og titeltests i `__tests__/parsing.test.js` og `__tests__/textname.test.js`
bevarer denne skelnen.

## Ved afslutning

Ved en væsentlig rettelse skal agenten undersøge, om den præciserer en
eksisterende erfaring, erstatter en gammel regel eller begrunder en bedre
kontrol. Opdater det autoritative sted og henvis hertil; undgå kopier af
samme regel. En enkeltstående hændelse uden overførbar læring kræver ingen
ny instruktion. Ændringer følger opgavens rammer og eksisterende gitregler.

Nye erfaringer får et stabilt `ERF-NNN`-id, hændelse med PR/commit eller anden
efterprøvbar kilde, begrundelse, anvendelsesgrænse og gældende regel/kontrol.
Mærk fortolkninger som hypoteser. Bevar id og begrundelse, når en erfaring
erstattes; angiv hvad der erstatter den. Kopiér ikke rå samtaler eller lokale
samtalestier ind som projektets hukommelse.

Før scratchmateriale ryddes op, bevares relevante beslutningsbegrundelser og
et kort kontrolresumé i den normale overdragelse: kilde og sideomfang,
reviewer, genkontrol af rettelser, faktisk udførte tests, checkpointstatus
og resterende usikkerhed. Midlertidige OCR-filer og kontrolregistre forbliver
arbejdsmateriale uden for repositoryet. Behold checkpointets afhængigheder,
så længe det skal kunne verificeres. Resuméet erstatter ikke denne kontrol.

## Opfølgning på de næste tre relevante opgaver

Pilotens start er den revision, der indfører denne vejledning. Brug de næste
tre efterfølgende, særskilt bestilte værkimporter eller korrekturopgaver,
der afsluttes med de ændrede skills. Start ikke ekstra korpusarbejde alene
for at udfylde piloten. Agenten udfylder PR-skabelonens evaluering som en del
af den normale overdragelse, også når ændringen endnu kun ligger lokalt.

Registrér relevante erfarings-id'er, omfang, udført kontrol, gentagne kendte
fejl og nødvendige brugerindgreb. Skeln mellem fejl opdaget af agent/reviewer
og fejl opdaget af brugeren samt mellem rettelser, redaktionelle valg og
publiceringsgodkendelser. Manglende observation er `ukendt`, ikke nul.
Brug de historiske forløb ovenfor som kvalitativt udgangspunkt; deres
brugerforbrug er ikke målt og må ikke omsættes til en opdigtet baseline.

Bevar en kort henvisning og resultat pr. afsluttet pilotopgave her. Ved den
tredje sammenfattes, hvilke fejl der gentog sig, hvad agenten selv fangede,
og hvor brugeren stadig måtte gribe ind. Sammenhold med antal relevante
sider/tekster, kildetype og kontrolomfang; rå fejltal alene viser ikke effekt.
Tre opgaver kan give tegn på forbedring, ikke bevise en generel effekt.
Dokumentationsændringer eller beståede tests alene tæller ikke som færre
brugerindgreb.

Status: Afventer efterfølgende opgaver; effekt endnu ikke målt.
