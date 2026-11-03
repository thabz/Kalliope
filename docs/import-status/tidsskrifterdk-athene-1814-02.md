# Athene, bind II (1814): kildehul løst og digtimport fuldført

Status 3. november 2026: Importen til #2125 omfatter alle bindets
22 selvstændige digte, Bruns seks slutnoter og hele Boyes kommentarapparat
til Baggesens »Apologien«. Tilhørende trykte indledninger er bevaret.
Værket ligger i `fdirs/tidsskrifterdk/1814-athene-02.xml`.

## Kilder og supplering

*Athene. Et Maanedsskrift*, Andet Bind, Januar–Junius 1814, udgivet af
Christian Molbech. Kiøbenhavn, den Gyldendalske Boghandlings Forlag,
trykt hos P. D. Kiøpping, 1814.

- [KB's PDF, 130020878011](https://www.kb.dk/e-mat/dod/130020878011.pdf):
  579 PDF-sider, SHA-256
  `68cf63b781993ecf5e03543409a3bc8f679499d548ad9bf4291ce4d737278b15`.
- [University of Minnesotas eksemplar hos HathiTrust](https://babel.hathitrust.org/cgi/pt?id=umn.31951000752563g),
  digitaliseret af Google: verificerede enkelt-PDF'er fra samme udgave.
- Det samlede facsimile har 589 PDF-sider, SHA-256
  `d4c23d4dc51bddd85c033b62610fcb3e74fa555c3dafbf7b055b6ff0907c98dc`.

Trykt s. 148–157 mangler mellem oprindelig PDF-side 158 (s. 147) og 159 (s. 158).
De ti sider er hentet fra HathiTrust-sekvens 158–167 og indsat som PDF-side 159–168.
Både billederne og sammenhængen med nabosiderne er kontrolleret visuelt.

Beskårne tekstkanter er desuden afhjulpet med ubeskårne HathiTrust-billeder:
fysisk plads 480 og de 17 ulige sider 521–553. Plads 480 svarer til sekvens 490;
de sene sider til sekvens 529, 531, …, 561. Disse erstatter eksisterende billeder.
Hele facsimilet og thumbnails er publiceret; serverens kontrolsum er verificeret.
Alle 589 sider er inventeret visuelt. Ingen yderligere manglende sider,
rettelsesark eller særskilt grafisk forside er identificeret. HathiTrusts
eget bind er ikke erklæret fuldstændigt; kun de konkret kontrollerede
suppleringsbilleder bruges som erstatningskilder.

## Udvalg og korrektur

Alle 40 registerposter med henvisning til bind II er afstemt med trykket.
Den uregistrerede »Norwegian National Song« er også medtaget. »Stufs
Samtale« er prosa med et kort versfragment; øvrig ikke-bestilt prosa og
ufuldstændige verscitater er udeladt. Baggesens otte vers er medtaget sammen
med hele det originale apparat på s. 521–544: Prolegomena, alle ti hovednoter,
23 fodnoter, citater, efterskrift og signaturer.

De 25 tekstposter indeholder 22 hoveddigte med 1.262 vers samt tre
prosaparatekster med 19 citerede vers. Alle 32 poesiblokke er kontrolleret
for vers, strofer, indryk og typografi. 94 tekst-sideposter dækker 83
forskellige kildebilleder.

Frisk OCR er udført med otte konfigurationer på alle relevante sider.
De 18 ubeskårne erstatningsbilleder har et særskilt nyt OCR-benchmark;
den oprindelige OCR-pakke er bevaret som kildehistorik. Alle inkluderede
tekster er fuldt sammenlæst med billederne i to forskellige sessioner.
Korte græske og latinske citater og alle seks Brun-noter er kontrolleret
manuelt. Sidetop er ikke i sig selv behandlet som bevis for en usynlig
strofegrænse.

Titelbladet er rettet op og beskåret med bestået geometrikontrol og
uafhængig visuel kontrol. Adolph Engelbert Boye er oprettet med kildebaserede
livsdata, fuld DBL1-biografi, dokumenteret portræt, seks blankværker og to
tekstønsker. Biografien er fuldt kontrolleret i to sessioner. Fürst er
identificeret som den eksisterende Nikolai Nathan Fürst; ingen dublet er oprettet.

## Kildeafvigelser og relationer

»Opvaagnelsen« står på tre fysiske sider med de trykte tal 479, 478, 480.
Billederne er bevaret i rigtig fysisk rækkefølge. Kilden angiver intervallet
479–480; den dokumenterede forskel mellem interval og tre billeder er
markeret med `ignore-tests="pagebreak-count"`. Den midterste markør bruger
kun `facs`, så et fejlagtigt faldende arabisk sidetal ikke indføres.
Plads 535 i kommentarapparatet er fejltrykt 435 og dokumenteret tilsvarende.
Dette er pagineringsfejl, ikke nye huller.

Syv sikre varianter er forbundet med eksisterende tekstforekomster.
Heibergs senere »Cantate« genbruger dele af »Uranienborg«, men er ikke
registreret som en heltekstvariant. Den engelske sang er en fri oversættelse
af tre strofer af Johan Nordahl Bruns vise og er forbundet med den konkrete
danske tekst i bind III. »Portnerindens Tilbagekomst« er forbundet med
Amalie von Helvigs tyske original; Athenes trykte tilskrivning til Fouqué
er bevaret og forklaret i en note. De konkrete tyske forlæg til Bruns to
digte og Fürsts »Blondinen« er ikke sikkert identificeret; markeringerne af
ukendt original bevares uden rekonstrueret tekst.

## Afsluttende validering

1.370 OCR-kandidater og alle 76 kandidater fra den ufiltrerede helværksanalyse
er individuelt disponeret; der er ingen åbne fund. Alle 94 sideposter og
32 visuelt fastlagte strukturprofiler er dækket af uafhængig korrektur.
`make test`: 139 testsuiter og 2.421 tests bestået, exit 0 (1 suite og
9 tests sprunget over). Den målrettede pagebreak-test har 23 beståede tests.
XML-skema, sideaudit og fundregister validerer. Static-build og
tekstønskescriptets `--check`/`--reconcile` afslutter uden fejl. Offentlig
facsimilekontrol dækker 628 værker og 1.256 repræsentative billeder.
