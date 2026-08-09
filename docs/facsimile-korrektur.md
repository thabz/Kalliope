# Korrektur mod facsimile

Denne vejledning beskriver en praktisk arbejdsgang for agenter, der skal
færdiggøre eller kontrollere en transskription mod et facsimile. Den supplerer
de redaktionelle principper i `docs/kalliope-masterplan.md` og formatreglerne i
`docs/xml-work-format.md`.

Målet er ikke blot en tekst uden oplagte OCR-fejl. Resultatet skal bevare
kildens ordlyd, verslinjer, strofer, overskrifter, tegnsætning og relevante
typografiske træk og samtidig være gyldigt Kalliope-XML.

## Grundregel

Facsimilet er facit. OCR, eksisterende transskriptioner, metadata og kendskab
til en strofeform er hjælpemidler, ikke selvstændige tekstvidner.

En usædvanlig form eller stavemåde må ikke rettes, blot fordi den ser
mistænkelig ud. Hvis facsimilet tydeligt har formen, skal den bevares. Hvis
læsningen ikke kan afgøres forsvarligt, skal usikkerheden synliggøres i stedet
for at blive skjult med et gæt.

## 1. Afgræns arbejdet

Læs altid `AGENTS.md`, `docs/style-guide.md` og den specialdokumentation, som
stilguiden henviser til, før der ændres filer.

Fastlæg derefter:

- hvilken fysisk udgave der transskriberes
- hvilke trykte sider og PDF-sider der hører til teksten
- hvordan trykte sidetal mappes til facsimilesider
- hvilke XML-filer og forfatterregistre der skal ændres
- om arbejdet tilhører en eksisterende PR-branch

Kontrollér både første og sidste relevante side direkte. Et angivet sideinterval
kan være forkert, og en tekst kan fortsætte på næste side uden ny overskrift.

Hvis det almindelige arbejdstræ indeholder andre ændringer, så brug en separat
worktree til en selvstændig dokumentations- eller værktøjs-PR. Bland aldrig en
tekstkorrektur med uvedkommende ændringer.

## 2. Lav et sideinventar

Ingen side må forsvinde mellem OCR og korrektur. Lav derfor en midlertidig liste
over alle relevante sider med mindst:

- trykt sidetal
- PDF-side eller billedfil
- facsimilebilledets stabile filnavn, fx `019.jpg`
- tekst eller afsnit
- første og sidste synlige verslinje
- status for strukturkontrol
- status for tekstkontrol
- eventuelle tvivlstilfælde

Listen er arbejdsdata og skal normalt ikke committes. Den skal gøre det muligt
at se, om hver side faktisk er blevet behandlet.

## 3. Kontrollér strukturen før enkeltordene

Begynd med en visuel gennemgang af facsimilet uden at stole på den eksisterende
XML-opdeling. Registrer:

- tekstens begyndelse og slutning
- titler, undertitler og deloverskrifter
- strofegrænser og ekstra blanklinjer
- nummererede og unummererede strofer
- skillelinjer, signaturer og andre ikke-verslinjer
- indrykninger og centrerede linjer
- sideskift midt i en strofe

Et blankt mellemrum i trykket er redaktionel information. Det må hverken
fjernes, fordi nabostrofer har samme rimskema, eller tilføjes alene ud fra en
formodet strofeform.

### Regelmæssige strofeformer

Når facsimilet har bekræftet en regelmæssig strofeform, kan linjetælling bruges
som en stærk kontrol. En ottave skal eksempelvis have otte verslinjer, men det
beviser ikke, at en indledning eller paratekst i samme bog også består af
ottaver.

Find også digtets dominerende strofemønster. Hvis næsten alle strofer har fire
verslinjer, skal enhver strofe med eksempelvis én, tre, fem eller otte linjer
behandles som en konkret korrekturkandidat. Det gælder også, selv om alle ord
allerede stemmer med OCR'en. En ekstra blanklinje kan splitte en firlinjet
strofe i `1 + 3`, mens en manglende blanklinje kan samle to strofer til én på
otte linjer. De to fejl kan ligge tæt på hinanden og derfor se ud som en enkelt
flyttet strofegrænse.

Lav derfor en afvigelsesliste for hvert regelmæssigt digt eller nummereret
afsnit:

- optæl verslinjerne mellem alle blanklinjer
- bestem den dominerende strofelængde ud fra de sikre strofer
- flag alle afvigende længder og alle steder uden blanklinje mellem to
  forventede strofer
- undersøg nabostrofer samlet, da en forkert grænse ofte giver komplementære
  afvigelser
- kontrollér hver kandidat visuelt i facsimilet, før XML'en ændres

En markant afvigelse kræver tydeligt belæg i facsimilet. Den må ikke accepteres
alene, fordi den eksisterende transskription eller OCR har en blanklinje på
stedet.

Kontrollér maskinelt:

- at alle strofeoverskrifter forekommer i ubrudt rækkefølge
- at hver strofe har det forventede antal verslinjer
- at ingen overskrift er blevet hængende ved den foregående strofe
- at en manglende overskrift ikke har dannet en dobbeltstrofe

Linjetælling finder strukturfejl, som en almindelig OCR-sammenligning ikke ser.
En korrekt tekst kan stadig være opdelt forkert.

Ved sideskift skal optællingen fortsætte på tværs af siden. Afgør ud fra
facsimilet, strofeformen og den løbende tekst, om den første linje på den nye
side fortsætter en strofe eller begynder en ny. En ny fysisk side er ikke i sig
selv en strofegrænse.

### Registrér alle interne sideskift

Ved en komplet PDF-transskription skal alle fysiske sideskift inde i de
inkluderede tekstkroppe bevares semantisk med `<pb>`. Markøren står ved
begyndelsen af den nye kildeside:

```xml
Sidste verslinje på side 11
<pb n="12" facs="019.jpg"/>Første verslinje på side 12
```

`n` er den nye sides trykte nummer eller betegnelse. Det kan udelades på en
unummereret side. `facs` er altid obligatorisk og er filnavnet på den samme
facsimileside uden sti. Kalliopes genererede sidebilleder er nulbaserede:
PDF-side 20 svarer derfor til `019.jpg`. Aflæs filnavnet i sideinventaret; udled
det ikke af det trykte sidetal.

Placér `<pb>` præcis før det første transskriberede tegn eller inline-element på
den nye side. Hvis sideskiftet falder inde i en verslinje, en prosasætning, et
ord, en note eller et andet sammenhængende tekstforløb, skal markøren stå inline
på det nøjagtige sted. Ved et skift mellem verslinjer eller strofer sættes den
foran første tekst på den nye side og aldrig på en selvstændig XML-linje.
Markøren må ikke skabe eller fjerne en verslinje, blanklinje, strofe eller et
prosaafsnit.

Der indsættes ikke en markør alene ved begyndelsen eller slutningen af hver
`<text>`; tekstens sideinterval ligger fortsat i `<source pages="...">`. Et værk,
hvor alle tekster står på én side, kan derfor være fuldt sideopmærket uden at
indeholde nogen `<pb>`.

Sideintervallet skal skrives med fulde endepunkter, fx `102-108`, ikke
`102-08`, og skal være lukket og ikke-faldende. I dokumentrækkefølge skal
arabiske `pb/@n` og de numeriske `pb/@facs`-filnavne være ikke-faldende gennem
værket; der må gerne være spring mellem markørerne. Romertal i `n` ignoreres af
den maskinelle rækkefølgekontrol.

En konkret tekst med en dokumenteret pagineringsafvigelse kan bruge
`ignore-tests="pagebreak-count"`, hvis det lovlige sideinterval ikke bestemmer
antallet af interne markører. Undtagelsen fritager kun for antalskontrollen og
må aldrig skjule et ulovligt `pages`, en manglende `facs`, forkert placering
eller faldende markørværdier.

Når alle inkluderede tekstkroppe er kontrolleret, skal værkets `<workhead>`
indeholde:

```xml
<pagebreaks/>
```

Elementet erklærer, at registreringen er komplet; det erklærer ikke, at der
findes mindst ét sideskift. En ældre fil uden `<pagebreaks/>` har ukendt status.
Følg `docs/xml-work-format.md` for den fulde XML-kontrakt.

Kontrollér nummerering på hvert hierarkisk niveau for sig. Et langt digt kan
eksempelvis have romertal som hovedafsnit og arabertal som underafsnit, så
rækken `I.`, `1.`, `2.` ikke nødvendigvis er en OCR-fejl. Omvendt er et spring
fra `3.` til `8.` et stærkt signal om manglende underafsnit. Sammenlign både
tegnformen og den lodrette afstand over og under hvert nummer med facsimilet;
OCR forveksler ofte `I` og `1` og mister let korte, centrerede nummerlinjer.

### Layout i XML

Strofeoverskrifter og andre trykte linjer, som ikke er vers, skal markeres efter
`docs/xml-work-format.md`. En centreret strofeoverskrift kan eksempelvis være:

```xml
<nonum><center>XLII.</center></nonum>
```

En trykt skillelinje kan tilsvarende være en centreret `<nonum>`-linje eller et
eksisterende, passende skilleelement. Følg mønstret i repositoryet; lad ikke en
overskrift eller dekoration stå som en almindelig verslinje.

## 4. Brug flere OCR-pass som kontrol

Undersøg først PDF'en med `pdfimages -list`. Udtræk de indlejrede sidebilleder,
når der er ét sikkert helsidesbillede pr. relevant PDF-side, og opløsningen er
tilstrækkelig. Render ellers siderne i en fast, læsbar opløsning med
`pdftoppm`. Repositoryets facsimileværktøjer og indstillinger er beskrevet i
`README.md`.

Antag aldrig, at et udtrukket billednummer er lig med det trykte sidetal. Bevar
mappingen mellem trykt side, PDF-side og filnavn i sideinventaret.

Kør gerne OCR med flere layoutstrategier, eksempelvis Tesseract med forskellige
PSM-værdier. Disse tre pass supplerer ofte hinanden:

- `--psm 3`: automatisk sideopdeling
- `--psm 4`: én kolonne med tekstområder i varierende størrelse
- `--psm 6`: én ensartet tekstblok

Gem OCR-resultaterne i en tydeligt afgrænset scratch-mappe. De må ikke ende i
PR'en.

OCR-værktøjers blanklinjer er særligt upålidelige. De kan opstå inde i en
strofe, når en kort eller indrykket verslinje registreres som en ny tekstblok,
og de kan forsvinde mellem to strofer. Brug derfor OCR til at sammenligne
ordlyd og finde kandidater, men udled ikke strofegrænser direkte af OCR'ens
plain-text-output.

### Sammenlign uden at normalisere kildeteksten

En midlertidig sammenligning må gerne normalisere kopier af linjerne for at
finde kandidater. Den kan eksempelvis ignorere:

- XML-tags
- forskelle mellem apostroftegn
- mellemrum omkring tegnsætning
- OCR-støj i sidemargener
- kendte OCR-varianter af `æ`, `ø` og `å`

Normaliseringen må kun bruges til søgning og justering. Den publicerede tekst
skal fortsat gengive facsimilets historiske ortografi og tegnsætning.

Prioritér steder, hvor flere OCR-pass er enige om en afvigelse fra XML. Husk
dog, at flere pass fra samme OCR-motor kan dele den samme fejl. Konsensus gør et
sted vigtigt at undersøge; den afgør ikke læsningen.

### Pas på forskudte linjer

Sammenligning linje for linje kan komme ud af takt ved:

- sidehoveder og sidetal
- strofeoverskrifter
- en overset eller dobbelt OCR-linje
- sideskift midt i en strofe
- skillelinjer og signaturer

Brug derfor et begrænset søgevindue omkring den forventede position, og
kontrollér altid første og sidste match på hver side. En lav samlet fejlafstand
er ikke bevis for, at linjerne er korrekt justeret.

## 5. Læs hver side direkte

OCR-kandidatlisten er et supplement til, ikke en erstatning for, en fuld
sidegennemgang. Læs hver relevant side og sammenhold den med XML'en.

Kontrollér særskilt:

- hvert ord og hver bøjningsendelse
- store og små begyndelsesbogstaver
- historiske stavemåder
- apostroffer og accenttegn
- punktum, komma, kolon og semikolon
- spørgsmålstegn og udråbstegn
- bindestreger, tankestreger og ellipser
- åbnende og lukkende anførselstegn
- kursiv, spatiering og anden fremhævelse
- indrykninger, centrerede linjer og signaturer
- at hvert internt sideskift har en korrekt placeret `<pb>` med det rigtige
  `facs`-filnavn

Tegnfejl er ofte sværere for OCR end ordfejl. Et pass kan gengive alle bogstaver
rigtigt og stadig miste en tankestreg, vende et anførselstegn eller forveksle
spatiering med almindelige mellemrum.

Zoom ind på tvivlsomme steder. Afgør dem ikke ud fra moderne sprogbrug. En
mærkelig, men tydeligt trykt læsning skal bevares.

## 6. Kør målrettede maskinkontroller

Efter den manuelle gennemgang bør filen undersøges for almindelige OCR-rester.
Tilpas søgningerne til XML'en, så tags ikke giver unødig støj. Nyttige kandidater
kan blandt andet være:

```shell
rg -n '«[^«»]*«|\*|[[:alpha:]]\.[[:alpha:]]|[[:alpha:]]- ' path/to/work.xml
rg -n '[[:space:]]+$' path/to/work.xml
```

Søg desuden efter:

- cifre midt i ord
- enkeltstående symboler fra OCR
- mellemrum midt i ord
- identiske nabolinjer
- usandsynlige punktummer midt i ord
- ens åbnende anførselstegn i begge ender af et citat
- rester af sidehoveder og sidetal

Kør repositoryets OCR-kandidatrapport:

```shell
npm run report-ocr-candidates
```

Rapporten viser kandidater, ikke sikre fejl. Hvert fund skal vurderes mod
facsimilet.

## 7. Validér XML og repository

Før ændringen afleveres eller publiceres:

```shell
xmllint --noout path/to/work.xml
git diff --check
npm test -- --runInBand
```

Kør også en domænespecifik kontrol af strofeantal, stroferækkefølge og
verslinjer pr. strofe, når formen tillader det. En lille midlertidig parser er
ofte mere pålidelig end manuel optælling i et langt værk.

Sammenhold desuden sideinventaret med XML'en og kontrollér, at:

- hvert internt sideskift i en inkluderet tekst har præcis én `<pb>`
- ingen `<pb>` er indsat blot ved begyndelsen eller slutningen af en tekst
- alle `<pb>` har en ikke-tom `facs`-attribut med det korrekte filnavn
- `n`, når den findes, er den trykte sidebetegnelse og ikke PDF-siden
- arabiske `n`-værdier og numeriske `facs`-filnavne er ikke-faldende gennem
  værket; spring er tilladt
- `<workhead>` indeholder `<pagebreaks/>`, når kontrollen er fuldført

Hele testsuiten skal bestå før PR-oprettelse. Tjek til sidst `git status --short`
og bekræft, at kun de tilsigtede filer er med.

## 8. Ryd op og aflever

Fjern genererede sidebilleder, OCR-filer, beskæringer og sammenligningsrapporter
fra arbejdstræet. Kontrollér den præcise scratch-mappe før sletning; slet aldrig
via en bred eller uafklaret sti.

Afleveringen skal oplyse:

- hvilke trykte sider der er gennemgået
- om hele teksten er læst direkte mod facsimilet
- hvordan strofer og overskrifter er valideret
- hvordan sideskift, `facs`-filnavne og `<pagebreaks/>` er valideret
- hvilke automatiske kontroller der er kørt
- om der findes uløste læsninger
- hvilke filer der er ændret
- om ændringerne er committet eller kun ligger lokalt

Hvis repositoryet kræver brugerens gennemlæsning før commit eller push, skal
arbejdet stoppe dér. En besked om, at teksten er færdig, er ikke i sig selv en
godkendelse til at publicere den.

## Afsluttende kontrolliste

- [ ] Alle relevante sider er registreret og gennemgået.
- [ ] Første og sidste tekstlinje stemmer med facsimilet.
- [ ] Strofegrænser følger trykket, også ved uregelmæssige former.
- [ ] Alle interne sideskift er markeret med præcist placerede `<pb>`.
- [ ] Hver `<pb>` har korrekt `facs`; `n` følger den trykte sidebetegnelse.
- [ ] `<workhead>` indeholder `<pagebreaks/>`, også når der ikke findes `<pb>`.
- [ ] Regelmæssige strofer har korrekt linjeantal og ubrudte overskrifter.
- [ ] Overskrifter og dekorationer tælles ikke som verslinjer.
- [ ] Historisk ortografi og tegnsætning er bevaret.
- [ ] Kursiv, spatiering, indrykning og signaturer er kontrolleret.
- [ ] Alle OCR-kandidater er afgjort mod facsimilet.
- [ ] XML validerer, og hele testsuiten består.
- [ ] Scratch-filer er fjernet.
- [ ] PR'en indeholder kun den aftalte ændring.
